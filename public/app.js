// 10 questions (modifie-les au besoin)
const QUESTIONS = [
  "Présentez-vous en quelques lignes.",
  "Pourquoi souhaitez-vous ce poste ?",
  "Citez une situation où vous avez résolu un problème complexe.",
  "Comment gérez-vous la pression et les délais ?",
  "Parlez d’un échec et de ce que vous avez appris.",
  "Quelles compétences clés apportez-vous à l’équipe ?",
  "Expliquez un projet dont vous êtes fier/fière.",
  "Comment vous organisez-vous au quotidien ?",
  "Qu’attendez-vous de votre manager ?",
  "Votre disponibilité et vos prétentions ?"
];

const url = new URL(window.location.href);
const token = (url.searchParams.get("token") || "").trim();

const meta = document.getElementById("meta");
meta.innerHTML = `<div class="badge">Identifiant: <b>${token || "(non fourni)"}<\/b></div>`;

const wrap = document.getElementById("qwrap");

// État
const textAnswers = Array(QUESTIONS.length).fill("");
const audioBlobs = Array(QUESTIONS.length).fill(null);

// Créer questions
QUESTIONS.forEach((q, idx) => {
  const div = document.createElement("div");
  div.className = "q";
  div.innerHTML = `
    <h3>Q${idx + 1}. ${q}</h3>
    <label>Réponse écrite</label>
    <textarea data-idx="${idx}" placeholder="Votre réponse ici..."></textarea>
    <div class="row">
      <button class="rec" data-idx="${idx}">🎙️ Enregistrer</button>
      <button class="stop" data-idx="${idx}" disabled>⏹ Arrêter</button>
      <span class="audio-status" id="astatus-${idx}">Aucun audio</span>
    </div>
    <audio id="ap-${idx}" controls style="display:none;"></audio>
  `;
  wrap.appendChild(div);
});

// Texte
wrap.addEventListener("input", (e) => {
  if (e.target.tagName === "TEXTAREA") {
    const i = parseInt(e.target.getAttribute("data-idx"));
    textAnswers[i] = e.target.value;
  }
});

// Audio avec MediaRecorder
let stream = null, mediaRecorder = null, currentIdx = null, chunks = [];

async function ensureStream() {
  if (!stream) stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  return stream;
}

wrap.addEventListener("click", async (e) => {
  if (e.target.classList.contains("rec")) {
    const idx = parseInt(e.target.getAttribute("data-idx"));
    await ensureStream();
    if (mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop();

    currentIdx = idx;
    chunks = [];
    mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
    mediaRecorder.ondataavailable = ev => chunks.push(ev.data);
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      audioBlobs[currentIdx] = blob;
      const audioEl = document.getElementById("ap-" + currentIdx);
      audioEl.src = URL.createObjectURL(blob);
      audioEl.style.display = "block";
      document.getElementById("astatus-" + currentIdx).textContent = "Audio enregistré ✔";
    };
    mediaRecorder.start();
    e.target.disabled = true;
    e.target.nextElementSibling.disabled = false;
    document.getElementById("astatus-" + idx).textContent = "Enregistrement en cours...";
  }
  if (e.target.classList.contains("stop")) {
    const idx = parseInt(e.target.getAttribute("data-idx"));
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      e.target.disabled = true;
      e.target.previousElementSibling.disabled = false;
      document.getElementById("astatus-" + idx).textContent = "Traitement de l'audio...";
    }
  }
});

// Soumission
document.getElementById("submitBtn").addEventListener("click", async () => {
  const status = document.getElementById("status");
  status.textContent = "Envoi en cours...";

  try {
    const fd = new FormData();
    fd.append("token", token);
    fd.append("answers", JSON.stringify(textAnswers));

    audioBlobs.forEach((blob, i) => {
      if (blob) fd.append(`audio${i}`, blob, `q${i+1}.webm`);
    });

    const res = await fetch("/api/submit", { method: "POST", body: fd });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "Erreur serveur");
    status.textContent = "✅ Réponses envoyées. Merci !";
  } catch (err) {
    console.error(err);
    status.textContent = "❌ Échec de l’envoi : " + err.message;
  }
});
