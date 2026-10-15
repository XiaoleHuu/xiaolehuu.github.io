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
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const accordionAnimations = new WeakMap();
function setExpanded(details, expand, animate = true) {
  const previous = accordionAnimations.get(details);
  const from = details.getBoundingClientRect().height;
  if (previous) {
    previous.animation.cancel();
    accordionAnimations.delete(details);
  }
  const summary = details.querySelector('summary');
  const panel = details.querySelector('.accordion-panel');
  if (!animate || reducedMotion.matches || !panel || !details.animate) {
    details.open = expand;
    details.style.overflow = '';
    if (expand) loadGallery(details);
    return;
  }
  details.open = true;
  if (expand) loadGallery(details);
  const border = parseFloat(getComputedStyle(details).borderBottomWidth) || 0;
  const to = summary.getBoundingClientRect().height + (expand ? panel.getBoundingClientRect().height : 0) + border;
  details.style.overflow = 'hidden';
  const animation = details.animate([{ height: `${from}px` }, { height: `${to}px` }], {
    duration: 420,
    easing: 'cubic-bezier(.22, .68, 0, 1)',
  });
  accordionAnimations.set(details, { animation, expanding: expand });
  animation.onfinish = () => {
    details.open = expand;
    details.style.overflow = '';
    accordionAnimations.delete(details);
    animation.cancel();
  };
}
document.querySelectorAll('details').forEach(details => {
  details.addEventListener('toggle', () => { if (details.open) loadGallery(details); });
  details.querySelector('summary').addEventListener('click', event => {
    event.preventDefault();
    const animation = accordionAnimations.get(details);
    setExpanded(details, animation ? !animation.expanding : !details.open);
  });
  if (details.open) loadGallery(details);
});
function revealHash() {
  let id;
  try { id = decodeURIComponent(location.hash.slice(1)); } catch (_) { return; }
  const target = id && document.getElementById(id);
  if (target && target.matches('details')) {
    setExpanded(target, true, false);
    target.scrollIntoView({ block: 'start' });
  }
}
window.addEventListener('hashchange', revealHash);
if (location.hash) revealHash();
const photos = document.querySelectorAll('.photo-button');
if (photos.length) {
  const arrow = direction => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${direction === 'left' ? 'm14 6-6 6 6 6' : 'm10 6 6 6-6 6'}"/></svg>`;
  const dialog = document.createElement('dialog');
  dialog.className = 'lightbox';
  dialog.setAttribute('aria-label', 'Photo gallery');
  dialog.setAttribute('aria-describedby', 'photo-caption');
  dialog.innerHTML = `<div class="lightbox-toolbar"><p class="lightbox-album"></p><p class="lightbox-counter" aria-live="polite"></p><button class="icon-button lightbox-close" type="button" aria-label="Close photo"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div><div class="lightbox-viewport" role="region" aria-label="Photographs. Swipe or use arrow keys to browse." tabindex="0"></div><div class="lightbox-bottom"><p id="photo-caption" aria-live="polite"></p><div class="lightbox-controls"><button type="button" class="icon-button lightbox-prev" aria-label="Previous photo">${arrow('left')}</button><button type="button" class="icon-button lightbox-next" aria-label="Next photo">${arrow('right')}</button></div></div>`;
  document.body.append(dialog);
  const viewport = dialog.querySelector('.lightbox-viewport');
  const caption = dialog.querySelector('#photo-caption');
  const counter = dialog.querySelector('.lightbox-counter');
  const previous = dialog.querySelector('.lightbox-prev');
  const next = dialog.querySelector('.lightbox-next');
  let collection = [];
  let currentIndex = 0;
  let resizeFrame;
  let scrollTimer;
  function updateSlide(index) {
    if (!collection.length) return;
    currentIndex = Math.max(0, Math.min(index, collection.length - 1));
    const selected = collection[currentIndex];
    caption.textContent = selected.closest('figure').querySelector('.photo-caption').textContent;
    counter.textContent = `${String(currentIndex + 1).padStart(2, '0')} / ${String(collection.length).padStart(2, '0')}`;
    previous.disabled = currentIndex === 0;
    next.disabled = currentIndex === collection.length - 1;
    // Fetch the selected print and immediate neighbours only.
    collection.forEach((button, i) => {
      const slide = viewport.children[i];
      slide.setAttribute('aria-label', `Photograph ${i + 1} of ${collection.length}`);
      const image = slide.querySelector('img');
      if (Math.abs(i - currentIndex) <= 1 && !image.hasAttribute('src')) image.src = button.dataset.full;
    });
  }
  function moveTo(index, animate = true) {
    updateSlide(index);
    viewport.scrollTo({ left: currentIndex * viewport.clientWidth, behavior: animate && !reducedMotion.matches ? 'smooth' : 'instant' });
  }
  photos.forEach(button => button.addEventListener('click', () => {
    const album = button.closest('details');
    collection = [...album.querySelectorAll('.photo-button')];
    dialog.querySelector('.lightbox-album').textContent = album.querySelector('.album-name').textContent;
    viewport.replaceChildren(...collection.map(item => {
      const slide = document.createElement('div');
      slide.className = 'lightbox-slide';
      slide.setAttribute('role', 'group');
      const image = document.createElement('img');
      image.alt = item.querySelector('img').alt;
      image.decoding = 'async';
      slide.append(image);
      return slide;
    }));
    dialog.showModal();
    moveTo(collection.indexOf(button), false);
  }));
  previous.addEventListener('click', () => moveTo(currentIndex - 1));
  next.addEventListener('click', () => moveTo(currentIndex + 1));
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      moveTo(currentIndex + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  viewport.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      if (!dialog.open) return;
      const index = Math.round(viewport.scrollLeft / viewport.clientWidth);
      if (index !== currentIndex) updateSlide(index);
    }, 100);
  }, { passive: true });
  window.addEventListener('resize', () => {
    if (!dialog.open) return;
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => moveTo(currentIndex, false));
  });
  dialog.querySelector('.lightbox-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => { clearTimeout(scrollTimer); viewport.replaceChildren(); collection = []; });
}
document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
