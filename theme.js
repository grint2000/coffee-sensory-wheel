// Theme toggle functionality
(function() {
  function safeStorageGet(key, fallback = null) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch (e) {
      return fallback;
    }
  }

  function safeStorageSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {}
  }

  function applyTheme(theme) {
    const isDark = theme === 'dark';
    document.body.classList.toggle('dark', isDark);
    document.documentElement.classList.toggle('dark', isDark);

    const icon = document.getElementById('themeToggleIcon');
    if (icon) icon.className = isDark ? 'fa fa-sun' : 'fa fa-moon';
  }

  function init() {
    const toggle = document.getElementById('themeToggle');
    const preferred = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const saved = safeStorageGet('theme', preferred);
    applyTheme(saved);

    if (toggle) {
      toggle.addEventListener('click', function() {
        const isDark = !document.body.classList.contains('dark');
        const nextTheme = isDark ? 'dark' : 'light';
        safeStorageSet('theme', nextTheme);
        applyTheme(nextTheme);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
