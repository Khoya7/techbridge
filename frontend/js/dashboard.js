/* ===========================================================
   TechBridge — Interactive Intern Dashboard (Task 7)
   Vanilla JavaScript only: no frameworks.

   Task 6 built this dashboard against a static in-file array.
   Task 7 upgrades it to talk to a real backend:

     Frontend  --fetch()-->  Express API  -->  tasks.json

   Responsibilities:
     1. Fetch tasks from the backend and render task cards
     2. Show loading / error / offline states around that fetch
     3. Calculate and display progress (count, remaining, %, bar)
     4. Mark a task complete via PUT and update everything live
     5. Filter tasks by status, and search them
     6. Show task details in a modal (fetched per task)
     7. Drive the Modern Web Technologies explorer
   =========================================================== */

/* -----------------------------------------------------------
   1. API CONFIGURATION
   One place defines the base URL — nothing else in this file
   builds an API URL by hand.
   ----------------------------------------------------------- */
const configuredApiBase = (window.TECHBRIDGE_API_URL || "").replace(/\/$/, "");
const isLocalPage =
  window.location.protocol === "file:" ||
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";
const API_BASE_URL = configuredApiBase || (isLocalPage ? "http://localhost:3000/api" : "/api");

/* -----------------------------------------------------------
   2. STATE
   `tasks` starts empty and is filled entirely from the API —
   nothing here is hard-coded.
   ----------------------------------------------------------- */
var tasks = [];
var TOTAL_TASKS = 8; // corrected once the API responds
var selectedStatus = "all";
var searchTerm = "";
var currentTech = "nextjs";
var toastTimer = null;
var lastFocusedButton = null;
var isLoading = false;
var backendOnline = false;
var pendingTaskIds = {}; // tasks currently mid-PUT, to block duplicate requests

/* -----------------------------------------------------------
   3. TECHNOLOGY DATA — content for the explorer (unchanged from
   Task 6; this is reference content, not task data, so it isn't
   part of the API).
   ----------------------------------------------------------- */
var technologies = {
  nextjs: {
    name: "Next.js",
    kicker: "React framework",
    summary: "Next.js is a framework built on top of React. React on its own only handles the interface; Next.js adds the things a real website needs around it — routing between pages, rendering on the server, image optimisation and a build process — so you are not assembling those yourself.",
    points: [
      "<strong>File-based routing</strong> — a file in the pages folder becomes a URL, with no router to configure",
      "<strong>Server-side rendering</strong> — HTML is generated on the server, so pages load fast and search engines can read them",
      "<strong>API routes</strong> — small backend endpoints can live in the same project as the frontend"
    ],
    usedFor: ["Marketing sites", "E-commerce storefronts", "Dashboards", "Blogs and documentation"],
    footNote: "If you already know React, Next.js is usually the next thing you learn."
  },
  vue: {
    name: "Vue.js",
    kicker: "Progressive framework",
    summary: "Vue is a JavaScript framework for building user interfaces. It is known for being approachable — its template syntax looks close to ordinary HTML, so much of what you already know about markup carries straight over. You can drop it into one page of an existing site, or build an entire application with it.",
    points: [
      "<strong>Template syntax</strong> — HTML with extra attributes, rather than a separate language to learn",
      "<strong>Reactivity</strong> — change the data and the page updates itself, with no manual DOM code",
      "<strong>Single-file components</strong> — markup, styling and logic for one component live in one .vue file"
    ],
    usedFor: ["Admin panels", "Internal tools", "Single-page applications", "Adding interactivity to existing pages"],
    footNote: "Often described as the gentlest step up from plain JavaScript."
  },
  angular: {
    name: "Angular",
    kicker: "Full application framework",
    summary: "Angular is a complete framework maintained by Google. Where other tools let you choose your own routing, forms and HTTP libraries, Angular ships all of it in the box and expects a particular structure. That makes it heavier to start with, but predictable across a large team and a long-lived codebase.",
    points: [
      "<strong>TypeScript by default</strong> — types catch mistakes before the code ever runs",
      "<strong>Everything included</strong> — routing, forms, HTTP and testing come as part of the framework",
      "<strong>Dependency injection</strong> — a formal structure for how the parts of an application find each other"
    ],
    usedFor: ["Enterprise applications", "Banking and insurance systems", "Large internal platforms", "Long-lived products"],
    footNote: "Common where consistency across a big team matters more than moving fast."
  },
  backend: {
    name: "Backend development",
    kicker: "The other half of a platform",
    summary: "This dashboard now has both halves. The frontend is what runs in the visitor's browser; the backend is the Express server that stores task data and answers questions about it. The frontend asks a question over the network with fetch(), the backend answers it, and the page shows the result — exactly what's happening on this page right now.",
    points: [
      "<strong>Node.js</strong> — runs JavaScript outside the browser, so one language covers both sides of an app",
      "<strong>Express.js</strong> — the minimal Node framework this dashboard's API is built on",
      "<strong>Django</strong> — a Python framework that arrives with an admin panel, authentication and database tools already built",
      "<strong>Laravel</strong> — a PHP framework with a strong set of conventions for building web applications quickly"
    ],
    usedFor: ["User accounts and login", "Databases", "File uploads", "Payments", "APIs the frontend calls"],
    footNote: "This dashboard's own /api/tasks endpoint is a small example of exactly this."
  }
};

/* -----------------------------------------------------------
   4. DOM REFERENCES
   ----------------------------------------------------------- */
var taskGrid = document.getElementById("task-grid");
var noTasks = document.getElementById("no-tasks");
var taskCount = document.getElementById("task-count");
var taskSearch = document.getElementById("task-search");
var statusButtons = document.querySelectorAll(".filter-btn[data-status]");
var resetFiltersBtn = document.getElementById("reset-filters-btn");
var emptyResetBtn = document.getElementById("empty-reset-btn");
var filterPanel = document.querySelector(".filter-panel");

var progressHeadline = document.getElementById("progress-headline");
var progressBar = document.getElementById("progress-bar");
var progressFill = document.getElementById("progress-fill");
var statTotal = document.getElementById("stat-total");
var statCompleted = document.getElementById("stat-completed");
var statRemaining = document.getElementById("stat-remaining");
var statPercent = document.getElementById("stat-percent");
var internshipStatus = document.getElementById("internship-status");
var celebration = document.getElementById("celebration");
var continueBtn = document.getElementById("continue-btn");
var resetProgressBtn = document.getElementById("reset-progress-btn");
var progressCard = document.querySelector(".progress-card");

var techButtons = document.querySelectorAll(".tech-btn");
var techPanel = document.getElementById("tech-panel");

var modalBackdrop = document.getElementById("modal-backdrop");
var modalTags = document.getElementById("modal-tags");
var modalTitle = document.getElementById("modal-title");
var modalBody = document.getElementById("modal-body");
var modalClose = document.getElementById("modal-close");

var toast = document.getElementById("toast");
var toastMessage = document.getElementById("toast-message");

var backendStatusEl = document.getElementById("backend-status");
var loadingStateEl = document.getElementById("loading-state");
var errorStateEl = document.getElementById("error-state");
var retryBtn = document.getElementById("retry-btn");

/* -----------------------------------------------------------
   5. HELPERS
   ----------------------------------------------------------- */

// Escape anything placed into markup via innerHTML
function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// "completed" -> "Completed", "not-started" -> "Not Started"
function statusLabel(status) {
  if (status === "completed") {
    return "Completed";
  } else if (status === "in-progress") {
    return "In Progress";
  }
  return "Not Started";
}

function findTask(id) {
  for (var i = 0; i < tasks.length; i++) {
    if (tasks[i].id === id) {
      return tasks[i];
    }
  }
  return null;
}

function countCompleted() {
  return tasks.filter(function (task) {
    return task.status === "completed";
  }).length;
}

// The task an intern should pick up next
function currentTask() {
  for (var i = 0; i < tasks.length; i++) {
    if (tasks[i].status === "in-progress") {
      return tasks[i];
    }
  }
  for (var j = 0; j < tasks.length; j++) {
    if (tasks[j].status === "not-started") {
      return tasks[j];
    }
  }
  return null;
}

// Does this task survive the current filter and search?
function matchesFilters(task) {
  if (selectedStatus !== "all" && task.status !== selectedStatus) {
    return false;
  }
  if (searchTerm !== "") {
    var haystack = (task.title + " " + task.description + " " + (task.detail || "") + " " +
      (task.skills || []).join(" ")).toLowerCase();
    if (haystack.indexOf(searchTerm) === -1) {
      return false;
    }
  }
  return true;
}

/* -----------------------------------------------------------
   6. BACKEND STATUS + LOADING / ERROR STATES
   ----------------------------------------------------------- */
function setBackendStatus(online) {
  backendOnline = online;
  if (!backendStatusEl) {
    return;
  }
  if (online) {
    backendStatusEl.textContent = "Backend status: Connected";
    backendStatusEl.classList.remove("is-offline");
    backendStatusEl.classList.add("is-online");
  } else {
    backendStatusEl.textContent = "Backend status: Offline";
    backendStatusEl.classList.remove("is-online");
    backendStatusEl.classList.add("is-offline");
  }
}

function showLoadingState() {
  isLoading = true;
  if (loadingStateEl) loadingStateEl.classList.add("is-visible");
  if (errorStateEl) errorStateEl.classList.remove("is-visible");
  if (filterPanel) filterPanel.classList.add("is-hidden");
  taskGrid.innerHTML = "";
  noTasks.classList.remove("is-visible");
}

function showErrorState() {
  isLoading = false;
  if (loadingStateEl) loadingStateEl.classList.remove("is-visible");
  if (errorStateEl) errorStateEl.classList.add("is-visible");
  if (filterPanel) filterPanel.classList.add("is-hidden");
  if (progressCard) progressCard.classList.add("is-hidden");
  taskGrid.innerHTML = "";
  noTasks.classList.remove("is-visible");
}

function showLoadedState() {
  isLoading = false;
  if (loadingStateEl) loadingStateEl.classList.remove("is-visible");
  if (errorStateEl) errorStateEl.classList.remove("is-visible");
  if (filterPanel) filterPanel.classList.remove("is-hidden");
  if (progressCard) progressCard.classList.remove("is-hidden");
}

/* -----------------------------------------------------------
   7. API CALLS
   ----------------------------------------------------------- */

// GET /api/tasks — load every task from the backend
async function fetchTasks() {
  showLoadingState();
  try {
    const response = await fetch(`${API_BASE_URL}/tasks`);

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();

    tasks = data.tasks || [];
    TOTAL_TASKS = tasks.length;

    setBackendStatus(true);
    showLoadedState();
    renderAll();
  } catch (error) {
    console.error("Failed to load tasks:", error);
    setBackendStatus(false);
    showErrorState();
  }
}

// GET /api/tasks/:id — used by the View Task modal
async function fetchTask(id) {
  const response = await fetch(`${API_BASE_URL}/tasks/${id}`);

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  const data = await response.json();
  return data.task;
}

// PUT /api/tasks/:id — mark a task's status
async function updateTaskStatus(id, status) {
  const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: status }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  const data = await response.json();
  return data.task;
}

/* -----------------------------------------------------------
   8. PROGRESS RENDERING
   ----------------------------------------------------------- */
function renderProgress() {
  var completed = countCompleted();
  var remaining = TOTAL_TASKS - completed;
  var percent = TOTAL_TASKS === 0 ? 0 : Math.round((completed / TOTAL_TASKS) * 100);

  progressHeadline.textContent = completed + " / " + TOTAL_TASKS + " tasks completed";
  progressFill.style.width = percent + "%";
  progressBar.setAttribute("aria-valuenow", percent);

  statTotal.textContent = TOTAL_TASKS;
  statCompleted.textContent = completed;
  statRemaining.textContent = remaining;
  statPercent.textContent = percent + "%";

  if (TOTAL_TASKS > 0 && completed === TOTAL_TASKS) {
    internshipStatus.textContent = "Internship status: Complete";
    celebration.classList.add("is-visible");
    continueBtn.disabled = true;
    continueBtn.textContent = "All tasks complete";
  } else if (completed === 0) {
    internshipStatus.textContent = "Internship status: Not Started";
    celebration.classList.remove("is-visible");
    continueBtn.disabled = false;
    continueBtn.textContent = "Continue current task";
  } else {
    internshipStatus.textContent = "Internship status: In Progress";
    celebration.classList.remove("is-visible");
    continueBtn.disabled = false;
    continueBtn.textContent = "Continue current task";
  }
}

/* -----------------------------------------------------------
   9. TASK CARD RENDERING (dynamic HTML generation)
   ----------------------------------------------------------- */
function createTaskCard(task) {
  var card = document.createElement("article");
  card.className = "task-card status-" + task.status;

  var isPending = !!pendingTaskIds[task.id];
  var completeButton;

  if (task.status === "completed") {
    completeButton = '<button type="button" class="btn-complete" disabled>Completed</button>';
  } else if (isPending) {
    completeButton = '<button type="button" class="btn-complete complete-btn" disabled>Updating…</button>';
  } else {
    completeButton = '<button type="button" class="btn-complete complete-btn" data-id="' +
      task.id + '">Mark as completed</button>';
  }

  card.innerHTML =
    '<div class="task-card-head">' +
      '<span class="task-card-num">Task ' + task.id + '</span>' +
      '<span class="status-badge status-' + task.status + '">' + statusLabel(task.status) + '</span>' +
    '</div>' +
    '<h3>' + escapeHTML(task.title) + '</h3>' +
    '<p class="task-card-day">Day ' + task.day + ' &middot; ' + escapeHTML(task.difficulty) + '</p>' +
    '<p>' + escapeHTML(task.description) + '</p>' +
    '<div class="task-card-actions">' +
      '<button type="button" class="btn btn-ghost view-task-btn" data-id="' + task.id + '">' +
        'View task' +
      '</button>' +
      completeButton +
    '</div>';

  return card;
}

function renderTasks() {
  var visible = tasks.filter(matchesFilters);

  taskGrid.innerHTML = "";
  for (var i = 0; i < visible.length; i++) {
    taskGrid.appendChild(createTaskCard(visible[i]));
  }

  if (visible.length === 0) {
    noTasks.classList.add("is-visible");
  } else {
    noTasks.classList.remove("is-visible");
  }

  if (visible.length === TOTAL_TASKS) {
    taskCount.innerHTML = "Showing <strong>all " + TOTAL_TASKS + "</strong> tasks";
  } else {
    taskCount.innerHTML = "Showing <strong>" + visible.length + "</strong> of " + TOTAL_TASKS + " tasks";
  }
}

// Redraw everything that depends on task state
function renderAll() {
  renderProgress();
  renderTasks();
}

/* -----------------------------------------------------------
   10. COMPLETING A TASK (PUT /api/tasks/:id)
   ----------------------------------------------------------- */
async function completeTask(id) {
  var task = findTask(id);
  if (!task || task.status === "completed" || pendingTaskIds[id]) {
    return; // already completed, unknown task, or a request is already in flight
  }

  pendingTaskIds[id] = true;
  renderTasks(); // shows the "Updating…" button state immediately

  try {
    var updated = await updateTaskStatus(id, "completed");

    task.status = updated.status;

    saveNextTaskLocally();

    delete pendingTaskIds[id];
    renderAll();

    if (countCompleted() === TOTAL_TASKS) {
      showToast("Every task complete — the whole internship is shipped.");
    } else {
      showToast("Task " + id + " marked as completed.");
    }
  } catch (error) {
    console.error("Failed to update task:", error);
    delete pendingTaskIds[id];
    renderTasks();
    showToast("Couldn't reach the backend — task was not updated.");
  }
}

// Whatever comes next locally becomes "in progress" so the dashboard
// still has a sensible "continue" target between backend calls.
function saveNextTaskLocally() {
  var next = currentTask();
  if (next && next.status === "not-started") {
    next.status = "in-progress";
  }
}

/* -----------------------------------------------------------
   11. TOAST NOTIFICATION
   ----------------------------------------------------------- */
function showToast(message) {
  toastMessage.textContent = message;
  toast.classList.add("is-visible");

  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(function () {
    toast.classList.remove("is-visible");
  }, 3200);
}

/* -----------------------------------------------------------
   12. TASK DETAIL MODAL (GET /api/tasks/:id)
   ----------------------------------------------------------- */
function buildSkillChips(items) {
  var html = '<ul class="modal-chips">';
  for (var i = 0; i < (items || []).length; i++) {
    html += '<li class="modal-chip">' + escapeHTML(items[i]) + '</li>';
  }
  return html + '</ul>';
}

function renderTaskInModal(task) {
  modalTags.innerHTML =
    '<span class="status-badge status-' + task.status + '">' + statusLabel(task.status) + '</span>' +
    '<span class="level-tag level-beginner">Day ' + task.day + '</span>';

  modalTitle.textContent = "Task " + task.id + " — " + task.title;

  var linkHTML = "";
  if (task.link) {
    linkHTML = '<a href="' + task.link + '" class="btn btn-primary">' + escapeHTML(task.linkLabel) + '</a>';
  }

  var completeHTML = "";
  if (task.status !== "completed") {
    completeHTML = '<button type="button" class="btn-complete complete-btn" data-id="' +
      task.id + '">Mark as completed</button>';
  }

  modalBody.innerHTML =
    '<div class="modal-block">' +
      '<h3>What it involves</h3>' +
      '<p>' + escapeHTML(task.detail || "") + '</p>' +
    '</div>' +
    '<div class="modal-block">' +
      '<h3>Difficulty</h3>' +
      '<p>' + escapeHTML(task.difficulty) + '</p>' +
    '</div>' +
    '<div class="modal-block">' +
      '<h3>Skills it builds</h3>' +
      buildSkillChips(task.skills) +
    '</div>' +
    '<div class="modal-block">' +
      '<h3>Current status</h3>' +
      '<div class="modal-result"><p>' + statusLabel(task.status) + '</p></div>' +
    '</div>' +
    '<div class="modal-foot">' +
      linkHTML +
      completeHTML +
      '<button type="button" class="btn btn-ghost modal-dismiss">Back to dashboard</button>' +
    '</div>';
}

async function openModal(id) {
  // Open immediately with whatever is cached locally, then refresh
  // from the API — the brief for Task 7 requires the modal's content
  // to come from a GET /api/tasks/:id request, not local data alone.
  var cached = findTask(id);
  if (!cached) {
    return;
  }

  modalTitle.textContent = "Task " + id + " — " + cached.title;
  modalTags.innerHTML = '<span class="status-badge status-' + cached.status + '">' + statusLabel(cached.status) + '</span>';
  modalBody.innerHTML = '<p class="modal-loading">Loading task details…</p>';

  modalBackdrop.classList.add("is-open");
  modalBackdrop.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  modalClose.focus();

  try {
    var task = await fetchTask(id);
    // The task list may have changed underneath (e.g. via another
    // tab's PUT) — keep the local cache in sync with the API's answer.
    var local = findTask(id);
    if (local) {
      local.status = task.status;
    }
    renderTaskInModal(task);
  } catch (error) {
    console.error("Failed to load task details:", error);
    modalBody.innerHTML =
      '<div class="modal-block">' +
        '<p>Unable to load this task from the backend. ' +
        '<button type="button" class="btn btn-ghost modal-retry-view" data-id="' + id + '">Try again</button></p>' +
      '</div>';
  }
}

function closeModal() {
  modalBackdrop.classList.remove("is-open");
  modalBackdrop.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");

  if (lastFocusedButton && document.body.contains(lastFocusedButton)) {
    lastFocusedButton.focus();
  }
  lastFocusedButton = null;
}

/* -----------------------------------------------------------
   13. TECHNOLOGY EXPLORER
   ----------------------------------------------------------- */
function renderTechnology(key) {
  var tech = technologies[key];
  if (!tech) {
    return;
  }

  currentTech = key;

  techButtons.forEach(function (btn) {
    var isSelected = btn.getAttribute("data-tech") === key;
    btn.classList.toggle("is-selected", isSelected);
    btn.setAttribute("aria-selected", isSelected ? "true" : "false");
  });

  techPanel.setAttribute("aria-labelledby", "tab-" + key);

  var pointsHTML = '<ul class="tech-list">';
  for (var i = 0; i < tech.points.length; i++) {
    pointsHTML += '<li>' + tech.points[i] + '</li>';
  }
  pointsHTML += '</ul>';

  var usedForHTML = '<div class="tech-chips">';
  for (var j = 0; j < tech.usedFor.length; j++) {
    usedForHTML += '<span class="modal-chip">' + escapeHTML(tech.usedFor[j]) + '</span>';
  }
  usedForHTML += '</div>';

  techPanel.classList.add("is-updating");
  window.setTimeout(function () {
    techPanel.innerHTML =
      '<p class="tech-panel-eyebrow">' + escapeHTML(tech.kicker) + '</p>' +
      '<h3>' + escapeHTML(tech.name) + '</h3>' +
      '<p>' + escapeHTML(tech.summary) + '</p>' +
      '<div class="tech-block">' +
        '<h4>Key ideas</h4>' +
        pointsHTML +
      '</div>' +
      '<div class="tech-block">' +
        '<h4>Commonly used for</h4>' +
        usedForHTML +
      '</div>' +
      '<div class="tech-panel-foot">' +
        '<p>' + escapeHTML(tech.footNote) + '</p>' +
      '</div>';
    techPanel.classList.remove("is-updating");
  }, 150);
}

/* -----------------------------------------------------------
   14. FILTER ACTIONS
   ----------------------------------------------------------- */
function setStatusFilter(value) {
  selectedStatus = value;
  statusButtons.forEach(function (btn) {
    var isSelected = btn.getAttribute("data-status") === value;
    btn.classList.toggle("is-selected", isSelected);
    btn.setAttribute("aria-pressed", isSelected ? "true" : "false");
  });
  renderTasks();
}

function resetFilters() {
  taskSearch.value = "";
  searchTerm = "";
  setStatusFilter("all");
}

/* -----------------------------------------------------------
   15. EVENT LISTENERS
   ----------------------------------------------------------- */

statusButtons.forEach(function (btn) {
  btn.addEventListener("click", function () {
    setStatusFilter(btn.getAttribute("data-status"));
  });
});

taskSearch.addEventListener("input", function () {
  searchTerm = taskSearch.value.trim().toLowerCase();
  renderTasks();
});

resetFiltersBtn.addEventListener("click", resetFilters);
emptyResetBtn.addEventListener("click", resetFilters);

resetProgressBtn.addEventListener("click", function () {
  // Resetting progress means resetting the data on the backend, one
  // PUT per task, so tasks.json genuinely reflects "not started".
  if (isLoading) return;
  var confirmed = window.confirm("Reset every task back to Not Started on the backend?");
  if (!confirmed) return;

  (async function () {
    showLoadingState();
    try {
      for (var i = 0; i < tasks.length; i++) {
        var status = tasks[i].id === 1 ? "in-progress" : "not-started";
        await updateTaskStatus(tasks[i].id, status);
      }
      showToast("Progress reset back to Task 1.");
      await fetchTasks();
    } catch (error) {
      console.error("Failed to reset progress:", error);
      setBackendStatus(false);
      showErrorState();
    }
  })();
});

// Task card buttons — delegated, so freshly rendered cards work too
taskGrid.addEventListener("click", function (event) {
  var viewButton = event.target.closest(".view-task-btn");
  if (viewButton) {
    lastFocusedButton = viewButton;
    openModal(Number(viewButton.getAttribute("data-id")));
    return;
  }

  var completeButton = event.target.closest(".complete-btn");
  if (completeButton) {
    completeTask(Number(completeButton.getAttribute("data-id")));
  }
});

continueBtn.addEventListener("click", function () {
  var task = currentTask();
  if (!task) {
    return;
  }
  resetFilters();
  lastFocusedButton = continueBtn;
  openModal(task.id);
});

techButtons.forEach(function (btn) {
  btn.addEventListener("click", function () {
    renderTechnology(btn.getAttribute("data-tech"));
  });
});

modalClose.addEventListener("click", closeModal);

modalBackdrop.addEventListener("click", function (event) {
  if (event.target === modalBackdrop || event.target.closest(".modal-dismiss")) {
    closeModal();
    return;
  }

  var completeButton = event.target.closest(".complete-btn");
  if (completeButton) {
    completeTask(Number(completeButton.getAttribute("data-id")));
    closeModal();
    return;
  }

  var retryViewButton = event.target.closest(".modal-retry-view");
  if (retryViewButton) {
    openModal(Number(retryViewButton.getAttribute("data-id")));
  }
});

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape" && modalBackdrop.classList.contains("is-open")) {
    closeModal();
  }
});

// Backend offline / error state — retry button
if (retryBtn) {
  retryBtn.addEventListener("click", function () {
    fetchTasks();
  });
}

/* -----------------------------------------------------------
   16. INITIAL LOAD
   ----------------------------------------------------------- */
setStatusFilter("all");
renderTechnology(currentTech);
fetchTasks();
