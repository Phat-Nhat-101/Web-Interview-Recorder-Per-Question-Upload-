##### Project-Cong-nghe-mang#####
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
+ Browser APIs for camera/mic (getUserMedia) require secure context (HTTPS) except localhost.

+ If users access your dev machine remotely, use Ngrok (HTTPS) or deploy to HTTPS-enabled hosting.

+ Without HTTPS, camera/mic access will be blocked or restricted — Ngrok is the recommended development workaround.

9. File Limits & MIME types
    This project enforces strict validation on uploaded files to ensure security, performance, and predictable behavior.
   Supported MIME Types
The API accepts only the following MIME types:

        image/jpeg
    
        image/png
    
        video/mp4
    
        audio/mpeg (MP3)
        
        audio/wav
    
        application/pdf
    
        text/plain

Any file with an unsupported MIME type will be rejected with an HTTP 415 Unsupported Media Type response.

File Size Limits
To ensure stable system performance, uploads are limited by size:

File Type	Maximum Size
  
    Images (JPG, PNG)	- 10 MB
    Videos (MP4)	- 50 MB
    Audio (MP3, WAV)	- 15 MB
    PDF	- 10 MB
    Text files	- 2 MB
If the uploaded file exceeds the limit, the API returns:
    
    413 Payload Too Large.

Multiple Files & Total Limit
+ Maximum files per request: 1

+ Maximum total upload size per user per hour: 100 MB (configurable)



11. Retry Policy
To ensure stable uploads and prevent data loss during video recording sessions, the platform implements a structured retry policy for all client‑to‑server requests—especially video uploads.

1. Client‑Side Retry Logic

The browser automatically retries failed upload attempts based on the following rules:

    | Condition               | Action                         |
    | ----------------------- | ------------------------------ |
    | Network timeout         | Retry up to **3 times**        |
    | HTTP 5xx response       | Retry up to **3 times**        |
    | HTTP 429 (Rate limited) | Retry with exponential backoff |
    | HTTP 4xx (except 429)   | No retry (client error)        |

Exponential Backoff
Each retry waits longer than the previous attempt:

    Retry 1 → wait 1 second  
    Retry 2 → wait 2 seconds  
    Retry 3 → wait 4 seconds
This prevents spam‑uploading and avoids server overload.

2. Server‑Side Retry Handling
The server treats duplicate uploads safely:

+ Uploads for the same question (e.g., Q2.webm) overwrite the previous file.

+ Metadata JSON (Q2.json) also updates safely.

+ The server ensures folders exist before writing (ensureFolder()).

+ Atomic rename (fs.renameSync) ensures no partial uploads.

Result: uploads are idempotent, so retries do NOT break the session.

3. Token Verification Retry
Token checking (/api/verify-token) is lightweight.

    | Scenario               | Policy                             |
    | ---------------------- | ---------------------------------- |
    | Token missing          | No retry                           |
    | Token invalid          | No retry                           |
    | Network/server failure | Client may retry up to **2 times** |

4. Safe Session Completion
/api/session/finish follows a single‑retry policy:

+ If the request fails due to network issues, the client retries once.

+ The endpoint itself is idempotent — calling it multiple times is safe.

5. Error Categories


    
        | Category                          | Retries              | Notes |
        | --------------------------------- | -------------------- | ----- |
        | Network loss                      | ✔ Retries enabled    |       |
        | Server overload (5xx)             | ✔ Retries enabled    |       |
        | Client error (400, 401, 403, 404) | ✖ No retry           |       |
        | File too large                    | ✖ No retry           |       |
        | Rate limit (429)                  | ✔ Retry with backoff |       |
    
6. Logging
Each upload attempt logs:

+ timestamp

+ retry index

+ ile processed

+ error message (if any)

This helps with debugging and analytics.

7. Why This Retry Policy Matters
This policy ensures that even under unstable connections:

+ No video chunks are lost

+ No duplicate submissions corrupt data

+ Users finish their interview reliably

+ Server stays stable under retry load

       


13. Folder & File Naming Rules

14. System Behavior & Edge Case

15. Team Workflow

16. 10. Bonus
