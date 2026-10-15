/* Runs before first paint to prevent a flash of the wrong theme. */
(function () {
  var theme;
  try { theme = localStorage.getItem('xiaole-theme'); } catch (_) {}
  if (theme !== 'light' && theme !== 'dark') {
    theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.add('js');
}());
