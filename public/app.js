// Questions (modifie librement)
const QUESTIONS = [
  "Présentez-vous en quelques lignes.",
  "Pourquoi souhaitez-vous ce poste ?",
  "Décrivez une situation où vous avez résolu un problème complexe.",
  "Comment gérez-vous la pression et les délais ?",
  "Parlez d’un échec et de ce que vous avez appris.",
  "Quelles compétences clés apportez-vous à l’équipe ?",
  "Expliquez un projet dont vous êtes fier/fière.",
  "Comment vous organisez-vous au quotidien ?",
  "Qu’attendez-vous de votre manager ?",
  "Votre disponibilité et vos prétentions ?"
];

const url = new URL(location.href);
const token = (url.searchParams.get("token") || "").trim();
document.getElementById("idToken").textContent = token ? `ID: ${token}` : "ID non fourni";

const qTitle = document.getElementById("qTitle");
const textArea = document.getElementById("textAnswer");
const chars = document.getElementById("chars");
const recBtn = document.getElementById("recBtn");
const stopBtn = document.getElementById("stopBtn");
const aStatus = document.getElementById("aStatus");
const player = document.getElementById("player");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const stepLabel = document.getElementById("stepLabel");
const progressBar = document.getElementById("progressBar");
const statusEl = document.getElementById("status");
const timerEl = document.getElementById("timer");

// État
let i = 0;
const textAnswers = Array(QUESTIONS.length).fill("");
const audioBlobs  = Array(QUESTIONS.length).fill(null);

// Timer total
const t0 = Date.now();
setInterval(() => {
  const s = Math.floor((Date.now() - t0)/1000);
  const m = Math.floor(s/60);
  const r = s % 60;
  timerEl.textContent = `Temps écoulé ${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')}`;
}, 1000);

// UI
function loadQuestion(idx){
  qTitle.textContent = `Q${idx+1}. ${QUESTIONS[idx]}`;
  textArea.value = textAnswers[idx] || "";
  chars.textContent = `${textArea.value.length} caractère${textArea.value.length>1?'s':''}`;
  player.classList.add("hidden");
  if (audioBlobs[idx]) {
    player.src = URL.createObjectURL(audioBlobs[idx]);
    player.classList.remove("hidden");
    aStatus.textContent = "Audio enregistré ✔";
  } else {
    player.removeAttribute("src");
    aStatus.textContent = "Aucun audio";
  }
  prevBtn.disabled = (idx === 0);
  nextBtn.textContent = (idx === QUESTIONS.length-1) ? "Soumettre ✅" : "Suivant →";
  stepLabel.textContent = `Question ${idx+1} / ${QUESTIONS.length}`;
  progressBar.style.width = `${((idx+1)/QUESTIONS.length)*100}%`;
}
loadQuestion(i);

textArea.addEventListener("input", () => {
  textAnswers[i] = textArea.value;
  chars.textContent = `${textArea.value.length} caractère${textArea.value.length>1?'s':''}`;
});

prevBtn.addEventListener("click", () => { if (i>0){ i--; loadQuestion(i);} });

nextBtn.addEventListener("click", async () => {
  if (i < QUESTIONS.length-1){ i++; loadQuestion(i); return; }
  // Soumission finale
  statusEl.textContent = "Envoi en cours…";
  try {
    const fd = new FormData();
    fd.append("token", token);
    fd.append("answers", JSON.stringify(textAnswers));
    audioBlobs.forEach((b, k) => { if (b) fd.append(`audio${k}`, b, `q${k+1}.webm`); });
    const res = await fetch("/api/submit", { method: "POST", body: fd });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "Erreur serveur");
    statusEl.textContent = "✅ Réponses envoyées. Merci !";
    nextBtn.disabled = true; prevBtn.disabled = true; recBtn.disabled = true; stopBtn.disabled = true; textArea.disabled = true;
  } catch (e) {
    statusEl.textContent = "❌ Échec de l’envoi : " + e.message;
  }
});

// Audio
let stream=null, mr=null, chunks=[];
async function ensureStream(){ if(!stream) stream = await navigator.mediaDevices.getUserMedia({audio:true}); return stream; }

recBtn.addEventListener("click", async ()=>{
  await ensureStream();
  if (mr && mr.state !== "inactive") mr.stop();
  chunks = [];
  mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
  mr.ondataavailable = e => chunks.push(e.data);
  mr.onstop = ()=>{
    const blob = new Blob(chunks, { type: "audio/webm" });
    audioBlobs[i] = blob;
    player.src = URL.createObjectURL(blob);
    player.classList.remove("hidden");
    aStatus.textContent = "Audio enregistré ✔";
  };
  mr.start();
  recBtn.disabled = true; stopBtn.disabled = false;
  aStatus.textContent = "Enregistrement en cours…";
});

stopBtn.addEventListener("click", ()=>{
  if (mr && mr.state !== "inactive") mr.stop();
  recBtn.disabled = false; stopBtn.disabled = true;
  aStatus.textContent = "Traitement de l’audio…";
});
