/* ===========================================================
   TechBridge — Interactive Internship Roadmap (Task 4)
   Vanilla JavaScript only: no frameworks.
   =========================================================== */

// ---------- Data: each task is an object, each track an array ----------
var dataAnalyticsTasks = [
  { day: 1, title: "Data Cleaning Basics", description: "Clean a messy dataset using Google Sheets or Excel. Identify and fix duplicate rows, blank cells, inconsistent formatting, and incorrect data types.", difficulty: "Beginner" },
  { day: 4, title: "Formulas & Pivot Tables", description: "Use spreadsheet formulas and Pivot Tables to answer questions and extract useful insights from a dataset.", difficulty: "Beginner" },
  { day: 8, title: "Data Visualization", description: "Create charts and a simple dashboard that communicate useful insights from a dataset.", difficulty: "Beginner → Intermediate" },
  { day: 11, title: "Introduction to SQL", description: "Practice basic SQL queries and use them to answer real-world questions about data.", difficulty: "Beginner → Intermediate" },
  { day: 15, title: "SQL Joins & Aggregations", description: "Use JOIN, GROUP BY and aggregate functions such as COUNT, SUM and AVG to analyze information across multiple tables.", difficulty: "Intermediate" },
  { day: 19, title: "Lookup Functions & Data Wrangling", description: "Use VLOOKUP or XLOOKUP to combine related datasets and handle data mismatches.", difficulty: "Intermediate" },
  { day: 22, title: "Mini Analysis Project", description: "Complete a small end-to-end analysis involving data cleaning, formulas, Pivot Tables, charts and recommendations.", difficulty: "Intermediate" },
  { day: 26, title: "Capstone Project", description: "Complete a larger project combining spreadsheet analysis and SQL using at least two related tables.", difficulty: "Intermediate" }
];

var webDevelopmentTasks = [
  { day: 1, title: "Build the TechBridge Homepage", description: "Create the first version of the TechBridge website using HTML and CSS.", difficulty: "Beginner" },
  { day: 4, title: "Build the TechBridge Programs Experience", description: "Create a Programs experience presenting TechBridge's available learning programs.", difficulty: "Beginner" },
  { day: 8, title: "Build the Internship Tasks Experience", description: "Create an interface that presents the TechBridge internship tasks and helps users understand the internship journey.", difficulty: "Beginner → Intermediate" },
  { day: 11, title: "Build an Interactive Internship Roadmap", description: "Use JavaScript to allow visitors to switch between the Data Analytics and Web Development internship tracks.", difficulty: "Beginner → Intermediate" },
  { day: 15, title: "Build the Intern Registration Experience", description: "Create a professional registration and onboarding interface for TechBridge interns.", difficulty: "Intermediate" },
  { day: 19, title: "Build the Task Submission System", description: "Create an interface through which interns can prepare and submit their task work.", difficulty: "Intermediate" },
  { day: 22, title: "Build the Intern Dashboard", description: "Create a dashboard where an intern can view their profile, progress, tasks and submissions.", difficulty: "Intermediate" },
  { day: 26, title: "Build the Complete TechBridge Internship Platform", description: "Combine the different components created during the internship into a complete TechBridge platform.", difficulty: "Intermediate" }
];

// A lookup object keyed by track id — each value bundles a display label with its tasks
var tracks = {
  "data-analytics": { label: "Data Analytics", tasks: dataAnalyticsTasks },
  "web-development": { label: "Web Development", tasks: webDevelopmentTasks }
};

// ---------- State ----------
var currentTrack = "web-development"; // the track shown by default

// ---------- DOM references ----------
var trackButtons = document.querySelectorAll(".track-btn");
var viewingValue = document.getElementById("viewing-value");
var roadmapList = document.getElementById("roadmap-list");
var progressRail = document.getElementById("progress-rail");

// ---------- Helper: map a difficulty string to a CSS class ----------
function difficultyClass(difficulty) {
  if (difficulty === "Beginner") {
    return "level-beginner";
  } else if (difficulty === "Intermediate") {
    return "level-intermediate";
  } else {
    return "level-beginner-intermediate";
  }
}

// ---------- Function: build one task card (DOM manipulation) ----------
function createTaskCard(task, index) {
  var card = document.createElement("article");
  card.className = "roadmap-card";

  var dayBlock = document.createElement("div");
  dayBlock.className = "roadmap-card-day";
  dayBlock.innerHTML =
    '<span class="roadmap-card-day-num">' + task.day + '</span>' +
    '<span class="roadmap-card-day-label">Day</span>';

  var body = document.createElement("div");
  body.className = "roadmap-card-body";

  var meta = document.createElement("div");
  meta.className = "roadmap-card-meta";
  meta.innerHTML =
    '<span class="roadmap-card-task-num">Task ' + (index + 1) + ' of 8</span>' +
    '<span class="roadmap-difficulty ' + difficultyClass(task.difficulty) + '">' + task.difficulty + '</span>';

  var heading = document.createElement("h3");
  heading.textContent = task.title;

  var description = document.createElement("p");
  description.textContent = task.description;

  body.appendChild(meta);
  body.appendChild(heading);
  body.appendChild(description);

  card.appendChild(dayBlock);
  card.appendChild(body);

  return card;
}

// ---------- Function: build the 30-day progression rail ----------
function renderProgressRail(tasks) {
  progressRail.innerHTML = "";
  for (var i = 0; i < tasks.length; i++) {
    var day = document.createElement("div");
    day.className = "progress-day";
    day.innerHTML =
      '<span class="progress-day-node"></span>' +
      '<span class="progress-day-label">Day ' + tasks[i].day + '</span>';
    progressRail.appendChild(day);

    if (i < tasks.length - 1) {
      var connector = document.createElement("span");
      connector.className = "progress-connector";
      progressRail.appendChild(connector);
    }
  }
}

// ---------- Function: switch the visible track ----------
function renderTrack(trackKey) {
  var track = tracks[trackKey];
  if (!track) {
    return; // unknown track id — do nothing
  }

  currentTrack = trackKey;

  // Update button states
  trackButtons.forEach(function (btn) {
    var isSelected = btn.getAttribute("data-track") === trackKey;
    btn.classList.toggle("is-selected", isSelected);
    btn.setAttribute("aria-selected", isSelected ? "true" : "false");
  });

  // Update the "Currently viewing" badge
  viewingValue.textContent = track.label;
  roadmapList.setAttribute("aria-labelledby", "tab-" + trackKey);

  // Rebuild the task list and progression rail with a short fade
  roadmapList.classList.add("is-updating");
  window.setTimeout(function () {
    roadmapList.innerHTML = "";
    for (var i = 0; i < track.tasks.length; i++) {
      roadmapList.appendChild(createTaskCard(track.tasks[i], i));
    }
    renderProgressRail(track.tasks);
    roadmapList.classList.remove("is-updating");
  }, 160);
}

// ---------- Event listeners: detect a track selection ----------
trackButtons.forEach(function (btn) {
  btn.addEventListener("click", function () {
    renderTrack(btn.getAttribute("data-track"));
  });
});

// ---------- Initial render ----------
renderTrack(currentTrack);
