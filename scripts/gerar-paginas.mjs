// Gera as páginas públicas para SEO a partir da tabela CONCELHOS de src/simulador.html (fonte única):
//   public/renda-acessivel/index.html      – índice por distrito
//   public/renda-acessivel/<concelho>.html – uma página por concelho (308)
//   public/sitemap.xml
// Os ficheiros gerados não vão para o git; são criados por `npm run dev` e `npm run deploy`.
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const raiz = fileURLToPath(new URL("..", import.meta.url));
// Endereço público do site. Se passar a haver domínio próprio, muda-se só aqui.
export const SITE = "https://simulador-arrendamento-pt.web.app";
const PORTARIA = "https://diariodarepublica.pt/dr/detalhe/portaria/454-2026-1179722108";
const TIPS = ["T0", "T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8"];

export function lerConcelhos() {
  const src = readFileSync(raiz + "src/simulador.html", "utf8");
  const m = src.match(/const CONCELHOS=(\{[\s\S]*?\n\});/);
  if (!m) throw new Error("src/simulador.html: tabela CONCELHOS não encontrada");
  return JSON.parse(m[1]);
}

const nome = c => c.replace(/ \(R\.A\.[AM]\.\)$/, "");
const regiao = c => (c.match(/\(R\.A\.([AM])\.\)$/) || [])[1];
export const slug = c => c.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
  .replace(/\(r\.a\.([am])\.\)/, "ra$1").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const eur = v => v.toLocaleString("pt-PT") + " €";
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const limite = ([, v, extra], t) => (t <= 5 ? v[t] : v[5] + (t - 5) * extra);
const porNome = (a, b) => a.localeCompare(b, "pt");
const ordemDistritos = (a, b) => (a.startsWith("Região") - b.startsWith("Região")) || porNome(a, b);

function cabeca({ titulo, descricao, url, jsonld }) {
  return `<!DOCTYPE html>
<html lang="pt-PT">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descricao)}">
<link rel="canonical" href="${url}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<meta property="og:type" content="website">
<meta property="og:locale" content="pt_PT">
<meta property="og:site_name" content="Simulador de Arrendamento Acessível (RSAA)">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descricao)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/og.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Public+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/tema.css">
<link rel="stylesheet" href="/css/paginas.css">
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
</head>
<body>
<div class="wrap">
  <nav class="migalhas" aria-label="Navegação"><a href="/">Simulador RSAA</a> › <a href="/renda-acessivel/">Renda acessível por concelho</a></nav>`;
}

const rodape = `
  <section class="cta">
    <h2>Simule o seu caso</h2>
    <p>Calcule a renda máxima de cada quarto, com casa de banho privativa e majorações, verifique a renda proposta e veja se compensa face ao mercado.</p>
    <a class="btn primary" href="/">Abrir o simulador</a>
  </section>
  <p class="nota">Valores da <a href="${PORTARIA}" target="_blank" rel="noopener">Portaria n.º 454/2026/1</a>, de 13 de outubro (anexo), que regulamenta o RSAA (Decreto-Lei n.º 97/2026, Anexo III). Atualizados automaticamente a 1 de janeiro de cada ano pelo coeficiente do NRAU. Página informativa; não substitui um contabilista ou advogado. Não afiliado ao IHRU.</p>
</div>
<p class="versao" id="versao"></p>
<script type="module">
import { VERSAO } from "/js/versao.js";
import "/js/analytics.js";
document.getElementById("versao").textContent = "v" + VERSAO;
</script>
</body>
</html>
`;

function paginaConcelho(c, dados, todos, rankT2) {
  const [distrito, v, extra] = dados;
  const n = nome(c), r = regiao(c);
  const onde = r ? `${n} (${r === "A" ? "Açores" : "Madeira"})` : n;
  const url = `${SITE}/renda-acessivel/${slug(c)}`;
  const linhas = TIPS.map((t, i) => {
    const b = limite(dados, i);
    return `<tr><th scope="row">${t}</th><td class="num"><strong>${eur(b)}</strong></td><td class="num">${eur(Math.floor(b * 1.1))}</td><td class="num">${eur(Math.floor(b * 1.2))}</td></tr>`;
  }).join("\n        ");
  // Exemplo de quartos: T3 com 12, 10 e 9 m² (Portaria, art. 2.º, n.º 2).
  const T3 = v[3], areas = [12, 10, 9], tot = 31;
  const quartos = areas.map(a => Math.floor(T3 * a / tot));
  const comWc = Math.floor(T3 * 12 * 1.25 / tot);
  const vizinhos = Object.keys(todos).filter(x => todos[x][0] === distrito && x !== c).sort(porNome);
  const pos = rankT2.indexOf(c) + 1;
  const media = Math.round(rankT2.reduce((s, x) => s + todos[x][1][2], 0) / rankT2.length);
  const titulo = `Renda acessível em ${onde} (RSAA): limites de T0 a T5`;
  const descricao = `Renda máxima para o arrendamento acessível (RSAA) em ${onde}: T1 ${eur(v[1])}, T2 ${eur(v[2])}, T3 ${eur(v[3])}. Valores da Portaria n.º 454/2026/1, com majorações e cálculo por quarto.`;
  const jsonld = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Simulador RSAA", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: "Renda acessível por concelho", item: SITE + "/renda-acessivel/" },
      { "@type": "ListItem", position: 3, name: onde, item: url },
    ],
  };
  return cabeca({ titulo, descricao, url, jsonld }) + `
  <h1>Renda acessível em ${esc(onde)} (RSAA)</h1>
  <p class="lede">Concelho de ${esc(n)}, ${esc(distrito)}. Estes são os valores máximos de renda mensal para um contrato beneficiar do Regime Simplificado de Arrendamento Acessível (RSAA), que dá isenção total de IRS ao senhorio. A renda pode ser mais baixa; acima destes valores o contrato é legal, mas fica na tributação normal.</p>

  <section>
    <h2>Renda máxima por tipologia</h2>
    <div class="tbl">
      <table>
        <thead><tr><th scope="col">Tipologia</th><th scope="col" class="num">Renda máxima</th><th scope="col" class="num">Com 1 majoração (+10 %)</th><th scope="col" class="num">Com 2 majorações (+20 %)</th></tr></thead>
        <tbody>
        ${linhas}
        </tbody>
      </table>
    </div>
    <p class="hint">Majorações cumulativas: +10 % com estacionamento privativo e +10 % com certificado energético A ou superior. Acima de T5 soma-se ${eur(extra)} por cada quarto adicional.</p>
    <p>Um T2 em ${esc(n)} tem um teto de ${eur(v[2])}, o ${pos}.º mais alto dos ${rankT2.length} concelhos do país (média nacional: ${eur(media)}).</p>
  </section>

  <section>
    <h2>Arrendar por quartos</h2>
    <p>No RSAA, o teto da casa é repartido pelos quartos em proporção da área de cada um (Portaria, art. 2.º, n.º 2). A área de um quarto com casa de banho privativa conta mais 25 %. Exemplo de um T3 em ${esc(n)} com quartos de 12, 10 e 9 m²:</p>
    <ul class="quartos">
      <li>Quarto de 12 m²: <strong>${eur(quartos[0])}</strong> (${eur(comWc)} com casa de banho privativa)</li>
      <li>Quarto de 10 m²: <strong>${eur(quartos[1])}</strong></li>
      <li>Quarto de 9 m²: <strong>${eur(quartos[2])}</strong></li>
    </ul>
    <p class="hint">O arrendamento de quartos só é possível em contratos de residência temporária, com o inquilino a ter residência fiscal noutro concelho (Decreto-Lei n.º 97/2026, Anexo III, art. 3.º).</p>
  </section>

  <section>
    <h2>Regras principais</h2>
    <ul>
      <li>Residência permanente: prazo mínimo de 3 anos. Residência temporária: prazo mínimo de 3 meses, renovável.</li>
      <li>O teto não inclui despesas (água, luz, internet), que podem ser cobradas à parte.</li>
      <li>O senhorio submete o contrato na plataforma do IHRU até 15 de janeiro do ano seguinte.</li>
    </ul>
  </section>
${vizinhos.length ? `
  <section>
    <h2>Outros concelhos de ${esc(distrito)}</h2>
    <ul class="lista-concelhos">${vizinhos.map(x => `<li><a href="/renda-acessivel/${slug(x)}">${esc(nome(x))}</a></li>`).join("")}</ul>
  </section>` : ""}` + rodape;
}

function paginaIndice(todos) {
  const url = `${SITE}/renda-acessivel/`;
  const distritos = [...new Set(Object.values(todos).map(x => x[0]))].sort(ordemDistritos);
  const titulo = "Renda acessível por concelho (RSAA): limites de 2026 em todos os concelhos";
  const descricao = "Tabela da renda máxima do arrendamento acessível (RSAA) nos 308 concelhos de Portugal, de T0 a T5, segundo a Portaria n.º 454/2026/1.";
  const jsonld = { "@context": "https://schema.org", "@type": "CollectionPage", name: titulo, url, description: descricao };
  return cabeca({ titulo, descricao, url, jsonld }) + `
  <h1>Renda acessível por concelho (RSAA)</h1>
  <p class="lede">Escolha o concelho para ver a renda máxima de T0 a T8 que permite beneficiar do Regime Simplificado de Arrendamento Acessível, com as majorações e o cálculo por quarto. Valores da Portaria n.º 454/2026/1 para os 308 concelhos.</p>
${distritos.map(d => `
  <section>
    <h2>${esc(d)}</h2>
    <ul class="lista-concelhos">${Object.keys(todos).filter(x => todos[x][0] === d).sort(porNome)
      .map(x => `<li><a href="/renda-acessivel/${slug(x)}">${esc(nome(x))}</a> <span class="hint">T2 ${eur(todos[x][1][2])}</span></li>`).join("")}</ul>
  </section>`).join("")}` + rodape;
}

export function gerar() {
  const todos = lerConcelhos();
  const nomes = Object.keys(todos);
  const slugs = new Set(nomes.map(slug));
  if (slugs.size !== nomes.length) throw new Error("Endereços de concelho repetidos");
  const rankT2 = [...nomes].sort((a, b) => todos[b][1][2] - todos[a][1][2] || porNome(a, b));
  const pasta = raiz + "public/renda-acessivel/";
  rmSync(pasta, { recursive: true, force: true });
  mkdirSync(pasta, { recursive: true });
  for (const c of nomes) writeFileSync(pasta + slug(c) + ".html", paginaConcelho(c, todos[c], todos, rankT2));
  writeFileSync(pasta + "index.html", paginaIndice(todos));
  const hoje = new Date().toISOString().slice(0, 10);
  const urls = ["/", "/renda-acessivel/", ...nomes.map(c => `/renda-acessivel/${slug(c)}`)];
  writeFileSync(raiz + "public/sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${SITE}${u}</loc><lastmod>${hoje}</lastmod></url>`).join("\n")}
</urlset>
`);
  console.log(`Páginas SEO geradas: ${nomes.length} concelhos + índice + sitemap (${urls.length} endereços)`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) gerar();
