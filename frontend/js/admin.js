/* ===========================================================
   TechBridge — Admin Panel (Task 8)
   Vanilla JavaScript only: no frameworks.

   Responsibilities:
     1. Load and display all tasks in a searchable table
     2. Load and display all challenges in a searchable table
     3. Update a task's status via PUT /api/tasks/:id
     4. Add a new task via POST /api/tasks
     5. Delete a task via DELETE /api/tasks/:id
     6. Add a new challenge via POST /api/challenges
     7. Delete a challenge via DELETE /api/challenges/:id
     8. Show loading, error and success states
   =========================================================== */

/* -----------------------------------------------------------
   1. API CONFIGURATION
   ----------------------------------------------------------- */
var API_BASE = (window.TECHBRIDGE_API_URL || "http://localhost:3000/api").replace(/\/$/, "");

/* -----------------------------------------------------------
   2. STATE
   ----------------------------------------------------------- */
var allTasks = [];
var allChallenges = [];
var taskSearchTerm = "";
var challengeSearchTerm = "";
var deleteTarget = null; // { type: "task"|"challenge", id, label }
var toastTimer = null;

/* -----------------------------------------------------------
   3. DOM REFERENCES
   ----------------------------------------------------------- */
var apiStatusEl = document.getElementById("admin-api-status");

// Tabs
var tabBtns = document.querySelectorAll(".admin-tab");
var panels = document.querySelectorAll(".admin-panel");

// Tasks
var tasksLoading = document.getElementById("admin-tasks-loading");
var tasksError = document.getElementById("admin-tasks-error");
var tasksTableWrap = document.getElementById("admin-tasks-table-wrap");
var tasksTbody = document.getElementById("admin-tasks-tbody");
var tasksNoResults = document.getElementById("admin-tasks-no-results");
var taskSearchInput = document.getElementById("admin-task-search");
var retryTasksBtn = document.getElementById("retry-tasks-btn");
var addTaskForm = document.getElementById("add-task-form");
var addTaskStatus = document.getElementById("add-task-status");
var taskEditModal = document.getElementById("task-edit-modal");
var taskEditForm = document.getElementById("task-edit-form");
var taskEditStatus = document.getElementById("task-edit-message");
var taskEditSave = document.getElementById("task-edit-save");

// Challenges
var challengesLoading = document.getElementById("admin-challenges-loading");
var challengesError = document.getElementById("admin-challenges-error");
var challengesTableWrap = document.getElementById("admin-challenges-table-wrap");
var challengesTbody = document.getElementById("admin-challenges-tbody");
var challengesNoResults = document.getElementById("admin-challenges-no-results");
var challengeSearchInput = document.getElementById("admin-challenge-search");
var retryChallengesBtn = document.getElementById("retry-challenges-btn");
var addChallengeForm = document.getElementById("add-challenge-form");
var addChallengeStatus = document.getElementById("add-challenge-status");

// Delete modal
var deleteModal = document.getElementById("delete-modal");
var deleteModalMsg = document.getElementById("delete-modal-msg");
var deleteModalConfirm = document.getElementById("delete-modal-confirm");
var deleteModalClose = document.getElementById("delete-modal-close");
var deleteModalCancel = document.getElementById("delete-modal-cancel");

// Toast
var toastEl = document.getElementById("toast");
var toastMsgEl = document.getElementById("toast-message");

/* -----------------------------------------------------------
   4. HELPERS
   ----------------------------------------------------------- */
function escapeHTML(v) {
  return String(v || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function statusLabel(status) {
  if (status === "completed") return "Completed";
  if (status === "in-progress") return "In Progress";
  return "Not Started";
}

function showToast(message, type) {
  toastMsgEl.textContent = message;
  toastEl.className = "toast is-visible" + (type === "error" ? " toast-error" : "");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(function () {
    toastEl.classList.remove("is-visible");
  }, 3500);
}

function setApiStatus(online) {
  if (!apiStatusEl) return;
  if (online) {
    apiStatusEl.innerHTML = '<span class="api-dot api-online" aria-hidden="true"></span> API Connected';
    apiStatusEl.className = "admin-api-status is-online";
  } else {
    apiStatusEl.innerHTML = '<span class="api-dot api-offline" aria-hidden="true"></span> API Offline';
    apiStatusEl.className = "admin-api-status is-offline";
  }
}

function clearFormErrors(formId) {
  var form = document.getElementById(formId);
  if (!form) return;
  form.querySelectorAll(".form-error").forEach(function (el) {
    el.textContent = "";
  });
  form.querySelectorAll(".form-input").forEach(function (el) {
    el.classList.remove("is-invalid");
  });
}

function setFieldError(inputId, errId, msg) {
  var input = document.getElementById(inputId);
  var err = document.getElementById(errId);
  if (input) input.classList.add("is-invalid");
  if (err) err.textContent = msg;
}

async function apiErrorMessage(res) {
  var data = await res.json().catch(function () { return {}; });
  return data.message || "HTTP " + res.status;
}

/* -----------------------------------------------------------
   5. TABS
   ----------------------------------------------------------- */
tabBtns.forEach(function (btn) {
  btn.addEventListener("click", function () {
    var target = btn.getAttribute("data-tab");

    tabBtns.forEach(function (b) {
      var isActive = b.getAttribute("data-tab") === target;
      b.classList.toggle("is-active", isActive);
      b.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    panels.forEach(function (p) {
      var isTarget = p.id === "panel-" + target;
      p.classList.toggle("is-hidden", !isTarget);
    });
  });
});

/* -----------------------------------------------------------
   6. LOAD TASKS
   ----------------------------------------------------------- */
async function loadTasks() {
  tasksLoading.classList.add("is-visible");
  tasksError.classList.remove("is-visible");
  tasksTableWrap.classList.add("is-hidden");

  try {
    var res = await fetch(API_BASE + "/tasks");
    if (!res.ok) throw new Error("HTTP " + res.status);
    var data = await res.json();
    allTasks = data.tasks || [];
    setApiStatus(true);
    renderTasksTable();
    tasksLoading.classList.remove("is-visible");
    tasksTableWrap.classList.remove("is-hidden");
  } catch (err) {
    console.error("Failed to load tasks:", err);
    setApiStatus(false);
    tasksLoading.classList.remove("is-visible");
    tasksError.classList.add("is-visible");
  }
}

function renderTasksTable() {
  var q = taskSearchTerm.toLowerCase();
  var filtered = q
    ? allTasks.filter(function (t) {
        return (t.title + " " + t.description + " " + (t.difficulty || "")).toLowerCase().includes(q);
      })
    : allTasks;

  tasksTbody.innerHTML = "";
  tasksNoResults.classList.toggle("is-visible", filtered.length === 0);

  filtered.forEach(function (task) {
    var tr = document.createElement("tr");
    tr.innerHTML =
      "<td>" + escapeHTML(task.id) + "</td>" +
      "<td>" + escapeHTML(task.day) + "</td>" +
      "<td class=\"admin-table-title\">" + escapeHTML(task.title) + "</td>" +
      "<td>" + escapeHTML(task.difficulty) + "</td>" +
      "<td><span class=\"status-badge status-" + escapeHTML(task.status) + "\">" + statusLabel(task.status) + "</span></td>" +
      "<td class=\"admin-table-actions\">" +
        "<button type=\"button\" class=\"btn btn-ghost btn-edit-task\" data-id=\"" + task.id + "\">Edit</button>" +
        "<select class=\"form-input form-select admin-status-select\" data-id=\"" + task.id + "\" aria-label=\"Change status for task " + escapeHTML(task.id) + "\">" +
          "<option value=\"not-started\"" + (task.status === "not-started" ? " selected" : "") + ">Not Started</option>" +
          "<option value=\"in-progress\"" + (task.status === "in-progress" ? " selected" : "") + ">In Progress</option>" +
          "<option value=\"completed\"" + (task.status === "completed" ? " selected" : "") + ">Completed</option>" +
        "</select>" +
        "<button type=\"button\" class=\"btn-delete\" data-type=\"task\" data-id=\"" + task.id + "\" data-label=\"Task " + task.id + ": " + escapeHTML(task.title) + "\" aria-label=\"Delete task " + escapeHTML(task.id) + "\">Delete</button>" +
      "</td>";
    tasksTbody.appendChild(tr);
  });
}

function openTaskEdit(taskId) {
  var task = allTasks.find(function (item) { return String(item.id) === String(taskId); });
  if (!task) return;

  taskEditForm.elements.title.value = task.title || "";
  taskEditForm.elements.day.value = task.day == null ? "" : task.day;
  taskEditForm.elements.description.value = task.description || "";
  taskEditForm.elements.status.value = task.status || "not-started";
  taskEditForm.elements.difficulty.value = task.difficulty || "";
  taskEditForm.elements.detail.value = task.detail || "";
  taskEditForm.elements.skills.value = Array.isArray(task.skills) ? task.skills.join(", ") : "";
  taskEditForm.elements.link.value = task.link || "";
  taskEditForm.dataset.taskId = task.id;
  taskEditStatus.textContent = "";
  taskEditModal.classList.add("is-open");
  taskEditModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  taskEditForm.elements.title.focus();
}

function closeTaskEdit() {
  taskEditModal.classList.remove("is-open");
  taskEditModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

tasksTbody.addEventListener("click", function (e) {
  var editButton = e.target.closest(".btn-edit-task");
  if (editButton) openTaskEdit(editButton.getAttribute("data-id"));
});

taskEditForm.addEventListener("submit", async function (e) {
  e.preventDefault();
  var taskId = taskEditForm.dataset.taskId;
  var payload = {
    title: taskEditForm.elements.title.value.trim(),
    day: taskEditForm.elements.day.value === "" ? null : Number(taskEditForm.elements.day.value),
    description: taskEditForm.elements.description.value.trim(),
    status: taskEditForm.elements.status.value,
    difficulty: taskEditForm.elements.difficulty.value.trim(),
    detail: taskEditForm.elements.detail.value.trim(),
    skills: taskEditForm.elements.skills.value.split(",").map(function (skill) { return skill.trim(); }).filter(Boolean),
    link: taskEditForm.elements.link.value.trim()
  };

  taskEditSave.disabled = true;
  taskEditStatus.textContent = "Saving...";
  try {
    var res = await fetch(API_BASE + "/tasks/" + encodeURIComponent(taskId), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    var data = await res.json().catch(function () { return {}; });
    if (!res.ok) throw new Error(data.message || "HTTP " + res.status);

    var task = allTasks.find(function (item) { return String(item.id) === String(taskId); });
    if (task) Object.assign(task, data.task);
    renderTasksTable();
    closeTaskEdit();
    showToast("Task changes saved.");
  } catch (err) {
    console.error("Failed to save task:", err);
    taskEditStatus.textContent = "Save failed: " + err.message;
    showToast("Could not save task changes.", "error");
  } finally {
    taskEditSave.disabled = false;
  }
});

document.getElementById("task-edit-close").addEventListener("click", closeTaskEdit);
document.getElementById("task-edit-cancel").addEventListener("click", closeTaskEdit);
taskEditModal.addEventListener("click", function (e) {
  if (e.target === taskEditModal) closeTaskEdit();
});

/* -----------------------------------------------------------
   7. UPDATE TASK STATUS
   ----------------------------------------------------------- */
tasksTbody.addEventListener("change", async function (e) {
  var select = e.target.closest(".admin-status-select");
  if (!select) return;

  var id = Number(select.getAttribute("data-id"));
  var status = select.value;
  var originalValue = select.getAttribute("data-original") || null;

  select.disabled = true;
  try {
    var res = await fetch(API_BASE + "/tasks/" + id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: status })
    });
    if (!res.ok) throw new Error(await apiErrorMessage(res));
    var data = await res.json();

    // Update local state
    var task = allTasks.find(function (t) { return t.id === id; });
    if (task) task.status = data.task.status;

    showToast('Task ' + id + ' updated to "' + statusLabel(status) + '".');
    renderTasksTable();
  } catch (err) {
    console.error("Failed to update task:", err);
    showToast(err.message, "error");
    renderTasksTable();
  }
});

/* -----------------------------------------------------------
   8. ADD TASK
   ----------------------------------------------------------- */
addTaskForm.addEventListener("submit", async function (e) {
  e.preventDefault();
  clearFormErrors("add-task-form");

  var title = document.getElementById("new-task-title").value.trim();
  var desc = document.getElementById("new-task-desc").value.trim();
  var day = parseInt(document.getElementById("new-task-day").value) || null;
  var difficulty = document.getElementById("new-task-difficulty").value;
  var link = document.getElementById("new-task-link").value.trim();
  var detail = document.getElementById("new-task-detail").value.trim();
  var skillsRaw = document.getElementById("new-task-skills").value.trim();

  var valid = true;
  if (!title) { setFieldError("new-task-title", "new-task-title-err", "Title is required."); valid = false; }
  if (!desc) { setFieldError("new-task-desc", "new-task-desc-err", "Description is required."); valid = false; }
  if (!valid) return;

  var skills = skillsRaw ? skillsRaw.split(",").map(function (s) { return s.trim(); }).filter(Boolean) : [];

  var submitBtn = document.getElementById("add-task-btn");
  submitBtn.disabled = true;
  addTaskStatus.textContent = "Saving…";

  try {
    var res = await fetch(API_BASE + "/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title, description: desc, day: day, difficulty: difficulty, link: link, detail: detail, skills: skills })
    });
    if (!res.ok) {
      var errData = await res.json();
      throw new Error(errData.message || "HTTP " + res.status);
    }
    var data = await res.json();
    allTasks.push(data.task);
    renderTasksTable();
    addTaskForm.reset();
    addTaskStatus.textContent = "";
    showToast('Task "' + data.task.title + '" added successfully.');
  } catch (err) {
    console.error("Failed to add task:", err);
    addTaskStatus.textContent = "Error: " + err.message;
    showToast("Could not add task.", "error");
  } finally {
    submitBtn.disabled = false;
  }
});

/* -----------------------------------------------------------
   9. LOAD CHALLENGES
   ----------------------------------------------------------- */
async function loadChallenges() {
  challengesLoading.classList.add("is-visible");
  challengesError.classList.remove("is-visible");
  challengesTableWrap.classList.add("is-hidden");

  try {
    var res = await fetch(API_BASE + "/challenges");
    if (!res.ok) throw new Error("HTTP " + res.status);
    var data = await res.json();
    allChallenges = data.challenges || [];
    renderChallengesTable();
    challengesLoading.classList.remove("is-visible");
    challengesTableWrap.classList.remove("is-hidden");
  } catch (err) {
    console.error("Failed to load challenges:", err);
    challengesLoading.classList.remove("is-visible");
    challengesError.classList.add("is-visible");
  }
}

function renderChallengesTable() {
  var q = challengeSearchTerm.toLowerCase();
  var filtered = q
    ? allChallenges.filter(function (c) {
        return (c.name + " " + c.track + " " + c.level + " " + c.description).toLowerCase().includes(q);
      })
    : allChallenges;

  challengesTbody.innerHTML = "";
  challengesNoResults.classList.toggle("is-visible", filtered.length === 0);

  filtered.forEach(function (c) {
    var tr = document.createElement("tr");
    tr.innerHTML =
      "<td class=\"admin-table-code\">" + escapeHTML(c.id) + "</td>" +
      "<td class=\"admin-table-title\">" + escapeHTML(c.name) + "</td>" +
      "<td><span class=\"challenge-tag track-" + (c.track === "Data Analytics" ? "da" : "wd") + "\">" + escapeHTML(c.track) + "</span></td>" +
      "<td><span class=\"level-tag level-" + escapeHTML(c.level.toLowerCase()) + "\">" + escapeHTML(c.level) + "</span></td>" +
      "<td class=\"admin-table-actions\">" +
        "<button type=\"button\" class=\"btn-delete\" data-type=\"challenge\" data-id=\"" + escapeHTML(c.id) + "\" data-label=\"" + escapeHTML(c.name) + "\" aria-label=\"Delete challenge " + escapeHTML(c.id) + "\">Delete</button>" +
      "</td>";
    challengesTbody.appendChild(tr);
  });
}

/* -----------------------------------------------------------
   10. ADD CHALLENGE
   ----------------------------------------------------------- */
addChallengeForm.addEventListener("submit", async function (e) {
  e.preventDefault();
  clearFormErrors("add-challenge-form");

  var id = document.getElementById("new-ch-id").value.trim().toLowerCase().replace(/\s+/g, "-");
  var name = document.getElementById("new-ch-name").value.trim();
  var track = document.getElementById("new-ch-track").value;
  var level = document.getElementById("new-ch-level").value;
  var desc = document.getElementById("new-ch-desc").value.trim();
  var outcome = document.getElementById("new-ch-outcome").value.trim();
  var skillsRaw = document.getElementById("new-ch-skills").value.trim();
  var time = document.getElementById("new-ch-time").value.trim();

  var valid = true;
  if (!id) { setFieldError("new-ch-id", "new-ch-id-err", "ID is required."); valid = false; }
  if (!name) { setFieldError("new-ch-name", "new-ch-name-err", "Name is required."); valid = false; }
  if (!desc) { setFieldError("new-ch-desc", "new-ch-desc-err", "Description is required."); valid = false; }
  if (!valid) return;

  var skills = skillsRaw ? skillsRaw.split(",").map(function (s) { return s.trim(); }).filter(Boolean) : [];

  var submitBtn = document.getElementById("add-challenge-btn");
  submitBtn.disabled = true;
  addChallengeStatus.textContent = "Saving…";

  try {
    var res = await fetch(API_BASE + "/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: id, name: name, track: track, level: level, description: desc, outcome: outcome, skills: skills, time: time })
    });
    if (!res.ok) {
      var errData = await res.json();
      throw new Error(errData.message || "HTTP " + res.status);
    }
    var data = await res.json();
    allChallenges.push(data.challenge);
    renderChallengesTable();
    addChallengeForm.reset();
    addChallengeStatus.textContent = "";
    showToast('Challenge "' + data.challenge.name + '" added successfully.');
  } catch (err) {
    console.error("Failed to add challenge:", err);
    addChallengeStatus.textContent = "Error: " + err.message;
    showToast("Could not add challenge.", "error");
  } finally {
    submitBtn.disabled = false;
  }
});

/* -----------------------------------------------------------
   11. DELETE — shared modal for tasks & challenges
   ----------------------------------------------------------- */
document.addEventListener("click", function (e) {
  var btn = e.target.closest(".btn-delete");
  if (!btn) return;

  deleteTarget = {
    type: btn.getAttribute("data-type"),
    id: btn.getAttribute("data-id"),
    label: btn.getAttribute("data-label")
  };

  deleteModalMsg.textContent = 'Are you sure you want to delete "' + deleteTarget.label + '"? This cannot be undone.';
  deleteModal.classList.add("is-open");
  deleteModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  deleteModalConfirm.focus();
});

deleteModalConfirm.addEventListener("click", async function () {
  if (!deleteTarget) return;
  closeDeleteModal();

  var type = deleteTarget.type;
  var id = deleteTarget.id;
  var label = deleteTarget.label;
  deleteTarget = null;

  try {
    var url = API_BASE + "/" + (type === "task" ? "tasks" : "challenges") + "/" + id;
    var res = await fetch(url, { method: "DELETE" });
    if (!res.ok) throw new Error("HTTP " + res.status);

    if (type === "task") {
      allTasks = allTasks.filter(function (t) { return String(t.id) !== String(id); });
      renderTasksTable();
    } else {
      allChallenges = allChallenges.filter(function (c) { return c.id !== id; });
      renderChallengesTable();
    }

    showToast('"' + label + '" deleted successfully.');
  } catch (err) {
    console.error('Failed to delete:', err);
    showToast('Could not delete "' + label + '".', 'error');
  }
});

function closeDeleteModal() {
  deleteModal.classList.remove("is-open");
  deleteModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

deleteModalClose.addEventListener("click", closeDeleteModal);
deleteModalCancel.addEventListener("click", closeDeleteModal);
deleteModal.addEventListener("click", function (e) {
  if (e.target === deleteModal || e.target.closest(".modal-dismiss")) closeDeleteModal();
});
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && deleteModal.classList.contains("is-open")) closeDeleteModal();
  if (e.key === "Escape" && taskEditModal.classList.contains("is-open")) closeTaskEdit();
});

/* -----------------------------------------------------------
   12. SEARCH
   ----------------------------------------------------------- */
taskSearchInput.addEventListener("input", function () {
  taskSearchTerm = taskSearchInput.value.trim();
  renderTasksTable();
});

challengeSearchInput.addEventListener("input", function () {
  challengeSearchTerm = challengeSearchInput.value.trim();
  renderChallengesTable();
});

/* -----------------------------------------------------------
   13. RETRY
   ----------------------------------------------------------- */
retryTasksBtn.addEventListener("click", loadTasks);
retryChallengesBtn.addEventListener("click", loadChallenges);

/* -----------------------------------------------------------
   14. INITIAL LOAD
   ----------------------------------------------------------- */
loadTasks();
loadChallenges();
