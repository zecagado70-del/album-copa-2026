// ============================================================
// 1. FIREBASE IMPORTS
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getFirestore, doc, getDoc, setDoc, updateDoc,
    increment, collection, getDocs, addDoc, query,
    where, orderBy, limit, serverTimestamp, writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ============================================================
// 2. CONFIG FIREBASE
// ============================================================
const firebaseConfig = {
    apiKey: "AIzaSyBXiKSsfVlUJ_FFtaFHiQjK4xOC51FHbTc",
    authDomain: "world-cup-arena-71b6e.firebaseapp.com",
    projectId: "world-cup-arena-71b6e",
    storageBucket: "world-cup-arena-71b6e.firebasestorage.app",
    messagingSenderId: "73141079508",
    appId: "1:73141079508:web:57b04761929557f7e4da41"
};

const app      = initializeApp(firebaseConfig);
const db       = getFirestore(app);
const auth     = getAuth(app);
const provider = new GoogleAuthProvider();

console.log("🔥 Firebase conectado!");

// ============================================================
// 3. UIDS ADMIN (adicione os UIDs dos admins aqui)
// ============================================================
const ADMIN_UIDS = [
    "xw5ARLPd2bgg99jS3RzdjafhHnZ2"
];

function isAdmin(uid) {
    return ADMIN_UIDS.includes(uid);
}

// ============================================================
// 4. CATÁLOGO DE FIGURINHAS
// ============================================================
const configPastas = [
    { pasta:"01_Alemanha",          ranges:[[1,15]] },
    { pasta:"02_Arabia_Saudita",    ranges:[[17,32]] },
    { pasta:"03_Argelia",           ranges:[[33,48]] },
    { pasta:"04_Argentina",         ranges:[[49,69]] },
    { pasta:"06_Australia",         ranges:[[81,93]] },
    { pasta:"07_Austria",           ranges:[[16,16],[97,112]] },
    { pasta:"08_Belgica",           ranges:[[113,128]] },
    { pasta:"09_Bosnia",            ranges:[[129,141],[144,144]] },
    { pasta:"10_Mistas_02",         ranges:[[149,149],[152,152],[158,160]] },
    { pasta:"11_Brasil",            ranges:[[145,148],[161,176]] },
    { pasta:"12_Cabo_Verde",        ranges:[[94,95],[177,192]] },
    { pasta:"13_Canada",            ranges:[[70,71],[193,208]] },
    { pasta:"14_Especiais_Brilhantes", ranges:[[143,143],[209,224]] },
    { pasta:"15_Colombia",          ranges:[[73,77],[225,240]] },
    { pasta:"16_Coreia_do_Sul",     ranges:[[241,256]] },
    { pasta:"17_Costa_do_Marfim",   ranges:[[79,80],[96,96],[142,142],[257,272]] },
    { pasta:"18_Croacia",           ranges:[[273,286]] },
    { pasta:"19_Curacao",           ranges:[[289,304]] },
    { pasta:"20_Equador",           ranges:[[153,157],[305,320]] },
    { pasta:"21_Egito",             ranges:[[321,331],[334,336]] },
    { pasta:"22_Escocia",           ranges:[[337,349]] },
    { pasta:"23_Espanha",           ranges:[[353,372]] },
    { pasta:"24_Equipes_Esp_Fra",   ranges:[[373,373],[381,381]] },
    { pasta:"25_EUA",               ranges:[[150,151],[385,400]] },
    { pasta:"26_Franca",            ranges:[[377,380],[401,416]] },
    { pasta:"27_Gana",              ranges:[[417,432]] },
    { pasta:"28_Haiti",             ranges:[[433,448]] },
    { pasta:"29_Inglaterra",        ranges:[[287,287],[449,464]] },
    { pasta:"30_Ira",               ranges:[[465,479]] },
    { pasta:"31_Iraque",            ranges:[[288,288],[481,496]] },
    { pasta:"32_Japao",             ranges:[[497,510]] },
    { pasta:"33_Jordania",          ranges:[[332,333],[513,528]] },
    { pasta:"34_Marrocos",          ranges:[[529,543]] },
    { pasta:"35_Mexico",            ranges:[[545,564]] },
    { pasta:"36_Holanda",           ranges:[[565,565],[569,573],[609,624]] },
    { pasta:"37_Noruega",           ranges:[[577,592]] },
    { pasta:"38_Nova_Zelandia",     ranges:[[593,608]] },
    { pasta:"40_Panama",            ranges:[[625,640]] },
    { pasta:"41_Paraguai",          ranges:[[641,656]] },
    { pasta:"42_Portugal",          ranges:[[657,672]] },
    { pasta:"43_Catar",             ranges:[[673,681],[685,697]] },
    { pasta:"44_RD_Congo",          ranges:[[480,480],[544,544],[701,716]] },
    { pasta:"46_Senegal",           ranges:[[733,747]] },
    { pasta:"48_Suecia",            ranges:[[749,774]] },
    { pasta:"49_Suica",             ranges:[[511,512],[777,792]] },
    { pasta:"50_Tunisia",           ranges:[[748,748],[793,808]] },
    { pasta:"51_Turquia",           ranges:[[809,824]] },
    { pasta:"52_Uruguai",           ranges:[[825,840]] },
    { pasta:"53_Uzbequistao",       ranges:[[841,856]] }
];

const catalogo = [];
configPastas.forEach(c => {
    c.ranges.forEach(b => {
        for (let i = b[0]; i <= b[1]; i++) {
            const n = String(i).padStart(4, '0');
            catalogo.push({ id: `fig_${n}`, pasta: c.pasta, imagem: `assets/${c.pasta}/fig_${n}.jpg` });
        }
    });
});

// Raridade baseada no índice da pasta (simplificado)
function getRaridade(pasta) {
    if (pasta.includes('Especiais_Brilhantes')) return 'lendaria';
    if (pasta.includes('Mistas')) return 'epica';
    const num = parseInt(pasta.split('_')[0]);
    if (num <= 4) return 'rara';
    return 'comum';
}

function getNomeAmigavel(pasta) {
    return pasta.replace(/^\d+_/, '').replace(/_/g, ' ');
}

console.log(`📦 Catálogo: ${catalogo.length} figurinhas`);

// ============================================================
// 5. SVG DO PACOTE (mantido original)
// ============================================================
function gerarSVGPacote() {
    return `
    <svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg" class="pacote-svg">
      <defs>
        <radialGradient id="bgRainbow" cx="50%" cy="40%" r="70%">
          <stop offset="0%"   stop-color="#ff6b00"/>
          <stop offset="20%"  stop-color="#ff3366"/>
          <stop offset="40%"  stop-color="#9b00e8"/>
          <stop offset="60%"  stop-color="#0055ff"/>
          <stop offset="80%"  stop-color="#00cc44"/>
          <stop offset="100%" stop-color="#ff6b00"/>
        </radialGradient>
        <linearGradient id="ray1" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#ff0000" stop-opacity="0.7"/>
          <stop offset="100%" stop-color="#ffff00" stop-opacity="0.7"/>
        </linearGradient>
        <linearGradient id="ray2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00aaff" stop-opacity="0.6"/>
          <stop offset="100%" stop-color="#aa00ff" stop-opacity="0.6"/>
        </linearGradient>
        <linearGradient id="ray3" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#00ff88" stop-opacity="0.5"/>
          <stop offset="100%" stop-color="#ff6600" stop-opacity="0.5"/>
        </linearGradient>
        <linearGradient id="goldTop" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stop-color="#7a5c00"/>
          <stop offset="20%"  stop-color="#f0c040"/>
          <stop offset="50%"  stop-color="#ffe270"/>
          <stop offset="80%"  stop-color="#f0c040"/>
          <stop offset="100%" stop-color="#7a5c00"/>
        </linearGradient>
        <linearGradient id="goldSide" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stop-color="#b8860b"/>
          <stop offset="30%"  stop-color="#ffd700"/>
          <stop offset="70%"  stop-color="#ffd700"/>
          <stop offset="100%" stop-color="#8b6914"/>
        </linearGradient>
        <linearGradient id="goldBottom" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stop-color="#6b4c00"/>
          <stop offset="25%"  stop-color="#e8b020"/>
          <stop offset="50%"  stop-color="#ffe060"/>
          <stop offset="75%"  stop-color="#e8b020"/>
          <stop offset="100%" stop-color="#6b4c00"/>
        </linearGradient>
        <linearGradient id="glassSheen" x1="0%" y1="0%" x2="60%" y2="100%">
          <stop offset="0%" stop-color="white" stop-opacity="0.18"/>
          <stop offset="40%" stop-color="white" stop-opacity="0.04"/>
          <stop offset="100%" stop-color="white" stop-opacity="0.10"/>
        </linearGradient>
        <clipPath id="innerClip">
          <rect x="14" y="28" width="172" height="224" rx="4"/>
        </clipPath>
      </defs>
      <rect x="14" y="28" width="172" height="224" rx="4" fill="url(#bgRainbow)"/>
      <g clip-path="url(#innerClip)">
        <path d="M100,140 L14,28 L60,28 Z"   fill="url(#ray1)" opacity="0.6"/>
        <path d="M100,140 L186,28 L140,28 Z"  fill="url(#ray2)" opacity="0.6"/>
        <path d="M100,140 L14,252 L60,252 Z"  fill="url(#ray3)" opacity="0.5"/>
        <path d="M100,140 L186,252 L140,252 Z" fill="url(#ray1)" opacity="0.5"/>
        <path d="M 20 200 Q 100 60 180 200" stroke="#ff0066" stroke-width="14" fill="none" opacity="0.4"/>
        <path d="M 20 200 Q 100 60 180 200" stroke="#ff6600" stroke-width="10" fill="none" opacity="0.4"/>
        <path d="M 20 200 Q 100 60 180 200" stroke="#ffcc00" stroke-width="6"  fill="none" opacity="0.5"/>
        <path d="M 20 200 Q 100 60 180 200" stroke="#00cc44" stroke-width="4"  fill="none" opacity="0.4"/>
        <path d="M 20 200 Q 100 60 180 200" stroke="#0066ff" stroke-width="2"  fill="none" opacity="0.5"/>
        <circle cx="55"  cy="70"  r="2"   fill="white"   opacity="0.9"/>
        <circle cx="145" cy="85"  r="1.5" fill="white"   opacity="0.8"/>
        <circle cx="80"  cy="200" r="2"   fill="#ffd700" opacity="0.9"/>
        <circle cx="150" cy="210" r="1.5" fill="white"   opacity="0.7"/>
        <circle cx="40"  cy="180" r="1"   fill="#ffd700" opacity="0.8"/>
        <circle cx="160" cy="155" r="1.5" fill="white"   opacity="0.6"/>
      </g>
      <rect x="8" y="28" width="8" height="224" fill="url(#goldSide)"/>
      <rect x="184" y="28" width="8" height="224" fill="url(#goldSide)"/>
      <rect x="8" y="10" width="184" height="20" rx="3" fill="url(#goldTop)"/>
      <rect x="8" y="26" width="184" height="4" fill="#b8860b" opacity="0.6"/>
      <g fill="#a07800">
        <rect x="12" y="7" width="6" height="4" rx="1"/><rect x="22" y="7" width="6" height="4" rx="1"/>
        <rect x="32" y="7" width="6" height="4" rx="1"/><rect x="42" y="7" width="6" height="4" rx="1"/>
        <rect x="52" y="7" width="6" height="4" rx="1"/><rect x="62" y="7" width="6" height="4" rx="1"/>
        <rect x="72" y="7" width="6" height="4" rx="1"/><rect x="82" y="7" width="6" height="4" rx="1"/>
        <rect x="92" y="7" width="6" height="4" rx="1"/><rect x="102" y="7" width="6" height="4" rx="1"/>
        <rect x="112" y="7" width="6" height="4" rx="1"/><rect x="122" y="7" width="6" height="4" rx="1"/>
        <rect x="132" y="7" width="6" height="4" rx="1"/><rect x="142" y="7" width="6" height="4" rx="1"/>
        <rect x="152" y="7" width="6" height="4" rx="1"/><rect x="162" y="7" width="6" height="4" rx="1"/>
        <rect x="172" y="7" width="6" height="4" rx="1"/><rect x="182" y="7" width="6" height="4" rx="1"/>
      </g>
      <rect x="8" y="252" width="184" height="20" rx="3" fill="url(#goldBottom)"/>
      <rect x="8" y="250" width="184" height="4" fill="#a07800" opacity="0.6"/>
      <g fill="#a07800">
        <rect x="12" y="270" width="6" height="4" rx="1"/><rect x="22" y="270" width="6" height="4" rx="1"/>
        <rect x="32" y="270" width="6" height="4" rx="1"/><rect x="42" y="270" width="6" height="4" rx="1"/>
        <rect x="52" y="270" width="6" height="4" rx="1"/><rect x="62" y="270" width="6" height="4" rx="1"/>
        <rect x="72" y="270" width="6" height="4" rx="1"/><rect x="82" y="270" width="6" height="4" rx="1"/>
        <rect x="92" y="270" width="6" height="4" rx="1"/><rect x="102" y="270" width="6" height="4" rx="1"/>
        <rect x="112" y="270" width="6" height="4" rx="1"/><rect x="122" y="270" width="6" height="4" rx="1"/>
        <rect x="132" y="270" width="6" height="4" rx="1"/><rect x="142" y="270" width="6" height="4" rx="1"/>
        <rect x="152" y="270" width="6" height="4" rx="1"/><rect x="162" y="270" width="6" height="4" rx="1"/>
        <rect x="172" y="270" width="6" height="4" rx="1"/><rect x="182" y="270" width="6" height="4" rx="1"/>
      </g>
      <g transform="translate(82, 34)">
        <path d="M18,0 L18,8 C18,16 28,22 28,28 L8,28 C8,22 18,16 18,8 Z" fill="#ffd700" stroke="#b8860b" stroke-width="0.5"/>
        <rect x="14" y="28" width="8" height="3" fill="#ffd700"/>
        <rect x="10" y="31" width="16" height="2" rx="1" fill="#e8b020"/>
        <path d="M18,4 C18,4 8,4 6,10 C4,16 10,18 14,18" fill="none" stroke="#ffd700" stroke-width="2" stroke-linecap="round"/>
        <path d="M18,4 C18,4 28,4 30,10 C32,16 26,18 22,18" fill="none" stroke="#ffd700" stroke-width="2" stroke-linecap="round"/>
      </g>
      <text x="100" y="130" text-anchor="middle" font-family="'Bebas Neue', sans-serif" font-size="22" font-weight="700" fill="white" stroke="#0b1120" stroke-width="3" paint-order="stroke">WORLD CUP</text>
      <text x="100" y="158" text-anchor="middle" font-family="'Bebas Neue', sans-serif" font-size="32" font-weight="700" fill="white" stroke="#0b1120" stroke-width="4" paint-order="stroke">ARENA</text>
      <text x="100" y="182" text-anchor="middle" font-family="'Bebas Neue', sans-serif" font-size="22" font-weight="700" fill="#ffd700" stroke="#0b1120" stroke-width="3" paint-order="stroke">2026</text>
      <rect x="14" y="28" width="172" height="224" rx="4" fill="url(#glassSheen)"/>
      <rect x="18" y="32" width="12" height="216" rx="3" fill="white" opacity="0.07"/>
    </svg>`;
}

// ============================================================
// 6. TOAST
// ============================================================
function showToast(msg, tipo = '') {
    let t = document.getElementById('toast-global');
    if (!t) {
        t = document.createElement('div');
        t.id = 'toast-global';
        t.className = 'toast';
        document.body.appendChild(t);
    }
    t.textContent = msg;
    t.className = 'toast' + (tipo ? ` toast-${tipo}` : '');
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 3000);
}

// ============================================================
// 7. RENDERIZAR PILHA
// ============================================================
function renderizarPilha(qtd) {
    const pilha    = document.getElementById('pilha-pacotes');
    const vazia    = document.getElementById('pilha-vazia');
    const btnRasgar    = document.getElementById('btn-rasgar');
    const btnAbrirTodos = document.getElementById('btn-abrir-todos');
    const qtdDisplay   = document.getElementById('qtd-display');
    const qtdHeader    = document.getElementById('qtd-pacotes');

    if (qtdDisplay) qtdDisplay.textContent = qtd;
    if (qtdHeader)  qtdHeader.textContent  = qtd;

    pilha.innerHTML = '';

    if (qtd === 0) {
        vazia.style.display = 'flex';
        pilha.style.display = 'none';
        if (btnRasgar)    btnRasgar.disabled    = true;
        if (btnAbrirTodos) btnAbrirTodos.disabled = true;
        return;
    }

    vazia.style.display = 'none';
    pilha.style.display = 'block';
    if (btnRasgar)    btnRasgar.disabled    = false;
    if (btnAbrirTodos) btnAbrirTodos.disabled = false;

    const visiveis = Math.min(qtd, 4);
    const classes  = ['offset-3','offset-2','offset-1','topo'];
    const inicio   = classes.length - visiveis;

    for (let i = 0; i < visiveis; i++) {
        const div = document.createElement('div');
        div.className = `pacote-na-pilha ${classes[inicio + i]}`;
        div.innerHTML = gerarSVGPacote();
        pilha.appendChild(div);
    }
}

// ============================================================
// 8. CONFETTI
// ============================================================
function dispararConfetti() {
    const canvas = document.getElementById('canvas-confetti');
    const ctx = canvas.getContext('2d');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const cores = ['#d4af37','#f2c94c','#ff6b6b','#4ecdc4','#45b7d1','#96ceb4','#ffeaa7','#ff7675'];
    const particulas = Array.from({ length: 120 }, () => ({
        x: canvas.width / 2 + (Math.random() - 0.5) * 200,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 14,
        vy: -(Math.random() * 12 + 4),
        r: Math.random() * 6 + 3,
        cor: cores[Math.floor(Math.random() * cores.length)],
        alpha: 1,
        rot: Math.random() * 360,
        vrot: (Math.random() - 0.5) * 10
    }));

    let frame = 0;
    function animar() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particulas.forEach(p => {
            p.x += p.vx; p.y += p.vy; p.vy += 0.35;
            p.alpha -= 0.012; p.rot += p.vrot;
            if (p.alpha <= 0) return;
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot * Math.PI / 180);
            ctx.fillStyle = p.cor;
            ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 1.6);
            ctx.restore();
        });
        frame++;
        if (frame < 120) requestAnimationFrame(animar);
        else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    animar();
}

// ============================================================
// 9. OVERLAY RASGAR (single)
// ============================================================
function mostrarOverlayRasgar(onConfirm) {
    const overlay    = document.getElementById('overlay-rasgar');
    const pacoteAnim = document.getElementById('pacote-animado');
    const dica       = document.getElementById('overlay-dica');

    pacoteAnim.innerHTML = gerarSVGPacote();
    pacoteAnim.style.animation = 'none';
    void pacoteAnim.offsetWidth;
    pacoteAnim.style.animation = '';
    if (dica) dica.style.display = '';

    // Remove contador se existia
    const ctOld = overlay.querySelector('.overlay-contador');
    if (ctOld) ctOld.remove();

    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    let clicks = 0;
    function handleClick() {
        clicks++;
        if (clicks === 1) {
            pacoteAnim.classList.add('shake');
            pacoteAnim.addEventListener('animationend', () => {
                pacoteAnim.classList.remove('shake');
            }, { once: true });
        } else if (clicks >= 2) {
            pacoteAnim.removeEventListener('click', handleClick);
            overlay.removeEventListener('click', handleClick);
            pacoteAnim.classList.add('explodir');
            dispararConfetti();
            setTimeout(() => {
                overlay.style.display = 'none';
                document.body.style.overflow = '';
                onConfirm();
            }, 500);
        }
    }

    overlay.addEventListener('click', handleClick);
}

// ============================================================
// 10. LOGIN + OLHEIRO DE AUTENTICAÇÃO (onAuthStateChanged)
// ============================================================
const btnLogin    = document.getElementById('btn-login');
const telaLogin   = document.getElementById('tela-login');
const telaPainel  = document.getElementById('tela-painel');
const nomeUsuario = document.getElementById('nome-usuario');

let perfilUsuario = { pacotes: 0, inventario: {}, streak: 0, palpitesHoje: 0, trocasHoje: 0, triviaHoje: 0 };

// Função central para ativar a sessão do usuário (usada pelo login e pelo observer)
async function ativarSessao(usuario) {
    telaLogin.style.display = 'none';
    telaPainel.style.display = 'block';
    nomeUsuario.innerText = '⚽ ' + usuario.displayName;
    if (isAdmin(usuario.uid)) {
        document.getElementById('menu-admin').style.display = '';
    }
    await inicializarPerfil(usuario);
}

// 🔥 OLHEIRO: observa o estado de autenticação persistida pelo Firebase
// Se o usuário já tem sessão ativa salva no navegador, pula direto para o painel
onAuthStateChanged(auth, async (usuario) => {
    if (usuario) {
        console.log("🟢 Sessão ativa detectada para:", usuario.displayName);
        await ativarSessao(usuario);
    } else {
        console.log("⚪ Nenhuma sessão ativa. Mostrando tela de login.");
        telaLogin.style.display = 'flex';
        telaPainel.style.display = 'none';
    }
});

// Botão de login manual (quando não há sessão salva)
btnLogin.addEventListener('click', () => {
    signInWithPopup(auth, provider)
        .then(async (resultado) => {
            await ativarSessao(resultado.user);
        })
        .catch(err => {
            console.error("Erro login:", err);
            alert("Falha no login. Verifique o console.");
        });
});

async function inicializarPerfil(usuario) {
    const perfilRef = doc(db, 'usuarios', usuario.uid);
    const snap = await getDoc(perfilRef);
    const hoje = diaAtual();

    if (!snap.exists()) {
        const dados = {
            nome: usuario.displayName,
            email: usuario.email,
            uid: usuario.uid,
            pacotes: 10,
            inventario: {},
            streak: 0,
            palpitesHoje: 0,
            trocasHoje: 0,
            triviaHoje: 0,
            ultimoDia: hoje,
            criadoEm: new Date().toISOString()
        };
        await setDoc(perfilRef, dados);
        perfilUsuario = dados;
        showToast('🎉 Bem-vindo! Você ganhou 10 pacotes!', 'sucesso');
    } else {
        perfilUsuario = snap.data();
        // Reset diário
        if (perfilUsuario.ultimoDia !== hoje) {
            perfilUsuario.palpitesHoje = 0;
            perfilUsuario.trocasHoje   = 0;
            perfilUsuario.triviaHoje   = 0;
            perfilUsuario.ultimoDia    = hoje;
            await updateDoc(perfilRef, {
                palpitesHoje: 0,
                trocasHoje: 0,
                triviaHoje: 0,
                ultimoDia: hoje
            });
        }
        // Defaults
        if (!perfilUsuario.pacotes)   perfilUsuario.pacotes   = 0;
        if (!perfilUsuario.inventario) perfilUsuario.inventario = {};
        if (!perfilUsuario.streak)     perfilUsuario.streak    = 0;
    }

    renderizarPilha(perfilUsuario.pacotes);
    atualizarStreakUI();
}

function diaAtual() {
    return new Date().toISOString().slice(0, 10);
}

// ============================================================
// 11. STREAK UI
// ============================================================
function atualizarStreakUI() {
    const badge = document.getElementById('streak-badge');
    const count = document.getElementById('streak-count');
    if (!badge || !count) return;
    const s = perfilUsuario.streak || 0;
    if (s > 0) {
        badge.style.display = 'flex';
        count.textContent = s;
    } else {
        badge.style.display = 'none';
    }
}

async function processarStreak(acertou) {
    const usuario = auth.currentUser;
    if (!usuario) return;

    if (acertou) {
        perfilUsuario.streak = (perfilUsuario.streak || 0) + 1;
    } else {
        perfilUsuario.streak = 0;
    }

    // Bônus de streak
    let bonus = 0;
    const s = perfilUsuario.streak;
    if (s === 3) { bonus = 1; showToast('🔥 3 acertos seguidos! +1 pacote bônus!', 'sucesso'); }
    if (s === 5) { bonus = 2; showToast('🌟 5 acertos! Pacote RARO! +2 pacotes!', 'sucesso'); }
    if (s === 10) { bonus = 5; showToast('👑 10 acertos! RECOMPENSA ESPECIAL! +5 pacotes!', 'sucesso'); }

    if (bonus > 0) {
        perfilUsuario.pacotes = (perfilUsuario.pacotes || 0) + bonus;
    }

    await updateDoc(doc(db, 'usuarios', usuario.uid), {
        streak: perfilUsuario.streak,
        pacotes: perfilUsuario.pacotes
    });

    atualizarStreakUI();
    renderizarPilha(perfilUsuario.pacotes);
}

// ============================================================
// 12. ABRIR PACOTE (single)
// ============================================================
const btnRasgar     = document.getElementById('btn-rasgar');
const btnAbrirTodos = document.getElementById('btn-abrir-todos');
const resultadoArea = document.getElementById('resultado-pacotinho');
const gridCartas    = document.getElementById('grid-cartas');
const btnFechar     = document.getElementById('btn-fechar-resultado');

if (btnRasgar) {
    btnRasgar.addEventListener('click', () => {
        if (perfilUsuario.pacotes <= 0) return;
        mostrarOverlayRasgar(abrirPacote);
    });
}

async function sortearFigurinhas(qtd = 4) {
    const sorteadas = [];
    for (let i = 0; i < qtd; i++) {
        sorteadas.push(catalogo[Math.floor(Math.random() * catalogo.length)]);
    }
    return sorteadas;
}

async function salvarFigurinhas(sorteadas, qtdPacotes) {
    const usuario = auth.currentUser;
    if (!usuario) return;

    sorteadas.forEach(c => {
        perfilUsuario.inventario[c.id] = (perfilUsuario.inventario[c.id] || 0) + 1;
    });
    perfilUsuario.pacotes = Math.max(0, qtdPacotes);

    const perfilRef = doc(db, 'usuarios', usuario.uid);
    await setDoc(perfilRef, {
        inventario: perfilUsuario.inventario,
        pacotes: perfilUsuario.pacotes
    }, { merge: true });
}

async function abrirPacote() {
    try {
        const qtdAntes = perfilUsuario.pacotes;
        const sorteadas = await sortearFigurinhas(4);
        await salvarFigurinhas(sorteadas, qtdAntes - 1);
        renderizarPilha(perfilUsuario.pacotes);
        exibirResultado(sorteadas, false);
    } catch (err) {
        console.error("Erro ao abrir pacote:", err);
        showToast('Erro ao abrir o pacote. Tente novamente.', 'erro');
    }
}

// ============================================================
// 13. ABRIR TODOS OS PACOTES
// ============================================================
let abrindoTodos = false;
let filaAbrirTodos = [];
let indiceAbrirTodos = 0;
let todasFigurinhas = [];

if (btnAbrirTodos) {
    btnAbrirTodos.addEventListener('click', async () => {
        if (perfilUsuario.pacotes <= 0 || abrindoTodos) return;
        const total = perfilUsuario.pacotes;
        if (total === 1) {
            // Só 1 pacote: usa fluxo normal
            mostrarOverlayRasgar(abrirPacote);
            return;
        }

        abrindoTodos = true;
        filaAbrirTodos = Array.from({ length: total }, (_, i) => i);
        indiceAbrirTodos = 0;
        todasFigurinhas = [];

        // Sorteia todas as figurinhas de uma vez e salva
        for (let i = 0; i < total; i++) {
            const s = await sortearFigurinhas(4);
            s.forEach(c => todasFigurinhas.push(c));
        }
        await salvarFigurinhas(todasFigurinhas, 0);
        renderizarPilha(0);

        // Inicia fluxo de animação sequencial
        abrirProximoPacoteSequencial(total);
    });
}

function abrirProximoPacoteSequencial(total) {
    if (indiceAbrirTodos >= total) {
        // Fim: mostrar todas juntas
        abrindoTodos = false;
        const inicio = 0;
        const todas = todasFigurinhas;
        exibirResultado(todas, true, total);
        return;
    }

    const overlay    = document.getElementById('overlay-rasgar');
    const pacoteAnim = document.getElementById('pacote-animado');
    const dica       = document.getElementById('overlay-dica');
    if (dica) dica.style.display = 'none';

    // Contador
    let contador = overlay.querySelector('.overlay-contador');
    if (!contador) {
        contador = document.createElement('div');
        contador.className = 'overlay-contador';
        overlay.appendChild(contador);
    }
    contador.textContent = `Pacote ${indiceAbrirTodos + 1} de ${total}`;

    pacoteAnim.innerHTML = gerarSVGPacote();
    pacoteAnim.style.animation = 'none';
    void pacoteAnim.offsetWidth;
    pacoteAnim.style.animation = '';

    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Auto-explode após 800ms (fluido, sem precisar clicar)
    setTimeout(() => {
        pacoteAnim.classList.add('explodir');
        dispararConfetti();
        setTimeout(() => {
            pacoteAnim.classList.remove('explodir');
            indiceAbrirTodos++;

            if (indiceAbrirTodos >= total) {
                overlay.style.display = 'none';
                document.body.style.overflow = '';
                const contador2 = overlay.querySelector('.overlay-contador');
                if (contador2) contador2.remove();
                abrindoTodos = false;
                exibirResultado(todasFigurinhas, true, total);
            } else {
                abrirProximoPacoteSequencial(total);
            }
        }, 500);
    }, 800);
}

// ============================================================
// 14. EXIBIR RESULTADO
// ============================================================
function exibirResultado(cartas, modoTodos = false, totalPacotes = 1) {
    const pacotesArea   = document.querySelector('.pacotes-area');
    const resultado     = document.getElementById('resultado-pacotinho');
    const grid          = document.getElementById('grid-cartas');
    const subtitulo     = document.getElementById('resultado-subtitulo');
    const btnProximo    = document.getElementById('btn-proximo-pacote');

    pacotesArea.style.display = 'none';
    resultado.style.display   = 'block';
    grid.innerHTML = '';

    if (subtitulo) {
        subtitulo.textContent = modoTodos
            ? `${totalPacotes} pacotes abertos · ${cartas.length} figurinhas`
            : 'Suas figurinhas!';
    }
    if (btnProximo) btnProximo.style.display = 'none';

    cartas.forEach((carta, idx) => {
        const qtdAtual = perfilUsuario.inventario[carta.id] || 0;
        const repetida = qtdAtual > 1;
        const raridade = getRaridade(carta.pasta);
        const nomeAmigavel = getNomeAmigavel(carta.pasta);

        const div = document.createElement('div');
        div.className = 'carta-sorteada' + (repetida ? ' repetida' : '');
        // Animação com delay escalonado (máximo 2s)
        div.style.animationDelay = `${Math.min(idx * 0.15, 2)}s`;

        if (repetida) {
            const badgeRep = document.createElement('div');
            badgeRep.className = 'badge-repetida';
            badgeRep.textContent = '🔁 Repetida';
            div.appendChild(badgeRep);
        }

        const imgWrap = document.createElement('div');
        imgWrap.className = 'carta-img-wrap';
        const img = document.createElement('img');
        img.src = carta.imagem;
        img.alt = nomeAmigavel;
        img.loading = 'lazy';
        imgWrap.appendChild(img);
        div.appendChild(imgWrap);

        const info = document.createElement('div');
        info.className = 'carta-info';

        const nome = document.createElement('div');
        nome.className = 'carta-nome';
        nome.textContent = nomeAmigavel;
        info.appendChild(nome);

        const badgeRar = document.createElement('span');
        badgeRar.className = `carta-raridade raridade-${raridade}`;
        const rarLabels = { comum:'Comum', rara:'Rara ⭐', epica:'Épica 💎', lendaria:'Lendária 👑' };
        badgeRar.textContent = rarLabels[raridade] || raridade;
        info.appendChild(badgeRar);

        div.appendChild(info);
        grid.appendChild(div);
    });
}

if (btnFechar) {
    btnFechar.addEventListener('click', () => {
        document.querySelector('.pacotes-area').style.display = 'flex';
        document.getElementById('resultado-pacotinho').style.display = 'none';
    });
}

// ============================================================
// 15. SISTEMA DE ABAS
// ============================================================
const menuPacotes = document.getElementById('menu-pacotes');
const menuAlbum   = document.getElementById('menu-album');
const menuJogos   = document.getElementById('menu-jogos');
const menuGrupos  = document.getElementById('menu-grupos');
const menuTrocas  = document.getElementById('menu-trocas');
const menuTrivia  = document.getElementById('menu-trivia');
const menuAdmin   = document.getElementById('menu-admin');

const secaoPacotes = document.getElementById('secao-pacotes');
const secaoAlbum   = document.getElementById('secao-album');
const secaoJogos   = document.getElementById('secao-jogos');
const secaoGrupos  = document.getElementById('secao-grupos');
const secaoTrocas  = document.getElementById('secao-trocas');
const secaoTrivia  = document.getElementById('secao-trivia');
const secaoAdmin   = document.getElementById('secao-admin');
const gradeAlbum   = document.getElementById('grade-album');

const todasSecoes = [secaoPacotes, secaoAlbum, secaoJogos, secaoGrupos, secaoTrocas, secaoTrivia, secaoAdmin];
const todosMenus  = [menuPacotes, menuAlbum, menuJogos, menuGrupos, menuTrocas, menuTrivia, menuAdmin];

function setAba(btnAtivo, secAtiva, callback) {
    todosMenus.forEach(b => b && b.classList.remove('ativo'));
    todasSecoes.forEach(s => s && (s.style.display = 'none'));
    btnAtivo.classList.add('ativo');
    secAtiva.style.display = 'block';
    if (callback) callback();
}

menuPacotes?.addEventListener('click', () => setAba(menuPacotes, secaoPacotes));
menuAlbum?.addEventListener('click',   () => setAba(menuAlbum, secaoAlbum, renderizarAlbum));
menuJogos?.addEventListener('click',   () => setAba(menuJogos, secaoJogos, carregarJogos));
menuGrupos?.addEventListener('click',  () => setAba(menuGrupos, secaoGrupos, renderizarGrupos));
menuTrocas?.addEventListener('click',  () => setAba(menuTrocas, secaoTrocas, carregarTrocas));
menuTrivia?.addEventListener('click',  () => setAba(menuTrivia, secaoTrivia, carregarTrivia));
menuAdmin?.addEventListener('click',   () => setAba(menuAdmin, secaoAdmin, carregarAdmin));

// ============================================================
// 16. ÁLBUM — Navegação por Seleções
// ============================================================

// Mapeamento de nomes de pasta para bandeiras (complementa getNomeAmigavel)
const BANDEIRAS_ALBUM = {
    'Alemanha':'🇩🇪','Arabia Saudita':'🇸🇦','Argelia':'🇩🇿','Argentina':'🇦🇷',
    'Australia':'🇦🇺','Austria':'🇦🇹','Belgica':'🇧🇪','Bosnia':'🇧🇦',
    'Mistas 02':'🌍','Brasil':'🇧🇷','Cabo Verde':'🇨🇻','Canada':'🇨🇦',
    'Especiais Brilhantes':'✨','Colombia':'🇨🇴','Coreia do Sul':'🇰🇷',
    'Costa do Marfim':'🇨🇮','Croacia':'🇭🇷','Curacao':'🇨🇼','Equador':'🇪🇨',
    'Egito':'🇪🇬','Escocia':'🏴󠁧󠁢󠁳󠁣󠁴󠁿','Espanha':'🇪🇸','Equipes Esp Fra':'⚽',
    'EUA':'🇺🇸','Franca':'🇫🇷','Gana':'🇬🇭','Haiti':'🇭🇹','Inglaterra':'🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    'Ira':'🇮🇷','Iraque':'🇮🇶','Japao':'🇯🇵','Jordania':'🇯🇴','Marrocos':'🇲🇦',
    'Mexico':'🇲🇽','Holanda':'🇳🇱','Noruega':'🇳🇴','Nova Zelandia':'🇳🇿',
    'Panama':'🇵🇦','Paraguai':'🇵🇾','Portugal':'🇵🇹','Catar':'🇶🇦',
    'RD Congo':'🇨🇩','Senegal':'🇸🇳','Suecia':'🇸🇪','Suica':'🇨🇭',
    'Tunisia':'🇹🇳','Turquia':'🇹🇷','Uruguai':'🇺🇾','Uzbequistao':'🇺🇿'
};

function getBandeiraPasta(nomeLimpo) {
    return BANDEIRAS_ALBUM[nomeLimpo] || '🏳️';
}

async function renderizarAlbum() {
    gradeAlbum.innerHTML = "<p style='text-align:center;color:rgba(255,255,255,.4);padding:40px'>A carregar o álbum... ☁️</p>";
    try {
        const inventario = perfilUsuario.inventario || {};

        // Agrupar figurinhas por seleção
        const selecoes = {};
        catalogo.forEach(c => {
            if (!selecoes[c.pasta]) selecoes[c.pasta] = [];
            selecoes[c.pasta].push(c);
        });

        // Mostrar o índice de seleções (grade de países)
        renderizarIndiceAlbum(selecoes, inventario);

    } catch (e) {
        console.error(e);
        gradeAlbum.innerHTML = "<p style='color:#ff4d4d;text-align:center'>Erro ao carregar o álbum.</p>";
    }
}

function renderizarIndiceAlbum(selecoes, inventario) {
    gradeAlbum.innerHTML = '';

    // Cabeçalho do álbum
    const totalFig = catalogo.length;
    const totalColetadas = catalogo.filter(c => (inventario[c.id] || 0) > 0).length;
    const pct = Math.round((totalColetadas / totalFig) * 100);

    const header = document.createElement('div');
    header.className = 'album-progresso-global';
    header.innerHTML = `
        <div class="album-prog-titulo">📒 Meu Álbum Oficial</div>
        <div class="album-prog-bar-wrap">
            <div class="album-prog-bar" style="width:${pct}%"></div>
        </div>
        <div class="album-prog-label">${totalColetadas} de ${totalFig} figurinhas · ${pct}%</div>
    `;
    gradeAlbum.appendChild(header);

    // Grade de índice (cards de país)
    const grade = document.createElement('div');
    grade.className = 'album-indice-grade';

    Object.entries(selecoes).forEach(([pasta, cartas]) => {
        const nomeLimpo = getNomeAmigavel(pasta);
        const bandeira  = getBandeiraPasta(nomeLimpo);
        const total     = cartas.length;
        const coletadas = cartas.filter(c => (inventario[c.id] || 0) > 0).length;
        const pctPais   = Math.round((coletadas / total) * 100);
        const completo  = coletadas === total;

        const card = document.createElement('div');
        card.className = 'album-pais-card' + (completo ? ' album-pais-completo' : '');
        card.innerHTML = `
            <div class="album-pais-bandeira">${bandeira}</div>
            <div class="album-pais-nome">${nomeLimpo}</div>
            <div class="album-pais-progresso">
                <div class="album-pais-bar-wrap">
                    <div class="album-pais-bar" style="width:${pctPais}%"></div>
                </div>
                <span class="album-pais-nums">${coletadas}/${total}</span>
            </div>
            ${completo ? '<div class="album-pais-check">✓ Completo</div>' : ''}
        `;
        card.addEventListener('click', () => {
            renderizarFigurinhasPais(pasta, cartas, inventario, selecoes);
        });
        grade.appendChild(card);
    });

    gradeAlbum.appendChild(grade);
}

function renderizarFigurinhasPais(pasta, cartas, inventario, selecoes) {
    gradeAlbum.innerHTML = '';

    const nomeLimpo = getNomeAmigavel(pasta);
    const bandeira  = getBandeiraPasta(nomeLimpo);
    const coletadas = cartas.filter(c => (inventario[c.id] || 0) > 0).length;

    // Botão de voltar + título da seleção
    const topo = document.createElement('div');
    topo.className = 'album-pais-topo';
    topo.innerHTML = `
        <button class="btn-voltar-indice">← Índice</button>
        <div class="album-pais-header">
            <span class="album-pais-header-bandeira">${bandeira}</span>
            <span class="album-pais-header-nome">${nomeLimpo}</span>
            <span class="album-pais-header-prog">${coletadas} / ${cartas.length}</span>
        </div>
    `;
    topo.querySelector('.btn-voltar-indice').addEventListener('click', () => {
        renderizarIndiceAlbum(selecoes, inventario);
    });
    gradeAlbum.appendChild(topo);

    // Grade de figurinhas da seleção
    const grade = document.createElement('div');
    grade.className = 'album-fig-grade';

    cartas.forEach(c => {
        const qtd = inventario[c.id] || 0;
        const div = document.createElement('div');
        div.className = 'espaco-figurinha album-fig-espaco' + (qtd === 0 ? ' figurinha-faltante' : '');

        const img = document.createElement('img');
        img.src = c.imagem;
        img.loading = 'lazy';
        img.title = getNomeAmigavel(c.pasta);
        div.appendChild(img);

        div.style.cursor = 'pointer';
        div.addEventListener('click', () => {
            const modal   = document.getElementById('modal-figurinha');
            const mImg    = document.getElementById('modal-fig-img');
            const mNome   = document.getElementById('modal-fig-nome');
            const mInfo   = document.getElementById('modal-fig-info');
            mImg.src      = c.imagem;
            mNome.textContent = getNomeAmigavel(c.pasta);
            const qtdAtual = perfilUsuario.inventario[c.id] || 0;
            mInfo.textContent = qtdAtual > 0
                ? `Figurinha ${c.id.replace('fig_','#')} · ${qtdAtual > 1 ? qtdAtual + ' cópias' : '1 cópia'}`
                : `Figurinha ${c.id.replace('fig_','#')} · Faltando`;
            modal.style.display = 'flex';
        });

        if (qtd > 1) {
            const badge = document.createElement('div');
            badge.className = 'qtd-badge';
            badge.textContent = qtd;
            div.appendChild(badge);
        }

        // Número da figurinha
        const numLabel = document.createElement('div');
        numLabel.className = 'album-fig-num';
        numLabel.textContent = '#' + c.id.replace('fig_','');
        div.appendChild(numLabel);

        grade.appendChild(div);
    });

    gradeAlbum.appendChild(grade);
}

// ============================================================
// 17. GRUPOS
// ============================================================
function renderizarGrupos() {
    const grade = document.getElementById('grade-grupos');
    if (!grade) return;
    grade.innerHTML = '';

    Object.entries(GRUPOS_JSON).forEach(([grupo, times]) => {
        const letraGrupo = grupo.replace('Group ', '');
        const card = document.createElement('div');
        card.className = 'grupo-card';

        const titulo = document.createElement('div');
        titulo.className = 'grupo-titulo';
        titulo.textContent = `Grupo ${letraGrupo}`;
        card.appendChild(titulo);

        const lista = document.createElement('div');
        lista.className = 'grupo-times-lista';

        times.forEach(time => {
            const item = document.createElement('div');
            item.className = 'grupo-time-item';
            const flag = getFlag(time);
            const nome = getNomePT(time);
            item.innerHTML = `<span class="grupo-flag">${flag}</span><span class="grupo-nome">${nome}</span>`;
            lista.appendChild(item);
        });

        card.appendChild(lista);
        grade.appendChild(card);
    });
}

// ============================================================
// 17b. SINCRONIZAÇÃO DE JOGOS — usa JSON local
// ============================================================

const JOGOS_COL  = 'jogos_copa';
const CONFIG_COL = 'config';

// ── Mapeamento de bandeiras por nome de seleção (openfootball usa nomes em inglês) ──
const FLAGS = {
    'Argentina':'🇦🇷','Australia':'🇦🇺','Austria':'🇦🇹','Belgium':'🇧🇪',
    'Bolivia':'🇧🇴','Bosnia-Herzegovina':'🇧🇦','Brazil':'🇧🇷','Cameroon':'🇨🇲',
    'Canada':'🇨🇦','Chile':'🇨🇱','Colombia':'🇨🇴','Costa Rica':'🇨🇷',
    'Croatia':'🇭🇷','Cuba':'🇨🇺','DR Congo':'🇨🇩','Denmark':'🇩🇰',
    'Ecuador':'🇪🇨','Egypt':'🇪🇬','El Salvador':'🇸🇻','France':'🇫🇷',
    'Germany':'🇩🇪','Ghana':'🇬🇭','Guatemala':'🇬🇹','Haiti':'🇭🇹',
    'Honduras':'🇭🇳','Hungary':'🇭🇺','Indonesia':'🇮🇩','Iran':'🇮🇷',
    'Iraq':'🇮🇶','Japan':'🇯🇵','Jordan':'🇯🇴','Kenya':'🇰🇪',
    'Korea Republic':'🇰🇷','Mexico':'🇲🇽','Morocco':'🇲🇦','Netherlands':'🇳🇱',
    'New Zealand':'🇳🇿','Nigeria':'🇳🇬','Norway':'🇳🇴','Panama':'🇵🇦',
    'Paraguay':'🇵🇾','Peru':'🇵🇪','Portugal':'🇵🇹','Qatar':'🇶🇦',
    'Saudi Arabia':'🇸🇦','Senegal':'🇸🇳','Serbia':'🇷🇸','Slovenia':'🇸🇮',
    'South Africa':'🇿🇦','Spain':'🇪🇸','Sweden':'🇸🇪','Switzerland':'🇨🇭',
    'Trinidad and Tobago':'🇹🇹','Tunisia':'🇹🇳','Türkiye':'🇹🇷','Turkey':'🇹🇷',
    'Ukraine':'🇺🇦','United States':'🇺🇸','Uruguay':'🇺🇾','Uzbekistan':'🇺🇿',
    'Venezuela':'🇻🇪','Wales':'🏴󠁧󠁢󠁷󠁬󠁳󠁿','England':'🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    'Algeria':'🇩🇿','Ivory Coast':'🇨🇮','Cape Verde':'🇨🇻','Curaçao':'🇨🇼',
    'Scotland':'🏴󠁧󠁢󠁳󠁣󠁴󠁿','Kosovo':'🇽🇰','TBD':'🏆',
    'South Africa':'🇿🇦','Czech Republic':'🇨🇿','Bosnia & Herzegovina':'🇧🇦',
    'South Korea':'🇰🇷','Haiti':'🇭🇹','USA':'🇺🇸','Turkey':'🇹🇷',
    'DR Congo':'🇨🇩','Jordan':'🇯🇴','Iraq':'🇮🇶',
};

// Tradução de nomes para PT-BR
const NOMES_PT = {
    'Argentina':'Argentina','Australia':'Austrália','Austria':'Áustria',
    'Belgium':'Bélgica','Bolivia':'Bolívia','Bosnia-Herzegovina':'Bósnia',
    'Brazil':'Brasil','Cameroon':'Camarões','Canada':'Canadá','Chile':'Chile',
    'Colombia':'Colômbia','Costa Rica':'Costa Rica','Croatia':'Croácia',
    'Cuba':'Cuba','DR Congo':'RD Congo','Denmark':'Dinamarca','Ecuador':'Equador',
    'Egypt':'Egito','El Salvador':'El Salvador','France':'França',
    'Germany':'Alemanha','Ghana':'Gana','Guatemala':'Guatemala','Haiti':'Haiti',
    'Honduras':'Honduras','Hungary':'Hungria','Indonesia':'Indonésia','Iran':'Irã',
    'Iraq':'Iraque','Japan':'Japão','Jordan':'Jordânia','Kenya':'Quênia',
    'Korea Republic':'Coreia do Sul','Mexico':'México','Morocco':'Marrocos',
    'Netherlands':'Holanda','New Zealand':'Nova Zelândia','Nigeria':'Nigéria',
    'Norway':'Noruega','Panama':'Panamá','Paraguay':'Paraguai','Peru':'Peru',
    'Portugal':'Portugal','Qatar':'Catar','Saudi Arabia':'Arábia Saudita',
    'Senegal':'Senegal','Serbia':'Sérvia','Slovenia':'Eslovênia',
    'South Africa':'África do Sul','Spain':'Espanha','Sweden':'Suécia',
    'Switzerland':'Suíça','Trinidad and Tobago':'Trinidad e Tobago',
    'Tunisia':'Tunísia','Türkiye':'Turquia','Turkey':'Turquia',
    'Ukraine':'Ucrânia','United States':'EUA','Uruguay':'Uruguai',
    'Uzbekistan':'Uzbequistão','Venezuela':'Venezuela','Wales':'País de Gales',
    'England':'Inglaterra','Algeria':'Argélia','Ivory Coast':'Costa do Marfim',
    'Cape Verde':'Cabo Verde','Curaçao':'Curaçao','Scotland':'Escócia',
    'Kosovo':'Kosovo','TBD':'TBD',
    'South Africa':'África do Sul','Czech Republic':'República Tcheca',
    'Bosnia & Herzegovina':'Bósnia e Herzegovina','South Korea':'Coreia do Sul',
    'Haiti':'Haiti','USA':'EUA','Turkey':'Turquia','DR Congo':'RD Congo',
    'Jordan':'Jordânia','Iraq':'Iraque','Senegal':'Senegal','Norway':'Noruega',
    'Austria':'Áustria','Uzbekistan':'Uzbequistão','Croatia':'Croácia',
    'Ghana':'Gana','Panama':'Panamá',
};

// ── JSON local da Copa 2026 (jogos.json) ──
const JOGOS_JSON_LOCAL = {"name":"World Cup 2026","matches":[{"round":"Matchday 1","date":"2026-06-11","time":"13:00 UTC-6","team1":"Mexico","team2":"South Africa","group":"Group A","ground":"Mexico City"},{"round":"Matchday 1","date":"2026-06-11","time":"20:00 UTC-6","team1":"South Korea","team2":"Czech Republic","group":"Group A","ground":"Guadalajara (Zapopan)"},{"round":"Matchday 8","date":"2026-06-18","time":"12:00 UTC-4","team1":"Czech Republic","team2":"South Africa","group":"Group A","ground":"Atlanta"},{"round":"Matchday 8","date":"2026-06-18","time":"19:00 UTC-6","team1":"Mexico","team2":"South Korea","group":"Group A","ground":"Guadalajara (Zapopan)"},{"round":"Matchday 14","date":"2026-06-24","time":"19:00 UTC-6","team1":"Czech Republic","team2":"Mexico","group":"Group A","ground":"Mexico City"},{"round":"Matchday 14","date":"2026-06-24","time":"19:00 UTC-6","team1":"South Africa","team2":"South Korea","group":"Group A","ground":"Monterrey (Guadalupe)"},{"round":"Matchday 2","date":"2026-06-12","time":"15:00 UTC-4","team1":"Canada","team2":"Bosnia & Herzegovina","group":"Group B","ground":"Toronto"},{"round":"Matchday 3","date":"2026-06-13","time":"12:00 UTC-7","team1":"Qatar","team2":"Switzerland","group":"Group B","ground":"San Francisco Bay Area (Santa Clara)"},{"round":"Matchday 8","date":"2026-06-18","time":"12:00 UTC-7","team1":"Switzerland","team2":"Bosnia & Herzegovina","group":"Group B","ground":"Los Angeles (Inglewood)"},{"round":"Matchday 8","date":"2026-06-18","time":"15:00 UTC-7","team1":"Canada","team2":"Qatar","group":"Group B","ground":"Vancouver"},{"round":"Matchday 14","date":"2026-06-24","time":"12:00 UTC-7","team1":"Switzerland","team2":"Canada","group":"Group B","ground":"Vancouver"},{"round":"Matchday 14","date":"2026-06-24","time":"12:00 UTC-7","team1":"Bosnia & Herzegovina","team2":"Qatar","group":"Group B","ground":"Seattle"},{"round":"Matchday 3","date":"2026-06-13","time":"18:00 UTC-4","team1":"Brazil","team2":"Morocco","group":"Group C","ground":"New York/New Jersey (East Rutherford)"},{"round":"Matchday 3","date":"2026-06-13","time":"21:00 UTC-4","team1":"Haiti","team2":"Scotland","group":"Group C","ground":"Boston (Foxborough)"},{"round":"Matchday 9","date":"2026-06-19","time":"18:00 UTC-4","team1":"Scotland","team2":"Morocco","group":"Group C","ground":"Boston (Foxborough)"},{"round":"Matchday 9","date":"2026-06-19","time":"20:30 UTC-4","team1":"Brazil","team2":"Haiti","group":"Group C","ground":"Philadelphia"},{"round":"Matchday 14","date":"2026-06-24","time":"18:00 UTC-4","team1":"Scotland","team2":"Brazil","group":"Group C","ground":"Miami (Miami Gardens)"},{"round":"Matchday 14","date":"2026-06-24","time":"18:00 UTC-4","team1":"Morocco","team2":"Haiti","group":"Group C","ground":"Atlanta"},{"round":"Matchday 2","date":"2026-06-12","time":"18:00 UTC-7","team1":"USA","team2":"Paraguay","group":"Group D","ground":"Los Angeles (Inglewood)"},{"round":"Matchday 3","date":"2026-06-13","time":"21:00 UTC-7","team1":"Australia","team2":"Turkey","group":"Group D","ground":"Vancouver"},{"round":"Matchday 9","date":"2026-06-19","time":"12:00 UTC-7","team1":"USA","team2":"Australia","group":"Group D","ground":"Seattle"},{"round":"Matchday 9","date":"2026-06-19","time":"20:00 UTC-7","team1":"Turkey","team2":"Paraguay","group":"Group D","ground":"San Francisco Bay Area (Santa Clara)"},{"round":"Matchday 15","date":"2026-06-25","time":"19:00 UTC-7","team1":"Turkey","team2":"USA","group":"Group D","ground":"Los Angeles (Inglewood)"},{"round":"Matchday 15","date":"2026-06-25","time":"19:00 UTC-7","team1":"Paraguay","team2":"Australia","group":"Group D","ground":"San Francisco Bay Area (Santa Clara)"},{"round":"Matchday 4","date":"2026-06-14","time":"12:00 UTC-5","team1":"Germany","team2":"Curaçao","group":"Group E","ground":"Houston"},{"round":"Matchday 4","date":"2026-06-14","time":"19:00 UTC-4","team1":"Ivory Coast","team2":"Ecuador","group":"Group E","ground":"Philadelphia"},{"round":"Matchday 10","date":"2026-06-20","time":"16:00 UTC-4","team1":"Germany","team2":"Ivory Coast","group":"Group E","ground":"Toronto"},{"round":"Matchday 10","date":"2026-06-20","time":"19:00 UTC-5","team1":"Ecuador","team2":"Curaçao","group":"Group E","ground":"Kansas City"},{"round":"Matchday 15","date":"2026-06-25","time":"16:00 UTC-4","team1":"Curaçao","team2":"Ivory Coast","group":"Group E","ground":"Philadelphia"},{"round":"Matchday 15","date":"2026-06-25","time":"16:00 UTC-4","team1":"Ecuador","team2":"Germany","group":"Group E","ground":"New York/New Jersey (East Rutherford)"},{"round":"Matchday 4","date":"2026-06-14","time":"15:00 UTC-5","team1":"Netherlands","team2":"Japan","group":"Group F","ground":"Dallas (Arlington)"},{"round":"Matchday 4","date":"2026-06-14","time":"20:00 UTC-6","team1":"Sweden","team2":"Tunisia","group":"Group F","ground":"Monterrey (Guadalupe)"},{"round":"Matchday 10","date":"2026-06-20","time":"12:00 UTC-5","team1":"Netherlands","team2":"Sweden","group":"Group F","ground":"Houston"},{"round":"Matchday 10","date":"2026-06-20","time":"22:00 UTC-6","team1":"Tunisia","team2":"Japan","group":"Group F","ground":"Monterrey (Guadalupe)"},{"round":"Matchday 15","date":"2026-06-25","time":"18:00 UTC-5","team1":"Japan","team2":"Sweden","group":"Group F","ground":"Dallas (Arlington)"},{"round":"Matchday 15","date":"2026-06-25","time":"18:00 UTC-5","team1":"Tunisia","team2":"Netherlands","group":"Group F","ground":"Kansas City"},{"round":"Matchday 5","date":"2026-06-15","time":"12:00 UTC-7","team1":"Belgium","team2":"Egypt","group":"Group G","ground":"Seattle"},{"round":"Matchday 5","date":"2026-06-15","time":"18:00 UTC-7","team1":"Iran","team2":"New Zealand","group":"Group G","ground":"Los Angeles (Inglewood)"},{"round":"Matchday 11","date":"2026-06-21","time":"12:00 UTC-7","team1":"Belgium","team2":"Iran","group":"Group G","ground":"Los Angeles (Inglewood)"},{"round":"Matchday 11","date":"2026-06-21","time":"18:00 UTC-7","team1":"New Zealand","team2":"Egypt","group":"Group G","ground":"Vancouver"},{"round":"Matchday 16","date":"2026-06-26","time":"20:00 UTC-7","team1":"Egypt","team2":"Iran","group":"Group G","ground":"Seattle"},{"round":"Matchday 16","date":"2026-06-26","time":"20:00 UTC-7","team1":"New Zealand","team2":"Belgium","group":"Group G","ground":"Vancouver"},{"round":"Matchday 5","date":"2026-06-15","time":"12:00 UTC-4","team1":"Spain","team2":"Cape Verde","group":"Group H","ground":"Atlanta"},{"round":"Matchday 5","date":"2026-06-15","time":"18:00 UTC-4","team1":"Saudi Arabia","team2":"Uruguay","group":"Group H","ground":"Miami (Miami Gardens)"},{"round":"Matchday 11","date":"2026-06-21","time":"12:00 UTC-4","team1":"Spain","team2":"Saudi Arabia","group":"Group H","ground":"Atlanta"},{"round":"Matchday 11","date":"2026-06-21","time":"18:00 UTC-4","team1":"Uruguay","team2":"Cape Verde","group":"Group H","ground":"Miami (Miami Gardens)"},{"round":"Matchday 16","date":"2026-06-26","time":"19:00 UTC-5","team1":"Cape Verde","team2":"Saudi Arabia","group":"Group H","ground":"Houston"},{"round":"Matchday 16","date":"2026-06-26","time":"18:00 UTC-6","team1":"Uruguay","team2":"Spain","group":"Group H","ground":"Guadalajara (Zapopan)"},{"round":"Matchday 6","date":"2026-06-16","time":"15:00 UTC-4","team1":"France","team2":"Senegal","group":"Group I","ground":"New York/New Jersey (East Rutherford)"},{"round":"Matchday 6","date":"2026-06-16","time":"18:00 UTC-4","team1":"Iraq","team2":"Norway","group":"Group I","ground":"Boston (Foxborough)"},{"round":"Matchday 12","date":"2026-06-22","time":"17:00 UTC-4","team1":"France","team2":"Iraq","group":"Group I","ground":"Philadelphia"},{"round":"Matchday 12","date":"2026-06-22","time":"20:00 UTC-4","team1":"Norway","team2":"Senegal","group":"Group I","ground":"New York/New Jersey (East Rutherford)"},{"round":"Matchday 16","date":"2026-06-26","time":"15:00 UTC-4","team1":"Norway","team2":"France","group":"Group I","ground":"Boston (Foxborough)"},{"round":"Matchday 16","date":"2026-06-26","time":"15:00 UTC-4","team1":"Senegal","team2":"Iraq","group":"Group I","ground":"Toronto"},{"round":"Matchday 6","date":"2026-06-16","time":"20:00 UTC-5","team1":"Argentina","team2":"Algeria","group":"Group J","ground":"Kansas City"},{"round":"Matchday 6","date":"2026-06-16","time":"21:00 UTC-7","team1":"Austria","team2":"Jordan","group":"Group J","ground":"San Francisco Bay Area (Santa Clara)"},{"round":"Matchday 12","date":"2026-06-22","time":"12:00 UTC-5","team1":"Argentina","team2":"Austria","group":"Group J","ground":"Dallas (Arlington)"},{"round":"Matchday 12","date":"2026-06-22","time":"20:00 UTC-7","team1":"Jordan","team2":"Algeria","group":"Group J","ground":"San Francisco Bay Area (Santa Clara)"},{"round":"Matchday 17","date":"2026-06-27","time":"21:00 UTC-5","team1":"Algeria","team2":"Austria","group":"Group J","ground":"Kansas City"},{"round":"Matchday 17","date":"2026-06-27","time":"21:00 UTC-5","team1":"Jordan","team2":"Argentina","group":"Group J","ground":"Dallas (Arlington)"},{"round":"Matchday 7","date":"2026-06-17","time":"12:00 UTC-5","team1":"Portugal","team2":"DR Congo","group":"Group K","ground":"Houston"},{"round":"Matchday 7","date":"2026-06-17","time":"20:00 UTC-6","team1":"Uzbekistan","team2":"Colombia","group":"Group K","ground":"Guadalajara (Zapopan)"},{"round":"Matchday 13","date":"2026-06-23","time":"12:00 UTC-5","team1":"Portugal","team2":"Uzbekistan","group":"Group K","ground":"Houston"},{"round":"Matchday 13","date":"2026-06-23","time":"20:00 UTC-6","team1":"Colombia","team2":"DR Congo","group":"Group K","ground":"Guadalajara (Zapopan)"},{"round":"Matchday 17","date":"2026-06-27","time":"19:30 UTC-4","team1":"Colombia","team2":"Portugal","group":"Group K","ground":"Miami (Miami Gardens)"},{"round":"Matchday 17","date":"2026-06-27","time":"19:30 UTC-4","team1":"DR Congo","team2":"Uzbekistan","group":"Group K","ground":"Atlanta"},{"round":"Matchday 7","date":"2026-06-17","time":"15:00 UTC-5","team1":"England","team2":"Croatia","group":"Group L","ground":"Dallas (Arlington)"},{"round":"Matchday 7","date":"2026-06-17","time":"19:00 UTC-4","team1":"Ghana","team2":"Panama","group":"Group L","ground":"Toronto"},{"round":"Matchday 13","date":"2026-06-23","time":"16:00 UTC-4","team1":"England","team2":"Ghana","group":"Group L","ground":"Boston (Foxborough)"},{"round":"Matchday 13","date":"2026-06-23","time":"19:00 UTC-4","team1":"Panama","team2":"Croatia","group":"Group L","ground":"Toronto"},{"round":"Matchday 17","date":"2026-06-27","time":"17:00 UTC-4","team1":"Panama","team2":"England","group":"Group L","ground":"New York/New Jersey (East Rutherford)"},{"round":"Matchday 17","date":"2026-06-27","time":"17:00 UTC-4","team1":"Croatia","team2":"Ghana","group":"Group L","ground":"Philadelphia"},{"round":"Round of 32","num":73,"date":"2026-06-28","time":"12:00 UTC-7","team1":"2A","team2":"2B","ground":"Los Angeles (Inglewood)"},{"round":"Round of 32","num":74,"date":"2026-06-29","time":"16:30 UTC-4","team1":"1E","team2":"3A/B/C/D/F","ground":"Boston (Foxborough)"},{"round":"Round of 32","num":75,"date":"2026-06-29","time":"19:00 UTC-6","team1":"1F","team2":"2C","ground":"Monterrey (Guadalupe)"},{"round":"Round of 32","num":76,"date":"2026-06-29","time":"12:00 UTC-5","team1":"1C","team2":"2F","ground":"Houston"},{"round":"Round of 32","num":77,"date":"2026-06-30","time":"17:00 UTC-4","team1":"1I","team2":"3C/D/F/G/H","ground":"New York/New Jersey (East Rutherford)"},{"round":"Round of 32","num":78,"date":"2026-06-30","time":"12:00 UTC-5","team1":"2E","team2":"2I","ground":"Dallas (Arlington)"},{"round":"Round of 32","num":79,"date":"2026-06-30","time":"19:00 UTC-6","team1":"1A","team2":"3C/E/F/H/I","ground":"Mexico City"},{"round":"Round of 32","num":80,"date":"2026-07-01","time":"12:00 UTC-4","team1":"1L","team2":"3E/H/I/J/K","ground":"Atlanta"},{"round":"Round of 32","num":81,"date":"2026-07-01","time":"17:00 UTC-7","team1":"1D","team2":"3B/E/F/I/J","ground":"San Francisco Bay Area (Santa Clara)"},{"round":"Round of 32","num":82,"date":"2026-07-01","time":"13:00 UTC-7","team1":"1G","team2":"3A/E/H/I/J","ground":"Seattle"},{"round":"Round of 32","num":83,"date":"2026-07-02","time":"19:00 UTC-4","team1":"2K","team2":"2L","ground":"Toronto"},{"round":"Round of 32","num":84,"date":"2026-07-02","time":"12:00 UTC-7","team1":"1H","team2":"2J","ground":"Los Angeles (Inglewood)"},{"round":"Round of 32","num":85,"date":"2026-07-02","time":"20:00 UTC-7","team1":"1B","team2":"3E/F/G/I/J","ground":"Vancouver"},{"round":"Round of 32","num":86,"date":"2026-07-03","time":"18:00 UTC-4","team1":"1J","team2":"2H","ground":"Miami (Miami Gardens)"},{"round":"Round of 32","num":87,"date":"2026-07-03","time":"20:30 UTC-5","team1":"1K","team2":"3D/E/I/J/L","ground":"Kansas City"},{"round":"Round of 32","num":88,"date":"2026-07-03","time":"13:00 UTC-5","team1":"2D","team2":"2G","ground":"Dallas (Arlington)"},{"round":"Round of 16","num":89,"date":"2026-07-04","time":"17:00 UTC-4","team1":"W74","team2":"W77","ground":"Philadelphia"},{"round":"Round of 16","num":90,"date":"2026-07-04","time":"12:00 UTC-5","team1":"W73","team2":"W75","ground":"Houston"},{"round":"Round of 16","num":91,"date":"2026-07-05","time":"16:00 UTC-4","team1":"W76","team2":"W78","ground":"New York/New Jersey (East Rutherford)"},{"round":"Round of 16","num":92,"date":"2026-07-05","time":"18:00 UTC-6","team1":"W79","team2":"W80","ground":"Mexico City"},{"round":"Round of 16","num":93,"date":"2026-07-06","time":"14:00 UTC-5","team1":"W83","team2":"W84","ground":"Dallas (Arlington)"},{"round":"Round of 16","num":94,"date":"2026-07-06","time":"17:00 UTC-7","team1":"W81","team2":"W82","ground":"Seattle"},{"round":"Round of 16","num":95,"date":"2026-07-07","time":"12:00 UTC-4","team1":"W86","team2":"W88","ground":"Atlanta"},{"round":"Round of 16","num":96,"date":"2026-07-07","time":"13:00 UTC-7","team1":"W85","team2":"W87","ground":"Vancouver"},{"round":"Quarter-final","num":97,"date":"2026-07-09","time":"16:00 UTC-4","team1":"W89","team2":"W90","ground":"Boston (Foxborough)"},{"round":"Quarter-final","num":98,"date":"2026-07-10","time":"12:00 UTC-7","team1":"W93","team2":"W94","ground":"Los Angeles (Inglewood)"},{"round":"Quarter-final","num":99,"date":"2026-07-11","time":"17:00 UTC-4","team1":"W91","team2":"W92","ground":"Miami (Miami Gardens)"},{"round":"Quarter-final","num":100,"date":"2026-07-11","time":"20:00 UTC-5","team1":"W95","team2":"W96","ground":"Kansas City"},{"round":"Semi-final","num":101,"date":"2026-07-14","time":"14:00 UTC-5","team1":"W97","team2":"W98","ground":"Dallas (Arlington)"},{"round":"Semi-final","num":102,"date":"2026-07-15","time":"15:00 UTC-4","team1":"W99","team2":"W100","ground":"Atlanta"},{"round":"Match for third place","date":"2026-07-18","time":"17:00 UTC-4","team1":"L101","team2":"L102","ground":"Miami (Miami Gardens)"},{"round":"Final","date":"2026-07-19","time":"15:00 UTC-4","team1":"W101","team2":"W102","ground":"New York/New Jersey (East Rutherford)"}]};

// Extrai grupos e seleções do JSON local
const GRUPOS_JSON = (() => {
    const grupos = {};
    JOGOS_JSON_LOCAL.matches.forEach(m => {
        if (!m.group) return;
        if (!grupos[m.group]) grupos[m.group] = new Set();
        if (m.team1 && !m.team1.match(/^\d/)) grupos[m.group].add(m.team1);
        if (m.team2 && !m.team2.match(/^\d/)) grupos[m.group].add(m.team2);
    });
    // Convert Sets to sorted arrays
    const result = {};
    Object.keys(grupos).sort().forEach(g => { result[g] = [...grupos[g]].sort(); });
    return result;
})();

// ── Helpers de mapeamento ──
function getFlag(nome) { return FLAGS[nome] || '🏳️'; }
function getNomePT(nome) { return NOMES_PT[nome] || nome; }

// Gera ID único para o jogo
function gerarIdJogo(team1, team2, date) {
    const t1 = (team1 || 'A').replace(/[\s&\/]/g,'').substring(0,4).toUpperCase();
    const t2 = (team2 || 'B').replace(/[\s&\/]/g,'').substring(0,4).toUpperCase();
    const d  = (date || '').replace(/-/g,'');
    return `${t1}_${t2}_${d}`;
}

// Parser do JSON local (substitui fetchJogosExternos + parseOpenfootball)
function parseLocalJson(data) {
    const jogos = [];
    const FASES_MAP = {
        'Round of 32': 'Rodada de 32',
        'Round of 16': 'Oitavas',
        'Quarter-final': 'Quartas',
        'Semi-final': 'Semifinal',
        'Match for third place': '3º Lugar',
        'Final': 'Final',
    };

    (data.matches || []).forEach(match => {
        const dateStr  = match.date || '';
        const timeRaw  = (match.time || '').replace(/\s*UTC[+-]\d+/i, '').trim();
        const utcOff   = (match.time || '').match(/UTC([+-]\d+)/i);
        let horarioBRT = timeRaw;
        if (timeRaw && utcOff) {
            try {
                const off = parseInt(utcOff[1]);
                const [hh, mm] = timeRaw.split(':').map(Number);
                const totalMin = hh * 60 + mm - off * 60 - 3 * 60; // convert to BRT (UTC-3)
                const adjMin   = ((totalMin % (24 * 60)) + 24 * 60) % (24 * 60);
                horarioBRT     = `${String(Math.floor(adjMin / 60)).padStart(2, '0')}:${String(adjMin % 60).padStart(2, '0')}`;
            } catch { horarioBRT = timeRaw; }
        }

        const team1 = match.team1 || 'TBD';
        const team2 = match.team2 || 'TBD';
        const grupo = match.group ? match.group.replace('Group ', '') : null;

        // Determine fase
        let fasePT, faseBase;
        if (match.group) {
            fasePT   = `Fase de Grupos · Grupo ${grupo}`;
            faseBase = 'Fase de Grupos';
        } else {
            const faseEn = match.round || 'TBD';
            faseBase = FASES_MAP[faseEn] || faseEn;
            fasePT   = faseBase;
        }

        const id = gerarIdJogo(team1, team2, dateStr) + (match.num ? `_${match.num}` : '');

        jogos.push({
            id,
            mandante:      getNomePT(team1),
            mandanteFlag:  getFlag(team1),
            visitante:     getNomePT(team2),
            visitanteFlag: getFlag(team2),
            data:          dateStr,
            horario:       horarioBRT || '—',
            fase:          fasePT,
            faseBase:      faseBase,
            grupo:         grupo,
            status:        'agendado',
            golsMandante:  null,
            golsVisitante: null,
            sede:          match.ground || null,
            numJogo:       match.num || null,
        });
    });
    return jogos;
}

async function fetchJogosExternos() {
    // Usa diretamente o JSON local — não depende de fetch externo
    return parseLocalJson(JOGOS_JSON_LOCAL);
}

async function syncJogos(forcar = false) {
    const syncIcon = document.getElementById('sync-icon');
    const syncMsg  = document.getElementById('sync-msg');
    if (syncIcon) syncIcon.textContent = '⏳';
    if (syncMsg)  syncMsg.textContent  = 'Buscando dados do openfootball...';

    try {
        const jogos = await fetchJogosExternos();

        if (!jogos || jogos.length === 0) {
            if (syncIcon) syncIcon.textContent = '⚠️';
            if (syncMsg)  syncMsg.textContent  = 'Sem dados — usando cache do Firebase';
            await carregarJogos();
            return;
        }

        // Commit em lotes de 400 (limite do Firestore)
        const LOTE = 400;
        for (let i = 0; i < jogos.length; i += LOTE) {
            const batch = writeBatch(db);
            const fatia = jogos.slice(i, i + LOTE);

            for (const jogo of fatia) {
                const ref  = doc(db, JOGOS_COL, jogo.id);
                const snap = await getDoc(ref);

                if (!snap.exists()) {
                    // Jogo novo: insere completo
                    batch.set(ref, { ...jogo, sincronizadoEm: new Date().toISOString() });
                } else if (forcar) {
                    // Forçar: atualiza apenas campos externos; PRESERVA edições do admin
                    const existente = snap.data();
                    const adminEditou = existente._adminEditado === true;
                    if (!adminEditou) {
                        // Se admin não editou: atualiza placar e status do openfootball
                        batch.update(ref, {
                            status:        jogo.status,
                            golsMandante:  jogo.golsMandante,
                            golsVisitante: jogo.golsVisitante,
                            sincronizadoEm: new Date().toISOString(),
                        });
                    }
                    // Se admin editou: não toca em nada
                }
            }
            await batch.commit();
        }

        await setDoc(doc(db, CONFIG_COL, 'jogos_meta'), {
            ultimaSync: new Date().toISOString(),
            totalJogos: jogos.length,
            fonte: 'openfootball_worldcup_json',
        }, { merge: true });

        if (syncIcon) syncIcon.textContent = '✅';
        if (syncMsg)  syncMsg.textContent  =
            `${jogos.length} jogos · ${new Date().toLocaleTimeString('pt-BR')}`;

        await carregarJogos();
    } catch (err) {
        console.error('Sync erro:', err);
        if (syncIcon) syncIcon.textContent = '❌';
        if (syncMsg)  syncMsg.textContent  = 'Erro na sincronização';
    }
}

window.syncJogos = () => syncJogos(false);
window.syncJogosForcar = () => syncJogos(true);

let jogosCache = [];
let faseAtiva  = 'todos';
let multiplicadorFinal = 1;

async function carregarJogos() {
    const listaJogos = document.getElementById('lista-jogos');
    const palpitesRestantes = document.getElementById('palpites-restantes');
    if (palpitesRestantes) {
        palpitesRestantes.textContent = Math.max(0, 2 - (perfilUsuario.palpitesHoje || 0));
    }

    listaJogos.innerHTML = "<p style='text-align:center;color:rgba(255,255,255,.3);padding:40px'>Carregando...</p>";

    try {
        // Carrega multiplicador
        const cfgSnap = await getDoc(doc(db, CONFIG_COL, 'multiplicador'));
        multiplicadorFinal = (cfgSnap.exists() && cfgSnap.data().valor) || 1;

        // Carrega timestamp da última sync
        const metaSnap = await getDoc(doc(db, CONFIG_COL, 'jogos_meta'));
        const syncIcon = document.getElementById('sync-icon');
        const syncMsg  = document.getElementById('sync-msg');
        if (metaSnap.exists() && syncMsg) {
            const ts = new Date(metaSnap.data().ultimaSync);
            syncMsg.textContent = `Atualizado em ${ts.toLocaleString('pt-BR')}`;
            if (syncIcon) syncIcon.textContent = '✅';
        } else {
            // Nunca sincronizou: faz sync inicial
            await syncJogos();
            return;
        }

        // Busca jogos do Firestore
        const snap = await getDocs(collection(db, JOGOS_COL));
        jogosCache = snap.docs.map(d => ({ ...d.data(), _id: d.id }));
        jogosCache.sort((a, b) => (a.data + a.horario).localeCompare(b.data + b.horario));

        // Busca palpites do usuário
        const usuario = auth.currentUser;
        const palpitesSnap = await getDocs(
            query(collection(db, 'palpites'), where('uid', '==', usuario.uid))
        );
        const palpitesMap = {};
        palpitesSnap.forEach(d => { palpitesMap[d.data().jogoId] = d.data(); });

        renderizarJogos(jogosCache, palpitesMap);
    } catch (err) {
        console.error(err);
        listaJogos.innerHTML = "<p style='color:#e74c3c;text-align:center;padding:40px'>Erro ao carregar jogos.</p>";
    }
}

function renderizarJogos(jogos, palpitesMap) {
    const listaJogos = document.getElementById('lista-jogos');
    listaJogos.innerHTML = '';

    const filtrados = faseAtiva === 'todos' ? jogos : jogos.filter(j => {
        // Filtra por faseBase (sem o grupo) ou pela fase completa
        return j.faseBase === faseAtiva || j.fase === faseAtiva || (j.fase && j.fase.startsWith(faseAtiva));
    });

    if (filtrados.length === 0) {
        listaJogos.innerHTML = "<p style='text-align:center;color:rgba(255,255,255,.3);padding:40px'>Nenhum jogo nesta fase ainda.</p>";
        return;
    }

    filtrados.forEach(jogo => {
        const palpite = palpitesMap[jogo.id || jogo._id];
        const isFinal = jogo.faseBase === 'Final' || jogo.fase === 'Final';
        const mult = isFinal ? multiplicadorFinal : 1;

        const card = document.createElement('div');
        card.className = 'card-jogo';

        const statusLabel = { agendado: 'Agendado', em_andamento: '🔴 AO VIVO', encerrado: 'Encerrado' };
        const dataFormatada = jogo.data ? new Date(jogo.data + 'T12:00:00').toLocaleDateString('pt-BR') : '—';

        const placarHtml = jogo.status === 'agendado'
            ? `<span class="jogo-horario">${jogo.horario || ''}</span>`
            : `<span class="jogo-placar-num">${jogo.golsMandante ?? '?'} x ${jogo.golsVisitante ?? '?'}</span>`;

        const multBadge = mult > 1 ? `<span class="mult-badge">x${mult}</span>` : '';
        const sedeHtml  = jogo.sede ? `<div class="jogo-sede">📍 ${jogo.sede}</div>` : '';

        card.innerHTML = `
            <div class="jogo-fase-label">${jogo.fase || ''} · ${dataFormatada}${multBadge}</div>
            <div class="jogo-times">
                <div class="jogo-time">
                    <div class="jogo-time-flag">${jogo.mandanteFlag || '🏳️'}</div>
                    <div class="jogo-time-nome">${jogo.mandante}</div>
                </div>
                <div class="jogo-placar">
                    ${placarHtml}
                    <span class="jogo-status status-${jogo.status}">${statusLabel[jogo.status] || jogo.status}</span>
                </div>
                <div class="jogo-time">
                    <div class="jogo-time-flag">${jogo.visitanteFlag || '🏳️'}</div>
                    <div class="jogo-time-nome">${jogo.visitante}</div>
                </div>
            </div>
            ${sedeHtml}
            <div class="jogo-acoes" id="acoes-${jogo._id}"></div>
        `;

        const acoes = card.querySelector('.jogo-acoes');
        renderizarAcoesPalpite(acoes, jogo, palpite, mult);

        listaJogos.appendChild(card);
    });
}

function renderizarAcoesPalpite(container, jogo, palpite, mult) {
    container.innerHTML = '';
    const podePalpitar = !palpite && jogo.status === 'agendado' && (perfilUsuario.palpitesHoje || 0) < 2;

    if (jogo.status === 'encerrado' && palpite) {
        // Calcula resultado
        const vencedorReal = jogo.golsMandante > jogo.golsVisitante ? 'mandante'
            : jogo.golsVisitante > jogo.golsMandante ? 'visitante' : 'empate';
        const acertouVencedor = palpite.vencedor === vencedorReal;
        const acertouPlacar   = palpite.placarM === jogo.golsMandante && palpite.placarV === jogo.golsVisitante;

        const cls = acertouVencedor ? 'palpite-acerto' : 'palpite-erro';
        let txt = `Seu palpite: ${palpite.vencedor === 'mandante' ? jogo.mandante : palpite.vencedor === 'visitante' ? jogo.visitante : 'Empate'} `;
        if (palpite.placarM !== null) txt += `(${palpite.placarM}x${palpite.placarV}) `;
        txt += acertouVencedor ? '✅' : '❌';
        if (acertouPlacar) txt += ' 🎯 Placar Exato!';

        container.innerHTML = `<span class="palpite-resultado ${cls}">${txt}</span>`;
    } else if (palpite && jogo.status !== 'encerrado') {
        const vStr = palpite.vencedor === 'mandante' ? jogo.mandante
            : palpite.vencedor === 'visitante' ? jogo.visitante : 'Empate';
        container.innerHTML = `<span class="palpite-feito">✏️ Seu palpite: ${vStr}${palpite.placarM !== null ? ` (${palpite.placarM}x${palpite.placarV})` : ''}</span>`;
    } else if (podePalpitar) {
        const btn = document.createElement('button');
        btn.className = 'btn-palpitar';
        btn.textContent = '🎯 Palpitar';
        btn.onclick = () => abrirModalPalpite(jogo, mult);
        container.appendChild(btn);
    } else if (!palpite && jogo.status === 'agendado') {
        const sem = document.createElement('span');
        sem.className = 'palpite-feito';
        sem.textContent = (perfilUsuario.palpitesHoje || 0) >= 2 ? '⛔ Limite diário atingido' : '—';
        container.appendChild(sem);
    }
}

// ── Filtro de fase ──
document.querySelectorAll('.btn-fase').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-fase').forEach(b => b.classList.remove('ativo'));
        btn.classList.add('ativo');
        faseAtiva = btn.dataset.fase;
        if (jogosCache.length > 0) {
            // Re-renderiza com cache
            getDocs(query(collection(db, 'palpites'),
                where('uid', '==', auth.currentUser?.uid || '')
            )).then(snap => {
                const map = {};
                snap.forEach(d => { map[d.data().jogoId] = d.data(); });
                renderizarJogos(jogosCache, map);
            });
        }
    });
});

// ============================================================
// 18. MODAL PALPITE
// ============================================================
let jogoSelecionado = null;
let vencedorSelecionado = null;
let multSelecionado = 1;

function abrirModalPalpite(jogo, mult) {
    jogoSelecionado = jogo;
    multSelecionado = mult || 1;
    vencedorSelecionado = null;

    document.getElementById('palpite-jogo-titulo').textContent = `${jogo.mandante} x ${jogo.visitante}`;
    document.getElementById('palpite-jogo-data').textContent =
        `${new Date(jogo.data + 'T12:00:00').toLocaleDateString('pt-BR')} · ${jogo.horario}` +
        (mult > 1 ? ` · 🏆 Multiplicador x${mult}` : '');

    document.getElementById('palpite-mandante').textContent = `🏠 ${jogo.mandante}`;
    document.getElementById('palpite-visitante').textContent = `✈️ ${jogo.visitante}`;

    document.querySelectorAll('.btn-palpite').forEach(b => b.classList.remove('selecionado'));
    document.getElementById('placar-mandante').value = '';
    document.getElementById('placar-visitante').value = '';

    document.getElementById('modal-palpite').style.display = 'flex';
}

['palpite-mandante','palpite-empate','palpite-visitante'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', function() {
        document.querySelectorAll('.btn-palpite').forEach(b => b.classList.remove('selecionado'));
        this.classList.add('selecionado');
        vencedorSelecionado = id === 'palpite-mandante' ? 'mandante' : id === 'palpite-visitante' ? 'visitante' : 'empate';
    });
});

document.getElementById('btn-confirmar-palpite')?.addEventListener('click', async () => {
    if (!vencedorSelecionado) { showToast('Escolha um resultado!', 'erro'); return; }

    const usuario = auth.currentUser;
    if (!usuario) return;

    const placarM = document.getElementById('placar-mandante').value;
    const placarV = document.getElementById('placar-visitante').value;

    try {
        await addDoc(collection(db, 'palpites'), {
            uid: usuario.uid,
            jogoId: jogoSelecionado.id || jogoSelecionado._id,
            vencedor: vencedorSelecionado,
            placarM: placarM !== '' ? parseInt(placarM) : null,
            placarV: placarV !== '' ? parseInt(placarV) : null,
            mult: multSelecionado,
            criadoEm: serverTimestamp()
        });

        perfilUsuario.palpitesHoje = (perfilUsuario.palpitesHoje || 0) + 1;
        await updateDoc(doc(db, 'usuarios', usuario.uid), {
            palpitesHoje: perfilUsuario.palpitesHoje
        });

        const palpitesRestantes = document.getElementById('palpites-restantes');
        if (palpitesRestantes) palpitesRestantes.textContent = Math.max(0, 2 - perfilUsuario.palpitesHoje);

        document.getElementById('modal-palpite').style.display = 'none';
        showToast('✅ Palpite registrado!', 'sucesso');
        carregarJogos();
    } catch (err) {
        console.error(err);
        showToast('Erro ao registrar palpite.', 'erro');
    }
});

// ── Processar resultado de palpites encerrados ──
async function processarResultadosPendentes() {
    const usuario = auth.currentUser;
    if (!usuario) return;

    const snap = await getDocs(
        query(collection(db, 'palpites'), where('uid', '==', usuario.uid), where('processado', '!=', true))
    );

    for (const pDoc of snap.docs) {
        const p = pDoc.data();
        const jogoSnap = await getDoc(doc(db, JOGOS_COL, p.jogoId));
        if (!jogoSnap.exists()) continue;
        const jogo = jogoSnap.data();
        if (jogo.status !== 'encerrado') continue;

        const vencedor = jogo.golsMandante > jogo.golsVisitante ? 'mandante'
            : jogo.golsVisitante > jogo.golsMandante ? 'visitante' : 'empate';

        let recompensa = 0;
        if (p.vencedor === vencedor) {
            recompensa += 1 * (p.mult || 1);
            // Placar exato: +2 extras
            if (p.placarM === jogo.golsMandante && p.placarV === jogo.golsVisitante) {
                recompensa += 2 * (p.mult || 1);
                showToast(`🎯 Placar exato! +${2 * (p.mult || 1)} pacotes bônus!`, 'sucesso');
            } else {
                showToast(`✅ Acertou! +${1 * (p.mult || 1)} pacote!`, 'sucesso');
            }
            await processarStreak(true);
        } else {
            await processarStreak(false);
        }

        if (recompensa > 0) {
            perfilUsuario.pacotes += recompensa;
            await updateDoc(doc(db, 'usuarios', usuario.uid), { pacotes: increment(recompensa) });
            renderizarPilha(perfilUsuario.pacotes);
        }

        await updateDoc(pDoc.ref, { processado: true, recompensa });
    }
}

// ============================================================
// 19. TROCAS
// ============================================================
async function carregarTrocas() {
    const usuario = auth.currentUser;
    if (!usuario) return;

    // Exibe UID do usuário
    const uidEl = document.getElementById('meu-uid-display');
    if (uidEl) uidEl.textContent = usuario.uid;

    // Botão copiar UID
    const btnCopiar = document.getElementById('btn-copiar-uid');
    if (btnCopiar) {
        btnCopiar.onclick = async () => {
            try {
                await navigator.clipboard.writeText(usuario.uid);
                btnCopiar.classList.add('copiado');
                document.getElementById('copiar-uid-icon').textContent = '✅';
                showToast('✅ ID copiado!', 'sucesso');
                setTimeout(() => {
                    btnCopiar.classList.remove('copiado');
                    document.getElementById('copiar-uid-icon').textContent = '📋';
                }, 2000);
            } catch {
                showToast('Selecione e copie manualmente.', '');
            }
        };
    }

    // Dots de limite
    const trocasUsadas = perfilUsuario.trocasHoje || 0;
    for (let i = 1; i <= 4; i++) {
        const dot = document.getElementById(`dot-${i}`);
        if (dot) dot.classList.toggle('usado', i <= trocasUsadas);
    }
    const label = document.getElementById('trocas-restantes-label');
    if (label) label.textContent = `${4 - trocasUsadas}/4 restantes`;

    // Minhas repetidas
    const listaRep = document.getElementById('lista-repetidas');
    listaRep.innerHTML = '';
    const repetidas = Object.entries(perfilUsuario.inventario || {})
        .filter(([, qtd]) => qtd > 1)
        .map(([id, qtd]) => ({ id, qtd }));

    if (repetidas.length === 0) {
        listaRep.innerHTML = "<p style='color:rgba(255,255,255,.3);font-size:13px;text-align:center;padding:20px'>Nenhuma figurinha repetida ainda.</p>";
    } else {
        repetidas.slice(0, 50).forEach(({ id, qtd }) => {
            const carta = catalogo.find(c => c.id === id);
            if (!carta) return;

            const div = document.createElement('div');
            div.className = 'item-repetida';
            div.innerHTML = `
                <img src="${carta.imagem}" alt="${id}" loading="lazy">
                <div class="item-repetida-info">
                    <div class="item-repetida-id">${getNomeAmigavel(carta.pasta)}</div>
                    <div class="item-repetida-qtd">x${qtd} cópias</div>
                </div>
                <button class="btn-palpitar" style="font-size:11px;padding:5px 10px;">Oferecer</button>
            `;

            div.querySelector('button').onclick = () => {
                if (trocasUsadas >= 4) { showToast('Limite de trocas diárias atingido!', 'erro'); return; }
                document.getElementById('troca-oferta-nome').textContent = `${getNomeAmigavel(carta.pasta)} (${id})`;
                document.getElementById('troca-form-area').dataset.ofertaId = id;
                document.getElementById('troca-form-area').style.display = 'block';
                preencherSelectTrocas();
            };

            listaRep.appendChild(div);
        });
    }

    // Pedidos recebidos
    const listaPedidos = document.getElementById('lista-pedidos');
    listaPedidos.innerHTML = "<p style='color:rgba(255,255,255,.3);font-size:13px;text-align:center;padding:20px'>Verificando...</p>";

    try {
        const pedidosSnap = await getDocs(
            query(collection(db, 'trocas'), where('destinatario', '==', usuario.uid), where('status', '==', 'pendente'))
        );

        if (pedidosSnap.empty) {
            listaPedidos.innerHTML = "<p style='color:rgba(255,255,255,.3);font-size:13px;text-align:center;padding:20px'>Nenhum pedido recebido.</p>";
        } else {
            listaPedidos.innerHTML = '';
            pedidosSnap.forEach(d => {
                const t = d.data();
                const cartaOferta = catalogo.find(c => c.id === t.ofertaId);
                const cartaPedido = catalogo.find(c => c.id === t.pedidoId);
                const tenhoAFig   = (perfilUsuario.inventario[t.pedidoId] || 0) >= 2;

                const div = document.createElement('div');
                div.className = 'card-pedido';
                div.innerHTML = `
                    <div class="pedido-header">
                        <strong style="color:rgba(255,255,255,.8);font-size:13px">${t.nomeRemetente || 'Usuário'} quer trocar:</strong>
                    </div>
                    <div class="pedido-figs">
                        <div class="pedido-fig-bloco">
                            <div class="pedido-fig-label">Oferece</div>
                            ${cartaOferta ? `<img src="${cartaOferta.imagem}" class="pedido-fig-img" alt="${t.ofertaId}">` : ''}
                            <div class="pedido-fig-id">${t.ofertaId}</div>
                            <div class="pedido-fig-pais">${cartaOferta ? getNomeAmigavel(cartaOferta.pasta) : '?'}</div>
                        </div>
                        <div class="pedido-seta">⇄</div>
                        <div class="pedido-fig-bloco">
                            <div class="pedido-fig-label">Quer de você</div>
                            ${cartaPedido ? `<img src="${cartaPedido.imagem}" class="pedido-fig-img" alt="${t.pedidoId}">` : ''}
                            <div class="pedido-fig-id">${t.pedidoId}</div>
                            <div class="pedido-fig-pais">${cartaPedido ? getNomeAmigavel(cartaPedido.pasta) : '?'}</div>
                        </div>
                    </div>
                    ${!tenhoAFig ? `<div class="pedido-aviso-sem-fig">⚠️ Você não tem <strong>${t.pedidoId}</strong> (precisa de 2+ cópias)</div>` : ''}
                    <div class="pedido-acoes">
                        <button class="btn-aceitar" data-id="${d.id}" ${!tenhoAFig ? 'disabled title="Você não tem essa figurinha"' : ''}>✅ Aceitar</button>
                        <button class="btn-recusar" data-id="${d.id}">❌ Recusar</button>
                    </div>
                `;
                if (tenhoAFig) {
                    div.querySelector('.btn-aceitar').onclick = () => executarTroca(d.id, t);
                }
                div.querySelector('.btn-recusar').onclick = () => recusarTroca(d.id);
                listaPedidos.appendChild(div);
            });
        }
    } catch (err) {
        console.error(err);
        listaPedidos.innerHTML = "<p style='color:#e74c3c;font-size:13px;text-align:center;padding:20px'>Erro ao carregar pedidos.</p>";
    }
}

function preencherSelectTrocas() {
    // Preenche select de países
    const sel = document.getElementById('troca-pais-select');
    if (!sel) return;
    sel.innerHTML = '<option value="">— Selecione um país —</option>';
    const paisesUnicos = [...new Set(catalogo.map(c => c.pasta))].sort();
    paisesUnicos.forEach(pasta => {
        const opt = document.createElement('option');
        opt.value = pasta;
        opt.textContent = getNomeAmigavel(pasta);
        sel.appendChild(opt);
    });

    sel.onchange = () => {
        const paisSel = sel.value;
        const grid = document.getElementById('troca-grid-figurinhas');
        window._trocaFigSel = null;
        document.getElementById('troca-figurinha-selecionada').style.display = 'none';
        if (!paisSel) { grid.style.display = 'none'; grid.innerHTML = ''; return; }

        const figsDoPais = catalogo.filter(c => c.pasta === paisSel);
        grid.innerHTML = '';
        grid.style.display = 'grid';
        figsDoPais.forEach(fig => {
            const div = document.createElement('div');
            div.className = 'troca-fig-item';
            div.dataset.id = fig.id;
            div.innerHTML = `<img src="${fig.imagem}" alt="${fig.id}" loading="lazy"><div class="troca-fig-num">${fig.id.replace('fig_','#')}</div>`;
            div.onclick = () => selecionarFigurinhaTroca(fig);
            grid.appendChild(div);
        });
    };
}

function selecionarFigurinhaTroca(fig) {
    window._trocaFigSel = fig.id;
    // Highlight selecionado
    document.querySelectorAll('.troca-fig-item').forEach(el => {
        el.classList.toggle('selecionada', el.dataset.id === fig.id);
    });
    // Preview
    const preview = document.getElementById('troca-figurinha-selecionada');
    document.getElementById('troca-fig-sel-img').src = fig.imagem;
    document.getElementById('troca-fig-sel-nome').textContent = `${getNomeAmigavel(fig.pasta)} — ${fig.id}`;
    preview.style.display = 'flex';
}

window.deselecTrocaFig = () => {
    window._trocaFigSel = null;
    document.querySelectorAll('.troca-fig-item').forEach(el => el.classList.remove('selecionada'));
    document.getElementById('troca-figurinha-selecionada').style.display = 'none';
};

document.getElementById('btn-enviar-troca')?.addEventListener('click', async () => {
    const usuario = auth.currentUser;
    if (!usuario) return;

    const ofertaId   = document.getElementById('troca-form-area').dataset.ofertaId;
    const destUid    = document.getElementById('troca-uid-destino').value.trim();
    const pedidoId   = window._trocaFigSel || null;

    if (!destUid) { showToast('Informe o ID do destinatário!', 'erro'); return; }
    if (!pedidoId) { showToast('Selecione a figurinha que você quer!', 'erro'); return; }
    if (destUid === usuario.uid) { showToast('Você não pode trocar consigo mesmo!', 'erro'); return; }
    if ((perfilUsuario.trocasHoje || 0) >= 4) { showToast('Limite de trocas atingido hoje!', 'erro'); return; }
    if ((perfilUsuario.inventario[ofertaId] || 0) < 2) { showToast('Você não tem cópias suficientes!', 'erro'); return; }

    try {
        await addDoc(collection(db, 'trocas'), {
            remetente: usuario.uid,
            nomeRemetente: usuario.displayName,
            destinatario: destUid,
            ofertaId,
            pedidoId,
            status: 'pendente',
            criadoEm: serverTimestamp()
        });

        perfilUsuario.trocasHoje = (perfilUsuario.trocasHoje || 0) + 1;
        await updateDoc(doc(db, 'usuarios', usuario.uid), { trocasHoje: perfilUsuario.trocasHoje });

        window._trocaFigSel = null;
        document.getElementById('troca-form-area').style.display = 'none';
        showToast('✅ Proposta enviada!', 'sucesso');
        carregarTrocas();
    } catch (err) {
        console.error(err);
        showToast('Erro ao enviar proposta.', 'erro');
    }
});

async function executarTroca(trocaId, t) {
    const usuario = auth.currentUser;
    if (!usuario) return;

    // Busca inventário do remetente (quem fez a proposta)
    const remSnap = await getDoc(doc(db, 'usuarios', t.remetente));
    const invRem  = remSnap.exists() ? (remSnap.data().inventario || {}) : {};
    const invMeu  = perfilUsuario.inventario || {};

    // Verifica se remetente ainda tem a figurinha que oferece
    if ((invRem[t.ofertaId] || 0) < 2) {
        showToast('❌ O remetente não tem mais essa figurinha disponível.', 'erro');
        await updateDoc(doc(db, 'trocas', trocaId), { status: 'cancelada' });
        carregarTrocas();
        return;
    }

    // Verifica se EU tenho a figurinha que o remetente pediu
    if ((invMeu[t.pedidoId] || 0) < 2) {
        showToast('❌ Você não tem essa figurinha para trocar! Precisa de pelo menos 2 cópias.', 'erro');
        return; // NÃO cancela — usuário pode conseguir a fig depois
    }

    // Executa a troca
    invRem[t.ofertaId]--;
    invRem[t.pedidoId] = (invRem[t.pedidoId] || 0) + 1;
    invMeu[t.pedidoId]--;
    invMeu[t.ofertaId] = (invMeu[t.ofertaId] || 0) + 1;

    const batch = writeBatch(db);
    batch.update(doc(db, 'usuarios', t.remetente), { inventario: invRem });
    batch.update(doc(db, 'usuarios', usuario.uid), { inventario: invMeu });
    batch.update(doc(db, 'trocas', trocaId), { status: 'aceita', aceitaEm: serverTimestamp() });
    await batch.commit();

    perfilUsuario.inventario = invMeu;
    perfilUsuario.trocasHoje = (perfilUsuario.trocasHoje || 0) + 1;
    await updateDoc(doc(db, 'usuarios', usuario.uid), { trocasHoje: perfilUsuario.trocasHoje });

    showToast('🔄 Troca realizada com sucesso!', 'sucesso');
    carregarTrocas();
}

async function recusarTroca(trocaId) {
    await updateDoc(doc(db, 'trocas', trocaId), { status: 'recusada' });
    showToast('Pedido recusado.', '');
    carregarTrocas();
}

// ============================================================
// 20. TRIVIA
// ============================================================
const INICIO_COPA = new Date('2026-06-13T00:00:00');

async function carregarTrivia() {
    const container = document.getElementById('trivia-container');
    const usuario   = auth.currentUser;
    if (!usuario) return;

    const agora = new Date();
    const preinicios = agora < INICIO_COPA;

    // Dots
    const triviaUsadas = perfilUsuario.triviaHoje || 0;
    for (let i = 1; i <= 2; i++) {
        const dot = document.getElementById(`trivia-dot-${i}`);
        if (dot) dot.classList.toggle('usado', i <= triviaUsadas);
    }
    const label = document.getElementById('trivia-restantes-label');
    if (label) label.textContent = `${2 - triviaUsadas}/2 restantes`;

    if (!preinicios) {
        container.innerHTML = `
            <div class="trivia-encerrada">
                <div class="encerrada-icon">⚽</div>
                <p style="color:rgba(255,255,255,.5);font-size:15px">As perguntas estão disponíveis apenas antes do início da Copa (13/06/2026).</p>
            </div>`;
        return;
    }

    if (triviaUsadas >= 2) {
        container.innerHTML = `
            <div class="trivia-encerrada">
                <div class="encerrada-icon">✅</div>
                <p style="color:rgba(255,255,255,.5);font-size:15px">Você já respondeu as 2 perguntas de hoje!</p>
                <p style="color:rgba(255,255,255,.3);font-size:13px;margin-top:8px">Volte amanhã para novas perguntas.</p>
            </div>`;
        return;
    }

    // Busca perguntas do banco (todas disponíveis)
    try {
        const snap = await getDocs(collection(db, 'trivia'));
        const todasPerguntas = snap.docs.map(d => ({ ...d.data(), _id: d.id }));

        if (todasPerguntas.length === 0) {
            container.innerHTML = `<div class="trivia-encerrada"><div class="encerrada-icon">📝</div><p style="color:rgba(255,255,255,.4)">Nenhuma pergunta disponível ainda. O admin adicionará em breve!</p></div>`;
            return;
        }

        // Embaralha com seed baseada no UID + data, garantindo ordem diferente por usuário e por dia
        const hoje = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const seed = [...(usuario.uid + hoje)].reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const embaralhadas = [...todasPerguntas].sort((a, b) => {
            const ha = Math.sin(seed + a._id.charCodeAt(0)) * 10000;
            const hb = Math.sin(seed + b._id.charCodeAt(0)) * 10000;
            return (ha - Math.floor(ha)) - (hb - Math.floor(hb));
        });

        // Pega a próxima não respondida (cada usuário vê em ordem diferente)
        const respondidas = perfilUsuario.triviaRespondidas || [];
        const disponivel = embaralhadas.find(p => !respondidas.includes(p._id));

        if (!disponivel) {
            container.innerHTML = `<div class="trivia-encerrada"><div class="encerrada-icon">🏆</div><p style="color:rgba(255,255,255,.5);font-size:15px">Parabéns! Você respondeu todas as perguntas disponíveis.</p><p style="color:rgba(255,255,255,.3);font-size:13px;margin-top:8px">Aguarde novas perguntas!</p></div>`;
            return;
        }

        renderizarTrivia(disponivel);
    } catch (err) {
        console.error(err);
        container.innerHTML = "<p style='color:#e74c3c;text-align:center'>Erro ao carregar pergunta.</p>";
    }
}

function renderizarTrivia(pergunta) {
    const container = document.getElementById('trivia-container');
    container.innerHTML = '';

    const card = document.createElement('div');
    card.className = 'card-trivia';
    card.innerHTML = `
        <div class="trivia-pergunta">${pergunta.pergunta}</div>
        <div class="trivia-alternativas" id="trivia-alts"></div>
        <div id="trivia-resultado"></div>
    `;

    const alts = card.querySelector('#trivia-alts');
    (pergunta.alternativas || []).forEach((alt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'btn-alternativa';
        btn.textContent = alt;
        btn.onclick = () => responderTrivia(idx, pergunta, card);
        alts.appendChild(btn);
    });

    container.appendChild(card);
}

async function responderTrivia(idxEscolhido, pergunta, card) {
    const usuario = auth.currentUser;
    if (!usuario) return;

    const alts    = card.querySelectorAll('.btn-alternativa');
    const correta = pergunta.correta;
    alts.forEach((b, i) => {
        b.disabled = true;
        if (i === correta)       b.classList.add('correta');
        if (i === idxEscolhido && i !== correta) b.classList.add('errada');
    });

    const acertou = idxEscolhido === correta;
    const resultado = card.querySelector('#trivia-resultado');
    resultado.className = `trivia-resultado ${acertou ? 'acerto' : 'erro'}`;

    if (acertou) {
        resultado.textContent = '🎉 Correto! +2 pacotes!';
        perfilUsuario.pacotes = (perfilUsuario.pacotes || 0) + 2;
        await updateDoc(doc(db, 'usuarios', usuario.uid), { pacotes: increment(2) });
        renderizarPilha(perfilUsuario.pacotes);
        showToast('🎉 Acertou! +2 pacotes!', 'sucesso');
    } else {
        resultado.textContent = `❌ Errado! A resposta era: ${pergunta.alternativas[correta]}`;
    }

    perfilUsuario.triviaHoje = (perfilUsuario.triviaHoje || 0) + 1;
    if (!perfilUsuario.triviaRespondidas) perfilUsuario.triviaRespondidas = [];
    perfilUsuario.triviaRespondidas.push(pergunta._id);

    await updateDoc(doc(db, 'usuarios', usuario.uid), {
        triviaHoje: perfilUsuario.triviaHoje,
        triviaRespondidas: perfilUsuario.triviaRespondidas
    });

    // Atualiza dots
    for (let i = 1; i <= 2; i++) {
        const dot = document.getElementById(`trivia-dot-${i}`);
        if (dot) dot.classList.toggle('usado', i <= perfilUsuario.triviaHoje);
    }
    const label = document.getElementById('trivia-restantes-label');
    if (label) label.textContent = `${2 - perfilUsuario.triviaHoje}/2 restantes`;

    // Botão próxima pergunta se ainda tem
    if (perfilUsuario.triviaHoje < 2) {
        const btnProx = document.createElement('button');
        btnProx.className = 'btn-fechar';
        btnProx.textContent = 'Próxima Pergunta ▶';
        btnProx.style.marginTop = '16px';
        btnProx.style.display = 'block';
        btnProx.style.margin = '16px auto 0';
        btnProx.onclick = () => carregarTrivia();
        card.appendChild(btnProx);
    }
}

// ============================================================
// 21. ADMIN
// ============================================================
async function carregarAdmin() {
    const usuario = auth.currentUser;
    if (!usuario || !isAdmin(usuario.uid)) {
        document.getElementById('secao-admin').innerHTML =
            "<p style='text-align:center;color:#e74c3c;padding:40px'>⛔ Acesso negado.</p>";
        return;
    }

    // Última sync
    const metaSnap = await getDoc(doc(db, CONFIG_COL, 'jogos_meta'));
    const ultima = document.getElementById('admin-ultima-sync');
    if (ultima && metaSnap.exists()) {
        ultima.textContent = new Date(metaSnap.data().ultimaSync).toLocaleString('pt-BR');
    }

    // Multiplicador atual
    const multSnap = await getDoc(doc(db, CONFIG_COL, 'multiplicador'));
    if (multSnap.exists()) {
        const sel = document.getElementById('admin-mult-select');
        if (sel) sel.value = String(multSnap.data().valor || 1);
    }
}

window.adminSyncJogos = async () => {
    showToast('Sincronizando com JSON local...', '');
    await syncJogos(false);
    showToast('✅ Sync concluída!', 'sucesso');
    carregarAdmin();
};

window.adminSetMultiplicador = async () => {
    const val = parseInt(document.getElementById('admin-mult-select').value);
    await setDoc(doc(db, CONFIG_COL, 'multiplicador'), { valor: val }, { merge: true });
    showToast(`✅ Multiplicador definido: x${val}`, 'sucesso');
};

window.adminCorrigirJogo = async () => {
    const id     = document.getElementById('admin-jogo-id').value.trim();
    const golsM  = parseInt(document.getElementById('admin-gols-mandante').value);
    const golsV  = parseInt(document.getElementById('admin-gols-visitante').value);
    const status = document.getElementById('admin-status-jogo').value;
    const mandante  = document.getElementById('admin-mandante-nome').value.trim();
    const visitante = document.getElementById('admin-visitante-nome').value.trim();
    const horario   = document.getElementById('admin-horario').value.trim();
    const fase      = document.getElementById('admin-fase-nome').value.trim();
    const sede      = document.getElementById('admin-sede').value.trim();

    if (!id) { showToast('Informe o ID do jogo!', 'erro'); return; }

    const payload = {
        golsMandante:  isNaN(golsM) ? null : golsM,
        golsVisitante: isNaN(golsV) ? null : golsV,
        status,
        _adminEditado: true,
        _adminEditadoEm: new Date().toISOString(),
    };
    if (mandante)  payload.mandante  = mandante;
    if (visitante) payload.visitante = visitante;
    if (horario)   payload.horario   = horario;
    if (fase)      payload.fase      = fase;
    if (sede)      payload.sede      = sede;

    await setDoc(doc(db, JOGOS_COL, id), payload, { merge: true });
    showToast('✅ Jogo atualizado!', 'sucesso');

    // Processa recompensas pendentes
    if (status === 'encerrado') await processarResultadosPendentes();
};

// Abre o modal de edição rápida de um jogo direto da lista
window.adminEditarJogoRapido = async (jogoId) => {
    const snap = await getDoc(doc(db, JOGOS_COL, jogoId));
    if (!snap.exists()) { showToast('Jogo não encontrado!', 'erro'); return; }
    const j = snap.data();

    document.getElementById('admin-jogo-id').value         = jogoId;
    document.getElementById('admin-mandante-nome').value   = j.mandante  || '';
    document.getElementById('admin-visitante-nome').value  = j.visitante || '';
    document.getElementById('admin-gols-mandante').value   = j.golsMandante  ?? '';
    document.getElementById('admin-gols-visitante').value  = j.golsVisitante ?? '';
    document.getElementById('admin-status-jogo').value     = j.status    || 'agendado';
    document.getElementById('admin-horario').value         = j.horario   || '';
    document.getElementById('admin-fase-nome').value       = j.fase      || '';
    document.getElementById('admin-sede').value            = j.sede      || '';

    // Rola até o card de correção
    const card = document.querySelector('[data-card="corrigir"]');
    if (card) card.scrollIntoView({ behavior:'smooth', block:'center' });
    document.getElementById('admin-jogo-id').focus();
    showToast(`✏️ Editando: ${j.mandante} x ${j.visitante}`, '');
};

window.adminListarJogos = async () => {
    const div = document.getElementById('admin-jogos-lista');
    div.innerHTML = '<p style="color:rgba(255,255,255,.4);font-size:12px">Carregando...</p>';
    const snap = await getDocs(collection(db, JOGOS_COL));
    const jogos = snap.docs.map(d => ({ ...d.data(), _id: d.id }));
    jogos.sort((a,b) => (a.data+a.horario).localeCompare(b.data+b.horario));

    if (jogos.length === 0) {
        div.innerHTML = '<p style="color:rgba(255,255,255,.3);font-size:12px">Nenhum jogo cadastrado.</p>';
        return;
    }

    div.innerHTML = jogos.map(j => {
        const placar = j.status === 'agendado'
            ? `<em style="color:rgba(255,255,255,.3)">${j.horario || '—'}</em>`
            : `<strong style="color:#d4af37">${j.golsMandante ?? '?'} x ${j.golsVisitante ?? '?'}</strong>`;
        const adminTag = j._adminEditado ? ' <span style="color:#f0c040;font-size:10px">✏️ editado</span>' : '';
        return `
            <div style="display:flex;align-items:center;gap:8px;font-size:11px;color:rgba(255,255,255,.6);padding:5px 0;border-bottom:1px solid rgba(255,255,255,.06)">
                <span style="flex:1">${j.mandanteFlag||''}${j.mandante} x ${j.visitanteFlag||''}${j.visitante}</span>
                <span>${placar}</span>
                <span style="color:rgba(255,255,255,.35)">${j.data||''}</span>
                ${adminTag}
                <button onclick="window.adminEditarJogoRapido('${j._id}')" style="background:rgba(212,175,55,.15);border:1px solid rgba(212,175,55,.3);color:#d4af37;border-radius:5px;padding:3px 8px;cursor:pointer;font-size:10px">✏️</button>
            </div>`;
    }).join('');
};

window.adminSalvarTrivia = async () => {
    const json = document.getElementById('admin-trivia-json').value.trim();
    const statusEl = document.getElementById('admin-trivia-status');
    if (!json) { statusEl.textContent = '⚠️ Cole o JSON antes de salvar.'; statusEl.style.color = '#f0c040'; return; }
    try {
        const perguntas = JSON.parse(json);
        if (!Array.isArray(perguntas)) throw new Error('Deve ser um array JSON');
        statusEl.textContent = `⏳ Importando 0 / ${perguntas.length}...`;
        statusEl.style.color = '#f0c040';

        // Verifica duplicatas: busca perguntas já existentes
        const existSnap = await getDocs(collection(db, 'trivia'));
        const textoExistentes = new Set(existSnap.docs.map(d => d.data().pergunta?.trim().toLowerCase()));

        let adicionadas = 0, duplicatas = 0;
        for (let i = 0; i < perguntas.length; i++) {
            const p = perguntas[i];
            if (!p.pergunta || !Array.isArray(p.alternativas) || p.correta == null) continue;
            const chave = p.pergunta.trim().toLowerCase();
            if (textoExistentes.has(chave)) { duplicatas++; continue; }
            await addDoc(collection(db, 'trivia'), {
                pergunta: p.pergunta,
                alternativas: p.alternativas,
                correta: Number(p.correta),
                criadoEm: serverTimestamp()
            });
            adicionadas++;
            textoExistentes.add(chave);
            statusEl.textContent = `⏳ Importando ${adicionadas} / ${perguntas.length - duplicatas}...`;
        }
        statusEl.textContent = `✅ ${adicionadas} pergunta(s) adicionada(s)${duplicatas > 0 ? ` · ${duplicatas} duplicata(s) ignorada(s)` : ''}!`;
        statusEl.style.color = '#00e676';
        document.getElementById('admin-trivia-json').value = '';
    } catch (err) {
        statusEl.textContent = '❌ Erro: ' + err.message;
        statusEl.style.color = '#e74c3c';
    }
};

window.adminDarPacotes = async () => {
    const uid = document.getElementById('admin-uid-alvo').value.trim();
    const qtd = parseInt(document.getElementById('admin-qtd-pacotes').value);
    if (!uid || isNaN(qtd) || qtd <= 0) { showToast('Preencha UID e quantidade!', 'erro'); return; }

    await updateDoc(doc(db, 'usuarios', uid), { pacotes: increment(qtd) });
    showToast(`✅ +${qtd} pacotes dados ao usuário!`, 'sucesso');
};

// ============================================================
// ADMIN — BRACKET (Quartas / Semi / Final)
// ============================================================
const BRACKET_FASES = ['Quarter-final','Semi-final','Final','Match for third place'];
const BRACKET_FASES_PT = {'Quarter-final':'Quartas de Final','Semi-final':'Semifinal','Final':'Final','Match for third place':'3º Lugar'};

window.adminCarregarBracket = async () => {
    const div = document.getElementById('admin-bracket-lista');
    div.innerHTML = '<p style="color:rgba(255,255,255,.4);font-size:12px">Carregando...</p>';

    // Pega jogos do bracket do JSON local
    const bracketJogos = JOGOS_JSON_LOCAL.matches.filter(m => BRACKET_FASES.includes(m.round));

    if (bracketJogos.length === 0) {
        div.innerHTML = '<p style="color:rgba(255,255,255,.3);font-size:12px">Nenhum jogo eliminatório encontrado.</p>';
        return;
    }

    div.innerHTML = '';
    let fasAtual = '';
    bracketJogos.forEach(m => {
        const fase = BRACKET_FASES_PT[m.round] || m.round;
        if (fase !== fasAtual) {
            fasAtual = fase;
            const h = document.createElement('div');
            h.style.cssText = 'color:#d4af37;font-size:11px;font-weight:700;margin:10px 0 4px;text-transform:uppercase;letter-spacing:.05em;';
            h.textContent = fase;
            div.appendChild(h);
        }

        const jogoId = gerarIdJogo(m.team1, m.team2, m.date) + (m.num ? `_${m.num}` : '');
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:8px;font-size:11px;color:rgba(255,255,255,.65);padding:4px 0;border-bottom:1px solid rgba(255,255,255,.05);';
        row.innerHTML = `
            <span style="flex:1">${m.team1} x ${m.team2}</span>
            <span style="color:rgba(255,255,255,.3)">${m.date || ''}</span>
            <button data-id="${jogoId}" data-t1="${m.team1}" data-t2="${m.team2}" data-fase="${m.round}" data-data="${m.date}"
                style="background:rgba(212,175,55,.15);border:1px solid rgba(212,175,55,.3);color:#d4af37;border-radius:5px;padding:3px 8px;cursor:pointer;font-size:10px">
                ✏️ Editar
            </button>`;
        row.querySelector('button').onclick = (e) => {
            const btn = e.currentTarget;
            abrirModalBracket(btn.dataset.id, btn.dataset.t1, btn.dataset.t2, btn.dataset.fase, btn.dataset.data);
        };
        div.appendChild(row);
    });
};

async function abrirModalBracket(jogoId, t1, t2, fase, data) {
    // Tenta carregar dados existentes do Firestore
    let mandante = t1, visitante = t2, golsM = '', golsV = '', horario = '', status = 'agendado';
    try {
        const snap = await getDoc(doc(db, JOGOS_COL, jogoId));
        if (snap.exists()) {
            const d = snap.data();
            mandante  = d.mandante  || t1;
            visitante = d.visitante || t2;
            golsM     = d.golsMandante  ?? '';
            golsV     = d.golsVisitante ?? '';
            horario   = d.horario   || '';
            status    = d.status    || 'agendado';
        }
    } catch {}

    document.getElementById('bracket-titulo').textContent = BRACKET_FASES_PT[fase] || fase;
    document.getElementById('bracket-sub').textContent    = `Jogo: ${t1} x ${t2} · ${data || ''}`;
    document.getElementById('bracket-jogo-id').value = jogoId;
    document.getElementById('bracket-m').value        = mandante;
    document.getElementById('bracket-v').value        = visitante;
    document.getElementById('bracket-gm').value       = golsM;
    document.getElementById('bracket-gv').value       = golsV;
    document.getElementById('bracket-horario').value  = horario;
    document.getElementById('bracket-status').value   = status;

    document.getElementById('modal-bracket').style.display = 'flex';
}

window.salvarBracketJogo = async () => {
    const jogoId   = document.getElementById('bracket-jogo-id').value;
    const mandante = document.getElementById('bracket-m').value.trim();
    const visitante= document.getElementById('bracket-v').value.trim();
    const golsM    = document.getElementById('bracket-gm').value;
    const golsV    = document.getElementById('bracket-gv').value;
    const horario  = document.getElementById('bracket-horario').value.trim();
    const status   = document.getElementById('bracket-status').value;

    if (!jogoId || !mandante || !visitante) { showToast('Preencha os times!', 'erro'); return; }

    const payload = {
        id:            jogoId,
        mandante,
        mandanteFlag:  getFlag(mandante) || '🏳️',
        visitante,
        visitanteFlag: getFlag(visitante) || '🏳️',
        status,
        horario:       horario || '—',
        _adminEditado: true,
        _adminEditadoEm: new Date().toISOString(),
    };
    if (golsM !== '') payload.golsMandante  = parseInt(golsM);
    if (golsV !== '') payload.golsVisitante = parseInt(golsV);

    await setDoc(doc(db, JOGOS_COL, jogoId), payload, { merge: true });
    document.getElementById('modal-bracket').style.display = 'none';
    showToast('✅ Jogo eliminatório salvo!', 'sucesso');
    if (status === 'encerrado') await processarResultadosPendentes();
};
