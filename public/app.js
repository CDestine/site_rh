// ===== i18n =====
const L = LANGS[getLang()]; // défini dans lang.js

// ===== Sélecteurs communs =====
const $ = (s) => document.querySelector(s);

// Récup token depuis l'URL
const url = new URL(location.href);
const token = (url.searchParams.get("token") || "").trim();

// Références DOM (voir test.html)
const idTok      = $("#idToken");
const qTitle     = $("#qTitle");
const textArea   = $("#textAnswer");
const chars      = $("#chars");
const recBtn     = $("#recBtn");
const stopBtn    = $("#stopBtn");
const aStatus    = $("#aStatus");
const player     = $("#player");
const prevBtn    = $("#prevBtn");
const nextBtn    = $("#nextBtn");
const stepLabel  = $("#stepLabel");
const progressBar= $("#progressBar");
const statusEl   = $("#status");
const timerEl    = $("#timer");
const audioLabel = $("#audioLabel");

// ===== Paramètres =====
const QUESTIONS = L.questions;
const N = QUESTIONS.length;
const MAX_CHARS = 600;   // <<< limite max
const MIN_CHARS = 20;    // <<< limite min conseillée (mettre 0 pour désactiver)

// ===== Init textes statiques (langue) =====
document.title = `${L.step_prefix} 1 / ${N}`;
$("header span.font-semibold").textContent = L.brand;
$("#lnkConf").textContent = L.conf;
$("footer a").textContent = L.footer;
audioLabel.textContent = L.audio_label;
recBtn.textContent = L.record;
stopBtn.textContent = L.stop;
prevBtn.textContent = L.prev;

// Afficher ID candidat
if (idTok) idTok.textContent = L.id_shown(token);

// Fond dégradé (si jamais pas déjà fait par la page)
document.body.classList.add("bg-gradient-to-br", "from-slate-50", "to-indigo-50");

// ===== Etat =====
let i = 0; // index question courante
const textAnswers = Array(N).fill("");
const audioBlobs  = Array(N).fill(null);

// ===== Timer global =====
const t0 = Date.now();
setInterval(() => {
  const s = Math.floor((Date.now() - t0) / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  timerEl.textContent = `${L.time_prefix} ${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}, 1000);

// ===== Helpers =====
function plural(n, s, p) { return n > 1 ? p : s; }
function countStr(n) { return `${n} ${plural(n, "caractère", "caractères")}`; }

// ===== Chargement d'une question =====
textArea.setAttribute("maxlength", MAX_CHARS);

function loadQuestion(idx) {
  qTitle.textContent = `${L.step_prefix} ${idx + 1}. ${QUESTIONS[idx]}`;
  textArea.value = textAnswers[idx] || "";
  const n = textArea.value.length;
  chars.textContent = `${countStr(n)} / ${MAX_CHARS}${MIN_CHARS ? ` (min ${MIN_CHARS})` : ""}`;

  // Audio
  player.classList.add("hidden");
  if (audioBlobs[idx]) {
    player.src = URL.createObjectURL(audioBlobs[idx]);
    player.classList.remove("hidden");
    aStatus.textContent = "Audio enregistré ✔";
  } else {
    player.removeAttribute("src");
    aStatus.textContent = "Aucun audio";
  }

  // Boutons / barre
  prevBtn.disabled = (idx === 0);
  nextBtn.textContent = (idx === N - 1) ? L.submit : L.next;
  stepLabel.textContent = `${L.step_prefix} ${idx + 1} / ${N}`;
  progressBar.style.width = `${((idx + 1) / N) * 100}%`;

  // Titre du document
  document.title = `${L.step_prefix} ${idx + 1} / ${N}`;
}

// Premier affichage
loadQuestion(i);

// ===== Écouteurs =====
// Saisie texte + compteur
textArea.addEventListener("input", () => {
  textAnswers[i] = textArea.value;
  const n = textArea.value.length;
  chars.textContent = `${countStr(n)} / ${MAX_CHARS}${MIN_CHARS ? ` (min ${MIN_CHARS})` : ""}`;
});

// Navigation
prevBtn.addEventListener("click", () => {
  if (i > 0) { i--; loadQuestion(i); }
});

nextBtn.addEventListener("click", async () => {
  // Vérifie minimum de caractères (optionnel)
  if (MIN_CHARS && textArea.value.length < MIN_CHARS) {
    alert(`Merci d'écrire au moins ${MIN_CHARS} caractères.`);
    return;
  }

  // Encore des questions → on avance
  if (i < N - 1) {
    i++;
    loadQuestion(i);
    return;
  }

  // Soumission finale
  statusEl.textContent = L.sending;
  try {
    const fd = new FormData();
    fd.append("token", token);
    fd.append("answers", JSON.stringify(textAnswers));
    audioBlobs.forEach((b, k) => { if (b) fd.append(`audio${k}`, b, `q${k + 1}.webm`); });

    const res = await fetch("/api/submit", { method: "POST", body: fd });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "Server error");

    statusEl.textContent = L.sent;
    nextBtn.disabled = true;
    prevBtn.disabled = true;
    recBtn.disabled = true;
    stopBtn.disabled = true;
    textArea.disabled = true;
  } catch (e) {
    statusEl.textContent = `${L.send_fail} ${e.message}`;
  }
});

// ===== Enregistrement audio =====
let stream = null, mr = null, chunks = [];

async function ensureStream() {
  if (!stream) {
    // Demande micro
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  }
  return stream;
}

recBtn.addEventListener("click", async () => {
  await ensureStream();
  if (mr && mr.state !== "inactive") mr.stop();

  chunks = [];
  mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
  mr.ondataavailable = (e) => chunks.push(e.data);
  mr.onstop = () => {
    const blob = new Blob(chunks, { type: "audio/webm" });
    audioBlobs[i] = blob;
    player.src = URL.createObjectURL(blob);
    player.classList.remove("hidden");
    aStatus.textContent = "Audio enregistré ✔";
  };

  mr.start();
  recBtn.disabled = true;
  stopBtn.disabled = false;
  aStatus.textContent = "Enregistrement en cours…";
});

stopBtn.addEventListener("click", () => {
  if (mr && mr.state !== "inactive") mr.stop();
  recBtn.disabled = false;
  stopBtn.disabled = true;
  aStatus.textContent = "Traitement de l’audio…";
});
