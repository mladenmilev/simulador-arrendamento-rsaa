// Publicação com versão: sobe a versão minor (semver), publica e regista a versão no git.
//   `npm run deploy -- --major` sobe a versão major (ex.: 1.18.0 → 2.0.0).
//   1. exige o git sem alterações por guardar (cada versão corresponde a um commit);
//   2. sobe a versão minor em package.json e public/js/versao.js;
//   3. gera as páginas públicas (concelhos, sitemap), publica o simulador no Firestore, as regras e o site;
//   4. se correr bem, faz commit e cria a tag vX.Y.Z; se falhar, repõe a versão anterior;
//   5. envia o commit e a tag para o GitHub (remote origin). Se o envio falhar, o site já está publicado:
//      basta repetir `git push origin HEAD --tags`.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const raiz = fileURLToPath(new URL("..", import.meta.url));
const sh = cmd => execSync(cmd, { cwd: raiz, encoding: "utf8" }).trim();
const corre = (cmd, args) => spawnSync(cmd, args, { cwd: raiz, stdio: "inherit" }).status === 0;
const FICHEIROS = ["package.json", "package-lock.json", "public/js/versao.js"];

if (sh("git status --porcelain")) {
  console.error("Há alterações por guardar no git. Faça commit antes de publicar, para a versão corresponder ao código.");
  process.exit(1);
}

// O e-mail de contacto vem de um ficheiro fora do git; sem ele a página de contacto sairia sem e-mail.
if (!existsSync(raiz + "contacto.local.json")) {
  console.error('Falta contacto.local.json (ex.: {"email": "nome@exemplo.pt"}). Crie-o antes de publicar.');
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(raiz + "package.json", "utf8"));
const [maj, min] = pkg.version.split(".").map(Number);
const versao = process.argv.includes("--major") ? `${maj + 1}.0.0` : `${maj}.${min + 1}.0`;

function escreverVersao(v) {
  for (const f of ["package.json", "package-lock.json"]) {
    const j = JSON.parse(readFileSync(raiz + f, "utf8"));
    j.version = v;
    if (j.packages?.[""]) j.packages[""].version = v;
    writeFileSync(raiz + f, JSON.stringify(j, null, 2) + "\n");
  }
  writeFileSync(raiz + "public/js/versao.js", `// Atualizado automaticamente por scripts/deploy.mjs. Não editar à mão.\nexport const VERSAO = "${v}";\n`);
}

console.log(`\nA publicar a versão ${versao} (anterior: ${pkg.version})\n`);
escreverVersao(versao);

const ok = corre("node", ["scripts/gerar-paginas.mjs"])
  && corre("node", ["scripts/publicar-conteudo.mjs"])
  && corre("firebase", ["deploy", "--only", "firestore:rules,hosting"]);

if (!ok) {
  sh(`git checkout -- ${FICHEIROS.join(" ")}`);
  console.error(`\nA publicação falhou. A versão voltou a ${pkg.version}.`);
  process.exit(1);
}

sh(`git add ${FICHEIROS.join(" ")}`);
sh(`git commit -q -m "Publicar v${versao}"`);
sh(`git tag v${versao}`);
console.log(`\nVersão ${versao} publicada. Commit e tag v${versao} criados.`);

// O código no GitHub acompanha cada versão publicada.
if (corre("git", ["push", "origin", "HEAD", `refs/tags/v${versao}`])) console.log(`Código e tag v${versao} enviados para o GitHub.`);
else console.error("Aviso: o envio para o GitHub falhou (o site está publicado). Repita com: git push origin HEAD --tags");
