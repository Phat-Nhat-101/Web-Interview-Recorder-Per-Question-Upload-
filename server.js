// ===================== IMPORTS =====================
import express from "express";
import authRoutes from "./authRoutes.js";
import multer from "multer";
import fs from "fs";
import path from "path";
import cors from "cors";

const app = express();

// ===================== MIDDLEWARE =====================
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Không cho Express tự load index.html
app.use(express.static("public", { index: false }));

// Route "/" luôn trả login.html
app.get("/", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "login.html"));
});

// Serve uploads
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

function ensureFolder(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

// ===================== AUTH =====================
app.use("/api/auth", authRoutes);

// ===================== MULTER =====================
const upload = multer({ dest: "uploads/" });

// ===================== VERIFY TOKEN =====================
app.post("/api/verify-token", (req, res) => {
  const { token } = req.body;
  res.json({ ok: token === "AI2025PRO" });
});

// ===================== START INTERVIEW SESSION =====================
app.post("/api/session/start", (req, res) => {
  const meetingId = req.body.meetingId || "noMeeting";

  // Format cũ: timestamp_meetingId_Candidate
  const folder =
    new Date().toISOString().replace(/[:.]/g, "") +
    `_${meetingId}_Candidate`;

  const dir = path.join("uploads", folder);
  ensureFolder(dir);

  res.json({ ok: true, folder });
});

// ===================== UPLOAD ONE VIDEO =====================
app.post("/api/upload-one", upload.single("video"), (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ ok: false, error: "No video uploaded" });

    const { folder, questionIndex, transcript, expressions } = req.body;

    if (!folder || questionIndex === undefined)
      return res.status(400).json({
        ok: false,
        error: "Missing folder or questionIndex",
      });

    const dir = path.join("uploads", folder);
    ensureFolder(dir);

    const destVideo = path.join(dir, `Q${questionIndex}.webm`);
    fs.renameSync(req.file.path, destVideo);

    const meta = {
      questionIndex: Number(questionIndex),
      transcript: transcript || "",
      expressions: expressions ? JSON.parse(expressions) : {},
      uploadedAt: new Date().toISOString(),
      videoFile: `Q${questionIndex}.webm`,
    };

    fs.writeFileSync(
      path.join(dir, `Q${questionIndex}.json`),
      JSON.stringify(meta, null, 2)
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("upload-one error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ===================== FINISH SESSION =====================
app.post("/api/session/finish", (req, res) => {
  res.json({ ok: true });
});

// ===================== QUESTIONS =====================
const questions = [
  "Tell me about yourself.",
  "Why do you want this job?",
  "Describe a challenge you overcame.",
  "What are your strengths?",
  "Where do you see yourself in 5 years?",
  "How do you handle stress?",
  "What motivates you to perform well?",
];

app.get("/api/questions", (req, res) => {
  const shuffled = [...questions]
    .sort(() => Math.random() - 0.5)
    .slice(0, 5);
  res.json({ ok: true, questions: shuffled });
});

// ===================== LIST SESSIONS =====================
app.get("/api/sessions", (req, res) => {
  const root = "uploads";
  ensureFolder(root);

  const dirs = fs
    .readdirSync(root)
    .filter((f) => fs.lstatSync(path.join(root, f)).isDirectory());

  res.json({ ok: true, sessions: dirs.map((folder) => ({ folder })) });
});

// ===================== MEETINGS =====================
let meetings = [
  {
    id: 1,
    companyName: "TechCorp",
    position: "Frontend Developer",
    baseSalary: 1000,
    interviewDate: "2025-12-10 10:00",
  },
  {
    id: 2,
    companyName: "DevSolutions",
    position: "Backend Developer",
    baseSalary: 1200,
    interviewDate: "2025-12-11 14:00",
  },
  {
    id: 3,
    companyName: "CreativeStudio",
    position: "UI/UX Designer",
    baseSalary: 900,
    interviewDate: "2025-12-12 09:00",
  },
];

app.get("/api/meetings", (req, res) => {
  res.json({ ok: true, meetings });
});

app.post("/api/meetings", (req, res) => {
  const { companyName, position, baseSalary, interviewDate } = req.body;

  if (!companyName || !position || !baseSalary || !interviewDate)
    return res.json({ ok: false, error: "Missing fields" });

  const newMeeting = {
    id: meetings.length + 1,
    companyName,
    position,
    baseSalary,
    interviewDate,
  };

  meetings.push(newMeeting);
  res.json({ ok: true, meeting: newMeeting });
});

// ===================== RECORDS LIST BY MEETING =====================
app.get("/api/records/:meetingId", (req, res) => {
  const meetingId = req.params.meetingId;
  const root = "uploads";
  ensureFolder(root);

  const folders = fs
    .readdirSync(root)
    .filter((f) => f.includes(`_${meetingId}_`) || f.includes(`_MID${meetingId}_`));

  res.json({ ok: true, records: folders });
});

// ===================== RECORD DETAILS =====================
app.get("/api/records/:meetingId/:folder", (req, res) => {
  try {
    const meetingId = req.params.meetingId;
    const folder = req.params.folder;

    const uploadsRoot = path.join(process.cwd(), "uploads");
    ensureFolder(uploadsRoot);

    let dir = path.join(uploadsRoot, folder);

    if (!fs.existsSync(dir)) {
      const all = fs
        .readdirSync(uploadsRoot)
        .filter((f) => fs.lstatSync(path.join(uploadsRoot, f)).isDirectory());

      const byName = all.find((f) => f.toLowerCase() === folder.toLowerCase());
      if (byName) dir = path.join(uploadsRoot, byName);
    }

    if (!fs.existsSync(dir))
      return res.json({ ok: false, error: "Record not found" });

    const items = fs.readdirSync(dir);

    const result = items
      .filter((x) => x.endsWith(".json"))
      .map((metaFile) => {
        const meta = JSON.parse(
          fs.readFileSync(path.join(dir, metaFile), "utf8")
        );

        return {
          questionIndex: meta.questionIndex,
          transcript: meta.transcript,
          expressions: meta.expressions,
          uploadedAt: meta.uploadedAt,
          video: meta.videoFile,
        };
      });

    res.json({ ok: true, data: result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ===================== START SERVER =====================
const PORT = 3000;

app.listen(PORT, () =>
  console.log(`✅ AI Interview Platform running at http://localhost:${PORT}`)
);
