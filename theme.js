// Theme toggle functionality
/**
 * Handles applying and toggling the light/dark theme.
 * The user's preference is stored in localStorage so the
 * choice persists across visits.
 */
(function() {
  const THEME_KEY = 'noel_sca_theme';
  const LEGACY_THEME_KEY = 'theme';

  function safeGetTheme() {
    try {
      return localStorage.getItem(THEME_KEY) || localStorage.getItem(LEGACY_THEME_KEY) || 'light';
    } catch (_) {
      return 'light';
    }
  }

  function safeSetTheme(theme) {
    try {
      localStorage.setItem(THEME_KEY, theme);
      localStorage.setItem(LEGACY_THEME_KEY, theme);
    } catch (_) {
      // keep UI functional even when storage is blocked
    }
  }

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
    const saved = safeGetTheme();
    applyTheme(saved);
    if (toggle) {
      toggle.addEventListener('click', function() {
        const isDark = document.body.classList.toggle('dark');
        const theme = isDark ? 'dark' : 'light';
        safeSetTheme(theme);
        applyTheme(theme);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
