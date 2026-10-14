// Ambiente local (corre dentro de `firebase emulators:exec`, via `npm run dev`):
// publica o simulador no emulador, volta a publicar a cada gravação e serve public/ com recarregamento automático.
import { watch } from "node:fs";
import { dirname, basename } from "node:path";
import browserSync from "browser-sync";
import { publicar, ORIGEM } from "./publicar-conteudo.mjs";

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error("Use `npm run dev`: este script só corre com os emuladores, para nunca escrever na produção.");
  process.exit(1);
}

await publicar();

const bs = browserSync.create();
bs.init({ server: { baseDir: "public", serveStaticOptions: { extensions: ["html"] } }, files: ["public/**/*"], port: 3000, notify: false, open: false, ui: false });

let t;
// Observa a pasta (e não o ficheiro): muitos editores gravam substituindo o ficheiro.
watch(dirname(ORIGEM), (_, f) => {
  if (f !== basename(ORIGEM)) return;
  clearTimeout(t);
  t = setTimeout(async () => {
    try { await publicar(); bs.reload(); } catch (e) { console.error(e.message); }
  }, 200);
});

console.log("\n  Simulador:        http://localhost:3000");
console.log("  Registos (local): http://localhost:4000/firestore\n");
