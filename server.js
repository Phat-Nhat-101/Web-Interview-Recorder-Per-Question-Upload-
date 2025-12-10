import express from "express";
import authRoutes from "./authRoutes.js";   // ✔ GIỮ NGUYÊN vì bạn đã đặt tên authRoutes.js
import multer from "multer";
import fs from "fs";
import path from "path";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public")); // HTML + JS + CSS

// ===== AUTH =====
app.use("/api/auth", authRoutes);

// ===== Upload video =====
const upload = multer({ dest: "uploads/" });

function ensureFolder(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

// ===== Verify token =====
app.post("/api/verify-token", (req, res) => {
  const { token } = req.body;
  res.json({ ok: token === "AI2025PRO" });
});

// ===== Start session =====
app.post("/api/session/start", (req, res) => {
  const user = req.body.userName || "User";
  const folder = new Date().toISOString().replace(/[:.]/g, "") + "_" + user;
  const dir = path.join("uploads", folder);
  ensureFolder(dir);

  res.json({ ok: true, folder });
});

// ===== Upload per question =====
app.post("/api/upload-one", upload.single("video"), (req, res) => {
  try {
    const { folder, questionIndex, transcript, expressions } = req.body;
    const dir = path.join("uploads", folder);
    ensureFolder(dir);

    const destVideo = path.join(dir, `Q${questionIndex}.webm`);
    fs.renameSync(req.file.path, destVideo);

    const meta = {
      transcript: transcript || "",
      expressions: expressions ? JSON.parse(expressions) : {},
      uploadedAt: new Date().toISOString()
    };

    fs.writeFileSync(
      path.join(dir, `Q${questionIndex}.json`),
      JSON.stringify(meta, null, 2)
    );

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ===== Finish session =====
app.post("/api/session/finish", (req, res) => {
  res.json({ ok: true });
});

// ===== Random questions =====
const questions = [
  "Tell me about yourself.",
  "Why do you want this job?",
  "Describe a challenge you overcame.",
  "What are your strengths?",
  "Where do you see yourself in 5 years?",
  "How do you handle stress?",
  "What motivates you to perform well?"
];

app.get("/api/questions", (req, res) => {
  const shuffled = [...questions].sort(() => Math.random() - 0.5).slice(0, 5);
  res.json({ ok: true, questions: shuffled });
});

// ===== HR Review =====
app.get("/api/sessions", (req, res) => {
  const root = "uploads";
  ensureFolder(root);

  const dirs = fs
    .readdirSync(root)
    .filter((f) => fs.lstatSync(path.join(root, f)).isDirectory());

  const sessions = dirs.map((folder) => {
    const files = fs.readdirSync(path.join(root, folder));
    return { folder, files };
  });

  res.json({ ok: true, sessions });
});

// ===== Meetings =====
let meetings = [
  {
    id: 1,
    companyName: "TechCorp",
    position: "Frontend Developer",
    baseSalary: 1000,
    interviewDate: "2025-12-10 10:00"
  },
  {
    id: 2,
    companyName: "DevSolutions",
    position: "Backend Developer",
    baseSalary: 1200,
    interviewDate: "2025-12-11 14:00"
  },
  {
    id: 3,
    companyName: "CreativeStudio",
    position: "UI/UX Designer",
    baseSalary: 900,
    interviewDate: "2025-12-12 09:00"
  }
];

app.get("/api/meetings", (req, res) => {
  res.json({ ok: true, meetings });
});

app.post("/api/meetings", (req, res) => {
  const { companyName, position, baseSalary, interviewDate } = req.body;

  if (!companyName || !position || !baseSalary || !interviewDate) {
    return res.json({ ok: false, error: "Missing fields" });
  }

  const newMeeting = {
    id: meetings.length + 1,
    companyName,
    position,
    baseSalary,
    interviewDate
  };

  meetings.push(newMeeting);
  res.json({ ok: true, meeting: newMeeting });
});

// ===== PORT =====
const PORT = 3000;
app.listen(PORT, () =>
  console.log(`✅ AI Interview Platform running: http://localhost:${PORT}`)
);
