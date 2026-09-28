/* ===========================================================
   TechBridge — Dark Mode Toggle (Task 8 — Optional Feature)
   Persists the user's preference in localStorage.

   Usage: include this script on any page that has a
   #dark-mode-toggle button and the .dark-mode-toggle class.
   =========================================================== */

(function () {
  var STORAGE_KEY = "techbridge-dark-mode";
  var toggleBtn = document.getElementById("dark-mode-toggle");
  var icon = toggleBtn ? toggleBtn.querySelector(".dm-icon") : null;

  /* ---------- Apply preference immediately (before paint) ---------- */
  function getPreference() {
    try {
      var stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        return stored === "dark";
      }
      // Respect the OS preference if no override is stored
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch (e) {
      return false;
    }
  }

  function setDarkMode(isDark) {
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    try {
      window.localStorage.setItem(STORAGE_KEY, isDark ? "dark" : "light");
    } catch (e) { /* localStorage unavailable */ }

    if (icon) {
      icon.textContent = isDark ? "☀️" : "🌙";
    }
    if (toggleBtn) {
      toggleBtn.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
      toggleBtn.setAttribute("title", isDark ? "Switch to light mode" : "Switch to dark mode");
    }
  }

  // Apply on load
  var isDark = getPreference();
  setDarkMode(isDark);

  // Toggle on click
  if (toggleBtn) {
    toggleBtn.addEventListener("click", function () {
      var currentlyDark = document.documentElement.getAttribute("data-theme") === "dark";
      setDarkMode(!currentlyDark);
    });
  }
})();
