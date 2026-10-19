// Gera as páginas públicas para SEO a partir da tabela CONCELHOS de src/simulador.html (fonte única):
//   public/renda-acessivel/index.html      – índice por distrito
//   public/renda-acessivel/<concelho>.html – uma página por concelho (308)
//   public/perguntas-frequentes.html       – perguntas frequentes (com dados estruturados FAQPage)
//   public/contacto.html                    – contacto do autor (e-mail protegido contra robôs)
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

function cabeca({ titulo, descricao, url, jsonld, migalhas = '<a href="/renda-acessivel/">Renda acessível por concelho</a>' }) {
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
  <a class="topo" href="/"><span class="tiles" aria-hidden="true"><span></span><span></span><span></span><span></span></span>Simulador de Arrendamento Acessível (RSAA)</a>
  <nav class="migalhas" aria-label="Navegação"><a href="/">Simulador RSAA</a> › ${migalhas}</nav>`;
}

const rodape = `
  <section class="cta">
    <h2>Simule o seu caso</h2>
    <p>Calcule a renda máxima de cada quarto, com casa de banho privativa e majorações, verifique a renda proposta e veja se compensa face ao mercado.</p>
    <a class="btn primary" href="/">Abrir o simulador</a>
  </section>
  <p class="nota"><a href="/perguntas-frequentes">Perguntas frequentes sobre o RSAA</a> · <a href="/renda-acessivel/">Renda acessível por concelho</a> · <a href="/contacto">Contacto</a></p>
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

const DL = "Decreto-Lei n.º 97/2026, Anexo III";
const PT = "Portaria n.º 454/2026/1";
// Perguntas frequentes: fonte única do texto visível e dos dados estruturados (FAQPage).
// Respostas em HTML simples; o texto para os dados estruturados é obtido retirando as etiquetas.
export const FAQ = [
  ["O que é o Regime Simplificado de Arrendamento Acessível (RSAA)?",
   `É um regime fiscal criado pelo ${DL}, em vigor desde 1 de setembro de 2026. Os contratos de arrendamento com renda igual ou inferior a um teto definido por concelho e tipologia ficam com <strong>isenção total de IRS ou IRC</strong> sobre as rendas, enquanto o contrato cumprir as regras (art. 6.º). Se o senhorio optar pelo englobamento dos rendimentos prediais, as rendas isentas contam apenas para determinar a taxa aplicável aos restantes rendimentos.`],
  ["Qual é a renda máxima no RSAA no meu concelho?",
   `Os tetos estão no anexo da ${PT}, de 13 de outubro, para os 308 concelhos e para as tipologias T0 a T5, variando entre 224 € (T0) e 2066 € (T5 em Lisboa). Pode consultá-los na <a href="/renda-acessivel/">tabela por concelho</a> ou calcular o seu caso no <a href="/">simulador</a>.`],
  ["A renda máxima do RSAA é o valor que devo cobrar ou pagar?",
   `Não. É o <strong>teto para o contrato beneficiar do RSAA</strong>, não um preço de referência. A renda pode ser mais baixa, consoante a localização e o estado do imóvel. Uma renda acima do teto é legal, mas o contrato fica fora do RSAA e o senhorio paga imposto sobre as rendas pela tributação normal.`],
  ["Como são definidos os tetos de renda?",
   `Têm por base 80 % da mediana das rendas divulgada pelo INE para o concelho do imóvel (${DL}, art. 4.º) e são fixados em euros para cada tipologia. A área do imóvel não entra no cálculo: um T2 de 60 m² e um T2 de 110 m² no mesmo concelho têm o mesmo teto.`],
  ["Há majorações ao teto de renda?",
   `Sim, cumulativas (${PT}, art. 2.º, n.º 4): <strong>+10 %</strong> se o arrendamento incluir estacionamento privativo e <strong>+10 %</strong> se o imóvel tiver certificado energético A ou superior, válido à data do contrato. Com as duas, o teto sobe 20 %.`],
  ["Qual é o teto para tipologias acima de T5?",
   `É o valor de T5 mais um montante por cada quarto adicional, que conforme o concelho é de 50 €, 75 € ou 100 € (nota ao anexo da ${PT}). Por exemplo, um T6 tem o teto do T5 mais um desses montantes.`],
  ["Posso arrendar um quarto no RSAA?",
   `Sim, mas só em contratos de <strong>residência temporária</strong>, com um inquilino que tenha residência fiscal noutro concelho, por exemplo um estudante ou trabalhador deslocado (${DL}, art. 3.º). O quarto tem de ter janela para o exterior (ou varanda ou marquise em contacto direto com o exterior), e o inquilino acesso autónomo à entrada da habitação, a uma casa de banho completa e à cozinha. Em residência permanente só é possível arrendar a habitação inteira.`],
  ["Como se calcula a renda máxima de um quarto?",
   `O teto da casa é repartido em proporção da área: <strong>teto do quarto = teto da casa × área do quarto ÷ soma das áreas de todos os quartos</strong> (${PT}, art. 2.º, n.º 2). A área de um quarto com casa de banho privativa conta mais 25 %; a soma das áreas não é majorada. Sala, cozinha e casas de banho não contam. Exemplo: num T3 com teto de 1193 € e quartos de 12, 10 e 9 m², o quarto de 12 m² tem um teto de 461 €.`],
  ["Quais são os prazos mínimos dos contratos?",
   `<strong>3 anos</strong> para residência permanente e <strong>3 meses</strong> para residência temporária, que pode ser renovada enquanto a finalidade temporária se mantiver (${DL}, art. 5.º).`],
  ["As despesas de água, luz ou internet contam para o teto?",
   `Não. Os tetos não incluem as despesas e encargos previstos no artigo 1078.º do Código Civil (${DL}, art. 4.º, n.º 3). Convém escrever no contrato quais despesas são pagas à parte e como são divididas. Se a renda incluir despesas, é o valor total cobrado que deve respeitar o teto.`],
  ["Como é que o senhorio adere ao RSAA?",
   `Depois de comunicar o contrato no Portal das Finanças, o senhorio submete na plataforma eletrónica do IHRU, até 15 de janeiro do ano seguinte ao da celebração, a cópia do contrato e o comprovativo dessa comunicação. O IHRU comunica o contrato à Autoridade Tributária até ao fim de fevereiro, e a isenção produz efeitos desde a data do contrato (${DL}, art. 6.º).`],
  ["O que acontece se as regras deixarem de ser cumpridas?",
   `Perdem-se os benefícios fiscais desde o momento do incumprimento. O senhorio tem de o declarar e pagar a diferença de imposto, acrescida de juros compensatórios. A verificação cabe ao IHRU, com audiência prévia dos interessados (${DL}, art. 7.º).`],
  ["Os tetos de renda mudam?",
   `Sim. São atualizados automaticamente a 1 de janeiro de cada ano pelo coeficiente de atualização das rendas (NRAU, art. 24.º), e podem ser revistos por alteração da portaria (${PT}, art. 3.º). Este simulador é atualizado quando os valores mudam.`],
  ["Sou inquilino: como verifico se a minha renda está dentro do teto?",
   `Use a vista do inquilino do <a href="/">simulador</a>, que não exige identificação. Para um quarto precisa da área do seu quarto e da soma das áreas de todos os quartos da casa (peça-as ao senhorio); para a casa inteira basta o concelho e a tipologia. Se a renda estiver acima do teto, o contrato é válido, mas não fica no RSAA.`],
  ["Este simulador é oficial?",
   `Não. É uma ferramenta informativa independente, não afiliada ao IHRU, que usa os valores da ${PT}. A Portaria prevê que o IHRU disponibilize uma ferramenta de cálculo na sua plataforma eletrónica (art. 4.º). O simulador não substitui um contabilista ou advogado.`],
];

function paginaFAQ() {
  const url = `${SITE}/perguntas-frequentes`;
  const titulo = "Perguntas frequentes sobre o arrendamento acessível (RSAA)";
  const descricao = "Respostas sobre o RSAA: tetos de renda por concelho, majorações, arrendamento de quartos, prazos mínimos, despesas, adesão no IHRU e isenção de IRS.";
  const texto = h => h.replace(/<[^>]+>/g, "");
  const jsonld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map(([q, r]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: texto(r) } })),
  };
  const id = i => "p" + (i + 1);
  return cabeca({ titulo, descricao, url, jsonld, migalhas: "Perguntas frequentes" }) + `
  <h1>Perguntas frequentes sobre o RSAA</h1>
  <p class="lede">O essencial sobre o Regime Simplificado de Arrendamento Acessível, para senhorios e inquilinos, com referência aos artigos da lei.</p>
  <nav class="indice" aria-label="Perguntas">
    <ol>${FAQ.map(([q], i) => `<li><a href="#${id(i)}">${esc(q)}</a></li>`).join("")}</ol>
  </nav>
${FAQ.map(([q, r], i) => `
  <section class="faq" id="${id(i)}">
    <h2>${esc(q)}</h2>
    <p>${r}</p>
  </section>`).join("")}` + rodape;
}

// Contacto: o e-mail não aparece no HTML. Está guardado em partes invertidas e só é montado no navegador
// depois de um clique, o que trava a maioria dos robôs que recolhem endereços.
function paginaContacto() {
  const url = `${SITE}/contacto`;
  const titulo = "Contacto – Simulador de Arrendamento Acessível (RSAA)";
  const descricao = "Sugestões, correções ou interesse em usar o simulador RSAA: contacte o autor.";
  const jsonld = { "@context": "https://schema.org", "@type": "ContactPage", name: titulo, url };
  return cabeca({ titulo, descricao, url, jsonld, migalhas: "Contacto" }) + `
  <h1>Contacto</h1>
  <p class="lede">Sugestões, correções ou interesse em usar o simulador? Escreva para:</p>
  <p class="contacto"><button type="button" class="btn" id="mostrar" data-u="velim.nedalm" data-d="moc.liamg">Mostrar e-mail</button></p>
  <noscript><p class="hint">Ative o JavaScript para ver o endereço de e-mail.</p></noscript>
  <p class="hint">Este simulador é informativo e não substitui um contabilista ou advogado; não é possível responder a pedidos de aconselhamento sobre casos concretos.</p>
  <script>
  document.getElementById("mostrar").addEventListener("click", function () {
    var r = function (s) { return s.split("").reverse().join(""); };
    var e = r(this.dataset.u) + "@" + r(this.dataset.d);
    var a = document.createElement("a");
    a.href = "mailto:" + e; a.textContent = e;
    this.replaceWith(a);
  });
  </script>
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
  writeFileSync(raiz + "public/perguntas-frequentes.html", paginaFAQ());
  writeFileSync(raiz + "public/contacto.html", paginaContacto());
  const hoje = new Date().toISOString().slice(0, 10);
  const urls = ["/", "/perguntas-frequentes", "/contacto", "/renda-acessivel/", ...nomes.map(c => `/renda-acessivel/${slug(c)}`)];
  writeFileSync(raiz + "public/sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${SITE}${u}</loc><lastmod>${hoje}</lastmod></url>`).join("\n")}
</urlset>
`);
  console.log(`Páginas SEO geradas: ${nomes.length} concelhos + índice + perguntas frequentes + contacto + sitemap (${urls.length} endereços)`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) gerar();
