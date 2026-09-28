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
const { neon } = require("@neondatabase/serverless");

const app = express();
const PORT = process.env.PORT || 3000;
const TASKS_PATH = path.join(__dirname, "data", "tasks.json");
const CHALLENGES_PATH = path.join(__dirname, "data", "challenges.json");
const FRONTEND_PATH = path.join(__dirname, "..", "frontend");
const VALID_STATUSES = ["completed", "in-progress", "not-started"];
const database = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;
let databaseReady;

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
  if (process.env.VERCEL) {
    const error = new Error("This Vercel deployment uses read-only JSON files. Configure a persistent database to save admin changes.");
    error.code = "HOSTED_JSON_STORAGE_UNAVAILABLE";
    throw error;
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function sendMutationError(res, error, fallbackMessage) {
  if (error.code === "HOSTED_JSON_STORAGE_UNAVAILABLE") {
    return res.status(503).json({ success: false, message: error.message });
  }
  return res.status(500).json({ success: false, message: fallbackMessage });
}

async function ensureDatabase() {
  if (!databaseReady) {
    databaseReady = database`
      CREATE TABLE IF NOT EXISTS techbridge_data (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL
      )
    `.catch((error) => {
      databaseReady = null;
      throw error;
    });
  }
  return databaseReady;
}

async function readCollection(key, filePath) {
  if (!database) return readJSON(filePath);

  await ensureDatabase();
  let rows = await database`SELECT value FROM techbridge_data WHERE key = ${key}`;
  if (rows.length === 0) {
    const initialValue = readJSON(filePath);
    await database`
      INSERT INTO techbridge_data (key, value)
      VALUES (${key}, ${JSON.stringify(initialValue)}::jsonb)
      ON CONFLICT (key) DO NOTHING
    `;
    rows = await database`SELECT value FROM techbridge_data WHERE key = ${key}`;
  }
  return rows[0].value;
}

async function writeCollection(key, filePath, value) {
  if (!database) {
    writeJSON(filePath, value);
    return;
  }

  await ensureDatabase();
  await database`
    INSERT INTO techbridge_data (key, value)
    VALUES (${key}, ${JSON.stringify(value)}::jsonb)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `;
}

function readTasks() { return readCollection("tasks", TASKS_PATH); }
function writeTasks(tasks) { return writeCollection("tasks", TASKS_PATH, tasks); }

function readChallenges() { return readCollection("challenges", CHALLENGES_PATH); }
function writeChallenges(challenges) { return writeCollection("challenges", CHALLENGES_PATH, challenges); }

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
app.get("/api/tasks", async (req, res) => {
  try {
    const tasks = await readTasks();
    res.status(200).json({ success: true, tasks, total: tasks.length });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not read task data." });
  }
});

// GET /api/tasks/:id -> a single task
app.get("/api/tasks/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: "Task id must be a number." });
    }

    const tasks = await readTasks();
    const task = tasks.find((t) => t.id === id);

    if (!task) {
      return res.status(404).json({ success: false, message: `Task ${id} was not found.` });
    }

    res.status(200).json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not read task data." });
  }
});

// PUT /api/tasks/:id -> update task fields
app.put("/api/tasks/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: "Task id must be a number." });
    }

    const tasks = await readTasks();
    const task = tasks.find((t) => t.id === id);

    if (!task) {
      return res.status(404).json({ success: false, message: `Task ${id} was not found.` });
    }

    const editableFields = ["title", "description", "status", "difficulty", "detail", "skills", "link"];
    const updates = Object.fromEntries(editableFields
      .filter((field) => Object.prototype.hasOwnProperty.call(req.body, field))
      .map((field) => [field, req.body[field]]));

    if (Object.prototype.hasOwnProperty.call(req.body, "day")) {
      const day = req.body.day === null || req.body.day === "" ? null : Number(req.body.day);
      if (day !== null && (!Number.isInteger(day) || day < 1)) {
        return res.status(400).json({ success: false, message: "day must be a positive integer or null." });
      }
      updates.day = day;
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: "No editable task fields were provided." });
    }
    if (updates.status && !VALID_STATUSES.includes(updates.status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${VALID_STATUSES.join(", ")}.` });
    }
    if (updates.skills && !Array.isArray(updates.skills)) {
      return res.status(400).json({ success: false, message: "skills must be an array." });
    }
    for (const field of ["title", "description", "difficulty", "detail", "link"]) {
      if (Object.prototype.hasOwnProperty.call(updates, field) && typeof updates[field] !== "string") {
        return res.status(400).json({ success: false, message: `${field} must be a string.` });
      }
    }
    if ((updates.title !== undefined && !updates.title.trim()) || (updates.description !== undefined && !updates.description.trim())) {
      return res.status(400).json({ success: false, message: "title and description cannot be empty." });
    }

    Object.assign(task, updates);
    await writeTasks(tasks);

    res.status(200).json({ success: true, task });
  } catch (error) {
    sendMutationError(res, error, "Could not update task data.");
  }
});

// POST /api/tasks -> add a new task (admin)
app.post("/api/tasks", async (req, res) => {
  try {
    const { title, description, difficulty, day, detail, skills, link, linkLabel } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: "title and description are required." });
    }

    const tasks = await readTasks();
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
    await writeTasks(tasks);

    res.status(201).json({ success: true, task: newTask });
  } catch (error) {
    sendMutationError(res, error, "Could not create task.");
  }
});

// DELETE /api/tasks/:id -> delete a task (admin)
app.delete("/api/tasks/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: "Task id must be a number." });
    }

    const tasks = await readTasks();
    const index = tasks.findIndex((t) => t.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: `Task ${id} was not found.` });
    }

    const [removed] = tasks.splice(index, 1);
    await writeTasks(tasks);

    res.status(200).json({ success: true, task: removed, message: `Task ${id} deleted.` });
  } catch (error) {
    sendMutationError(res, error, "Could not delete task.");
  }
});

/* -----------------------------------------------------------
   CHALLENGE ROUTES
   ----------------------------------------------------------- */

// GET /api/challenges -> every challenge
app.get("/api/challenges", async (req, res) => {
  try {
    const challenges = await readChallenges();

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
app.get("/api/challenges/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const challenges = await readChallenges();
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
app.post("/api/challenges", async (req, res) => {
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

    const challenges = await readChallenges();
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
    await writeChallenges(challenges);

    res.status(201).json({ success: true, challenge: newChallenge });
  } catch (error) {
    sendMutationError(res, error, "Could not create challenge.");
  }
});

// DELETE /api/challenges/:id -> delete a challenge (admin)
app.delete("/api/challenges/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const challenges = await readChallenges();
    const index = challenges.findIndex((c) => c.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: `Challenge '${id}' was not found.` });
    }

    const [removed] = challenges.splice(index, 1);
    await writeChallenges(challenges);

    res.status(200).json({ success: true, challenge: removed, message: `Challenge '${id}' deleted.` });
  } catch (error) {
    sendMutationError(res, error, "Could not delete challenge.");
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
