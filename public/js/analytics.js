// Google Analytics 4 com consentimento prévio (RGPD): o gtag.js só é carregado depois de "Aceitar".
// Sem consentimento não há cookies nem pedidos ao Google; os eventos ficam apenas na fila local.
// Em ambiente local (emuladores) o Analytics nunca é carregado.
import { local } from "/js/firebase.js";

const ID = "G-F08WS0ML0L";
const CHAVE = "analytics";

window.dataLayer = window.dataLayer || [];
window.gtag = window.gtag || function () { dataLayer.push(arguments); };

const escolha = () => { try { return localStorage.getItem(CHAVE); } catch (e) { return null; } };
const guardar = v => { try { localStorage.setItem(CHAVE, v); } catch (e) {} };

let carregado = false;
function carregar() {
  if (carregado || local) return;
  carregado = true;
  gtag("js", new Date());
  gtag("config", ID);
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${ID}`;
  document.head.appendChild(s);
}

export const evento = (nome, params = {}) => { if (carregado) gtag("event", nome, params); };

function aviso() {
  if (document.getElementById("cookies")) return;
  const d = document.createElement("div");
  d.id = "cookies";
  d.setAttribute("role", "dialog");
  d.setAttribute("aria-label", "Cookies");
  d.style.cssText = "position:fixed;left:16px;right:16px;bottom:16px;max-width:640px;margin:0 auto;z-index:50;background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:12px;padding:14px 16px;box-shadow:0 6px 24px rgba(0,0,0,.25);font-size:.9rem;display:flex;gap:12px;align-items:center;flex-wrap:wrap";
  d.innerHTML = `<span style="flex:1 1 260px">Usamos o Google Analytics para medir visitas de forma agregada e melhorar o simulador. Só é ativado se aceitar.</span>
    <span style="display:flex;gap:8px">
      <button type="button" data-v="nao" style="border:1px solid var(--line);background:transparent;color:var(--ink);padding:7px 14px;border-radius:8px;font:inherit;font-weight:600;cursor:pointer">Recusar</button>
      <button type="button" data-v="sim" style="border:1px solid var(--tile);background:var(--tile);color:var(--surface);padding:7px 14px;border-radius:8px;font:inherit;font-weight:600;cursor:pointer">Aceitar</button>
    </span>`;
  d.addEventListener("click", e => {
    const v = e.target.dataset && e.target.dataset.v;
    if (!v) return;
    guardar(v);
    d.remove();
    if (v === "sim") carregar();
    // Retirar o consentimento só tem efeito total depois de recarregar (o gtag.js já carregado não se descarrega).
    else if (carregado) location.reload();
  });
  document.body.appendChild(d);
}

// Link "Cookies" junto à versão, para rever a escolha.
function linkPreferencias() {
  const v = document.getElementById("versao");
  if (!v || document.getElementById("cookiesLink")) return;
  const a = document.createElement("button");
  a.type = "button";
  a.id = "cookiesLink";
  a.textContent = "Cookies";
  a.style.cssText = "border:0;background:none;color:inherit;font:inherit;text-decoration:underline;cursor:pointer;padding:0";
  a.addEventListener("click", aviso);
  v.append(" · ", a);
}

if (escolha() === "sim") carregar();
else if (escolha() === null) aviso();
// Depois de a página escrever o texto da versão (que apagaria o link).
setTimeout(linkPreferencias, 0);
