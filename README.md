# Simulador de renda por quarto

Simulador de renda por quarto em arrendamento acessível. Página estática (HTML/CSS/JS), sem backend.

## Estrutura

- `public/index.html` – a aplicação
- `firebase.json` – configuração do Firebase Hosting

## Testar localmente

```sh
npm install      # só na primeira vez
npm run dev      # abre http://localhost:3000 e recarrega ao gravar
```

## Publicar (Firebase Hosting, plano gratuito Spark)

```sh
npm install -g firebase-tools   # requer Node.js
firebase login
firebase use --add              # escolher o projeto Firebase
firebase deploy --only hosting   # ou: npm run deploy
```
