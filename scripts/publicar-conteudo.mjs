// Envia src/simulador.html para o Firestore, em duas versões geradas a partir do mesmo ficheiro:
//   conteudo/simulador – completa (senhorio + inquilino), só para quem se identificou;
//   conteudo/inquilino – sem os blocos marcados "senhorio:inicio … senhorio:fim", para convidados.
// Com FIRESTORE_EMULATOR_HOST definido (npm run dev) escreve no emulador; caso contrário, na produção,
// usando a chave service-account.json (que nunca vai para o git).
import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const raiz = fileURLToPath(new URL("..", import.meta.url));
export const ORIGEM = raiz + "src/simulador.html";
const PROJETO = "simulador-arrendamento-pt";

let db;
function ligar() {
  if (db) return db;
  const emulador = !!process.env.FIRESTORE_EMULATOR_HOST;
  initializeApp(emulador
    ? { projectId: PROJETO }
    : { credential: cert(JSON.parse(readFileSync(raiz + "service-account.json", "utf8"))) });
  db = getFirestore();
  return db;
}

function unico(html, re, nome) {
  const m = [...html.matchAll(re)];
  if (m.length !== 1) throw new Error(`${ORIGEM}: esperava 1 bloco <${nome}>, encontrei ${m.length}`);
  return m[0][1].trim();
}

// Marcadores dos blocos exclusivos do senhorio, em HTML e em JavaScript.
const MARCAS = [
  [/<!-- senhorio:inicio -->/g, /<!-- senhorio:fim -->/g, /<!-- senhorio:inicio -->[\s\S]*?<!-- senhorio:fim -->/g],
  [/\/\/ senhorio:inicio/g, /\/\/ senhorio:fim/g, /\/\/ senhorio:inicio[\s\S]*?\/\/ senhorio:fim/g],
];
function versao(texto, inquilino) {
  for (const [ini, fim, bloco] of MARCAS) {
    const a = (texto.match(ini) || []).length, b = (texto.match(fim) || []).length;
    if (a !== b) throw new Error(`${ORIGEM}: marcadores senhorio desemparelhados (${a} início, ${b} fim)`);
    texto = inquilino ? texto.replace(bloco, "") : texto.replace(ini, "").replace(fim, "");
  }
  if (/senhorio:(inicio|fim)/.test(texto)) throw new Error(`${ORIGEM}: marcador senhorio dentro de outro bloco`);
  return texto;
}

export function extrair(inquilino = false) {
  const html = versao(readFileSync(ORIGEM, "utf8"), inquilino);
  // Título e estilos só no <head>: o JavaScript do simulador pode conter estas etiquetas em texto
  // (ex.: a página "Análise da situação" gerada no navegador).
  const cabeca = html.slice(0, html.indexOf("</head>"));
  const corpo = unico(html, /<body[^>]*>([\s\S]*)<\/body>/g, "body");
  return {
    titulo: unico(cabeca, /<title>([\s\S]*?)<\/title>/g, "title"),
    css: unico(cabeca, /<style>([\s\S]*?)<\/style>/g, "style"),
    js: unico(corpo, /<script>([\s\S]*?)<\/script>/g, "script"),
    html: corpo.replace(/<script>[\s\S]*?<\/script>/, "").trim(),
  };
}

export async function publicar() {
  const completo = extrair(), inquilino = extrair(true);
  const agora = FieldValue.serverTimestamp();
  const lote = ligar().batch();
  lote.set(db.doc("conteudo/simulador"), { ...completo, atualizadoEm: agora });
  lote.set(db.doc("conteudo/inquilino"), { ...inquilino, atualizadoEm: agora });
  await lote.commit();
  const destino = process.env.FIRESTORE_EMULATOR_HOST ? "emulador local" : "PRODUÇÃO";
  const kb = c => Math.round(JSON.stringify(c).length / 1024);
  console.log(`Simulador publicado (${destino}): completo ${kb(completo)} KB, inquilino ${kb(inquilino)} KB`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await publicar();
  await db.terminate();
}
