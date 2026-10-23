// Gera as páginas públicas para SEO a partir da tabela CONCELHOS de src/simulador.html (fonte única):
//   public/renda-acessivel/index.html      – índice por distrito
//   public/renda-acessivel/<concelho>.html – uma página por concelho (308)
//   public/perguntas-frequentes.html       – perguntas frequentes (com dados estruturados FAQPage)
//   public/contacto.html                    – contacto do autor (e-mail protegido contra robôs)
//   public/como-se-calcula.html             – fórmulas e exemplos (para pessoas, motores de busca e assistentes de IA)
//   public/termos.html                      – termos de utilização (uso pessoal livre; profissional/comercial com licença)
//   public/llms.txt                         – resumo do site e valores de todos os concelhos, para assistentes de IA
//   public/dados/concelhos.json             – valores de referência por concelho para a página de entrada (concelho lembrado)
//   public/sitemap.xml
// Os ficheiros gerados não vão para o git; são criados por `npm run dev` e `npm run deploy`.
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const raiz = fileURLToPath(new URL("..", import.meta.url));
// Endereço público do site. Se passar a haver domínio próprio, muda-se só aqui.
export const SITE = "https://simulador-arrendamento-pt.web.app";
const PORTARIA = "https://diariodarepublica.pt/dr/detalhe/portaria/454-2026-1179722108";
const DECRETO = "https://diariodarepublica.pt/dr/detalhe/decreto-lei/97-2026-1124493227";
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
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/tema.css">
<link rel="stylesheet" href="/css/paginas.css">
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
</head>
<body class="com-rua">
<div class="wrap">
  <header class="cab">
    <a class="marca" href="/"><span class="tiles" aria-hidden="true"><span></span><span></span><span></span><span></span></span><span>Simulador <b>RSAA</b></span></a>
    <nav aria-label="Principal"><a href="/renda-acessivel/">Valores por concelho</a><a href="/perguntas-frequentes">Perguntas</a><a href="/contacto">Contacto</a><a class="entrar" href="/simulador">Abrir simulador</a></nav>
  </header>
  <nav class="migalhas" aria-label="Navegação"><a href="/">Simulador RSAA</a> › ${migalhas}</nav>`;
}

const rodape = `
  <section class="cta">
    <h2>A sua renda pode ficar no RSAA?</h2>
    <p>Sem registo. Inquilinos verificam a renda; senhorios calculam o valor de referência do RSAA de cada quarto e veem a partir de que renda compensaria ficar fora do RSAA.</p>
    <div class="cta-acoes">
      <a class="btn primary" href="/simulador?vista=inquilino">Verificar a minha renda</a>
      <a class="btn claro" href="/simulador?vista=senhorio">Calcular valores de referência</a>
    </div>
    <p class="cta-nota">Grátis e sem registo</p>
  </section>
  <p class="nota"><a href="/perguntas-frequentes">Perguntas frequentes sobre o RSAA</a> · <a href="/como-se-calcula">Como se calcula</a> · <a href="/renda-acessivel/">Renda acessível por concelho</a> · <a href="/contacto">Contacto</a> · <a href="/termos">Termos de utilização</a></p>
  <p class="nota">Valores da <a href="${PORTARIA}" target="_blank" rel="noopener">Portaria n.º 454/2026/1</a>, de 13 de outubro (anexo), que regulamenta o RSAA (Decreto-Lei n.º 97/2026, Anexo III). Atualizados automaticamente a 1 de janeiro de cada ano pelo coeficiente do NRAU. Página informativa; não substitui um contabilista ou advogado. Não afiliado ao IHRU.</p>
  <p class="nota licenca">Uso pessoal gratuito; uso profissional ou comercial requer licença do autor (Business Source License 1.1). Ver os <a href="/termos">termos de utilização</a>.</p>
</div>
<p class="versao" id="versao"></p>
<script type="module">
import { VERSAO } from "/js/versao.js";
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
  const titulo = `Renda acessível em ${onde} (RSAA): valores de referência de T0 a T5`;
  const descricao = `Valores de referência do arrendamento acessível (RSAA) em ${onde}: T1 ${eur(v[1])}, T2 ${eur(v[2])}, T3 ${eur(v[3])}. Valores da Portaria n.º 454/2026/1, com majorações e cálculo por quarto.`;
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
  <script>try{localStorage.setItem("concelho",${JSON.stringify(c)})}catch(e){}</script>
  <h1>Renda acessível em ${esc(onde)} (RSAA)</h1>
  <p class="lede">Concelho de ${esc(n)}, ${esc(distrito)}. Estes são os valores de referência do RSAA: a renda mensal até à qual um contrato pode beneficiar do Regime Simplificado de Arrendamento Acessível (RSAA), que dá isenção total de IRS ao senhorio. A renda pode ser mais baixa; acima destes valores o contrato é legal, mas fica na tributação normal.</p>

  <section>
    <h2>Valor de referência do RSAA por tipologia</h2>
    <div class="tbl">
      <table>
        <thead><tr><th scope="col">Tipologia</th><th scope="col" class="num">Valor de referência</th><th scope="col" class="num">Com 1 majoração (+10 %)</th><th scope="col" class="num">Com 2 majorações (+20 %)</th></tr></thead>
        <tbody>
        ${linhas}
        </tbody>
      </table>
    </div>
    <p class="hint">Majorações cumulativas: +10 % com estacionamento privativo e +10 % com certificado energético A ou superior. Acima de T5 soma-se ${eur(extra)} por cada quarto adicional.</p>
    <p>Um T2 em ${esc(n)} tem um valor de referência de ${eur(v[2])}, o ${pos}.º mais alto dos ${rankT2.length} concelhos do país (média nacional: ${eur(media)}).</p>
  </section>

  <section>
    <h2>Arrendar por quartos</h2>
    <p>No RSAA, o valor de referência da casa é repartido pelos quartos em proporção da área de cada um (Portaria, art. 2.º, n.º 2). A área de um quarto com casa de banho privativa conta mais 25 %. Exemplo de um T3 em ${esc(n)} com quartos de 12, 10 e 9 m²:</p>
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
      <li>O valor de referência não inclui despesas (água, luz, internet), que podem ser cobradas à parte.</li>
      <li>Não é um limite à renda: o senhorio pode pedir mais, e é legal, mas o contrato fica fora do RSAA e sem isenção de IRS.</li>
      <li>O senhorio comunica o contrato às Finanças e submete-o na plataforma do IHRU até 15 de janeiro do ano seguinte (o inquilino não tem de o fazer).</li>
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
  const titulo = "Renda acessível por concelho (RSAA): valores de referência de 2026 em todos os concelhos";
  const descricao = "Tabela dos valores de referência do arrendamento acessível (RSAA) nos 308 concelhos de Portugal, de T0 a T5, segundo a Portaria n.º 454/2026/1.";
  const jsonld = { "@context": "https://schema.org", "@type": "CollectionPage", name: titulo, url, description: descricao };
  return cabeca({ titulo, descricao, url, jsonld }) + `
  <h1>Renda acessível por concelho (RSAA)</h1>
  <p class="lede">Escolha o concelho para ver o valor de referência, de T0 a T8, até ao qual a renda permite beneficiar do Regime Simplificado de Arrendamento Acessível, com as majorações e o cálculo por quarto. Valores da Portaria n.º 454/2026/1 para os 308 concelhos.</p>
${distritos.map(d => `
  <section>
    <h2>${esc(d)}</h2>
    <ul class="lista-concelhos">${Object.keys(todos).filter(x => todos[x][0] === d).sort(porNome)
      .map(x => `<li><a href="/renda-acessivel/${slug(x)}">${esc(nome(x))}</a> <span class="hint">T2 ${eur(todos[x][1][2])}</span></li>`).join("")}</ul>
  </section>`).join("")}` + rodape;
}

const DL = "Decreto-Lei n.º 97/2026, Anexo III";
const DL_URL = "https://diariodarepublica.pt/dr/detalhe/decreto-lei/97-2026-1124493227";
const PT = "Portaria n.º 454/2026/1";
// Perguntas frequentes: fonte única do texto visível e dos dados estruturados (FAQPage).
// Respostas em HTML simples; o texto para os dados estruturados é obtido retirando as etiquetas.
export const FAQ = [
  ["O que é o Regime Simplificado de Arrendamento Acessível (RSAA)?",
   `É um regime fiscal criado pelo ${DL}, em vigor desde 1 de setembro de 2026. Os contratos com renda igual ou inferior a um valor de referência definido por concelho e tipologia ficam com <strong>isenção total de IRS ou IRC</strong> sobre as rendas, enquanto cumprirem as regras (art. 6.º). Se o senhorio optar pelo englobamento dos rendimentos prediais, as rendas isentas contam apenas para determinar a taxa aplicável aos restantes rendimentos.`],
  ["Qual é o valor de referência do RSAA no meu concelho?",
   `Os valores estão no anexo da ${PT}, de 13 de outubro, para os 308 concelhos e para as tipologias T0 a T5, entre 224 € (T0) e 2066 € (T5 em Lisboa). Pode consultá-los na <a href="/renda-acessivel/">tabela por concelho</a> ou calcular o seu caso no <a href="/">simulador</a>.`],
  ["O valor de referência do RSAA é um limite à renda?",
   `Não. É a renda mensal até à qual o contrato pode <strong>beneficiar do RSAA</strong> e da isenção de IRS. O senhorio pode pedir mais, e é <strong>legal</strong>: nesse caso o contrato fica fora do regime e as rendas são tributadas normalmente. Também não é um preço de mercado: a renda pode ser mais baixa, consoante a localização e o estado do imóvel.`],
  ["O RSAA compensa sempre ao senhorio?",
   `Não necessariamente. No RSAA não paga IRS sobre as rendas, desde que a renda não passe o valor de referência; fora do regime pode pedir mais, mas paga IRS. O que compensa depende da renda que a casa consegue fora do regime e da taxa de IRS de cada senhorio. Fora do RSAA só compensa com uma renda acima do valor de referência ÷ (1 − taxa de IRS): com a taxa de 25 %, cerca de um terço acima do valor de referência (por exemplo, 1784 € para um valor de referência de 1338 €). O <a href="/">simulador</a> mostra esse valor para o seu caso.`],
  ["Que vantagens tem o RSAA para o inquilino?",
   `O RSAA não altera os impostos do inquilino. O que ganha é <strong>clareza contratual</strong> (contrato com regras definidas, que o senhorio comunica às Finanças e submete no IHRU, com recibos eletrónicos e despesas definidas à parte) e um prazo mínimo conforme a finalidade: 3 anos em residência permanente, que dá estabilidade, ou 3 meses renováveis em residência temporária, que dá flexibilidade. Quando a análise o confirma, pode também ser um argumento para negociar a renda.`],
  ["Como são definidos os valores de referência?",
   `Têm por base 80 % da mediana das rendas divulgada pelo INE para o concelho do imóvel (${DL}, art. 4.º) e são fixados em euros para cada tipologia. A lei chama-lhes «limite máximo de renda», mas é o limite para o contrato beneficiar do regime, não um limite à renda. A área do imóvel não entra no cálculo: um T2 de 60 m² e um T2 de 110 m² no mesmo concelho têm o mesmo valor de referência.`],
  ["Há majorações ao valor de referência?",
   `Sim, cumulativas (${PT}, art. 2.º, n.º 4): <strong>+10 %</strong> se o arrendamento incluir estacionamento privativo e <strong>+10 %</strong> se o imóvel tiver certificado energético A ou superior, válido à data do contrato. Com as duas, o valor sobe 20 %.`],
  ["Qual é o valor de referência para tipologias acima de T5?",
   `É o valor de T5 mais um montante por cada quarto adicional, que conforme o concelho é de 50 €, 75 € ou 100 € (150 € em Lisboa) (nota ao anexo da ${PT}). Por exemplo, um T6 tem o valor do T5 mais um desses montantes.`],
  ["Posso arrendar um quarto no RSAA?",
   `Sim, mas só em contratos de <strong>residência temporária</strong>, com um inquilino que tenha residência fiscal noutro concelho, por exemplo um estudante ou trabalhador deslocado (${DL}, art. 3.º). O quarto tem de ter janela para o exterior (ou varanda ou marquise em contacto direto com o exterior), e o inquilino acesso autónomo à entrada da habitação, a uma casa de banho completa e à cozinha. Em residência permanente só é possível arrendar a habitação inteira.`],
  ["Como se calcula o valor de referência de um quarto?",
   `O valor da casa é repartido em proporção da área: <strong>valor do quarto = valor de referência da casa × área do quarto ÷ soma das áreas de todos os quartos</strong> (${PT}, art. 2.º, n.º 2). A área de um quarto com casa de banho privativa conta mais 25 %; a soma das áreas não é majorada. Sala, cozinha e casas de banho não contam. Exemplo: num T3 com valor de referência de 1193 € e quartos de 12, 10 e 9 m², o quarto de 12 m² tem um valor de referência de 461 €.`],
  ["Quais são os prazos mínimos dos contratos?",
   `<strong>3 anos</strong> para residência permanente e <strong>3 meses</strong> para residência temporária, que pode ser renovada enquanto a finalidade temporária se mantiver (${DL}, art. 5.º).`],
  ["As despesas de água, luz ou internet contam para o valor de referência?",
   `Não. Os valores de referência não incluem as despesas e encargos previstos no artigo 1078.º do Código Civil (${DL}, art. 4.º, n.º 3). Convém escrever no contrato quais despesas são pagas à parte e como são divididas. Se a renda incluir despesas, é o valor total cobrado que deve respeitar o valor de referência.`],
  ["Como é que o senhorio adere ao RSAA?",
   `Depois de comunicar o contrato no Portal das Finanças, o senhorio submete na plataforma eletrónica do IHRU, até 15 de janeiro do ano seguinte ao da celebração, a cópia do contrato e o comprovativo dessa comunicação. O IHRU comunica o contrato à Autoridade Tributária até ao fim de fevereiro, e a isenção produz efeitos desde a data do contrato (${DL}, art. 6.º).`],
  ["O que acontece se as regras deixarem de ser cumpridas?",
   `Perdem-se os benefícios fiscais desde o momento do incumprimento. O senhorio tem de o declarar e pagar a diferença de imposto, acrescida de juros compensatórios. A verificação cabe ao IHRU, com audiência prévia dos interessados (${DL}, art. 7.º).`],
  ["Os valores de referência mudam?",
   `Sim. São atualizados automaticamente a 1 de janeiro de cada ano pelo coeficiente de atualização das rendas (NRAU, art. 24.º), e podem ser revistos por alteração da portaria (${PT}, art. 3.º). Este simulador é atualizado quando os valores mudam.`],
  ["A renda de um contrato no RSAA pode ser aumentada todos os anos?",
   `Sim, pelas regras gerais do arrendamento. O RSAA não tem uma regra própria para o aumento anual: os contratos de arrendamento acessível regem-se pelo Código Civil e pelo NRAU (<a href="${DL_URL}" target="_blank" rel="noopener">${DL}</a>, art. 3.º, n.º 3). Pelo artigo 1077.º do Código Civil, o contrato pode definir como a renda é atualizada; se não disser nada, aplica-se o <strong>coeficiente anual publicado pelo INE</strong> (NRAU, art. 24.º), que para 2027 é de 1,0256, ou seja, +2,56 % (Aviso n.º 24199/2026/2). A primeira atualização pode ser pedida um ano depois do início do contrato, e o senhorio comunica-a por escrito com pelo menos 30 dias de antecedência. Os valores de referência do RSAA sobem pelo mesmo coeficiente, a 1 de janeiro de cada ano (${DL}, art. 4.º, n.º 2; <a href="${PORTARIA}" target="_blank" rel="noopener">${PT}</a>, art. 3.º): uma renda atualizada pelo coeficiente legal continua dentro do valor de referência. Já um aumento maior, por exemplo uma percentagem fixa acima do coeficiente, pode fazer a renda passar o valor de referência; a partir desse momento o contrato <strong>perde a isenção de IRS</strong> e o senhorio tem de regularizar o imposto, com juros compensatórios (${DL}, art. 7.º). A isenção mantém-se nas renovações do contrato (art. 6.º, n.º 5).`],
  ["Sou inquilino: como sei se a minha renda permite ao senhorio beneficiar do RSAA?",
   `Use a vista do inquilino do <a href="/">simulador</a>, que não exige identificação. Para um quarto precisa da área do seu quarto e da soma das áreas de todos os quartos da casa (peça-as ao senhorio); para a casa inteira basta o concelho e a tipologia. Se a renda estiver acima do valor de referência, é legal, mas o contrato não fica no RSAA. A «Análise da situação» explica o resultado e pode ser guardada em PDF.`],
  ["Este simulador é oficial?",
   `Não. É uma ferramenta informativa independente, não afiliada ao IHRU, que usa os valores da ${PT}. A Portaria prevê que o IHRU disponibilize uma ferramenta de cálculo na sua plataforma eletrónica (art. 4.º). O simulador não substitui um contabilista ou advogado.`],
];

function paginaFAQ() {
  const url = `${SITE}/perguntas-frequentes`;
  const titulo = "Perguntas frequentes sobre o arrendamento acessível (RSAA)";
  const descricao = "Respostas sobre o RSAA: valores de referência por concelho, majorações, arrendamento de quartos, prazos mínimos, despesas, adesão no IHRU e isenção de IRS.";
  const texto = h => h.replace(/<[^>]+>/g, "");
  const jsonld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map(([q, r]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: texto(r) } })),
  };
  const id = i => "p" + (i + 1);
  return cabeca({ titulo, descricao, url, jsonld, migalhas: "Perguntas frequentes" }) + `
  <h1>Perguntas frequentes sobre o RSAA</h1>
  <p class="lede">O essencial sobre o Regime Simplificado de Arrendamento Acessível, para senhorios e inquilinos, com referência aos artigos da lei. As fórmulas, com exemplos, estão em <a href="/como-se-calcula">Como se calcula</a>.</p>
  <nav class="indice" aria-label="Perguntas">
    <ol>${FAQ.map(([q], i) => `<li><a href="#${id(i)}">${esc(q)}</a></li>`).join("")}</ol>
  </nav>
${FAQ.map(([q, r], i) => `
  <section class="faq" id="${id(i)}">
    <h2>${esc(q)}</h2>
    <p>${r}</p>
  </section>`).join("")}` + rodape;
}

// Como se calcula: as regras do simulador em texto, com exemplos calculados a partir da tabela (Lisboa, T3).
// Serve quem quer perceber o resultado e os motores de busca e assistentes de IA, que não correm o simulador.
function paginaCalculo(todos) {
  const url = `${SITE}/como-se-calcula`;
  const titulo = "Como se calcula o valor de referência do arrendamento acessível (RSAA)";
  const descricao = "Fórmulas e exemplos do RSAA: valor de referência da casa, majorações, valor de um quarto, tipologias acima de T5 e a renda a partir da qual compensa ficar fora do regime.";
  const c = "Lisboa", L = limite(todos[c], 3), [, v, extra] = todos[c];
  const q = a => Math.floor(L * a / 31), eq = Math.ceil(L / 0.75);
  const iFaq = FAQ.findIndex(([p]) => /aumentada todos os anos/.test(p));
  const jsonld = {
    "@context": "https://schema.org", "@type": "TechArticle", headline: titulo, description: descricao, inLanguage: "pt-PT", url,
    isBasedOn: [PORTARIA, DECRETO], about: "Regime Simplificado de Arrendamento Acessível (RSAA)",
  };
  return cabeca({ titulo, descricao, url, jsonld, migalhas: "Como se calcula" }) + `
  <h1>Como se calcula o valor de referência do RSAA</h1>
  <p class="lede">As regras que o simulador aplica, com a referência na lei e exemplos para um T3 em ${c}. O valor de referência é a renda mensal até à qual o contrato pode beneficiar do RSAA e da isenção de IRS; não é um limite à renda. Os valores de cada concelho estão na <a href="/renda-acessivel/">tabela por concelho</a>.</p>

  <section>
    <h2>1. Valor de referência da casa</h2>
    <p>É fixado em euros por concelho e tipologia no anexo da <a href="${PORTARIA}" target="_blank" rel="noopener">${PT}</a>, com base em 80 % da mediana das rendas do INE para o concelho (<a href="${DECRETO}" target="_blank" rel="noopener">${DL}</a>, art. 4.º). A área da casa não conta: dois T3 do mesmo concelho têm o mesmo valor de referência.</p>
    <p><strong>Exemplo:</strong> um T3 em ${c} tem um valor de referência de <strong>${eur(L)}</strong> por mês.</p>
    <p>Acima de T5, soma-se ao valor do T5 um montante por cada quarto a mais, de 50 €, 75 € ou 100 € consoante o concelho, e de 150 € em Lisboa (anexo da Portaria). Em ${c}: T5 ${eur(v[5])}, T6 ${eur(v[5] + extra)}, T7 ${eur(v[5] + 2 * extra)}.</p>
  </section>

  <section>
    <h2>2. Majorações</h2>
    <p>O valor de referência sobe <strong>10 %</strong> se o arrendamento incluir estacionamento privativo e <strong>10 %</strong> se o imóvel tiver certificado energético A ou superior. São cumulativas (${PT}, art. 2.º, n.º 4).</p>
    <p class="formula"><strong>Valor com majorações = valor de referência × (1 + 0,10 por cada majoração)</strong></p>
    <p><strong>Exemplo:</strong> T3 em ${c} com estacionamento: ${eur(L)} × 1,10 = <strong>${eur(Math.floor(L * 1.1))}</strong>; com estacionamento e certificado A: ${eur(L)} × 1,20 = <strong>${eur(Math.floor(L * 1.2))}</strong>.</p>
  </section>

  <section>
    <h2>3. Valor de referência de um quarto</h2>
    <p>O valor da casa reparte-se pelos quartos em proporção da área (${PT}, art. 2.º, n.º 2). Só contam os quartos: sala, cozinha e casas de banho ficam de fora. A área de um quarto com casa de banho privativa conta mais 25 %; a soma das áreas não é majorada.</p>
    <p class="formula"><strong>Valor do quarto = valor de referência da casa × área do quarto ÷ soma das áreas de todos os quartos</strong></p>
    <p><strong>Exemplo:</strong> T3 em ${c} (${eur(L)}) com quartos de 12, 10 e 9 m² (soma: 31 m²):</p>
    <ul class="quartos">
      <li>Quarto de 12 m²: ${eur(L)} × 12 ÷ 31 = <strong>${eur(q(12))}</strong></li>
      <li>Quarto de 10 m²: ${eur(L)} × 10 ÷ 31 = <strong>${eur(q(10))}</strong></li>
      <li>Quarto de 9 m²: ${eur(L)} × 9 ÷ 31 = <strong>${eur(q(9))}</strong></li>
      <li>O quarto de 12 m² com casa de banho privativa conta como 15 m²: ${eur(L)} × 15 ÷ 31 = <strong>${eur(q(15))}</strong></li>
    </ul>
    <p>Num quarto para 2 pessoas, o valor de referência é o do quarto; o simulador mostra também a metade por pessoa (${eur(Math.floor(q(12) / 2))} no quarto de 12 m²). Arrendar quartos no RSAA só é possível em residência temporária, com um inquilino com residência fiscal noutro concelho (${DL}, art. 3.º).</p>
    <p class="hint">O simulador arredonda os valores para baixo, ao euro, para a renda ficar sempre dentro do valor de referência.</p>
  </section>

  <section>
    <h2>4. A renda proposta cabe no RSAA?</h2>
    <p>Cabe se for <strong>igual ou inferior</strong> ao valor de referência (da casa ou do quarto) e o contrato cumprir as outras condições: prazo mínimo de 3 anos em residência permanente ou de 3 meses, renovável, em residência temporária (${DL}, art. 5.º). O valor de referência não inclui despesas de água, luz ou internet pagas à parte (art. 4.º, n.º 3).</p>
    <p>Acima do valor de referência a renda continua a ser <strong>legal</strong>; o contrato apenas fica fora do RSAA e as rendas pagam IRS pela tributação normal.</p>
  </section>

  <section>
    <h2>5. A partir de que renda compensa ficar fora do RSAA</h2>
    <p>No RSAA as rendas ficam isentas de IRS (${DL}, art. 6.º). Fora dele, o senhorio pode pedir mais, mas paga IRS. Compensa ficar fora só quando a renda, depois do imposto, deixa mais do que o valor de referência isento:</p>
    <p class="formula"><strong>Renda a partir da qual compensa = valor de referência ÷ (1 − taxa de IRS)</strong></p>
    <p><strong>Exemplo:</strong> com a taxa autónoma de 25 %, o T3 em ${c} só compensa fora do RSAA com uma renda acima de ${eur(L)} ÷ 0,75 = <strong>${eur(eq)}</strong> por mês. Abaixo disso, o RSAA rende mais ao senhorio. As contas não descontam encargos (IMI, condomínio, seguros, obras) nem reduções de taxa para contratos longos; confirme a taxa aplicável com um contabilista.</p>
  </section>

  <section>
    <h2>6. Atualização anual</h2>
    <p>Os valores de referência sobem a 1 de janeiro de cada ano pelo coeficiente de atualização das rendas (${DL}, art. 4.º, n.º 2; ${PT}, art. 3.º). A renda de um contrato pode ser atualizada pelas regras gerais do Código Civil (art. 1077.º): <a href="/perguntas-frequentes#p${iFaq + 1}">ver a pergunta sobre o aumento anual</a>.</p>
  </section>

  <section>
    <h2>Fontes</h2>
    <ul>
      <li><a href="${DECRETO}" target="_blank" rel="noopener">Decreto-Lei n.º 97/2026, de 20 de maio</a>, Anexo III (Regime Simplificado de Arrendamento Acessível)</li>
      <li><a href="${PORTARIA}" target="_blank" rel="noopener">Portaria n.º 454/2026/1, de 13 de outubro</a> (valores de referência por concelho e tipologia)</li>
    </ul>
  </section>` + rodape;
}

// Termos de utilização: valem para o simulador em qualquer endereço (o domínio pode mudar).
// Coerentes com a licença do código (Business Source License 1.1, ficheiro LICENSE do repositório).
const REPOSITORIO = "https://github.com/mladenmilev/simulador-arrendamento-rsaa";
function paginaTermos() {
  const url = `${SITE}/termos`;
  const titulo = "Termos de utilização – Simulador de Arrendamento Acessível (RSAA)";
  const descricao = "Uso pessoal gratuito; uso profissional, comercial ou incorporação noutros sites requer autorização do autor.";
  const jsonld = { "@context": "https://schema.org", "@type": "WebPage", name: titulo, url };
  return cabeca({ titulo, descricao, url, jsonld, migalhas: "Termos de utilização" }) + `
  <h1>Termos de utilização</h1>
  <section>
    <h2>Âmbito</h2>
    <p>O Simulador de Arrendamento Acessível (RSAA), o «Simulador», é disponibilizado pelo autor em qualquer endereço, domínio ou plataforma, atual ou futuro, incluindo subdomínios, endereços alternativos, aplicações e versões incorporadas noutros sites com autorização. Estes termos aplicam-se ao Simulador, aos seus resultados e aos seus conteúdos, seja qual for o endereço por onde é acedido.</p>
  </section>
  <section>
    <h2>Uso pessoal: gratuito</h2>
    <p>O Simulador é gratuito para <strong>uso pessoal</strong>: particulares, inquilinos ou senhorios, que o usam para o seu próprio caso.</p>
  </section>
  <section>
    <h2>Uso que precisa de autorização</h2>
    <p>Precisa de autorização prévia do autor para:</p>
    <ul>
      <li>usar o Simulador ou os seus resultados no exercício de uma atividade profissional ou ao serviço de uma empresa ou entidade (por exemplo, mediação imobiliária, gestão de imóveis, advocacia, contabilidade ou consultoria);</li>
      <li>incorporar o Simulador, ou partes dele, noutro site, aplicação ou serviço, incluindo por <em>iframe</em>;</li>
      <li>reproduzir de forma sistemática os resultados ou os dados do Simulador, ou usá-los para fins comerciais.</li>
    </ul>
    <p>Para pedir autorização ou uma licença, use a página de <a href="/contacto">contacto</a>.</p>
  </section>
  <section>
    <h2>Código-fonte</h2>
    <p>O código-fonte está disponível em <a href="${REPOSITORIO}" target="_blank" rel="noopener">GitHub</a> sob a Business Source License 1.1: pode ser consultado, estudado e testado; o uso real (em produção) só é livre para fins pessoais e não comerciais. Cada versão passa à licença MIT quatro anos depois de publicada.</p>
  </section>
  <section>
    <h2>Natureza informativa</h2>
    <p>O Simulador é informativo, não está afiliado ao IHRU e não substitui um contabilista ou advogado. Os resultados dependem dos dados indicados e da legislação em vigor; confirme o seu caso antes de decidir.</p>
  </section>` + rodape;
}

// llms.txt: resumo do site para assistentes de IA (formato llmstxt.org), com os valores de todos os concelhos
// em texto simples, para poderem responder e citar sem correr o simulador.
function llmsTxt(todos) {
  const nomes = Object.keys(todos).sort(porNome);
  const linha = x => { const [d, v, extra] = todos[x];
    return `- [${nome(x)}](${SITE}/renda-acessivel/${slug(x)}) (${d}): ${v.slice(0, 6).map((y, t) => `T${t} ${y} €`).join(" · ")} · +${extra} € por quarto acima de T5`; };
  return `# Simulador de Arrendamento Acessível (RSAA)

> Ferramenta informativa e gratuita sobre o Regime Simplificado de Arrendamento Acessível (RSAA) em Portugal, criado pelo Decreto-Lei n.º 97/2026 (Anexo III), em vigor desde 1 de setembro de 2026. Os contratos com renda igual ou inferior a um valor de referência, definido por concelho e tipologia na Portaria n.º 454/2026/1, ficam isentos de IRS ou IRC sobre as rendas. Acima do valor de referência a renda é legal, mas o contrato fica na tributação normal. Não afiliado ao IHRU; não substitui um contabilista ou advogado.

Regras essenciais:
- Valor de referência da casa: tabela por concelho e tipologia (Portaria n.º 454/2026/1, anexo). A área da casa não conta. Acima de T5: valor do T5 + 50, 75 ou 100 € por quarto a mais, conforme o concelho (150 € em Lisboa).
- Majorações cumulativas: +10 % com estacionamento privativo; +10 % com certificado energético A ou superior (Portaria, art. 2.º, n.º 4).
- Valor de um quarto: valor da casa × área do quarto ÷ soma das áreas de todos os quartos; um quarto com casa de banho privativa conta mais 25 % de área (Portaria, art. 2.º, n.º 2). Quartos só em residência temporária, com inquilino com residência fiscal noutro concelho (DL 97/2026, Anexo III, art. 3.º).
- Prazos mínimos: 3 anos em residência permanente; 3 meses, renovável, em residência temporária (art. 5.º).
- Os valores de referência não incluem despesas (art. 4.º, n.º 3) e sobem a 1 de janeiro de cada ano pelo coeficiente de atualização das rendas (art. 4.º, n.º 2).
- Adesão: o senhorio comunica o contrato às Finanças e submete-o na plataforma do IHRU até 15 de janeiro do ano seguinte (art. 6.º, n.º 3).
- Compensa ficar fora do RSAA só com uma renda acima do valor de referência ÷ (1 − taxa de IRS); com 25 %, cerca de um terço acima do valor de referência.

## Páginas
- [Como se calcula](${SITE}/como-se-calcula): fórmulas e exemplos (casa, majorações, quartos, limiar do IRS, atualização anual)
- [Perguntas frequentes](${SITE}/perguntas-frequentes): ${FAQ.length} perguntas com referência aos artigos da lei
- [Valores por concelho](${SITE}/renda-acessivel/): tabela dos 308 concelhos, com uma página por concelho
- [Simulador](${SITE}/): verificação interativa da renda para inquilinos e senhorios (requer JavaScript)
- [Termos de utilização](${SITE}/termos): uso pessoal gratuito; uso profissional, comercial ou incorporação noutros sites requer autorização do autor

## Fontes legais
- [Decreto-Lei n.º 97/2026, de 20 de maio](${DECRETO})
- [Portaria n.º 454/2026/1, de 13 de outubro](${PORTARIA})

## Valores de referência por concelho (€/mês, sem majorações, em vigor desde 1 de setembro de 2026)
${nomes.map(linha).join("\n")}
`;
}

// E-mail de contacto: fica fora do git, em contacto.local.json ({"email": "..."}), para não aparecer no código público.
// Sem esse ficheiro, a página de contacto mostra um aviso (o deploy recusa publicar assim).
export const CONTACTO = raiz + "contacto.local.json";
function emailContacto() {
  try { return JSON.parse(readFileSync(CONTACTO, "utf8")).email || ""; } catch (e) { return ""; }
}

// Contacto: o e-mail não aparece no HTML. Está guardado em partes invertidas e só é montado no navegador
// depois de um clique, o que trava a maioria dos robôs que recolhem endereços.
function paginaContacto() {
  const email = emailContacto(), inv = t => t.split("").reverse().join("");
  const [u, d] = email.split("@");
  const url = `${SITE}/contacto`;
  const titulo = "Contacto – Simulador de Arrendamento Acessível (RSAA)";
  const descricao = "Sugestões, correções ou interesse em usar o simulador RSAA: contacte o autor.";
  const jsonld = { "@context": "https://schema.org", "@type": "ContactPage", name: titulo, url };
  return cabeca({ titulo, descricao, url, jsonld, migalhas: "Contacto" }) + `
  <h1>Contacto</h1>
  <p class="lede">Sugestões, correções ou interesse em usar o simulador? Escreva para:</p>
  ${email ? `<p class="contacto"><button type="button" class="btn" id="mostrar" data-u="${esc(inv(u))}" data-d="${esc(inv(d))}">Mostrar e-mail</button></p>`
    : `<p class="contacto hint">(Falta configurar o e-mail em contacto.local.json.)</p>`}
  <noscript><p class="hint">Ative o JavaScript para ver o endereço de e-mail.</p></noscript>
  <p class="hint">Este simulador é informativo e não substitui um contabilista ou advogado; não é possível responder a pedidos de aconselhamento sobre casos concretos.</p>
  <p class="hint licenca">Licenças para uso profissional, comercial ou para incorporar o simulador noutro site: escreva para o mesmo endereço. O uso pessoal é gratuito. O código-fonte está disponível em <a href="${REPOSITORIO}" target="_blank" rel="noopener">GitHub</a> sob a Business Source License 1.1; ver os <a href="/termos">termos de utilização</a>.</p>
  <script>
  var mostrar = document.getElementById("mostrar");
  if (mostrar) mostrar.addEventListener("click", function () {
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
  if (!emailContacto()) console.warn("Aviso: contacto.local.json em falta; a página de contacto fica sem e-mail.");
  writeFileSync(raiz + "public/contacto.html", paginaContacto());
  writeFileSync(raiz + "public/como-se-calcula.html", paginaCalculo(todos));
  writeFileSync(raiz + "public/termos.html", paginaTermos());
  writeFileSync(raiz + "public/llms.txt", llmsTxt(todos));
  mkdirSync(raiz + "public/dados", { recursive: true });
  writeFileSync(raiz + "public/dados/concelhos.json", JSON.stringify(Object.fromEntries(
    nomes.map(c => [c, { nome: nome(c), d: todos[c][0], v: todos[c][1], x: todos[c][2], s: slug(c) }]))));
  const hoje = new Date().toISOString().slice(0, 10);
  const urls = ["/", "/perguntas-frequentes", "/como-se-calcula", "/contacto", "/termos", "/renda-acessivel/", ...nomes.map(c => `/renda-acessivel/${slug(c)}`)];
  writeFileSync(raiz + "public/sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${SITE}${u}</loc><lastmod>${hoje}</lastmod></url>`).join("\n")}
</urlset>
`);
  console.log(`Páginas SEO geradas: ${nomes.length} concelhos + índice + perguntas frequentes + como se calcula + contacto + termos + llms.txt + sitemap (${urls.length} endereços)`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) gerar();
