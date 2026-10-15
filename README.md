# Simulador de Arrendamento Acessível (RSAA)

Simulador da renda máxima no Regime Simplificado de Arrendamento Acessível (RSAA), para o apartamento inteiro ou por quartos. A vista do senhorio exige identificação (Google ou nome + e-mail); a vista do inquilino também está disponível sem identificação (convidado).

## Como funciona

- `public/index.html` – página de entrada: apresenta o simulador e pede a identificação.
- `public/simulador.html` – moldura do simulador. Não contém o simulador: lê-o do Firestore. Quem tem registo recebe `conteudo/simulador` (versão completa); o convidado recebe `conteudo/inquilino` (só a vista do inquilino).
- `src/simulador.html` – **o simulador em si** (é aqui que se fazem as alterações). Um só ficheiro para as duas versões: o que é exclusivo do senhorio fica entre marcadores, que o script de publicação retira na versão do inquilino:
  - HTML: `<!-- senhorio:inicio -->` … `<!-- senhorio:fim -->`
  - JavaScript: `// senhorio:inicio` … `// senhorio:fim` (todo o código do senhorio está no objeto `Senhorio`; o código comum só o chama se existir)
- `firestore.rules` – regras de segurança (registos e acesso ao conteúdo).
- `scripts/publicar-conteudo.mjs` – gera as duas versões a partir de `src/simulador.html` e envia-as para o Firestore.

Os registos ficam na coleção `registos` do Firestore (nome, e-mail, método, consentimento, data).

## Desenvolvimento local (nada vai para a produção)

Requisitos: Node.js e Java 21 (para os emuladores do Firebase).

```sh
npm install      # só na primeira vez
npm run dev
```

- http://localhost:3000 – a app, com recarregamento automático (também ao gravar `src/simulador.html`)
- http://localhost:4000 – painel dos emuladores (registos de teste em Firestore, utilizadores em Authentication)

O login e a base de dados são emulados: o "Entrar com Google" mostra uma conta fictícia e os dados de teste desaparecem ao parar.

## Publicar

Requer `service-account.json` (chave de serviço do Firebase, fora do git).

```sh
npm run deploy
```

O `deploy`:
1. exige o git sem alterações por guardar (cada versão corresponde a um commit);
2. sobe a versão **minor** ([semver](https://semver.org/lang/pt-BR/)) em `package.json` e `public/js/versao.js`;
3. publica o simulador no Firestore, as regras e o site;
4. faz commit `Publicar vX.Y.Z` e cria a tag `vX.Y.Z` (se falhar, repõe a versão anterior).

A versão aparece discretamente no fundo das páginas.

## Consultar registos

Consola do Firebase → Firestore Database → `registos`.
