# Project-Cong-nghe-mang
Overview
The AI Interview Platform is a lightweight full‑stack web application for delivering recorded interview sessions.
Candidates can join an interview session, answer randomized questions, record video responses in the browser, and submit transcripts and facial‑expression metadata. Recruiters or interviewers can list sessions, open a session folder, watch per‑question videos, and read the metadata.



1.Architecture & Flow: 
Frontend (public/*.html, JS)
    
        ↕ (fetch / media capture)
Ngrok (optional HTTPS tunnel for public access)
        
        ↕ (HTTPS -> HTTP)
Backend (Node.js + Express)
        
        ↕ (filesystem)
uploads/ (session folders, .webm + .json metadata)

2. Flow:
Typical flow
- Visitor opens the public URL (local http://localhost:3000 or Ngrok HTTPS).

- Login / token verification via POST /api/verify-token.

- User selects a meeting (frontend calls GET /api/meetings).

- Starting interview: frontend calls POST /api/session/start → backend creates a timestamped session folder.

-For each question:

+ Frontend records candidate’s webcam (WebM).

+ Frontend uploads the recorded file and metadata with POST /api/upload-one.

+ Backend saves Q{index}.webm and Q{index}.json.

+ After finishing, frontend calls POST /api/session/finish.

+ Recruiter uses GET /api/records/:meetingId and GET /api/records/:meetingId/:folder to list and view session details and videos.

4. API Contract

Base URL: http://localhost:3000 (or the Ngrok HTTPS URL when public)

POST /api/verify-token
Request

        { "token": "AI2025PRO" }
        Response
Respone
     
        { "ok": true }
POST /api/session/start
Start a session (creates folder).

Request

        { "meetingId": 1, "userName": "Alice" } // optional userName
Response

        { "ok": true, "folder": "20251209T101530_1_Candidate" }
POST /api/upload-one
Upload one recorded answer (per question). Multipart/form-data.

Form fields:

video: file (webm)

folder: folder name returned from /api/session/start

questionIndex: integer (0,1,2,...)

transcript: optional string

expressions: optional JSON string with expression metrics

Response

        { "ok": true }
POST /api/session/finish
End the session.

Response

        { "ok": true }
GET /api/questions
Get 5 random questions (shuffled from a fixed list).
Response

        { "ok": true, "questions": ["Tell me about yourself.", ...] }
GET /api/meetings
List meetings.
Response

        { "ok": true, "meetings": [{ "id":1, "companyName":"TechCorp", "position":"Frontend Developer", "baseSalary":1000, "interviewDate":"2025-12-10 10:00" }, ...] }
POST /api/meetings
Create a meeting.
Request

        { "companyName": "...", "position": "...", "baseSalary": 1000, "interviewDate": "YYYY-MM-DD HH:mm" }
Response

        { "ok": true, "meeting": { ... } }
GET /api/records/:meetingId
List session folders associated with meetingId.
Response

        { "ok": true, "records": ["20251209T101530_1_Candidate", ...] }
GET /api/records/:meetingId/:folder
Detailed record list for a folder — returns metadata for each question.
Response

        {
          "ok": true,
          "data": [
            {
              "questionIndex": 0,
              "transcript": "Answer text",
              "expressions": { "happy": 0.8 },
              "uploadedAt": "2025-12-09T10:15:30Z",
              "video": "Q0.webm"
            },
            ...
          ]
        }
Run Instructions
Requirements
- Node.js (v18+ recommended)

- npm

- Ngrok (for HTTPS and remote camera access)

Modern browser (Chrome / Edge) with camera access

Setup & run locally
Clone:

        git clone <repo-url>
        cd <repo>
Install dependencies:

        npm install
Start server:

        node server.js
Server listens on http://localhost:3000 (configurable inside server.js).

(Optional) Expose via Ngrok (required for browser camera on remote devices):

        ngrok http 3000
Ngrok returns a public HTTPS URL. Use that to open the app remotely.

Notes for production
+ For stable public hosting, deploy to Render / Railway / VPS and use a persistent disk for uploads/ (or a cloud object store).

+ Use a reverse proxy (nginx) and process manager (pm2) in production.



6. Runs intruction

7. HTTPS requirements

8. File Limits & MIME types

9. Retry Policy

10. Folder & File Naming Rules

11. System Behavior & Edge Case

12. Team Workflow

13. 10. Bonus
