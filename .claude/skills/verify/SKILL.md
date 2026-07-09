---
name: verify
description: Build/launch/drive recipe for verifying visual changes to this static site (stirlinghepburn.com).
---

# Verifying changes to this site

Static site — no build step. Surface is pixels in a browser.

## Launch

```bash
python -m http.server 8741   # serve repo root; kill the port when done
```

Don't use `file://` — main.js is a `type="module"` script and won't run.

## Drive

Playwright works (installed globally as CLI; the npm package + chromium
may need installing into the scratchpad: `npm i playwright && npx
playwright install chromium`). Drive with a node script:

- Desktop viewport 1400x900, mobile 390x844.
- Scroll sections into view with `scrollIntoViewIfNeeded()` and wait
  ~1.2s — reveals are GSAP ScrollTrigger animations (`once: true`).
- Headless Chromium defaults to light theme; click `#theme-toggle`
  to check dark.
- Listen for `console` errors and `pageerror`.

## Flows worth probing

- Reduced motion: `reducedMotion: 'reduce'` context — the whole GSAP
  block in main.js is skipped, so anything JS-revealed must have a
  sane static default.
- CDN down: abort `**cdn.jsdelivr.net**` routes — GSAP/Three.js are
  CDN-loaded and the site must degrade gracefully without them.
- Mobile horizontal overflow: check
  `document.documentElement.scrollWidth > clientWidth`.
- The custom cursor ring shows up in screenshots as a small circle —
  it's not an artifact.
