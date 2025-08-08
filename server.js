// server.js
import express from "express";
import path from "path";
import multer from "multer";
import fs from "fs";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app  = express();
const PORT = process.env.PORT || 3000;

// --------------------------------------------------------
// Dossiers et persistance
// --------------------------------------------------------
// Sur Render, ajoutez un Disk monté sur /data puis réglez :
//   DATA_DIR=/data
//   UPLOAD_AUDIO_DIR=/data/audio
const DATA_DIR          = process.env.DATA_DIR || path.join(__dirname, "data");
const UPLOAD_AUDIO_DIR  = process.env.UPLOAD_AUDIO_DIR || path.join(__dirname, "uploads", "audio");

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_AUDIO_DIR, { recursive: true });

const DATA_FILE = path.join(DATA_DIR, "responses.json");
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, "[]", "utf-8");
}

// --------------------------------------------------------
// Middlewares
// --------------------------------------------------------
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Sert le site statique (public/) et les audios
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads/audio", express.static(UPLOAD_AUDIO_DIR));

// Upload audio (fichiers nommés audio0..audio9)
const upload = multer({ dest: UPLOAD_AUDIO_DIR });

// --------------------------------------------------------
// Basic Auth pour /admin
// --------------------------------------------------------
function basicAuth(req, res, next) {
  const user = process.env.ADMIN_USER || "admin";
  const pass = process.env.ADMIN_PASS || "changeme";

  const hdr = req.headers.authorization || "";
  const b64 = hdr.split(" ")[1] || "";
  const [login, pwd] = Buffer.from(b64, "base64").toString().split(":");

  if (login === user && pwd === pass) return next();

  res.set("WWW-Authenticate", 'Basic realm="Restricted"');
  res.status(401).send("Authentication required.");
}

// --------------------------------------------------------
// Utils lecture/écriture JSON
// --------------------------------------------------------
function readAll() {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    console.error("Read JSON error:", e);
    return [];
  }
}

function writeAll(arr) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(arr, null, 2), "utf-8");
  } catch (e) {
    console.error("Write JSON error:", e);
    throw e;
  }
}

// --------------------------------------------------------
// API: soumission des réponses
// --------------------------------------------------------
app.post("/api/submit", upload.any(), (req, res) => {
  try {
    const token   = (req.body.token || "").trim() || uuidv4();
    const answers = JSON.parse(req.body.answers || "[]"); // tableau de 10 strings

    // map des fichiers audio reçus: audio0..audio9 -> URL publique
    const files = {};
    (req.files || []).forEach(f => {
      // on expose via /uploads/audio/<filename>
      files[f.fieldname] = `/uploads/audio/${path.basename(f.filename)}`;
    });

    const all = readAll();
    const record = {
      id: uuidv4(),
      token,
      createdAt: new Date().toISOString(),
      answers,
      files
    };
    all.push(record);
    writeAll(all);

    res.json({ ok: true, token, savedAudios: Object.keys(files).length });
  } catch (e) {
    console.error(e);
    res.status(400).json({ ok: false, error: e.message });
  }
});

// --------------------------------------------------------
// Page /admin (protégée) — liste des soumissions
// --------------------------------------------------------
app.get("/admin", basicAuth, (req, res) => {
  const all = readAll();
  const rows = all.map(rec => {
    const listAnswers = (rec.answers || [])
      .map((a, i) => `<li><b>Q${i + 1}:</b> ${a ? String(a).replace(/</g, "&lt;") : ""}</li>`)
      .join("");
    const listAudios = Object.values(rec.files || {})
      .map(url => `<li><audio controls src="${url}"></audio></li>`)
      .join("");
    return `
      <tr>
        <td>${rec.createdAt}</td>
        <td>${rec.token}</td>
        <td><ul>${listAnswers}</ul></td>
        <td><ul>${listAudios}</ul></td>
      </tr>`;
  }).join("");

  res.send(`<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <title>Admin – Soumissions (${all.length})</title>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; margin: 0; padding: 24px; background:#f6f7fb; }
    h1 { margin: 0 0 16px; }
    table { width: 100%; border-collapse: collapse; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,.05); }
    th, td { border-bottom: 1px solid #eee; padding: 10px 12px; vertical-align: top; }
    th { background: #fafafa; text-align: left; }
    ul { margin: 0; padding-left: 18px; }
    .hint { color:#667085; font-size:12px; margin-bottom:12px;}
  </style>
</head>
<body>
  <h1>Soumissions (${all.length})</h1>
  <div class="hint">Page privée. Protégez vos identifiants (variables ADMIN_USER / ADMIN_PASS).</div>
  <table>
    <thead>
      <tr><th>Date</th><th>Token</th><th>Réponses écrites</th><th>Audios</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`);
});

// (Facultatif) route santé
app.get("/healthz", (req, res) => res.json({ ok: true }));

// --------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
