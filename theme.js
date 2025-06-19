// Theme toggle functionality
/**
 * Handles applying and toggling the light/dark theme.
 * The user's preference is stored in localStorage so the
 * choice persists across visits.
 */
(function() {
  function applyTheme(theme) {
    if (theme === 'dark') {
      document.body.classList.add('dark');
      const icon = document.getElementById('themeToggleIcon');
      if (icon) icon.className = 'fa fa-sun';
    } else {
      document.body.classList.remove('dark');
      const icon = document.getElementById('themeToggleIcon');
      if (icon) icon.className = 'fa fa-moon';
    }
  }

  function init() {
    const toggle = document.getElementById('themeToggle');
    const saved = localStorage.getItem('theme') || 'light';
    applyTheme(saved);
    if (toggle) {
      toggle.addEventListener('click', function() {
        const isDark = document.body.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        applyTheme(isDark ? 'dark' : 'light');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
