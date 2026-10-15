'use strict';
const root = document.documentElement;
const themeButton = document.querySelector('.theme-toggle');
const systemTheme = window.matchMedia('(prefers-color-scheme: light)');
let manualTheme = false;
try { manualTheme = ['light', 'dark'].includes(localStorage.getItem('xiaole-theme')); } catch (_) {}
function setTheme(theme) {
  root.dataset.theme = theme;
  const dark = theme === 'dark';
  themeButton.setAttribute('aria-pressed', String(dark));
  themeButton.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} mode`);
  themeButton.title = `Switch to ${dark ? 'light' : 'dark'} mode`;
  document.querySelector('meta[name="theme-color"]').content = dark ? '#242628' : '#f3f0e9';
}
setTheme(root.dataset.theme);
themeButton.addEventListener('click', () => {
  manualTheme = true;
  setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
  try { localStorage.setItem('xiaole-theme', root.dataset.theme); } catch (_) {}
});
systemTheme.addEventListener('change', event => {
  if (!manualTheme) setTheme(event.matches ? 'light' : 'dark');
});
window.addEventListener('storage', event => {
  if (event.key !== 'xiaole-theme') return;
  manualTheme = ['light', 'dark'].includes(event.newValue);
  setTheme(manualTheme ? event.newValue : (systemTheme.matches ? 'light' : 'dark'));
});
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  navigation.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open navigation');
}
menuButton.addEventListener('click', () => {
  const open = navigation.classList.toggle('is-open');
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', `${open ? 'Close' : 'Open'} navigation`);
});
navigation.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && navigation.classList.contains('is-open')) {
    closeMenu(); menuButton.focus();
  }
});
document.addEventListener('click', event => {
  if (!event.target.closest('.site-header')) closeMenu();
});
function loadGallery(details) {
  details.querySelectorAll('img[data-src]').forEach(img => {
    img.srcset = img.dataset.srcset;
    img.src = img.dataset.src;
    img.removeAttribute('data-src');
    img.removeAttribute('data-srcset');
  });
}
document.querySelectorAll('details').forEach(details => {
  details.addEventListener('toggle', () => { if (details.open) loadGallery(details); });
  if (details.open) loadGallery(details);
});
// Deep links expand the relevant country before scrolling into view.
function revealHash() {
  const id = decodeURIComponent(location.hash.slice(1));
  const target = id && document.getElementById(id);
  if (target && target.matches('details')) {
    target.open = true;
    loadGallery(target);
    target.scrollIntoView({ block: 'start' });
  }
}
window.addEventListener('hashchange', revealHash);
if (location.hash) revealHash();
const photos = document.querySelectorAll('.photo-button');
if (photos.length) {
  const dialog = document.createElement('dialog');
  dialog.className = 'lightbox';
  dialog.setAttribute('aria-label', 'Photo viewer');
  dialog.innerHTML = '<div class="lightbox-toolbar"><p id="photo-caption"></p><button class="icon-button" type="button" aria-label="Close photo"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div><img alt="">';
  dialog.setAttribute('aria-describedby', 'photo-caption');
  document.body.append(dialog);
  const fullImage = dialog.querySelector('img');
  const caption = dialog.querySelector('p');
  photos.forEach(button => button.addEventListener('click', () => {
    const img = button.querySelector('img');
    fullImage.src = button.dataset.full;
    fullImage.alt = img.alt;
    caption.textContent = button.closest('figure').querySelector('figcaption').textContent;
    dialog.showModal();
  }));
  dialog.querySelector('button').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) {
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  } });
  dialog.addEventListener('close', () => fullImage.removeAttribute('src'));
}
document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
