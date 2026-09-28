/* ===========================================================
   TechBridge — Admin Panel (Task 8)
   Vanilla JavaScript only: no frameworks.

   Responsibilities:
     1. Load and display all tasks in a searchable table
     2. Load and display all challenges in a searchable table
    3. Update task fields via PUT /api/tasks/:id
     4. Add a new task via POST /api/tasks
     5. Delete a task via DELETE /api/tasks/:id
     6. Add a new challenge via POST /api/challenges
     7. Delete a challenge via DELETE /api/challenges/:id
    8. Edit tasks and challenges through their PUT endpoints
    9. Show loading, error and success states
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
var editTarget = null;
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
var editModal = document.getElementById("edit-modal");
var editModalTitle = document.getElementById("edit-modal-title");
var editForm = document.getElementById("edit-form");
var editFormFields = document.getElementById("edit-form-fields");
var editFormStatus = document.getElementById("edit-form-status");
var editSaveBtn = document.getElementById("edit-save-btn");

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
    if (!res.ok) {
      var errData = await res.json().catch(function () { return {}; });
      throw new Error(errData.message || "HTTP " + res.status);
    }
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
        "<button type=\"button\" class=\"btn-edit\" data-type=\"task\" data-id=\"" + task.id + "\">Edit</button>" +
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
    if (!res.ok) throw new Error("HTTP " + res.status);
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
        "<button type=\"button\" class=\"btn-edit\" data-type=\"challenge\" data-id=\"" + escapeHTML(c.id) + "\">Edit</button>" +
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
   11. EDIT — shared modal for tasks & challenges
   ----------------------------------------------------------- */
function appendEditField(name, label, value, type, options) {
  var group = document.createElement("div");
  group.className = "form-group";

  var labelEl = document.createElement("label");
  labelEl.htmlFor = "edit-field-" + name;
  labelEl.textContent = label;
  group.appendChild(labelEl);

  var field;
  if (type === "textarea" || type === "comma-list" || type === "line-list") {
    field = document.createElement("textarea");
    field.className = "form-input form-textarea";
    if (type === "comma-list") field.dataset.format = "comma";
    if (type === "line-list") field.dataset.format = "lines";
    field.value = Array.isArray(value)
      ? value.join(type === "line-list" ? "\n" : ", ")
      : (value || "");
  } else if (type === "select") {
    field = document.createElement("select");
    field.className = "form-input form-select";
    options.forEach(function (option) {
      var optionEl = document.createElement("option");
      optionEl.value = option;
      optionEl.textContent = option;
      field.appendChild(optionEl);
    });
    field.value = value;
  } else {
    field = document.createElement("input");
    field.className = "form-input";
    field.type = type === "number" ? "number" : "text";
    if (type === "number") field.min = "1";
    field.value = value == null ? "" : value;
  }

  field.id = "edit-field-" + name;
  field.name = name;
  group.appendChild(field);
  editFormFields.appendChild(group);
}

function closeEditModal() {
  editModal.classList.remove("is-open");
  editModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  editTarget = null;
}

function openEditModal(type, id) {
  var item = type === "task"
    ? allTasks.find(function (task) { return String(task.id) === String(id); })
    : allChallenges.find(function (challenge) { return challenge.id === id; });
  if (!item) return;

  editTarget = { type: type, id: id };
  editModalTitle.textContent = "Edit " + (type === "task" ? "task " + id : item.name);
  editFormFields.replaceChildren();

  if (type === "task") {
    appendEditField("title", "Title", item.title, "text");
    appendEditField("day", "Day", item.day, "number");
    appendEditField("description", "Description", item.description, "textarea");
    appendEditField("status", "Status", item.status, "select", ["not-started", "in-progress", "completed"]);
    appendEditField("difficulty", "Difficulty", item.difficulty, "text");
    appendEditField("detail", "Detailed description", item.detail, "textarea");
    appendEditField("skills", "Skills (comma-separated)", item.skills, "comma-list");
    appendEditField("link", "Link", item.link, "text");
    appendEditField("linkLabel", "Link label", item.linkLabel, "text");
  } else {
    appendEditField("name", "Name", item.name, "text");
    appendEditField("track", "Track", item.track, "select", ["Data Analytics", "Web Development"]);
    appendEditField("level", "Difficulty", item.level, "select", ["Beginner", "Intermediate", "Advanced"]);
    appendEditField("description", "Description", item.description, "textarea");
    appendEditField("outcome", "Expected outcome", item.outcome, "textarea");
    appendEditField("objective", "Objective", item.objective, "textarea");
    appendEditField("skills", "Skills (comma-separated)", item.skills, "comma-list");
    appendEditField("tools", "Tools (comma-separated)", item.tools, "comma-list");
    appendEditField("deliverables", "Deliverables (one per line)", item.deliverables, "line-list");
    appendEditField("time", "Estimated time", item.time, "text");
    appendEditField("result", "Result", item.result, "textarea");
  }

  editFormStatus.textContent = "";
  editModal.classList.add("is-open");
  editModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  editFormFields.querySelector("input, select, textarea").focus();
}

editForm.addEventListener("submit", async function (e) {
  e.preventDefault();
  if (!editTarget) return;

  var target = editTarget;
  var payload = {};
  new FormData(editForm).forEach(function (value, key) {
    payload[key] = value;
  });
  editFormFields.querySelectorAll("[data-format]").forEach(function (field) {
    var delimiter = field.dataset.format === "lines" ? /\r?\n/ : ",";
    payload[field.name] = field.value.split(delimiter).map(function (value) { return value.trim(); }).filter(Boolean);
  });
  if (target.type === "task") {
    payload.day = payload.day ? Number(payload.day) : null;
  }

  editSaveBtn.disabled = true;
  editFormStatus.textContent = "Saving…";
  try {
    var collection = target.type === "task" ? "tasks" : "challenges";
    var res = await fetch(API_BASE + "/" + collection + "/" + encodeURIComponent(target.id), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    var data = await res.json().catch(function () { return {}; });
    if (!res.ok) {
      var message = data.message || "HTTP " + res.status;
      if (res.status === 404 && (!data.message || data.message === "Unknown API endpoint.")) {
        message = "The API server is out of date. Restart the local backend or deploy the latest backend code to enable challenge edits.";
      }
      throw new Error(message);
    }

    if (target.type === "task") {
      allTasks = allTasks.map(function (task) { return task.id === data.task.id ? data.task : task; });
      renderTasksTable();
    } else {
      allChallenges = allChallenges.map(function (challenge) { return challenge.id === data.challenge.id ? data.challenge : challenge; });
      renderChallengesTable();
    }
    closeEditModal();
    showToast("Changes saved successfully.");
  } catch (err) {
    console.error("Failed to save edits:", err);
    editFormStatus.textContent = "Save failed: " + err.message;
    showToast("Could not save changes.", "error");
  } finally {
    editSaveBtn.disabled = false;
  }
});

document.getElementById("edit-modal-close").addEventListener("click", closeEditModal);
document.getElementById("edit-modal-cancel").addEventListener("click", closeEditModal);
editModal.addEventListener("click", function (e) {
  if (e.target === editModal) closeEditModal();
});

/* -----------------------------------------------------------
   12. DELETE — shared modal for tasks & challenges
   ----------------------------------------------------------- */
document.addEventListener("click", function (e) {
  var editBtn = e.target.closest(".btn-edit");
  if (editBtn) {
    openEditModal(editBtn.getAttribute("data-type"), editBtn.getAttribute("data-id"));
    return;
  }

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
  if (e.key === "Escape" && editModal.classList.contains("is-open")) closeEditModal();
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
