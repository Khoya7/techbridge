/* ===========================================================
   TechBridge — Task Management API (Task 7)
   Node.js + Express REST API backed by a JSON data file.

   Endpoints:
     GET  /api/tasks       -> all tasks
     GET  /api/tasks/:id   -> one task
     PUT  /api/tasks/:id   -> update a task's status
   =========================================================== */

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;
const DATA_PATH = path.join(__dirname, "data", "tasks.json");
const VALID_STATUSES = ["completed", "in-progress", "not-started"];

app.use(cors());
app.use(express.json());

/* -----------------------------------------------------------
   DATA HELPERS
   Reads and writes go through these two functions so tasks.json
   stays the single source of truth (no in-memory copy drifting
   away from the file).
   ----------------------------------------------------------- */
function readTasks() {
  const raw = fs.readFileSync(DATA_PATH, "utf-8");
  return JSON.parse(raw);
}

function writeTasks(tasks) {
  if (process.env.VERCEL) {
    return;
  }

  fs.writeFileSync(DATA_PATH, JSON.stringify(tasks, null, 2), "utf-8");
}

const taskStore = readTasks();

/* -----------------------------------------------------------
   ROUTES
   ----------------------------------------------------------- */

// GET /api/tasks -> every task
app.get("/api/tasks", (req, res) => {
  try {
    res.status(200).json({ success: true, tasks: taskStore });
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

    const task = taskStore.find((t) => t.id === id);

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

    const task = taskStore.find((t) => t.id === id);

    if (!task) {
      return res.status(404).json({ success: false, message: `Task ${id} was not found.` });
    }

    task.status = status;
    writeTasks(taskStore);

    res.status(200).json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not update task data." });
  }
});

/* -----------------------------------------------------------
   404 — unknown API route
   ----------------------------------------------------------- */
app.use("/api", (req, res) => {
  res.status(404).json({ success: false, message: "Unknown API endpoint." });
});

app.get("/", (req, res) => {
  res.status(200).json({ success: true, message: "TechBridge Task API is running." });
});

/* -----------------------------------------------------------
   SERVER-LEVEL ERROR HANDLING
   Catches anything that slips past the try/catch blocks above
   (e.g. malformed JSON bodies) so the server returns JSON
   instead of crashing.
   ----------------------------------------------------------- */
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: "Something went wrong on the server." });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`TechBridge Task API running at http://localhost:${PORT}`);
  });
}

module.exports = app;
