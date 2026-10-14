// Envia src/simulador.html para o Firestore (documento conteudo/simulador).
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

export function extrair() {
  const html = readFileSync(ORIGEM, "utf8");
  const corpo = unico(html, /<body[^>]*>([\s\S]*)<\/body>/g, "body");
  return {
    titulo: unico(html, /<title>([\s\S]*?)<\/title>/g, "title"),
    css: unico(html, /<style>([\s\S]*?)<\/style>/g, "style"),
    js: unico(corpo, /<script>([\s\S]*?)<\/script>/g, "script"),
    html: corpo.replace(/<script>[\s\S]*?<\/script>/, "").trim(),
  };
}

export async function publicar() {
  const c = extrair();
  await ligar().doc("conteudo/simulador").set({ ...c, atualizadoEm: FieldValue.serverTimestamp() });
  const destino = process.env.FIRESTORE_EMULATOR_HOST ? "emulador local" : "PRODUÇÃO";
  console.log(`Simulador publicado (${destino}): ${Math.round(JSON.stringify(c).length / 1024)} KB`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await publicar();
  await db.terminate();
}
