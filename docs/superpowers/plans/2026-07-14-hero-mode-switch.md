# Hero Mode Switch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an Apple-style toggle switch to the `#hero` section of `index.html` that crossfades between the existing dark Commercial hero and a new light Wedding hero, whose CTA links through to `hochzeiten.html`.

**Architecture:** Two stacked background layers and two stacked content layers live inside `#hero` at all times; a `data-hero-mode` attribute on `#hero` (toggled by a `role="switch"` button) drives CSS opacity crossfades between them. No new dependencies — reuses the existing GSAP setup, the existing `js/main.js` IIFE module pattern, and the existing plain-`assert` Node test convention (`js/tests/*.test.js`).

**Tech Stack:** Vanilla HTML/CSS/JS (no build step), GSAP (already loaded via CDN in `index.html`), Node's built-in `assert` for the one pure-logic unit test.

## Global Constraints

- Colors: Commercial stays Schwarz/Weiß/Rot (`--color-bg:#000`, `--color-fg:#fff`, `--color-accent:#E1272C` in `css/main.css`); Wedding accents use `#FAF8F5` (text), `#C9A876` (accent/CTA), matching `css/wedding.css` and `Konzept.md`.
- Fonts: Wedding headline uses Playfair Display, wedding body copy uses Montserrat Light — load via the exact same Google Fonts query string already used in `hochzeiten.html`: `family=Montserrat:wght@300;400&family=Playfair+Display:wght@500;600`.
- Animation: all new transitions must respect `prefers-reduced-motion: reduce` (instant swap, no transition) — this repo's established pattern (see `.typed-cursor` in `css/main.css`).
- Touch targets ≥ 44×44px (project guideline, see `docs/superpowers/plans/2026-07-11-fabian-visuals-website-plan.md` quality guardrails).
- Image paths are fixed, not invented: `assets/images/hero-bg.jpg` (Commercial) and `assets/images/wedding/hero.jpg` (Wedding) — both are already referenced/expected by existing code (`css/main.css:90` and `css/wedding.css:50`), so dropping the two photos in place makes them appear on **both** this hero and the real `hochzeiten.html` hero automatically.
- The Wedding CTA must be a real `<a href="hochzeiten.html">` link (navigates away), not a JS-only preview.
- No changes to the footer's existing `wedding-teaser` link, the case-grid, or any other section — scope is `#hero` only.
- This repo has no DOM-level test harness (its two existing tests mock only `window.matchMedia`, no jsdom) — UI-visible tasks are verified by manual browser check, matching this project's existing convention, not skipped.

---

## Task 1: `nextHeroMode` pure toggle logic + unit test

**Files:**
- Modify: `js/main.js`
- Test: `js/tests/nextHeroMode.test.js` (create)

**Interfaces:**
- Produces: `nextHeroMode(current)` — takes the string `'commercial'` or `'wedding'`, returns the other one. Exported from the `js/main.js` factory alongside `prefersReducedMotion`/`isTouchDevice`/`initMainPage`, so `require('../main.js').nextHeroMode` works in tests, matching how `isTouchDevice.test.js` already requires the module.

- [ ] **Step 1: Write the failing test**

Create `js/tests/nextHeroMode.test.js`:

```js
const assert = require('assert');
const { nextHeroMode } = require('../main.js');

assert.strictEqual(nextHeroMode('commercial'), 'wedding', 'commercial should flip to wedding');
assert.strictEqual(nextHeroMode('wedding'), 'commercial', 'wedding should flip to commercial');

console.log('nextHeroMode tests passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node js/tests/nextHeroMode.test.js`
Expected: `TypeError: nextHeroMode is not a function` (or similar — the export doesn't exist yet)

- [ ] **Step 3: Write minimal implementation**

In `js/main.js`, add the function inside the factory (near the top, next to `prefersReducedMotion`/`isTouchDevice`):

```js
  function nextHeroMode(current) {
    return current === 'wedding' ? 'commercial' : 'wedding';
  }
```

Update the factory's return statement (currently `return { prefersReducedMotion: prefersReducedMotion, isTouchDevice: isTouchDevice, initMainPage: initMainPage };`) to also export it:

```js
  return { prefersReducedMotion: prefersReducedMotion, isTouchDevice: isTouchDevice, nextHeroMode: nextHeroMode, initMainPage: initMainPage };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node js/tests/nextHeroMode.test.js`
Expected: prints `nextHeroMode tests passed`, exit code 0

- [ ] **Step 5: Run the existing tests to confirm nothing broke**

Run: `node js/tests/isTouchDevice.test.js && node js/tests/prefersReducedMotion.test.js`
Expected: both print their `... tests passed` lines

- [ ] **Step 6: Commit**

```bash
git add js/main.js js/tests/nextHeroMode.test.js
git commit -m "feat: add nextHeroMode toggle logic for hero mode switch"
```

---

## Task 2: Hero markup — dual layers + switch control + Playfair/Montserrat fonts

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: nothing from Task 1 yet (markup only; wiring happens in Task 4).
- Produces: the exact DOM structure/class names/ids that Task 3 (CSS) and Task 4 (JS) rely on: `#hero[data-hero-mode]`, `.hero-bg--commercial`, `.hero-bg--wedding`, `.hero-content--commercial`, `.hero-content--wedding`, `.hero-switch-toggle`, `.hero-switch-knob`, `#hero-switch-label`, `.btn--wedding`. The existing `#hero-headline` id and `.typed-text`/`.typed-cursor` spans are preserved unchanged inside the commercial content block (required by `initHeroTypewriter`, already in `js/main.js`).

- [ ] **Step 1: Add the Google Fonts link to `<head>`**

In `index.html`, right after the existing `<link rel="stylesheet" href="css/reset.css">` line (line 8), add:

```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400&family=Playfair+Display:wght@500;600&display=swap" rel="stylesheet">
```

- [ ] **Step 2: Replace the `#hero` section markup**

Replace the current `#hero` block (`index.html` lines 25-30):

```html
  <section id="hero">
    <div class="hero-bg"></div>
    <h1 id="hero-headline" aria-label="FABIAN.VISUALS. WE CRAFT YOUR VISUALS"><span class="typed-text" aria-hidden="true"></span><span class="typed-cursor" aria-hidden="true">|</span></h1>
    <p>Wir produzieren nicht nur Content für deinen Feed. Wir bauen die visuelle Welt, in der deine Kunden und Fans leben wollen.</p>
    <a href="#kontakt" class="btn">Jetzt Termin sichern</a>
  </section>
```

with:

```html
  <section id="hero" data-hero-mode="commercial">
    <div class="hero-bg hero-bg--commercial" aria-hidden="true"></div>
    <div class="hero-bg hero-bg--wedding" aria-hidden="true"></div>
    <div class="hero-content hero-content--commercial">
      <h1 id="hero-headline" aria-label="FABIAN.VISUALS. WE CRAFT YOUR VISUALS"><span class="typed-text" aria-hidden="true"></span><span class="typed-cursor" aria-hidden="true">|</span></h1>
      <p>Wir produzieren nicht nur Content für deinen Feed. Wir bauen die visuelle Welt, in der deine Kunden und Fans leben wollen.</p>
      <a href="#kontakt" class="btn">Jetzt Termin sichern</a>
    </div>
    <div class="hero-content hero-content--wedding" aria-hidden="true" inert>
      <h2>Eure Geschichte, festgehalten wie ein Film</h2>
      <p>Cinematische Hochzeitsfotografie und -filme — für Paare, die ihren Tag so erleben wollen, wie er wirklich war.</p>
      <a href="hochzeiten.html" class="btn btn--wedding">Hochzeitsfotografie ansehen</a>
    </div>
    <div class="hero-switch">
      <span class="hero-switch-label" id="hero-switch-label">Hochzeiten ansehen</span>
      <button type="button" class="hero-switch-toggle" role="switch" aria-checked="false" aria-labelledby="hero-switch-label">
        <span class="hero-switch-knob" aria-hidden="true"></span>
      </button>
    </div>
  </section>
```

Notes:
- The wedding content block ships with `aria-hidden="true" inert` in the markup itself, so a no-JS visitor never sees an interactive-but-invisible link.
- The wedding headline is an `<h2>`, not a second `<h1>` — the page must keep exactly one `<h1>`.
- The wedding copy is copied verbatim from `hochzeiten.html`'s `#w-hero` for message consistency between the preview and the real page.

- [ ] **Step 3: Manual verification**

Run: `python3 -m http.server 8080` from the repo root, open `http://localhost:8080/index.html`.
Expected: page loads with no console errors about missing elements; view source shows the new nested structure; the wedding content block is present in the DOM but not yet visually distinguished (CSS/JS for the actual switch behavior come in Tasks 3-4, so at this point it may render both blocks stacked/overlapping — that's expected and fixed by Task 3).

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add dual commercial/wedding hero markup and mode switch control"
```

---

## Task 3: Crossfade CSS + Apple-style switch styling

**Files:**
- Modify: `css/main.css`

**Interfaces:**
- Consumes: the class names and `data-hero-mode` attribute produced by Task 2.
- Produces: the visual crossfade and switch appearance that Task 4's JS toggles by flipping `data-hero-mode` and `aria-checked`.

- [ ] **Step 1: Replace the existing `#hero` background/typography rules**

Replace the current hero CSS block in `css/main.css` (lines 79-95):

```css
#hero {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-top: 96px;
  position: relative;
  overflow: hidden;
}
#hero .hero-bg {
  position: absolute; inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0.3), rgba(0,0,0,0.85)), url('../assets/images/hero-bg.jpg') center/cover;
  z-index: -1;
}
#hero h1 { font-size: clamp(2.5rem, 8vw, 5rem); max-width: 900px; }
#hero p { margin-top: 24px; max-width: 560px; font-size: 1.125rem; }
#hero .btn { margin-top: 40px; align-self: flex-start; }
```

with:

```css
#hero {
  min-height: 100dvh;
  padding-top: 96px;
  position: relative;
  overflow: hidden;
}
#hero .hero-bg {
  position: absolute; inset: 0;
  z-index: -1;
  opacity: 1;
  transition: opacity 700ms ease;
}
#hero .hero-bg--commercial {
  background: linear-gradient(180deg, rgba(0,0,0,0.3), rgba(0,0,0,0.85)), url('../assets/images/hero-bg.jpg') center/cover;
}
#hero .hero-bg--wedding {
  background: linear-gradient(180deg, rgba(0,0,0,0.25), rgba(0,0,0,0.75)), url('../assets/images/wedding/hero.jpg') center/cover;
  opacity: 0;
}
#hero .hero-content {
  position: absolute; inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 24px;
  max-width: var(--max-width);
  margin: 0 auto;
  opacity: 1;
  transition: opacity 700ms ease;
}
#hero .hero-content--wedding {
  opacity: 0;
  pointer-events: none;
}
#hero[data-hero-mode="wedding"] .hero-bg--commercial,
#hero[data-hero-mode="wedding"] .hero-content--commercial {
  opacity: 0;
  pointer-events: none;
}
#hero[data-hero-mode="wedding"] .hero-bg--wedding,
#hero[data-hero-mode="wedding"] .hero-content--wedding {
  opacity: 1;
  pointer-events: auto;
}
#hero h1 { font-size: clamp(2.5rem, 8vw, 5rem); max-width: 900px; }
#hero .hero-content--commercial p { margin-top: 24px; max-width: 560px; font-size: 1.125rem; }
#hero .hero-content--commercial .btn { margin-top: 40px; align-self: flex-start; }
#hero .hero-content--wedding h2 {
  font-family: 'Playfair Display', Georgia, serif;
  text-transform: none;
  font-size: clamp(2rem, 6vw, 3.5rem);
  max-width: 640px;
  color: #FAF8F5;
}
#hero .hero-content--wedding p {
  margin-top: 20px;
  max-width: 480px;
  font-size: 1.05rem;
  font-family: 'Montserrat', 'Helvetica Neue', Arial, sans-serif;
  font-weight: 300;
  color: rgba(250,248,245,0.85);
}
#hero .hero-content--wedding .btn { margin-top: 40px; align-self: flex-start; }
.btn.btn--wedding { background: #C9A876; color: #3A3530; }
.btn.btn--wedding:hover { box-shadow: 0 8px 20px rgba(201,168,118,0.35); }
```

- [ ] **Step 2: Add the switch styling**

Append to `css/main.css`:

```css
.hero-switch {
  position: absolute;
  left: 50%;
  bottom: 40px;
  transform: translateX(-50%);
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.hero-switch-label {
  font-size: 0.7rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.7);
  transition: color 700ms ease;
}
.hero-switch-toggle {
  width: 56px;
  height: 44px;
  padding: 0;
  border: none;
  background: transparent;
  position: relative;
  cursor: pointer;
}
.hero-switch-toggle::before {
  content: '';
  position: absolute;
  top: 50%; left: 0;
  width: 56px; height: 30px;
  transform: translateY(-50%);
  border-radius: 999px;
  background: rgba(255,255,255,0.25);
  transition: background 300ms ease;
}
.hero-switch-toggle:focus-visible { outline: 3px solid var(--color-fg); outline-offset: 3px; }
.hero-switch-knob {
  position: absolute;
  top: 50%; left: 3px;
  width: 24px; height: 24px;
  transform: translateY(-50%);
  border-radius: 50%;
  background: #fff;
  transition: transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
}
#hero[data-hero-mode="wedding"] .hero-switch-toggle::before { background: #C9A876; }
#hero[data-hero-mode="wedding"] .hero-switch-knob { transform: translateY(-50%) translateX(26px); }
```

- [ ] **Step 3: Add the reduced-motion override**

Append to the existing `@media (prefers-reduced-motion: reduce)` block at the bottom of `css/main.css` (currently only contains the `.typed-cursor` rule) — add these two selectors into that same block:

```css
  #hero .hero-bg,
  #hero .hero-content,
  .hero-switch-label,
  .hero-switch-toggle::before,
  .hero-switch-knob { transition: none; }
```

- [ ] **Step 4: Manual verification**

Reload `http://localhost:8080/index.html`.
Expected: hero shows only the commercial state by default (headline, subline, red "Jetzt Termin sichern" button), switch pill is dark/off, knob sits left. Using devtools, manually set `document querySelector('#hero').dataset.heroMode = 'wedding'` in the console and confirm the wedding text/photo-gradient fades in, switch pill turns sand-colored, knob slides right (Task 4 will wire the actual click handler — this step only confirms the CSS reacts correctly to the attribute).

- [ ] **Step 5: Commit**

```bash
git add css/main.css
git commit -m "feat: add hero crossfade and Apple-style switch styling"
```

---

## Task 4: Wire the switch + fix selectors that now match two elements

**Files:**
- Modify: `js/main.js`

**Interfaces:**
- Consumes: `nextHeroMode` from Task 1; `#hero`, `.hero-switch-toggle`, `.hero-content--commercial`, `.hero-content--wedding`, `#hero-switch-label` from Task 2/3.
- Produces: `initHeroModeSwitch()`, called from `initMainPage()`.

- [ ] **Step 1: Add `initHeroModeSwitch`**

In `js/main.js`, add this function (place it near `initHeroParallax`):

```js
  function initHeroModeSwitch() {
    var hero = document.querySelector('#hero');
    var toggle = document.querySelector('.hero-switch-toggle');
    var label = document.getElementById('hero-switch-label');
    var commercial = document.querySelector('.hero-content--commercial');
    var wedding = document.querySelector('.hero-content--wedding');
    if (!hero || !toggle || !label || !commercial || !wedding) return;
    toggle.addEventListener('click', function () {
      var mode = nextHeroMode(hero.getAttribute('data-hero-mode'));
      var weddingActive = mode === 'wedding';
      hero.setAttribute('data-hero-mode', mode);
      toggle.setAttribute('aria-checked', String(weddingActive));
      label.textContent = weddingActive ? 'Zurück zu Commercial' : 'Hochzeiten ansehen';
      wedding.toggleAttribute('inert', !weddingActive);
      wedding.setAttribute('aria-hidden', String(!weddingActive));
      commercial.toggleAttribute('inert', weddingActive);
      commercial.setAttribute('aria-hidden', String(weddingActive));
    });
  }
```

- [ ] **Step 2: Scope `initHeroParallax` to the commercial layer only**

In `js/main.js`, change (inside `initHeroParallax`):

```js
    var bg = document.querySelector('#hero .hero-bg');
```

to:

```js
    var bg = document.querySelector('.hero-bg--commercial');
```

This keeps parallax on the Commercial background only — the Wedding layer stays static, matching this project's existing rule that the wedding experience never gets scroll/parallax animation (see `Konzept.md` section 4).

- [ ] **Step 3: Scope `initScrollReveal`'s hero target to the commercial paragraph only**

In `js/main.js`, inside `initScrollReveal`, change:

```js
    var targets = document.querySelectorAll('#hero p, .service-card, .case-card, #ueber-mich .text, #kundenstimmen h2');
```

to:

```js
    var targets = document.querySelectorAll('#hero .hero-content--commercial p, .service-card, .case-card, #ueber-mich .text, #kundenstimmen h2');
```

Without this change, GSAP would also fade in the wedding `<p>` on page load and set its inline `style.opacity = 1`, which — because inline styles beat the CSS class rule from Task 3 — would permanently defeat the Task 3 crossfade for that element.

- [ ] **Step 4: Register the new init function**

In `js/main.js`, inside `initMainPage`, add the call (after `initHeroTypewriter()` is fine):

```js
  function initMainPage() {
    initNavToggle();
    initScrollReveal();
    initCaseCardHover();
    initMagnetCursor();
    initHeroParallax();
    initCustomCursor();
    initHeroTypewriter();
    initProcessPin();
    initHeroModeSwitch();
  }
```

- [ ] **Step 5: Run the unit tests to confirm nothing broke**

Run: `node js/tests/isTouchDevice.test.js && node js/tests/prefersReducedMotion.test.js && node js/tests/nextHeroMode.test.js`
Expected: all three print their `... tests passed` lines.

- [ ] **Step 6: Manual verification (this is the real end-to-end check for this feature)**

Reload `http://localhost:8080/index.html`.
- Click the switch: headline/photo/button crossfade from Commercial to Wedding over ~700ms, switch knob slides right and turns sand-colored, label text changes to "Zurück zu Commercial".
- Click the Wedding CTA ("Hochzeitsfotografie ansehen"): browser navigates to `hochzeiten.html`.
- Go back, click the switch again: crossfades back to Commercial, label reverts.
- In devtools, enable "Emulate CSS prefers-reduced-motion: reduce", reload, click the switch: state changes instantly with no fade.
- Tab through the page with keyboard only: the switch receives visible focus and activates with Enter/Space; when Wedding mode is inactive, its CTA link is not reachable by Tab (confirms `inert` is working).
- Resize to a mobile viewport: switch remains tappable and centered, no layout overflow.

- [ ] **Step 7: Commit**

```bash
git add js/main.js
git commit -m "feat: wire hero mode switch interaction and scope existing animations to commercial layer"
```

---

## Open item (not blocking these tasks)

`assets/images/hero-bg.jpg` and `assets/images/wedding/hero.jpg` still need to be dropped in by Fabian (see chat) — until then both hero states render with a broken image icon behind the gradient/text, which does not affect verifying the interaction logic above.
