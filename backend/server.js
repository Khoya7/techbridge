/* ===========================================================
   TechBridge — Complete Intern Management Platform API (Task 8)
   Node.js + Express REST API backed by JSON data files.

   Endpoints:
     Tasks:
       GET  /api/tasks            -> all tasks
       GET  /api/tasks/:id        -> one task
       PUT  /api/tasks/:id        -> update a task's status
       POST /api/tasks            -> add a new task (admin)
       DELETE /api/tasks/:id      -> delete a task (admin)

     Challenges:
       GET  /api/challenges       -> all challenges
       GET  /api/challenges/:id   -> one challenge
       POST /api/challenges       -> add a new challenge (admin)
       DELETE /api/challenges/:id -> delete a challenge (admin)

     Health:
       GET  /api/health           -> API status check
   =========================================================== */

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const TASKS_PATH = path.join(__dirname, "data", "tasks.json");
const CHALLENGES_PATH = path.join(__dirname, "data", "challenges.json");
const FRONTEND_PATH = path.join(__dirname, "..", "frontend");
const VALID_STATUSES = ["completed", "in-progress", "not-started"];

app.use(cors());
app.use(express.json());

/* -----------------------------------------------------------
   SERVE FRONTEND STATIC FILES
   When running locally, the Express server also serves the
   frontend so everything runs on one port (3000).
   ----------------------------------------------------------- */
app.use(express.static(FRONTEND_PATH));

/* -----------------------------------------------------------
   DATA HELPERS
   ----------------------------------------------------------- */
function readJSON(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function readTasks() { return readJSON(TASKS_PATH); }
function writeTasks(tasks) { writeJSON(TASKS_PATH, tasks); }

function readChallenges() { return readJSON(CHALLENGES_PATH); }
function writeChallenges(challenges) { writeJSON(CHALLENGES_PATH, challenges); }

/* -----------------------------------------------------------
   HEALTH CHECK
   ----------------------------------------------------------- */
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "TechBridge API is running.",
    version: "8.0.0",
    endpoints: {
      tasks: "/api/tasks",
      challenges: "/api/challenges"
    }
  });
});

/* -----------------------------------------------------------
   TASK ROUTES
   ----------------------------------------------------------- */

// GET /api/tasks -> every task
app.get("/api/tasks", (req, res) => {
  try {
    const tasks = readTasks();
    res.status(200).json({ success: true, tasks, total: tasks.length });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not read task data." });
  }
});

// GET /api/tasks/:id -> a single task
app.get("/api/tasks/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: "Task id must be a number." });
    }

    const tasks = readTasks();
    const task = tasks.find((t) => t.id === id);

    if (!task) {
      return res.status(404).json({ success: false, message: `Task ${id} was not found.` });
    }

    res.status(200).json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not read task data." });
  }
});

// PUT /api/tasks/:id -> update a task's status
app.put("/api/tasks/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: "Task id must be a number." });
    }

    const { status } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${VALID_STATUSES.join(", ")}.`,
      });
    }

    const tasks = readTasks();
    const task = tasks.find((t) => t.id === id);

    if (!task) {
      return res.status(404).json({ success: false, message: `Task ${id} was not found.` });
    }

    task.status = status;
    writeTasks(tasks);

    res.status(200).json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not update task data." });
  }
});

// POST /api/tasks -> add a new task (admin)
app.post("/api/tasks", (req, res) => {
  try {
    const { title, description, difficulty, day, detail, skills, link, linkLabel } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: "title and description are required." });
    }

    const tasks = readTasks();
    const newTask = {
      id: tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1,
      day: day || tasks.length + 1,
      title,
      description,
      status: "not-started",
      difficulty: difficulty || "Intermediate",
      detail: detail || "",
      skills: Array.isArray(skills) ? skills : [],
      link: link || "",
      linkLabel: linkLabel || ""
    };

    tasks.push(newTask);
    writeTasks(tasks);

    res.status(201).json({ success: true, task: newTask });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not create task." });
  }
});

// DELETE /api/tasks/:id -> delete a task (admin)
app.delete("/api/tasks/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: "Task id must be a number." });
    }

    const tasks = readTasks();
    const index = tasks.findIndex((t) => t.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: `Task ${id} was not found.` });
    }

    const [removed] = tasks.splice(index, 1);
    writeTasks(tasks);

    res.status(200).json({ success: true, task: removed, message: `Task ${id} deleted.` });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not delete task." });
  }
});

/* -----------------------------------------------------------
   CHALLENGE ROUTES
   ----------------------------------------------------------- */

// GET /api/challenges -> every challenge
app.get("/api/challenges", (req, res) => {
  try {
    const challenges = readChallenges();

    // Support optional query filters: ?track=Web+Development&level=Beginner
    let filtered = challenges;
    if (req.query.track && req.query.track !== "all") {
      filtered = filtered.filter(c => c.track === req.query.track);
    }
    if (req.query.level && req.query.level !== "all") {
      filtered = filtered.filter(c => c.level === req.query.level);
    }
    if (req.query.q) {
      const q = req.query.q.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        (c.skills || []).join(" ").toLowerCase().includes(q)
      );
    }

    res.status(200).json({ success: true, challenges: filtered, total: filtered.length });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not read challenge data." });
  }
});

// GET /api/challenges/:id -> a single challenge
app.get("/api/challenges/:id", (req, res) => {
  try {
    const id = req.params.id;
    const challenges = readChallenges();
    const challenge = challenges.find((c) => c.id === id);

    if (!challenge) {
      return res.status(404).json({ success: false, message: `Challenge '${id}' was not found.` });
    }

    res.status(200).json({ success: true, challenge });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not read challenge data." });
  }
});

// POST /api/challenges -> add a new challenge (admin)
app.post("/api/challenges", (req, res) => {
  try {
    const { id, name, track, level, description, outcome, objective, skills, tools, deliverables, time, result } = req.body;

    if (!id || !name || !track || !level || !description) {
      return res.status(400).json({ success: false, message: "id, name, track, level and description are required." });
    }

    const VALID_TRACKS = ["Data Analytics", "Web Development"];
    const VALID_LEVELS = ["Beginner", "Intermediate", "Advanced"];

    if (!VALID_TRACKS.includes(track)) {
      return res.status(400).json({ success: false, message: `track must be one of: ${VALID_TRACKS.join(", ")}.` });
    }
    if (!VALID_LEVELS.includes(level)) {
      return res.status(400).json({ success: false, message: `level must be one of: ${VALID_LEVELS.join(", ")}.` });
    }

    const challenges = readChallenges();
    if (challenges.find(c => c.id === id)) {
      return res.status(409).json({ success: false, message: `A challenge with id '${id}' already exists.` });
    }

    const newChallenge = {
      id,
      name,
      track,
      level,
      description,
      outcome: outcome || "",
      objective: objective || "",
      skills: Array.isArray(skills) ? skills : [],
      tools: Array.isArray(tools) ? tools : [],
      deliverables: Array.isArray(deliverables) ? deliverables : [],
      time: time || "",
      result: result || ""
    };

    challenges.push(newChallenge);
    writeChallenges(challenges);

    res.status(201).json({ success: true, challenge: newChallenge });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not create challenge." });
  }
});

// DELETE /api/challenges/:id -> delete a challenge (admin)
app.delete("/api/challenges/:id", (req, res) => {
  try {
    const id = req.params.id;
    const challenges = readChallenges();
    const index = challenges.findIndex((c) => c.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: `Challenge '${id}' was not found.` });
    }

    const [removed] = challenges.splice(index, 1);
    writeChallenges(challenges);

    res.status(200).json({ success: true, challenge: removed, message: `Challenge '${id}' deleted.` });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not delete challenge." });
  }
});

/* -----------------------------------------------------------
   404 — unknown API route
   ----------------------------------------------------------- */
app.use("/api", (req, res) => {
  res.status(404).json({ success: false, message: "Unknown API endpoint." });
});

/* -----------------------------------------------------------
   CATCH-ALL — serve the frontend for any non-API route
   ----------------------------------------------------------- */
app.get("*", (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, "index.html"));
});

/* -----------------------------------------------------------
   SERVER-LEVEL ERROR HANDLING
   ----------------------------------------------------------- */
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: "Something went wrong on the server." });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n  TechBridge Platform API running at http://localhost:${PORT}`);
    console.log(`  Frontend available at       http://localhost:${PORT}`);
    console.log(`  Dashboard at               http://localhost:${PORT}/dashboard.html\n`);
  });
}

module.exports = app;
