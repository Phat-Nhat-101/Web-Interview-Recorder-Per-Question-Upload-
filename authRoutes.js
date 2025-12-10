import express from "express";
import fs from "fs";
import path from "path";

const router = express.Router();
const USERS_FILE = path.join("uploads", "users.json");

// ===== Helper =====
function ensureUsersFile() {
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "[]");
}
function readUsers() {
  ensureUsersFile();
  return JSON.parse(fs.readFileSync(USERS_FILE));
}
function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// ===== REGISTER =====
router.post("/register", (req, res) => {
  const { username, password, accountType } = req.body;

  if (!username || !password || !accountType) {
    return res.json({ ok: false, error: "Missing fields" });
  }

  const users = readUsers();

  if (users.find((u) => u.username === username)) {
    return res.json({ ok: false, error: "Username exists" });
  }

  users.push({ username, password, accountType });
  saveUsers(users);

  res.json({ ok: true });
});

// ===== LOGIN =====
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  const users = readUsers();
  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) return res.json({ ok: false, error: "Invalid credentials" });

  // QUAN TRỌNG: trả đúng "accountType" để login.html redirect đúng
  res.json({
    ok: true,
    username: user.username,
    accountType: user.accountType
  });
});

export default router;
