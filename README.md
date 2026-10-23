# Simulador de Arrendamento Acessível (RSAA)

Simulador da renda máxima no Regime Simplificado de Arrendamento Acessível (RSAA), para o apartamento inteiro ou por quartos, com vista do inquilino e do senhorio. Aberto a todos, sem registo nem login, e sem Google Analytics: o site não trata dados pessoais. Cada simulação fica registada de forma anónima, para estatísticas.

## Como funciona

- `public/index.html` – página de entrada, com entradas diretas para as duas vistas.
- `public/simulador.html` – moldura do simulador. Não contém o simulador: lê-o do Firestore (`conteudo/simulador`) e grava cada simulação calculada em `simulacoes`.
- `src/simulador.html` – **o simulador em si** (é aqui que se fazem as alterações). Os marcadores `senhorio:inicio` … `senhorio:fim` vêm do tempo em que havia uma versão só do inquilino; o script de publicação retira-os.
- `firestore.rules` – regras de segurança: conteúdo de leitura pública; `simulacoes` só aceita criar registos com o esquema previsto (ninguém lê pela app).
- `scripts/publicar-conteudo.mjs` – envia `src/simulador.html` para o Firestore.

## Simulações (estatísticas)

Cada clique em «Verificar a minha renda» ou «Calcular valores máximos» grava um documento em `simulacoes`, sem nome, e-mail nem identificador: data, versão, telemóvel/computador, vista, apartamento ou quarto, distrito, concelho, tipologia, majorações, valor máximo, resultado e os valores do inquilino (renda, áreas) ou do senhorio (contrato, mercado, IRS, cada quarto com área, renda e valor máximo).

```sh
node scripts/exportar-simulacoes.mjs [--desde AAAA-MM-DD]
```

Cria `exportacoes/simulacoes.csv` (uma linha por simulação) e `exportacoes/quartos.csv` (uma linha por quarto, com renda por m²), prontos para Excel ou Google Sheets. A pasta `exportacoes/` fica fora do git.

`scripts/apagar-registos.mjs` apaga os dados do tempo em que havia login (coleção `registos` e utilizadores do Authentication); só apaga com `--confirmar`.

## Ficheiros locais (fora do git)

- `service-account.json` – chave de serviço do Firebase, para publicar e exportar.
- `contacto.local.json` – e-mail mostrado na página de contacto: `{"email": "nome@exemplo.pt"}`. O `deploy` recusa publicar sem ele.

## Desenvolvimento local (nada vai para a produção)

Requisitos: Node.js e Java 21 (para os emuladores do Firebase).

```sh
npm install      # só na primeira vez
npm run dev
```

- http://localhost:3000 – a app, com recarregamento automático (também ao gravar `src/simulador.html`)
- http://localhost:4000 – painel do emulador do Firestore (simulações de teste)

A base de dados é emulada: os dados de teste desaparecem ao parar.

## Publicar

Requer `service-account.json` (chave de serviço do Firebase, fora do git).

```sh
npm run deploy
```

O `deploy`:
1. exige o git sem alterações por guardar (cada versão corresponde a um commit);
2. sobe a versão **minor** (ou a **major**, com `npm run deploy -- --major`) ([semver](https://semver.org/lang/pt-BR/)) em `package.json` e `public/js/versao.js`;
3. publica o simulador no Firestore, as regras e o site;
4. faz commit `Publicar vX.Y.Z` e cria a tag `vX.Y.Z` (se falhar, repõe a versão anterior).

A versão aparece discretamente no fundo das páginas.

## Licença

[Business Source License 1.1](LICENSE). Em resumo:

- pode consultar, estudar, copiar e testar o código;
- o uso real (em produção) só é livre para fins **pessoais e não comerciais**, por particulares;
- uso profissional ou ao serviço de empresas e entidades, incorporação noutros sites, aplicações ou serviços, e qualquer uso comercial precisam de uma licença do autor;
- cada versão passa à licença MIT quatro anos depois de publicada.

As versões publicadas até à v2.8.0 inclusive foram distribuídas sob a licença MIT.

Licenças e autorizações: página de contacto do simulador, em https://simulador-arrendamento-pt.web.app/contacto. Termos de utilização do site: /termos.
