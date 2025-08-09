// i18n
const L = LANGS[getLang()];
const $ = s => document.querySelector(s);

const url = new URL(location.href);
const token = (url.searchParams.get("token") || "").trim();

const idTok = $("#idToken"), qTitle = $("#qTitle"), textArea = $("#textAnswer"),
      chars = $("#chars"), recBtn = $("#recBtn"), stopBtn = $("#stopBtn"),
      aStatus = $("#aStatus"), player = $("#player"), prevBtn = $("#prevBtn"),
      nextBtn = $("#nextBtn"), stepLabel = $("#stepLabel"), progressBar = $("#progressBar"),
      statusEl = $("#status"), timerEl = $("#timer"), audioLabel = $("#audioLabel");

document.title = `${L.step_prefix} 1 / ${L.questions.length}`;
$("#lnkConf") && ($("#lnkConf").textContent = L.conf);
$("footer a") && (document.querySelector("footer a").textContent = L.footer);
audioLabel.textContent = L.audio_label;
recBtn.textContent = L.record; stopBtn.textContent = L.stop; prevBtn.textContent = L.prev;

if (idTok) idTok.textContent = L.id_shown(token);

// limites
const QUESTIONS = L.questions;
const N = QUESTIONS.length;
const MAX_CHARS = 600, MIN_CHARS = 20;

let i = 0;
const textAnswers = Array(N).fill("");
const audioBlobs  = Array(N).fill(null);

// timer
const t0 = Date.now();
setInterval(()=> {
  const s = Math.floor((Date.now()-t0)/1000), m = Math.floor(s/60), r = s%60;
  timerEl.textContent = `${L.time_prefix} ${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')}`;
}, 1000);

textArea.setAttribute("maxlength", MAX_CHARS);
const countStr = n => `${n} caractère${n>1?'s':''}`;

function loadQuestion(idx){
  qTitle.textContent = `${L.step_prefix} ${idx+1}. ${QUESTIONS[idx]}`;
  textArea.value = textAnswers[idx] || "";
  const n = textArea.value.length;
  chars.textContent = `${countStr(n)} / ${MAX_CHARS}${MIN_CHARS?` (min ${MIN_CHARS})`:''}`;

  player.style.display = "none";
  if (audioBlobs[idx]) { player.src = URL.createObjectURL(audioBlobs[idx]); player.style.display="block"; aStatus.textContent = "Audio enregistré ✔"; }
  else { player.removeAttribute("src"); aStatus.textContent = "Aucun audio"; }

  prevBtn.disabled = (idx===0);
  nextBtn.textContent = (idx===N-1) ? L.submit : L.next;
  stepLabel.textContent = `${L.step_prefix} ${idx+1} / ${N}`;
  progressBar.style.width = `${((idx+1)/N)*100}%`;
  document.title = `${L.step_prefix} ${idx+1} / ${N}`;
}
loadQuestion(i);

textArea.addEventListener("input", ()=>{
  textAnswers[i] = textArea.value;
  const n = textArea.value.length;
  chars.textContent = `${countStr(n)} / ${MAX_CHARS}${MIN_CHARS?` (min ${MIN_CHARS})`:''}`;
});

prevBtn.addEventListener("click", ()=>{ if(i>0){ i--; loadQuestion(i);} });

nextBtn.addEventListener("click", async ()=>{
  if (MIN_CHARS && textArea.value.length < MIN_CHARS) { alert(`Merci d'écrire au moins ${MIN_CHARS} caractères.`); return; }
  if (i < N-1) { i++; loadQuestion(i); return; }

  statusEl.textContent = L.sending;
  try {
    const fd = new FormData();
    fd.append("token", token);
    fd.append("answers", JSON.stringify(textAnswers));
    audioBlobs.forEach((b,k)=>{ if(b) fd.append(`audio${k}`, b, `q${k+1}.webm`); });
    const res = await fetch("/api/submit", { method:"POST", body: fd });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error||"Server error");
    statusEl.textContent = L.sent;
    [nextBtn,prevBtn,recBtn,stopBtn,textArea].forEach(el=>el.disabled = true);
  } catch(e){ statusEl.textContent = `${L.send_fail} ${e.message}`; }
});

// audio
let stream=null, mr=null, chunks=[];
async function ensureStream(){ if(!stream) stream = await navigator.mediaDevices.getUserMedia({audio:true}); }

recBtn.addEventListener("click", async ()=>{
  await ensureStream();
  if (mr && mr.state!=="inactive") mr.stop();
  chunks=[]; mr=new MediaRecorder(stream,{mimeType:"audio/webm"});
  mr.ondataavailable = e => chunks.push(e.data);
  mr.onstop = ()=>{ const blob=new Blob(chunks,{type:"audio/webm"}); audioBlobs[i]=blob; player.src=URL.createObjectURL(blob); player.style.display="block"; aStatus.textContent="Audio enregistré ✔"; };
  mr.start(); recBtn.disabled=true; stopBtn.disabled=false; aStatus.textContent="Enregistrement en cours…";
});

stopBtn.addEventListener("click", ()=>{
  if (mr && mr.state!=="inactive") mr.stop();
  recBtn.disabled=false; stopBtn.disabled=true; aStatus.textContent="Traitement de l’audio…";
});
