import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Dossiers
const DATA_DIR = path.join(__dirname, "data");
const UP_DIR = path.join(__dirname, "uploads", "audio");
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UP_DIR, { recursive: true });

const SUBMISSIONS_JSON = path.join(DATA_DIR, "submissions.json");
if (!fs.existsSync(SUBMISSIONS_JSON)) fs.writeFileSync(SUBMISSIONS_JSON, "[]");

// Static
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json({ limit: "5mb" }));

// Multer pour fichiers audio
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UP_DIR),
  filename: (req, file, cb) => {
    const token = req.body.token || "notoken";
    const stamp = Date.now();
    const base = file.originalname.replace(/\s+/g, "_");
    cb(null, `${token}_${stamp}_${base}`);
  }
});
const upload = multer({ storage });

// API de soumission
app.post("/api/submit", upload.any(), (req, res) => {
  try {
    const token = (req.body.token || "").trim() || uuidv4();
    const answers = JSON.parse(req.body.answers || "[]");

    // mapping fichiers audio
    const files = {};
    (req.files || []).forEach(f => {
      files[f.fieldname] = "/uploads/audio/" + path.basename(f.path);
    });

    // Persist
    const raw = fs.readFileSync(SUBMISSIONS_JSON, "utf-8");
    const all = JSON.parse(raw);
    const record = {
      id: uuidv4(),
      token,
      createdAt: new Date().toISOString(),
      answers,
      files
    };
    all.push(record);
    fs.writeFileSync(SUBMISSIONS_JSON, JSON.stringify(all, null, 2));

    res.json({ ok: true, token, saved: Object.keys(files).length });
  } catch (e) {
    console.error(e);
    res.status(400).json({ ok: false, error: e.message });
  }
});

// Expose dossiers uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Mini admin
app.get("/admin", (req, res) => {
  const raw = fs.readFileSync(SUBMISSIONS_JSON, "utf-8");
  const all = JSON.parse(raw);
  const rows = all.map(rec => {
    const listAudios = Object.values(rec.files || {})
      .map(url => `<li><audio controls src="${url}"></audio></li>`)
      .join("");
    const listAnswers = (rec.answers || [])
      .map((a, i) => `<li><b>Q${i+1}:</b> ${a ? a.replace(/</g,"&lt;") : ""}</li>`)
      .join("");
    return `
      <tr>
        <td>${rec.createdAt}</td>
        <td>${rec.token}</td>
        <td><ul>${listAnswers}</ul></td>
        <td><ul>${listAudios}</ul></td>
      </tr>
    `;
  }).join("");

  res.send(`
    <html><head>
      <meta charset="utf-8"/>
      <title>Admin - Soumissions</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; vertical-align: top; }
        th { background: #f3f3f3; }
        ul { margin: 0; padding-left: 16px; }
      </style>
    </head>
    <body>
      <h1>Soumissions (${all.length})</h1>
      <table>
        <thead>
          <tr><th>Date</th><th>Token</th><th>Réponses écrites</th><th>Audios</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </body></html>
  `);
});

app.listen(PORT, () => console.log("Server on http://localhost:" + PORT));
