// Inicialização do Firebase partilhada pela página de entrada e pelo simulador.
// Em localhost (ou rede local) liga-se aos emuladores, para testar sem tocar na produção.
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth, connectAuthEmulator } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getFirestore, connectFirestoreEmulator } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// A configuração web do Firebase é pública por natureza; os dados são protegidos pelas regras do Firestore.
const app = initializeApp({
  apiKey: "AIzaSyCD36dX5H4odorMuucpRfLNuXtEO5mxoJA",
  authDomain: "simulador-arrendamento-pt.firebaseapp.com",
  projectId: "simulador-arrendamento-pt",
  appId: "1:451673970405:web:9700ecbd5253597604660c",
  messagingSenderId: "451673970405",
});

export const auth = getAuth(app);
export const db = getFirestore(app);

const h = location.hostname;
export const local = h === "localhost" || h === "127.0.0.1" || /^(192\.168|10)\./.test(h);
if (local) {
  connectAuthEmulator(auth, `http://${h}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(db, h, 8080);
}
