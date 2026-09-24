# TechBridge Task Management

TechBridge Internship — **Task 7: Backend API Integration**.

This upgrades the Task 6 Interactive Intern Dashboard from static, in-file
task data to a real full-stack app:

```
Frontend (fetch) → REST API (Node.js + Express) → tasks.json
```

The dashboard's design, task cards, progress tracking, status system,
filters and View Task modal are all unchanged from Task 6 — only the data
source changed, from a hard-coded array to the API below.

## Project structure

```text
techbridge-task-management/
├── package.json            # root scripts (run both servers together)
├── package-lock.json
├── .gitignore
│
├── frontend/
│   ├── index.html          # TechBridge homepage
│   ├── dashboard.html      # Intern Dashboard (Task 6 UI, Task 7 data)
│   ├── programs.html / tasks.html / roadmap.html / challenges.html
│   ├── css/style.css
│   ├── js/dashboard.js     # fetch()-driven dashboard logic
│   ├── js/roadmap.js, js/challenges.js
│   └── assets/images/
│
└── backend/
    ├── server.js            # Express app + REST endpoints
    ├── package.json
    ├── package-lock.json
    └── data/
        └── tasks.json       # the 8 TechBridge internship tasks
```

## 1. Install dependencies

From the project root:

```bash
npm install
npm install --prefix backend
```

## 2. Start both servers

```bash
npm run dev
```

This runs the backend and frontend together via `concurrently`:

- **Backend:** http://localhost:3000
- **Frontend:** http://localhost:5500

You can also run them separately:

```bash
npm run backend    # http://localhost:3000
npm run frontend    # http://localhost:5500
```

Open the dashboard at **http://localhost:5500/dashboard.html** — don't open
the HTML file directly with `file://`, since `fetch()` needs it served over
HTTP.

## 3. API endpoints

| Method | Endpoint         | Purpose             |
| ------ | ---------------- | -------------------- |
| GET    | `/api/tasks`     | Get all 8 tasks      |
| GET    | `/api/tasks/:id` | Get one task by id   |
| PUT    | `/api/tasks/:id` | Update a task's status |

**GET** retrieves information — no data changes.
**PUT** updates existing information — here, a task's `status`, sent as
`{ "status": "completed" }`. Only `completed`, `in-progress` and
`not-started` are accepted; anything else returns `400`. An unknown `id`
returns `404`.

## 4. How the pieces talk to each other

1. `dashboard.js` defines `API_BASE_URL` once (`http://localhost:3000/api`
   on localhost) and calls `fetch(`${API_BASE_URL}/tasks`)` on load.
2. `server.js` reads `backend/data/tasks.json` and returns it as JSON.
3. The dashboard renders the task cards, progress bar and filters from
   that response — while loading, it shows "Loading tasks…"; if the
   request fails, it shows an offline/error state with a **Try Again**
   button.
4. **View Task** sends `GET /api/tasks/:id` and shows the response in the
   existing modal, without a page reload.
5. **Mark as Completed** sends `PUT /api/tasks/:id` with the new status.
   The server updates the task in memory and writes it back to
   `tasks.json`, so the change survives a backend restart.

## 5. Production configuration

`API_BASE_URL` in `frontend/js/dashboard.js` switches automatically based
on hostname:

```javascript
const API_BASE_URL =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000/api"
    : "YOUR_DEPLOYED_BACKEND_URL/api"; // set this once the API is deployed
```

GitHub Pages can host the `frontend/` folder as static files, but it
cannot run the Express server — `backend/` needs a Node host (e.g.
Render, Railway, Fly.io). Until then, `YOUR_DEPLOYED_BACKEND_URL` is a
placeholder to fill in later.
"# techbridge" 
