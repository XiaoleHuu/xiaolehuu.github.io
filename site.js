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
// Decode off the reveal path; keep the inline preview until the photograph is ready.
const fullImageLoads = new WeakMap();
function revealImage(img) {
  if (!img.dataset.src || fullImageLoads.has(img)) return;
  img.loading = 'eager';
  img.fetchPriority = 'high';
  img.srcset = img.dataset.srcset;
  img.src = img.dataset.src;
  const ready = img.decode().then(() => {
    img.classList.add('is-ready');
    img.removeAttribute('data-src');
    img.removeAttribute('data-srcset');
  }).catch(() => {
    // Preserve the inline print and allow another attempt when the album reopens.
  }).finally(() => fullImageLoads.delete(img));
  fullImageLoads.set(img, ready);
}
const galleryImageObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting || !entry.target.closest('details').open) return;
    galleryImageObserver.unobserve(entry.target);
    revealImage(entry.target);
  });
}, { rootMargin: '180px 0px' }) : null;
function loadGallery(details) {
  const firstRow = details.querySelector('.gallery-row');
  details.querySelectorAll('.photo-button img[data-src]').forEach(img => {
    if (!galleryImageObserver || firstRow.contains(img)) revealImage(img);
    else galleryImageObserver.observe(img);
  });
}
// Warm only a small first print near the viewport or on explicit pointer/keyboard intent.
const warmedImages = new WeakSet();
const warmQueue = [];
let warming = false;
async function warmNext() {
  if (warming || !warmQueue.length) return;
  warming = true;
  const img = warmQueue.shift();
  if (img.dataset.src && !fullImageLoads.has(img)) {
    const src = img.dataset.srcset.split(',')[0].trim().split(/\s+/)[0];
    const preview = new Image();
    preview.fetchPriority = 'low';
    preview.decoding = 'async';
    preview.src = src;
    try {
      await preview.decode();
      img.closest('.photo-button').style.setProperty('--photo-preview', `url("${src}")`);
    } catch (_) {}
  }
  warming = false;
  warmNext();
}
function warmGallery(details) {
  const connection = navigator.connection;
  if (connection && (connection.saveData || /(^|-)2g$/.test(connection.effectiveType))) return;
  const img = details.querySelector('.photo-button img[data-src]');
  if (!img || warmedImages.has(img)) return;
  warmedImages.add(img);
  warmQueue.push(img);
  warmNext();
}
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const accordionAnimations = new WeakMap();
const movingBlocks = new WeakMap();
// Following sections slide with transforms, so opening a tall gallery does not
// recalculate the layout on every animation frame.
function followingBlocks(details) {
  const blocks = [];
  for (let node = details; node && node !== document.body; node = node.parentElement) {
    for (let next = node.nextElementSibling; next; next = next.nextElementSibling) {
      if (!next.matches('script, dialog')) blocks.push(next);
    }
  }
  return blocks;
}
function setExpanded(details, expand, animate = true) {
  const previous = accordionAnimations.get(details);
  const panel = details.querySelector('.accordion-panel');
  const blocks = followingBlocks(details);
  const positions = blocks.map(block => block.getBoundingClientRect().top);
  const wasOpen = details.open;
  const panelStyle = panel && wasOpen ? getComputedStyle(panel) : null;
  const from = {
    clipPath: panelStyle && panelStyle.clipPath !== 'none' ? panelStyle.clipPath : (wasOpen ? 'inset(0 0 0% 0)' : 'inset(0 0 100% 0)'),
    transform: panelStyle ? panelStyle.transform : 'translateY(-10px)',
    opacity: panelStyle ? panelStyle.opacity : '0',
  };
  if (previous) { previous.animations.forEach(animation => animation.cancel()); accordionAnimations.delete(details); }
  blocks.forEach(block => movingBlocks.get(block)?.cancel());
  delete details.dataset.animating;
  if (!animate || reducedMotion.matches || !panel || !panel.animate) {
    details.open = expand;
    if (expand) loadGallery(details);
    return;
  }
  // Measure the destination once. Closing keeps the panel visible just for its reveal.
  details.open = expand;
  if (expand) loadGallery(details);
  const destinations = blocks.map(block => block.getBoundingClientRect().top);
  details.open = true;
  const basePositions = blocks.map(block => block.getBoundingClientRect().top);
  const duration = 300;
  const timing = { duration, easing: 'cubic-bezier(.25, .1, .25, 1)', fill: 'both' };
  const animations = blocks.map((block, index) => {
    const animation = block.animate([
      { transform: `translateY(${positions[index] - basePositions[index]}px)` },
      { transform: `translateY(${destinations[index] - basePositions[index]}px)` },
    ], timing);
    movingBlocks.set(block, animation);
    return animation;
  });
  const reveal = panel.animate([from, {
    clipPath: expand ? 'inset(0 0 0% 0)' : 'inset(0 0 100% 0)',
    transform: expand ? 'translateY(0)' : 'translateY(-10px)',
    opacity: expand ? '1' : '0',
  }], timing);
  animations.push(reveal);
  const state = { animations, expanding: expand };
  accordionAnimations.set(details, state);
  details.dataset.animating = '';
  reveal.onfinish = () => {
    if (accordionAnimations.get(details) !== state) return;
    details.open = expand;
    animations.forEach(animation => animation.cancel());
    accordionAnimations.delete(details);
    delete details.dataset.animating;
  };
}
document.querySelectorAll('details').forEach(details => {
  details.addEventListener('toggle', () => { if (details.open) loadGallery(details); });
  const summary = details.querySelector('summary');
  summary.addEventListener('pointerenter', () => warmGallery(details), { passive: true });
  summary.addEventListener('focus', () => warmGallery(details));
  summary.addEventListener('pointerdown', () => warmGallery(details), { passive: true });
  summary.addEventListener('click', event => {
    event.preventDefault();
    const animation = accordionAnimations.get(details);
    setExpanded(details, animation ? !animation.expanding : !details.open);
  });
  if (details.open) loadGallery(details);
});
if ('IntersectionObserver' in window) {
  const nearbyAlbums = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { warmGallery(entry.target.closest('details')); nearbyAlbums.unobserve(entry.target); }
    });
  }, { rootMargin: '160px 0px' });
  const observeAlbums = () => document.querySelectorAll('details:has(.gallery) > summary').forEach(summary => nearbyAlbums.observe(summary));
  window.addEventListener('load', () => {
    if ('requestIdleCallback' in window) requestIdleCallback(observeAlbums, { timeout: 1200 });
    else setTimeout(observeAlbums, 300);
  }, { once: true });
}
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
  photos.forEach(button => button.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const album = button.closest('[data-figure-gallery], details');
    collection = [...album.querySelectorAll('.photo-button')];
    const publication = album.matches('[data-figure-gallery]');
    dialog.setAttribute('aria-label', publication ? 'Publication figures' : 'Photo gallery');
    viewport.setAttribute('aria-label', publication ? 'Figures. Swipe or use arrow keys to browse.' : 'Photographs. Swipe or use arrow keys to browse.');
    dialog.querySelector('.lightbox-album').textContent = publication ? 'Publication figures' : album.querySelector('.album-name').textContent;
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
