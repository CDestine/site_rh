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

/* ---------- Persistance (disks Render conseillés) ---------- */
const DATA_DIR         = process.env.DATA_DIR || path.join(__dirname, "data");
const UPLOAD_AUDIO_DIR = process.env.UPLOAD_AUDIO_DIR || path.join(__dirname, "uploads", "audio");
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_AUDIO_DIR, { recursive: true });

const DATA_FILE = path.join(DATA_DIR, "responses.json");
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]", "utf-8");

/* ---------- Middlewares ---------- */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads/audio", express.static(UPLOAD_AUDIO_DIR));

const upload = multer({ dest: UPLOAD_AUDIO_DIR });

/* ---------- Basic Auth /admin ---------- */
function basicAuth(req, res, next) {
  const user = process.env.ADMIN_USER || "admin";
  const pass = process.env.ADMIN_PASS || "changeme";
  const b64  = (req.headers.authorization || "").split(" ")[1] || "";
  const [login, pwd] = Buffer.from(b64, "base64").toString().split(":");
  if (login === user && pwd === pass) return next();
  res.set("WWW-Authenticate", 'Basic realm="Restricted"');
  res.status(401).send("Authentication required.");
}

/* ---------- Utils JSON ---------- */
const readAll  = () => JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
const writeAll = (arr) => fs.writeFileSync(DATA_FILE, JSON.stringify(arr, null, 2), "utf-8");

/* ---------- API ---------- */
app.post("/api/submit", upload.any(), (req, res) => {
  try {
    const token   = (req.body.token || "").trim() || uuidv4();
    const answers = JSON.parse(req.body.answers || "[]");
    const files = {};
    (req.files || []).forEach(f => { files[f.fieldname] = `/uploads/audio/${path.basename(f.filename)}`; });

    const all = readAll();
    all.push({ id: uuidv4(), token, createdAt: new Date().toISOString(), answers, files });
    writeAll(all);

    res.json({ ok: true, token, savedAudios: Object.keys(files).length });
  } catch (e) {
    console.error(e);
    res.status(400).json({ ok: false, error: e.message });
  }
});

/* ---------- Admin protégé ---------- */
app.get("/admin", basicAuth, (req, res) => {
  const all = readAll();
  const rows = all.map(rec => `
    <tr>
      <td>${rec.createdAt}</td>
      <td>${rec.token}</td>
      <td><ul>${(rec.answers||[]).map((a,i)=>`<li><b>Q${i+1} :</b> ${String(a||"").replace(/</g,"&lt;")}</li>`).join("")}</ul></td>
      <td><ul>${Object.values(rec.files||{}).map(u=>`<li><audio controls src="${u}"></audio></li>`).join("")}</ul></td>
    </tr>`).join("");
  res.send(`<!doctype html><meta charset="utf-8"><title>Admin (${all.length})</title>
<style>body{font-family:system-ui,segui,roboto,sans-serif;padding:24px;background:#f6f7fb}
table{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,.05)}
th,td{border-bottom:1px solid #eee;padding:10px 12px;vertical-align:top}th{background:#fafafa;text-align:left}
ul{margin:0;padding-left:18px}.hint{color:#667085;font-size:12px;margin:8px 0 16px}
</style><h1>Soumissions (${all.length})</h1><div class="hint">Accès limité — variables ADMIN_USER / ADMIN_PASS</div>
<table><thead><tr><th>Date</th><th>Token</th><th>Réponses</th><th>Audios</th></tr></thead><tbody>${rows}</tbody></table>`);
});

/* ---------- Health ---------- */
app.get("/healthz", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`Server on :${PORT}`));
