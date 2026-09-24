/* ===========================================================
   TechBridge — Challenge Hub (Task 5)
   Vanilla JavaScript only: no frameworks.

   Responsibilities:
     1. Track filtering      (All / Data Analytics / Web Development)
     2. Difficulty filtering (All / Beginner / Intermediate / Advanced)
     3. Search by name or keyword
     4. Challenge details in a modal, with no page refresh
   =========================================================== */

/* -----------------------------------------------------------
   1. DATA — an array of challenge objects
   Each object carries both the card-level information and the
   deeper detail shown inside the modal.
   ----------------------------------------------------------- */
var challenges = [
  {
    id: "sales-performance",
    name: "Monthly Sales Performance Review",
    track: "Data Analytics",
    level: "Beginner",
    description: "A small retail business has twelve months of messy sales records and no idea which months actually carried the year. Clean the data, then answer that question.",
    outcome: "A tidy dataset plus a one-page summary naming the best and worst months, with a reason for each.",
    objective: "Turn a raw, inconsistent sales export into a clean dataset you trust, then use it to explain how the business performed month by month.",
    skills: ["Data cleaning", "Spreadsheet formulas", "Pivot Tables", "Basic charting"],
    tools: ["Google Sheets", "Microsoft Excel"],
    deliverables: [
      "A cleaned sheet with duplicates removed and consistent date and currency formats",
      "A Pivot Table of total revenue by month",
      "One chart showing the monthly trend",
      "Three sentences explaining what the chart shows"
    ],
    time: "3–4 hours",
    result: "You can hand someone a number for any month and defend where it came from."
  },
  {
    id: "customer-segments",
    name: "Customer Segmentation Snapshot",
    track: "Data Analytics",
    level: "Beginner",
    description: "Not every customer is worth the same amount. Group a customer list by spend and buying frequency, and find out who the business should actually be paying attention to.",
    outcome: "A segmented customer table showing which group drives the largest share of revenue.",
    objective: "Practise grouping and summarising data so that a long customer list becomes a short, useful set of categories.",
    skills: ["Grouping and aggregation", "Lookup functions", "Percentage calculations", "Data storytelling"],
    tools: ["Google Sheets", "Microsoft Excel"],
    deliverables: [
      "A customer table with a segment label applied to every row",
      "A summary showing revenue and customer count per segment",
      "A short note on which segment you would protect first, and why"
    ],
    time: "3–4 hours",
    result: "A clear view of which customers matter most, backed by numbers rather than a hunch."
  },
  {
    id: "operations-dashboard",
    name: "Operations Dashboard Build",
    track: "Data Analytics",
    level: "Intermediate",
    description: "A manager wants one screen that answers their questions before they have to ask them. Design a dashboard that does exactly that, with no scrolling required.",
    outcome: "A single-screen dashboard with the key operational metrics and at least three supporting charts.",
    objective: "Move from answering one question to designing a view that answers the five questions a manager asks every week.",
    skills: ["Dashboard design", "Data visualization", "Pivot Tables", "Chart selection", "Layout and hierarchy"],
    tools: ["Google Sheets", "Microsoft Excel", "Looker Studio (optional)"],
    deliverables: [
      "Four headline metrics across the top of the dashboard",
      "At least three charts, each answering a specific question",
      "A filter or slicer so the view can be narrowed by period",
      "A short note on why you chose each chart type"
    ],
    time: "5–6 hours",
    result: "A dashboard someone can read in thirty seconds without you standing next to them."
  },
  {
    id: "sql-churn",
    name: "Customer Churn Investigation with SQL",
    track: "Data Analytics",
    level: "Advanced",
    description: "Customers are leaving and nobody knows why. Query across several related tables to find the pattern that the spreadsheet view was hiding.",
    outcome: "A written finding naming the strongest churn signal you found, with the queries that prove it.",
    objective: "Use SQL across multiple tables to test a real business hypothesis, rather than just retrieving rows.",
    skills: ["SQL JOINs", "GROUP BY and aggregation", "Subqueries", "Hypothesis testing", "Written analysis"],
    tools: ["SQLite", "PostgreSQL", "DB Fiddle", "BigQuery sandbox"],
    deliverables: [
      "Queries joining at least three related tables",
      "A churn rate broken down by two different customer attributes",
      "One clearly stated finding, with the query that supports it",
      "One recommendation the business could act on this month"
    ],
    time: "6–8 hours",
    result: "An evidence-backed answer to a question the business genuinely could not answer before."
  },
  {
    id: "landing-page",
    name: "Responsive Landing Page",
    track: "Web Development",
    level: "Beginner",
    description: "Build a single-page site for a small business that works as well on a cheap phone as it does on a laptop. One page, one message, one clear action.",
    outcome: "A responsive landing page with a hero, a features section and a working call to action.",
    objective: "Get comfortable with semantic HTML structure and a mobile-first CSS workflow before adding any complexity.",
    skills: ["Semantic HTML5", "CSS layout", "Flexbox and Grid", "Media queries", "Mobile-first thinking"],
    tools: ["HTML5", "CSS3", "VS Code", "Browser DevTools"],
    deliverables: [
      "A complete page using semantic sectioning elements",
      "A layout that holds up at 360px, 768px and 1280px wide",
      "A hero section with a single, obvious call to action",
      "No horizontal scrolling at any screen width"
    ],
    time: "3–4 hours",
    result: "A page you would be comfortable sending to a real client."
  },
  {
    id: "contact-form",
    name: "Contact Form with Live Validation",
    track: "Web Development",
    level: "Beginner",
    description: "Forms are where most sites quietly fail. Build one that tells people what went wrong while they are typing, instead of after they hit submit.",
    outcome: "A styled, accessible contact form that validates every field and explains each error in plain language.",
    objective: "Learn to handle user input properly — capturing it, checking it, and giving feedback that actually helps.",
    skills: ["Form markup", "JavaScript events", "Input validation", "Accessible labels", "Error messaging"],
    tools: ["HTML5", "CSS3", "JavaScript"],
    deliverables: [
      "Name, email and message fields, each with a visible label",
      "Validation that runs as the user types, not only on submit",
      "Error messages that say what to fix, not just that something is wrong",
      "A confirmation state after a successful submission"
    ],
    time: "3–4 hours",
    result: "A form that someone can complete on the first try without guessing."
  },
  {
    id: "product-filter",
    name: "Filterable Product Catalogue",
    track: "Web Development",
    level: "Intermediate",
    description: "Take a list of twenty products and make it genuinely browsable — filters by category and price, plus a search box, all without a page reload.",
    outcome: "A product grid that filters and searches instantly, including a sensible empty state.",
    objective: "Practise holding data in arrays and objects and re-rendering the page from that data whenever it changes.",
    skills: ["Arrays and objects", "Array filter methods", "DOM manipulation", "Event handling", "State management"],
    tools: ["HTML5", "CSS3", "JavaScript"],
    deliverables: [
      "At least twenty products stored as JavaScript objects",
      "Category and price filters that combine correctly",
      "A search box that filters as the user types",
      "A count of visible results and a 'no results' message"
    ],
    time: "5–6 hours",
    result: "A catalogue that stays fast and clear no matter how the user narrows it down."
  },
  {
    id: "portfolio-site",
    name: "Multi-Page Portfolio Website",
    track: "Web Development",
    level: "Advanced",
    description: "Build the site that gets you hired. Multiple pages, a consistent design system, real project write-ups, and it has to be live on the internet when you are done.",
    outcome: "A deployed, multi-page portfolio with shared navigation, a consistent design system and at least three project pages.",
    objective: "Pull everything together — structure, styling, interactivity, version control and deployment — into one piece of work you own.",
    skills: ["Multi-page architecture", "Design systems", "Responsive design", "Git and GitHub", "Deployment", "Accessibility basics"],
    tools: ["HTML5", "CSS3", "JavaScript", "Git", "GitHub Pages or Netlify"],
    deliverables: [
      "At least four pages sharing one navigation and one stylesheet",
      "CSS custom properties driving colours, spacing and typography",
      "Three project write-ups covering the problem, your approach and the result",
      "A live URL and a public repository with a readable commit history"
    ],
    time: "8–10 hours",
    result: "A portfolio you can put at the top of a job application without apologising for it."
  }
];

/* -----------------------------------------------------------
   2. STATE — variables tracking what the visitor has selected
   ----------------------------------------------------------- */
var selectedTrack = "all";
var selectedLevel = "all";
var searchTerm = "";

/* -----------------------------------------------------------
   3. DOM REFERENCES
   ----------------------------------------------------------- */
var grid = document.getElementById("challenge-grid");
var noResults = document.getElementById("no-results");
var resultCount = document.getElementById("result-count");
var statTotal = document.getElementById("stat-total");
var searchInput = document.getElementById("search-input");
var resetBtn = document.getElementById("reset-btn");
var emptyResetBtn = document.getElementById("empty-reset-btn");
var filterButtons = document.querySelectorAll(".filter-btn");

var modalBackdrop = document.getElementById("modal-backdrop");
var modalTags = document.getElementById("modal-tags");
var modalTitle = document.getElementById("modal-title");
var modalBody = document.getElementById("modal-body");
var modalClose = document.getElementById("modal-close");

var lastFocusedCard = null; // so focus can return where it came from

/* -----------------------------------------------------------
   4. HELPERS
   ----------------------------------------------------------- */

// Turn "Data Analytics" into "data-analytics" for use in a CSS class
function slugify(value) {
  return value.toLowerCase().replace(/\s+/g, "-");
}

// Escape anything that gets placed into markup via innerHTML
function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Find one challenge by its id
function findChallenge(id) {
  for (var i = 0; i < challenges.length; i++) {
    if (challenges[i].id === id) {
      return challenges[i];
    }
  }
  return null;
}

// Does this challenge survive the current filters? (conditional logic)
function matchesFilters(challenge) {
  if (selectedTrack !== "all" && challenge.track !== selectedTrack) {
    return false;
  }
  if (selectedLevel !== "all" && challenge.level !== selectedLevel) {
    return false;
  }
  if (searchTerm !== "") {
    var haystack = (challenge.name + " " + challenge.description + " " +
      challenge.skills.join(" ") + " " + challenge.track).toLowerCase();
    if (haystack.indexOf(searchTerm) === -1) {
      return false;
    }
  }
  return true;
}

/* -----------------------------------------------------------
   5. RENDERING
   ----------------------------------------------------------- */

// Build a single challenge card element
function createChallengeCard(challenge) {
  var card = document.createElement("article");
  card.className = "challenge-card";

  card.innerHTML =
    '<div class="challenge-tags">' +
      '<span class="track-tag track-' + slugify(challenge.track) + '">' + escapeHTML(challenge.track) + '</span>' +
      '<span class="level-tag level-' + slugify(challenge.level) + '">' + escapeHTML(challenge.level) + '</span>' +
    '</div>' +
    '<h3>' + escapeHTML(challenge.name) + '</h3>' +
    '<p>' + escapeHTML(challenge.description) + '</p>' +
    '<div class="challenge-outcome">' +
      '<span class="challenge-outcome-label">Expected outcome</span>' +
      '<p>' + escapeHTML(challenge.outcome) + '</p>' +
    '</div>' +
    '<button type="button" class="btn btn-primary view-challenge-btn" data-id="' + challenge.id + '">' +
      'View challenge' +
    '</button>';

  return card;
}

// Redraw the grid from the current filter state (DOM manipulation)
function renderChallenges() {
  var visible = challenges.filter(matchesFilters);

  grid.innerHTML = "";
  for (var i = 0; i < visible.length; i++) {
    grid.appendChild(createChallengeCard(visible[i]));
  }

  // Empty state
  if (visible.length === 0) {
    noResults.classList.add("is-visible");
  } else {
    noResults.classList.remove("is-visible");
  }

  // Result counter
  if (visible.length === challenges.length) {
    resultCount.innerHTML = "Showing <strong>all " + challenges.length + "</strong> challenges";
  } else {
    resultCount.innerHTML = "Showing <strong>" + visible.length + "</strong> of " +
      challenges.length + " challenges";
  }
}

/* -----------------------------------------------------------
   6. MODAL — challenge details, without leaving the page
   ----------------------------------------------------------- */

function buildChipList(items) {
  var html = '<ul class="modal-chips">';
  for (var i = 0; i < items.length; i++) {
    html += '<li class="modal-chip">' + escapeHTML(items[i]) + '</li>';
  }
  return html + '</ul>';
}

function buildDeliverableList(items) {
  var html = '<ul class="modal-deliverable-list">';
  for (var i = 0; i < items.length; i++) {
    html += '<li>' + escapeHTML(items[i]) + '</li>';
  }
  return html + '</ul>';
}

function openModal(id) {
  var challenge = findChallenge(id);
  if (!challenge) {
    return;
  }

  modalTags.innerHTML =
    '<span class="track-tag track-' + slugify(challenge.track) + '">' + escapeHTML(challenge.track) + '</span>' +
    '<span class="level-tag level-' + slugify(challenge.level) + '">' + escapeHTML(challenge.level) + '</span>';

  modalTitle.textContent = challenge.name;

  modalBody.innerHTML =
    '<div class="modal-block">' +
      '<h3>Objective</h3>' +
      '<p>' + escapeHTML(challenge.objective) + '</p>' +
    '</div>' +
    '<div class="modal-block">' +
      '<h3>Skills you will use</h3>' +
      buildChipList(challenge.skills) +
    '</div>' +
    '<div class="modal-block">' +
      '<h3>Tools</h3>' +
      buildChipList(challenge.tools) +
    '</div>' +
    '<div class="modal-block">' +
      '<h3>What you need to produce</h3>' +
      buildDeliverableList(challenge.deliverables) +
    '</div>' +
    '<div class="modal-block">' +
      '<h3>Estimated time</h3>' +
      '<p>' + escapeHTML(challenge.time) + '</p>' +
    '</div>' +
    '<div class="modal-block">' +
      '<h3>Expected result</h3>' +
      '<div class="modal-result"><p>' + escapeHTML(challenge.result) + '</p></div>' +
    '</div>' +
    '<div class="modal-foot">' +
      '<a href="https://docs.google.com/forms/d/e/1FAIpQLScoEhKAAUHw0lB2lzI5oT4x_VPQNSY2XE8Hv71q0XZ7IS_3bA/viewform" ' +
        'class="btn btn-primary" target="_blank" rel="noopener">Apply to the internship</a>' +
      '<button type="button" class="btn btn-ghost modal-dismiss">Back to challenges</button>' +
    '</div>';

  modalBackdrop.classList.add("is-open");
  modalBackdrop.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  modalClose.focus();
}

function closeModal() {
  modalBackdrop.classList.remove("is-open");
  modalBackdrop.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");

  if (lastFocusedCard) {
    lastFocusedCard.focus();
    lastFocusedCard = null;
  }
}

/* -----------------------------------------------------------
   7. FILTER ACTIONS
   ----------------------------------------------------------- */

// Highlight the selected button within one filter group
function updateFilterButtons(filterName, value) {
  filterButtons.forEach(function (btn) {
    if (btn.getAttribute("data-filter") === filterName) {
      var isSelected = btn.getAttribute("data-value") === value;
      btn.classList.toggle("is-selected", isSelected);
      btn.setAttribute("aria-pressed", isSelected ? "true" : "false");
    }
  });
}

function setTrackFilter(value) {
  selectedTrack = value;
  updateFilterButtons("track", value);
  renderChallenges();
}

function setLevelFilter(value) {
  selectedLevel = value;
  updateFilterButtons("level", value);
  renderChallenges();
}

function resetFilters() {
  searchInput.value = "";
  searchTerm = "";
  selectedTrack = "all";
  selectedLevel = "all";
  updateFilterButtons("track", "all");
  updateFilterButtons("level", "all");
  renderChallenges();
}

/* -----------------------------------------------------------
   8. EVENT LISTENERS
   ----------------------------------------------------------- */

// Filter buttons — one listener per button
filterButtons.forEach(function (btn) {
  btn.addEventListener("click", function () {
    var filterName = btn.getAttribute("data-filter");
    var value = btn.getAttribute("data-value");

    if (filterName === "track") {
      setTrackFilter(value);
    } else if (filterName === "level") {
      setLevelFilter(value);
    }
  });
});

// Search box
searchInput.addEventListener("input", function () {
  searchTerm = searchInput.value.trim().toLowerCase();
  renderChallenges();
});

// Reset buttons
resetBtn.addEventListener("click", resetFilters);
emptyResetBtn.addEventListener("click", resetFilters);

// "View challenge" buttons — delegated, so newly rendered cards work too
grid.addEventListener("click", function (event) {
  var button = event.target.closest(".view-challenge-btn");
  if (button) {
    lastFocusedCard = button;
    openModal(button.getAttribute("data-id"));
  }
});

// Closing the modal: the X, the dismiss button, the backdrop, or Escape
modalClose.addEventListener("click", closeModal);

modalBackdrop.addEventListener("click", function (event) {
  if (event.target === modalBackdrop || event.target.closest(".modal-dismiss")) {
    closeModal();
  }
});

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape" && modalBackdrop.classList.contains("is-open")) {
    closeModal();
  }
});

/* -----------------------------------------------------------
   9. INITIAL RENDER
   ----------------------------------------------------------- */
statTotal.textContent = challenges.length;
updateFilterButtons("track", "all");
updateFilterButtons("level", "all");
renderChallenges();
