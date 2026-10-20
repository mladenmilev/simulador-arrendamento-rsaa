// Apaga os dados pessoais do tempo em que havia login: a coleção `registos` (nome, e-mail) e todos os
// utilizadores do Firebase Authentication. O simulador já não pede identificação, por isso deixaram de ter finalidade.
// Irreversível. Só corre com --confirmar; sem ele mostra apenas quantos existem.
// Uso: node scripts/apagar-registos.mjs [--confirmar]
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const raiz = fileURLToPath(new URL("..", import.meta.url));
const emulador = !!process.env.FIRESTORE_EMULATOR_HOST;
initializeApp(emulador
  ? { projectId: "simulador-arrendamento-pt" }
  : { credential: cert(JSON.parse(readFileSync(raiz + "service-account.json", "utf8"))) });
const db = getFirestore(), auth = getAuth();
const confirmar = process.argv.includes("--confirmar");

const registos = (await db.collection("registos").get()).docs;
const uids = [];
for (let pagina; ;) {
  const r = await auth.listUsers(1000, pagina);
  uids.push(...r.users.map(u => u.uid));
  if (!(pagina = r.pageToken)) break;
}
console.log(`${emulador ? "Emulador" : "PRODUÇÃO"}: ${registos.length} registos e ${uids.length} utilizadores.`);

if (!confirmar) {
  console.log("Nada foi apagado. Para apagar, corra de novo com --confirmar.");
} else {
  for (let i = 0; i < registos.length; i += 400) {
    const lote = db.batch();
    registos.slice(i, i + 400).forEach(d => lote.delete(d.ref));
    await lote.commit();
  }
  for (let i = 0; i < uids.length; i += 1000) await auth.deleteUsers(uids.slice(i, i + 1000));
  console.log("Apagados.");
}
await db.terminate();
