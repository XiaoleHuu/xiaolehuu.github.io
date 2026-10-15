# Xiaole Hu · Personal Website

A lightweight static personal website. Published from the `main` branch to https://xiaolehuu.github.io/.

## Local preview

No Node build step or third-party browser resources are required.

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Open http://127.0.0.1:4173/.

## Appearance and interaction

- Soft cream / sage light palette and warm charcoal dark palette.
- The first visit follows the system theme. The theme button saves your choice across pages and visits, and synchronizes it across tabs.
- Desktop navigation becomes a collapsible menu below 600px. Content also adapts at 800px; gallery rows combine landscape and portrait prints on desktop, adapt to two columns on tablets when needed, and become one column on phones.
- Country galleries slide open and closed, and load their photos when opened. Photographs appear as borderless prints at their complete original aspect ratios, with proportional rows and generous spacing. Clicking a photo opens a larger gallery view; swipe on phones, use previous/next buttons or the left/right arrow keys on desktop. Escape closes it and restores focus. Only the selected large print and its immediate neighbours load.
- Navigation, native accordions and fallback photos remain available without JavaScript. Keyboard focus, skip navigation and reduced motion preferences are supported.

The biography and travel writing come from the original site. Empty blog/video sections are shown as work in progress. Reused Japan photos under China and incorrect Swiss landmark captions have been replaced with honest placeholders and neutral captions.

## Images

Original JPGs are retained. Pages use WebP assets under `images/optimized/`, with responsive `srcset` variants up to 480, 960 and 1600 pixels wide. Explicit dimensions reserve image space; the first photo receives high priority and other photos use lazy loading. A full photo view uses the 1600px WebP, avoiding multi-megabyte original downloads.

To regenerate the optimized assets:

```powershell
python -m pip install -r tools/requirements-images.txt
python tools/optimize_images.py
```

The generated manifest records widths, heights and byte sizes. If adding a photograph, add its HTML with the corresponding responsive sources and dimensions. Keep meaningful alt text and captions.

For the 25 photographs referenced by these pages, the original JPGs total 90,662,373 bytes, the largest generated variants total 6,881,244 bytes, and the smallest variants total 863,286 bytes. These are asset-size comparisons, not measured page load times; actual transfers depend on device pixel ratio, viewport, opened galleries and caching.

## Pages and deployment

- `index.html`: academic profile
- `life.html`: travel journals and photographs
- `video.html`, `blog.html`: work in progress
- `style.css`: shared layout and color tokens
- `theme-init.js`: applies the saved theme before paint
- `site.js`: theme control, mobile navigation and gallery interactions
- `components/navbar.html`: shared navigation reference; each page includes its navigation directly to avoid a fetch request and keep navigation available without JavaScript

GitHub Pages should publish `main` / root. `.nojekyll` marks the site as plain static files. No changes to the separate `master` branch are needed.

## Verification

Checked in Microsoft Edge using Playwright at widths 320, 390, 768 and 1440px across all four pages. Checks cover horizontal overflow, active navigation, theme persistence, mobile menu / Escape, deferred gallery requests, full photo view / Escape, country deep links, no-JavaScript navigation / images and unavailable local storage. Additional gallery checks cover complete photo ratios, square corners, interrupted accordion animations, previous/next buttons, arrow keys, focus restoration, native mobile touch swipes and reduced motion. Desktop and phone layouts were also inspected visually.
