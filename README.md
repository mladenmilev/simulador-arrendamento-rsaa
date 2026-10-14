# Simulador de renda por quarto

Simulador de renda por quarto em arrendamento acessível. Página estática (HTML/CSS/JS), sem backend.

## Estrutura

- `public/index.html` – a aplicação
- `firebase.json` – configuração do Firebase Hosting

## Testar localmente

```sh
python3 -m http.server 8000 --directory public
# abrir http://localhost:8000
```

## Publicar (Firebase Hosting, plano gratuito Spark)

```sh
npm install -g firebase-tools   # requer Node.js
firebase login
firebase use --add              # escolher o projeto Firebase
firebase deploy --only hosting
```
