function loadTheme() {
  document.body.classList.remove('dark-mode');
  try {
    localStorage.removeItem('studyBuddy_theme');
  } catch {
    /* ignore storage errors */
  }
  updateThemeToggleIcon();
}

function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  updateThemeToggleIcon();
}

function updateThemeToggleIcon() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  const isDark = document.body.classList.contains('dark-mode');
  btn.textContent = isDark ? '☀️' : '🌙';
  btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
}

loadTheme();

document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
});
