# TechBridge Intern Management Platform

**Task 8 — The complete, fully-integrated TechBridge platform.**

> "Bridging Learning to Real-World Experience"

---

## Project Description

The TechBridge Intern Management Platform is a full-stack web application built over 8 tasks during the TechBridge Web Development internship. It combines a professional marketing homepage, an interactive intern dashboard, a challenge hub, and a complete REST API into a single, cohesive platform.

Interns can track their progress through all 8 tasks, explore practical challenges from two learning tracks, update task statuses through the backend, and search/filter across all content — all without a page reload.

Administrators can view, add, update and delete both tasks and challenges through a dedicated admin panel backed by the same REST API.

---

## Technologies Used

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | HTML5, CSS3, Vanilla JavaScript   |
| Backend    | Node.js, Express.js               |
| API        | REST API (JSON over HTTP)         |
| Data       | JSON files (`tasks.json`, `challenges.json`) |
| Fonts      | Google Fonts (Space Grotesk, Inter) |
| Tooling    | npm, concurrently, serve          |

---

## Main Features

### Core (Tasks 5–7)
- **Homepage** — TechBridge branding, hero section, programs, internship overview and community links
- **Programs page** — Data Analytics and Web Development track descriptions
- **Tasks timeline** — Static day-by-day view of all 8 internship tasks
- **Interactive roadmap** — Switch between the two tracks without a page reload
- **Challenge Hub** — 8 realistic challenges filterable by track and difficulty, with full-detail modals
- **Intern Dashboard** — Live progress tracking, status filtering, task search, and the Modern Web Technologies explorer
- **REST API** — Express backend serving task data with GET and PUT endpoints

### Task 8 Additions
- **Admin Panel** (`admin.html`) — Full CRUD management for tasks and challenges
  - View all tasks and challenges in searchable tables
  - Add new tasks (POST /api/tasks)
  - Add new challenges (POST /api/challenges)
  - Update task status via dropdown (PUT /api/tasks/:id)
  - Delete tasks and challenges with confirmation (DELETE)
- **Challenges API** — New `/api/challenges` endpoints with query filtering by track, level and keyword
- **Dark Mode** — System-preference-aware toggle, persisted to `localStorage`, works across all pages
- **Local Storage fallback** — Task status changes persist on-device even if the backend is offline
- **Loading & Error States** — Every API call shows a loading spinner and a retry option on failure
- **Search** — Tasks searchable on the dashboard; challenges searchable on the hub and in the admin panel
- **Responsive Design** — All pages tested on desktop, tablet (768px) and mobile (360px)
- **Single-port mode** — The Express server now also serves the frontend (`frontend/`) so everything runs on `http://localhost:3000`

---

## Project Structure

```text
techbridge/
├── package.json                    # Root scripts (run both servers together)
├── package-lock.json
├── .gitignore
├── README.md
│
├── frontend/
│   ├── index.html                  # TechBridge homepage (Task 1)
│   ├── programs.html               # Programs experience (Task 2)
│   ├── tasks.html                  # Internship tasks timeline (Task 3)
│   ├── roadmap.html                # Interactive track roadmap (Task 4)
│   ├── challenges.html             # Challenge Hub (Task 5)
│   ├── dashboard.html              # Intern dashboard (Tasks 6 & 7)
│   ├── admin.html                  # Admin panel (Task 8)
│   │
│   ├── css/
│   │   └── style.css               # Shared design system + dark mode + admin styles
│   │
│   ├── js/
│   │   ├── challenges.js           # Challenge Hub logic (Task 5)
│   │   ├── roadmap.js              # Roadmap track switcher (Task 4)
│   │   ├── dashboard.js            # Dashboard logic + API integration (Tasks 6 & 7)
│   │   ├── admin.js                # Admin panel CRUD logic (Task 8)
│   │   └── darkmode.js             # Dark mode toggle + localStorage (Task 8)
│   │
│   └── assets/
│       └── images/
│           ├── favicon.png
│           ├── techbridge-logo.png
│           └── techbridge-logo-cropped.png
│
└── backend/
    ├── server.js                   # Express app + all REST endpoints (Tasks 7 & 8)
    ├── package.json
    ├── package-lock.json
    └── data/
        ├── tasks.json              # Local task data and PostgreSQL seed
        └── challenges.json         # Local challenge data and PostgreSQL seed
```

---

## How to Run the Project

### 1. Install dependencies

From the project root:

```bash
npm install
npm install --prefix backend
```

### 2. Start both servers

```bash
npm run dev
```

This uses `concurrently` to run the backend API and the frontend dev server simultaneously:

| Service  | URL                                    |
|----------|----------------------------------------|
| Backend  | http://localhost:3000                  |
| Frontend | http://localhost:5500                  |
| Dashboard | http://localhost:5500/dashboard.html  |
| Admin     | http://localhost:5500/admin.html      |

> **Tip:** You can also open `http://localhost:3000/dashboard.html` — the backend now also serves the frontend directly.

### 3. Run servers separately

```bash
npm run backend     # http://localhost:3000 (API + static files)
npm run frontend    # http://localhost:5500 (frontend only)
```

### Persistent storage on Vercel

Local development uses the JSON files in `backend/data`. Production and Preview use the private `techbridge-blob` store connected in Vercel. The API stores task and challenge collections as `techbridge/tasks.json` and `techbridge/challenges.json`, seeding each from the local JSON files on first read. Vercel provides the Blob credentials to the project; never commit storage tokens.

---

## API Endpoints

### Tasks

| Method | Endpoint         | Purpose                          |
|--------|------------------|----------------------------------|
| GET    | `/api/tasks`     | Get all tasks                    |
| GET    | `/api/tasks/:id` | Get one task by numeric ID       |
| PUT    | `/api/tasks/:id` | Update task fields               |
| POST   | `/api/tasks`     | Add a new task (admin)           |
| DELETE | `/api/tasks/:id` | Delete a task (admin)            |

**PUT body:** Any editable task fields, including `title`, `description`, `day`, `status`, `difficulty`, `detail`, `skills`, and `link`.
**POST body:** `{ "title", "description", "day", "difficulty", "detail", "skills", "link", "linkLabel" }`

### Challenges

| Method | Endpoint               | Purpose                             |
|--------|------------------------|-------------------------------------|
| GET    | `/api/challenges`      | Get all challenges (supports `?track=`, `?level=`, `?q=`) |
| GET    | `/api/challenges/:id`  | Get one challenge by string ID      |
| POST   | `/api/challenges`      | Add a new challenge (admin)         |
| DELETE | `/api/challenges/:id`  | Delete a challenge (admin)          |

### Health

| Method | Endpoint      | Purpose            |
|--------|---------------|--------------------|
| GET    | `/api/health` | API status check   |

---

## How the Pieces Talk to Each Other

```
Browser (frontend)
  │
  │  fetch() calls
  ▼
Express API (backend/server.js)  ←→  tasks.json / challenges.json
  │
  │  JSON responses
  ▼
Dashboard / Admin / Challenge Hub update the UI without page reloads
```

1. On load, `dashboard.js` calls `GET /api/tasks` and renders task cards + progress bar.
2. "View Task" triggers `GET /api/tasks/:id` — the response populates the modal.
3. "Mark as Completed" sends `PUT /api/tasks/:id` — the server writes to `tasks.json` and the UI updates.
4. `admin.js` calls `POST` and `DELETE` endpoints to add/remove entries.
5. If any API call fails, a loading spinner transitions to an error state with a **Try Again** button.
6. `darkmode.js` reads the OS preference on first load and stores the user's choice in `localStorage` so it persists across pages and refreshes.

---

## Optional Advanced Features Completed (Task 8)

- [x] **Dark Mode** — light/dark toggle with OS detection and `localStorage` persistence
- [x] **Local Storage** — task status overrides saved locally as a backend-offline fallback
- [x] **POST API** — new tasks and challenges can be added through the API
- [x] **DELETE API** — tasks and challenges can be removed through the API
- [x] **Admin Section** — full admin panel (`admin.html`) to manage all content

---

*Built during the TechBridge Web Development internship, 2026.*  
*GitHub: https://github.com/Khoya7/techbridge*
