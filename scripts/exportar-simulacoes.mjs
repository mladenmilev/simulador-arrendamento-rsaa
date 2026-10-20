// Exporta a coleção `simulacoes` (registos anónimos) para CSV, para estatísticas em Excel ou Google Sheets:
//   exportacoes/simulacoes.csv – uma linha por simulação (local, casa, contrato, resultado);
//   exportacoes/quartos.csv    – uma linha por quarto (inquilino em modo quarto e cada quarto do senhorio),
//                                com área, renda, valor máximo e renda por m².
// Uso: node scripts/exportar-simulacoes.mjs [--desde AAAA-MM-DD]
// Com FIRESTORE_EMULATOR_HOST definido lê o emulador; caso contrário, a produção (service-account.json).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const raiz = fileURLToPath(new URL("..", import.meta.url));
const emulador = !!process.env.FIRESTORE_EMULATOR_HOST;
initializeApp(emulador
  ? { projectId: "simulador-arrendamento-pt" }
  : { credential: cert(JSON.parse(readFileSync(raiz + "service-account.json", "utf8"))) });
const db = getFirestore();

const i = process.argv.indexOf("--desde");
let q = db.collection("simulacoes").orderBy("criadoEm");
if (i > 0) q = q.where("criadoEm", ">=", new Date(process.argv[i + 1]));
const docs = (await q.get()).docs;

// CSV com «;» e vírgula decimal, como o Excel em português espera.
const cel = v => {
  if (v === undefined || v === null) return "";
  if (typeof v === "boolean") return v ? "sim" : "não";
  if (typeof v === "number") return String(Math.round(v * 100) / 100).replace(".", ",");
  const s = String(v);
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = (cols, linhas) => "﻿" + [cols.join(";"), ...linhas.map(l => cols.map(c => cel(l[c])).join(";"))].join("\n") + "\n";
const porM2 = (renda, area) => renda > 0 && area > 0 ? renda / area : null;
const dentro = (renda, max) => renda > 0 && max > 0 ? renda <= max : null;

const sims = [], quartos = [];
for (const d of docs) {
  const s = d.data(), base = {
    id: d.id, data: s.criadoEm?.toDate().toLocaleString("sv-SE", { timeZone: "Europe/Lisbon" }).slice(0, 16), // hora de Lisboa versao: s.versao, ecra: s.ecra,
    vista: s.vista, modo: s.modo, distrito: s.distrito, concelho: s.concelho, tipologia: s.tipologia,
    estacionamento: s.estacionamento, certificadoA: s.certificadoA, valorMaxCasa: s.valorMaxCasa, resultado: s.resultado,
  };
  const linha = { ...base };
  if (s.inquilino) {
    const t = s.inquilino;
    Object.assign(linha, { renda: t.renda, valorMax: t.valorMax, areaQuarto: t.areaQuarto, areaQuartos: t.areaQuartos });
    if (s.modo === "quarto") quartos.push({ ...base, origem: "inquilino", quarto: 1, area: t.areaQuarto, areaQuartos: t.areaQuartos,
      wcPrivativa: t.wcPrivativa, pessoas: t.pessoas, arrendado: true, renda: t.renda, rendaAuto: false, valorMax: t.valorMax,
      rendaM2: porM2(t.renda, t.areaQuarto), dentro: dentro(t.renda, t.valorMax) });
  }
  if (s.senhorio) {
    const h = s.senhorio, qs = h.quartos || [];
    const areaQuartos = qs.reduce((a, r) => a + (r.area || 0), 0);
    Object.assign(linha, {
      finalidade: h.finalidade, prazoMeses: h.prazoMeses, residenciaFiscalFora: h.residenciaFiscalFora, despesasAParte: h.despesasAParte,
      rendaMercado: h.rendaMercado, rendaMercadoEstimada: h.rendaMercadoEstimada, taxaIRS: h.taxaIRS,
      areaApartamento: h.apartamento?.area, nQuartos: qs.length || undefined, nArrendados: qs.length ? qs.filter(r => r.arrendado).length : undefined,
      areaQuartos: qs.length ? areaQuartos : undefined,
      renda: h.apartamento ? h.apartamento.renda : qs.filter(r => r.arrendado).reduce((a, r) => a + (r.renda || 0), 0),
      rendaAuto: h.apartamento ? h.apartamento.auto : qs.some(r => r.arrendado && r.auto),
      valorMax: h.apartamento ? h.apartamento.valorMax : qs.filter(r => r.arrendado).reduce((a, r) => a + (r.valorMax || 0), 0),
    });
    qs.forEach((r, n) => quartos.push({ ...base, origem: "senhorio", quarto: n + 1, area: r.area, areaQuartos, wcPrivativa: r.wcPrivativa,
      pessoas: r.pessoas, arrendado: r.arrendado, renda: r.renda, rendaAuto: r.auto, valorMax: r.valorMax,
      rendaM2: porM2(r.renda, r.area), dentro: dentro(r.renda, r.valorMax) }));
  }
  linha.rendaM2 = porM2(linha.renda, linha.areaApartamento ?? linha.areaQuarto ?? linha.areaQuartos);
  sims.push(linha);
}

const COLS = ["id", "data", "versao", "ecra", "vista", "modo", "distrito", "concelho", "tipologia", "estacionamento", "certificadoA",
  "valorMaxCasa", "resultado", "renda", "rendaAuto", "valorMax", "rendaM2", "areaApartamento", "areaQuarto", "areaQuartos", "nQuartos",
  "nArrendados", "finalidade", "prazoMeses", "residenciaFiscalFora", "despesasAParte", "rendaMercado", "rendaMercadoEstimada", "taxaIRS"];
const COLS_Q = ["id", "data", "versao", "vista", "origem", "distrito", "concelho", "tipologia", "estacionamento", "certificadoA",
  "valorMaxCasa", "quarto", "area", "areaQuartos", "wcPrivativa", "pessoas", "arrendado", "renda", "rendaAuto", "valorMax", "rendaM2", "dentro"];

mkdirSync(raiz + "exportacoes", { recursive: true });
writeFileSync(raiz + "exportacoes/simulacoes.csv", csv(COLS, sims));
writeFileSync(raiz + "exportacoes/quartos.csv", csv(COLS_Q, quartos));
console.log(`${emulador ? "Emulador" : "Produção"}: ${sims.length} simulações e ${quartos.length} quartos exportados para exportacoes/`);
await db.terminate();
