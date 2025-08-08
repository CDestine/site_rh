import express from "express";
import path from "path";
import multer from "multer";
import fs from "fs";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

// --- Protection Basic Auth pour /admin ---
function basicAuth(req, res, next) {
  const user = process.env.ADMIN_USER || "admin";
  const pass = process.env.ADMIN_PASS || "changeme";

  const b64auth = (req.headers.authorization || "").split(" ")[1] || "";
  const [login, pwd] = Buffer.from(b64auth, "base64").toString().split(":");

  if (login === user && pwd === pass) return next();

  res.set("WWW-Authenticate", 'Basic realm="Restricted"');
  res.status(401).send("Authentication required.");
}

// Middleware pour JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Fichiers statiques
app.use(express.static(path.join(__dirname, "public")));

// Multer pour upload audio
const upload = multer({ dest: path.join(__dirname, "uploads/audio") });

// Chargement des réponses
const dataFile = path.join(__dirname, "data/responses.json");
if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, "[]", "utf-8");

// Route soumission formulaire
app.post("/api/submit", upload.any(), (req, res) => {
  const { token, answers } = req.body;
  const files = req.files || [];

  const entry = {
    id: uuidv4(),
    token,
    answers: JSON.parse(answers),
    audios: files.map(f => f.filename),
    date: new Date().toISOString()
  };

  const all = JSON.parse(fs.readFileSync(dataFile, "utf-8"));
  all.push(entry);
  fs.writeFileSync(dataFile, JSON.stringify(all, null, 2), "utf-8");

  res.json({ ok: true });
});

// Page admin protégée
app.get("/admin", basicAuth, (req, res) => {
  const responses = JSON.parse(fs.readFileSync(dataFile, "utf-8"));
  let html = `
    <h1>Réponses</h1>
    <ul>
  `;
  for (let r of responses) {
    html += `<li><b>${r.token}</b> - ${r.date}
      <ul>
        ${r.answers.map((a, i) => `<li>Q${i+1}: ${a}</li>`).join("")}
        ${r.audios.map(a => `<li><audio controls src="/uploads/audio/${a}"></audio></li>`).join("")}
      </ul>
    </li>`;
  }
  html += `</ul>`;
  res.send(html);
});

app.listen(PORT, () => console.log(`Serveur démarré sur port ${PORT}`));
