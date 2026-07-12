# Animations Round 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add five additional animation/motion effects to the already-shipped main page (`index.html`), inspired by reference sites the client shared, without introducing any new library beyond the GSAP already loaded, and without touching the wedding page at all.

**Architecture:** All five effects extend the existing `js/main.js` (same UMD module, same `initMainPage()` bootstrap) and `css/main.css`. Two of the five (typewriter hero, pinned process section) require small, precise edits to the existing `initScrollReveal()` function's target selector to avoid double-animating the same elements — these edits are spelled out exactly since they touch shared code from the first plan.

**Tech Stack:** Same as the shipped site — vanilla JS, GSAP 3 + ScrollTrigger (already loaded via CDN in `index.html`), no new dependencies, no build step.

## Global Constraints

- Every new effect must respect `prefers-reduced-motion` via the existing `prefersReducedMotion()` helper (`js/main.js`) — no ad hoc reimplementations
- The custom cursor must NEVER result in a page with no visible cursor at all: the CSS that hides the native cursor (`cursor: none`) must be gated behind a class the JS only adds after confirming it will actually run the effect (not a blanket `@media (pointer: fine)` rule) — this is the one subtle bug this plan explicitly designs around, see Task 1
- All effects touch ONLY `index.html`, `css/main.css`, `js/main.js` — `hochzeiten.html`, `css/wedding.css` are never touched by this plan
- The pinned scroll section is the ONLY pinned section on the page (per the project's own animation guidelines: no more than 1-2 pinned sections per page)
- No new paid plugins (e.g. GSAP SplitText/Club GreenSock) — the typewriter effect is implemented in plain JS
- Local dev/verification server: `python3 -m http.server 8080` from the project root

---

### Task 1: Full custom cursor (desktop only)

**Files:**
- Modify: `index.html` (add two cursor elements before the closing `</body>` scripts)
- Modify: `css/main.css` (append)
- Modify: `js/main.js` (add `initCustomCursor()`, call it from `initMainPage()`)

**Interfaces:**
- Consumes: `prefersReducedMotion()`, `isTouchDevice()` (both already exported from `js/main.js`)
- Produces: `.cursor-dot` / `.cursor-ring` elements and the `html.custom-cursor-active` class-gating pattern — no later task in this plan depends on this, but do not remove the class-gating design (see Global Constraints)

- [ ] **Step 1: Append cursor CSS to `css/main.css`**

```css
.cursor-dot, .cursor-ring {
  position: fixed;
  top: 0; left: 0;
  pointer-events: none;
  z-index: 9999;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
}
.cursor-dot { width: 8px; height: 8px; background: var(--color-accent); }
.cursor-ring {
  width: 36px; height: 36px;
  border: 1px solid var(--color-fg);
  transition: width 200ms ease, height 200ms ease, border-color 200ms ease;
}
.cursor-ring.is-active { width: 56px; height: 56px; border-color: var(--color-accent); }

/* IMPORTANT: cursor:none is gated behind this class, added by JS only when the
   effect actually initializes (not a blanket pointer:fine media query) — this
   guarantees the native cursor is never hidden while our custom cursor fails
   to render (e.g. reduced-motion, touch, or JS disabled). Do not "simplify"
   this into `@media (pointer: fine) { body { cursor: none; } }`. */
html.custom-cursor-active { cursor: none; }
html.custom-cursor-active .cursor-dot,
html.custom-cursor-active .cursor-ring { opacity: 1; }
html.custom-cursor-active .cursor-ring { opacity: 0.6; }
html.custom-cursor-active .cursor-ring.is-active { opacity: 1; }
```

- [ ] **Step 2: Add the cursor elements to `index.html`**

Add immediately before the existing `<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>` line, i.e. as the last markup before the scripts:

```html
<div class="cursor-dot" aria-hidden="true"></div>
<div class="cursor-ring" aria-hidden="true"></div>
```

- [ ] **Step 3: Add `initCustomCursor()` to `js/main.js`**

Add this function after `initHeroParallax()` and before `function initMainPage() {`:

```js
  function initCustomCursor() {
    if (prefersReducedMotion() || isTouchDevice()) return;
    var dot = document.querySelector('.cursor-dot');
    var ring = document.querySelector('.cursor-ring');
    if (!dot || !ring) return;
    document.documentElement.classList.add('custom-cursor-active');
    var dotX = gsap.quickTo(dot, 'x', { duration: 0.1, ease: 'power2.out' });
    var dotY = gsap.quickTo(dot, 'y', { duration: 0.1, ease: 'power2.out' });
    var ringX = gsap.quickTo(ring, 'x', { duration: 0.3, ease: 'power2.out' });
    var ringY = gsap.quickTo(ring, 'y', { duration: 0.3, ease: 'power2.out' });
    window.addEventListener('mousemove', function (e) {
      dotX(e.clientX); dotY(e.clientY);
      ringX(e.clientX); ringY(e.clientY);
    });
    document.querySelectorAll('a, button, .case-card').forEach(function (el) {
      el.addEventListener('mouseenter', function () { ring.classList.add('is-active'); });
      el.addEventListener('mouseleave', function () { ring.classList.remove('is-active'); });
    });
  }
```

Update `initMainPage()` to add a call to `initCustomCursor()` as a new line (keep all 5 existing calls: `initNavToggle`, `initScrollReveal`, `initCaseCardHover`, `initMagnetCursor`, `initHeroParallax`).

- [ ] **Step 4: Verify in browser**

Start `python3 -m http.server 8080`, open `http://localhost:8080/index.html` on desktop. Expected: native cursor is invisible, a small red dot + a larger ring follow the mouse smoothly, the ring grows and turns red when hovering over any link/button/case-card. Reload with Chrome DevTools "Emulate CSS prefers-reduced-motion: reduce" — expected: normal native cursor is visible (NOT hidden), no dot/ring appear. Reload with a touch-device emulation — expected: normal native cursor visible, no dot/ring.

- [ ] **Step 5: Commit**

```bash
git add index.html css/main.css js/main.js
git commit -m "feat: add full custom cursor effect for desktop"
```

---

### Task 2: Index numbers on case-grid cards

**Files:**
- Modify: `index.html` (add a number span inside each of the 4 `.case-card` elements)
- Modify: `css/main.css` (append)

**Interfaces:** None — pure presentational HTML/CSS, no JS.

- [ ] **Step 1: Append index-number CSS to `css/main.css`**

```css
.case-card { position: relative; } /* already position:relative from Task 5 of the first plan — if this rule already exists, do not duplicate it, just add the new rule below */
.case-card .case-index {
  position: absolute;
  top: 16px; right: 16px;
  font-family: var(--font-headline);
  font-size: 0.85rem;
  color: var(--color-fg);
  background: rgba(0,0,0,0.5);
  padding: 4px 10px;
  border-radius: 2px;
  z-index: 2;
}
```

Check `css/main.css` first — `.case-card` already has `position: relative;` from the original case-grid rule (Task 5 of the main plan). If so, skip re-adding that line and only add the `.case-card .case-index` rule.

- [ ] **Step 2: Add the index span to each of the 4 case cards in `index.html`**

Add `<span class="case-index">01 / 04</span>` as the first child inside each `.case-card` div (right after the opening `<div class="case-card">` tag, before the `<img>`), numbering sequentially: `01 / 04`, `02 / 04`, `03 / 04`, `04 / 04` in the order the cards already appear (Fotoshooting, Musikvideo, DJ-Set, Musikvideo 2).

- [ ] **Step 3: Verify in browser**

Reload `index.html`, scroll to the Projekte section. Expected: each card shows a small dark pill with "01 / 04" through "04 / 04" in the top-right corner, readable over the (currently broken, pending real photos) image area.

- [ ] **Step 4: Commit**

```bash
git add index.html css/main.css
git commit -m "feat: add index-number overlay to case-grid cards"
```

---

### Task 3: Typewriter effect on hero headline

**Files:**
- Modify: `index.html` (restructure the hero `<h1>` to carry the full text as an `aria-label` plus an empty span the JS types into)
- Modify: `css/main.css` (append blinking-cursor style)
- Modify: `js/main.js` (add `initHeroTypewriter()`, remove `#hero h1` from `initScrollReveal()`'s target selector, call the new function from `initMainPage()`)

**Interfaces:**
- Consumes: `prefersReducedMotion()`
- Produces: nothing consumed by later tasks in this plan

- [ ] **Step 1: Restructure the hero headline in `index.html`**

Replace:

```html
<h1>FABIAN.VISUALS. WE CRAFT YOUR VISUALS</h1>
```

with:

```html
<h1 id="hero-headline" aria-label="FABIAN.VISUALS. WE CRAFT YOUR VISUALS"><span class="typed-text" aria-hidden="true"></span><span class="typed-cursor" aria-hidden="true">|</span></h1>
```

The `aria-label` on the `<h1>` gives screen readers the full text immediately regardless of animation state; the inner spans are `aria-hidden` so nothing gets double-announced.

- [ ] **Step 2: Append typewriter-cursor CSS to `css/main.css`**

```css
.typed-cursor {
  display: inline-block;
  margin-left: 2px;
  animation: blink-cursor 900ms steps(1) infinite;
}
@keyframes blink-cursor { 50% { opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  .typed-cursor { animation: none; opacity: 0; }
}
```

- [ ] **Step 3: Add `initHeroTypewriter()` to `js/main.js`**

Add after `initCustomCursor()` (before `function initMainPage() {`):

```js
  function initHeroTypewriter() {
    var h1 = document.getElementById('hero-headline');
    if (!h1) return;
    var textEl = h1.querySelector('.typed-text');
    var fullText = h1.getAttribute('aria-label') || '';
    if (!textEl || !fullText) return;
    if (prefersReducedMotion()) {
      textEl.textContent = fullText;
      return;
    }
    var i = 0;
    function typeNext() {
      if (i > fullText.length) return;
      textEl.textContent = fullText.slice(0, i);
      i++;
      setTimeout(typeNext, 35);
    }
    typeNext();
  }
```

- [ ] **Step 4: Remove `#hero h1` from `initScrollReveal()`'s target selector**

In `js/main.js`, find this line inside `initScrollReveal()`:

```js
    var targets = document.querySelectorAll('#hero h1, #hero p, .service-card, .case-card, #prozess .step, #ueber-mich .text, #kundenstimmen h2');
```

Replace with (removes `#hero h1` only — the typewriter effect now owns the headline's reveal, the old fade-in would otherwise fight with it):

```js
    var targets = document.querySelectorAll('#hero p, .service-card, .case-card, #prozess .step, #ueber-mich .text, #kundenstimmen h2');
```

- [ ] **Step 5: Update `initMainPage()` to call the new function**

Add `initHeroTypewriter();` as a new line, keeping all existing calls (including `initCustomCursor()` from Task 1).

- [ ] **Step 6: Verify in browser**

Reload `index.html`. Expected: the hero headline types itself out character by character with a blinking `|` cursor after it, then stays static once done; screen-reader tools (or `document.getElementById('hero-headline').getAttribute('aria-label')` in console) show the full text is present immediately, not built up. With reduced-motion emulation: headline appears instantly in full, cursor is not blinking (check computed `animation-name: none` or `opacity: 0` on `.typed-cursor`).

- [ ] **Step 7: Commit**

```bash
git add index.html css/main.css js/main.js
git commit -m "feat: add typewriter effect to hero headline"
```

---

### Task 4: Pinned scroll section for Prozess

**Files:**
- Modify: `css/main.css` (append)
- Modify: `js/main.js` (add `initProcessPin()`, remove `#prozess .step` from `initScrollReveal()`'s target selector — this line was already modified by Task 3, edit the CURRENT state of that line, not the original)

**Interfaces:**
- Consumes: `prefersReducedMotion()`

- [ ] **Step 1: Remove `#prozess .step` from `initScrollReveal()`'s target selector**

After Task 3, the line in `js/main.js` reads:

```js
    var targets = document.querySelectorAll('#hero p, .service-card, .case-card, #prozess .step, #ueber-mich .text, #kundenstimmen h2');
```

Replace with (removes `#prozess .step` — the pinned timeline below now owns this section's reveal):

```js
    var targets = document.querySelectorAll('#hero p, .service-card, .case-card, #ueber-mich .text, #kundenstimmen h2');
```

- [ ] **Step 2: Add `initProcessPin()` to `js/main.js`**

Add after `initHeroTypewriter()` (before `function initMainPage() {`):

```js
  function initProcessPin() {
    if (prefersReducedMotion()) return;
    var section = document.querySelector('#prozess');
    var steps = document.querySelectorAll('#prozess .step');
    if (!section || !steps.length) return;
    gsap.set(steps, { opacity: 0, y: 24 });
    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: '+=100%',
        scrub: 1,
        pin: true
      }
    });
    steps.forEach(function (step, i) {
      tl.to(step, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, i * 0.5);
    });
  }
```

- [ ] **Step 3: Update `initMainPage()` to call the new function**

Add `initProcessPin();` as a new line, keeping all existing calls.

- [ ] **Step 4: Verify in browser**

Reload `index.html`, scroll down to the "Unser Prozess" section. Expected: the section locks in place (page stops scrolling visually) while you keep scrolling, and the 4 steps fade/slide in one after another as you scroll, roughly filling one extra viewport-height of scroll distance; after the 4th step has appeared, continued scrolling releases the pin and moves on to the next section normally. With reduced-motion emulation: no pinning occurs at all, the section behaves like a normal static block (steps are simply visible, since `initScrollReveal` no longer targets them and `initProcessPin` returns early — confirm the steps are NOT stuck at `opacity: 0` in this case, i.e. do not call `gsap.set(steps, {opacity:0, y:24})` before the reduced-motion check).

- [ ] **Step 5: Commit**

```bash
git add css/main.css js/main.js
git commit -m "feat: add pinned scroll section for process steps"
```

---

### Task 5: Branded preloader

**Files:**
- Modify: `index.html` (add preloader overlay as the first element inside `<body>`, before `<header>`)
- Modify: `css/main.css` (append)
- Modify: `js/main.js` (add `initPreloader()`, call it FIRST in `initMainPage()`)

**Interfaces:** None — self-contained overlay, no later task depends on it.

- [ ] **Step 1: Add the preloader markup to `index.html`**

Add as the very first line inside `<body>`, before `<header>`:

```html
<div id="preloader" aria-hidden="true">
  <div class="preloader-logo">F<span class="rec-dot"></span></div>
</div>
```

- [ ] **Step 2: Append preloader CSS to `css/main.css`**

```css
#preloader {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: var(--color-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 400ms ease;
}
.preloader-logo {
  font-family: var(--font-headline);
  font-size: 4rem;
  color: var(--color-fg);
  display: inline-flex;
  align-items: flex-start;
  gap: 8px;
  opacity: 0;
  transform: scale(0.85);
}
.preloader-logo .rec-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--color-accent);
  margin-top: 10px;
}
```

- [ ] **Step 3: Add `initPreloader()` to `js/main.js`**

Add as the FIRST function after the module wrapper opens (right after `isTouchDevice()`, before `initNavToggle()` — order in the file doesn't functionally matter since these are just function declarations, but keep it near the top for readability since it runs first):

```js
  function initPreloader() {
    var pre = document.getElementById('preloader');
    if (!pre) return;
    if (sessionStorage.getItem('fv-preloader-shown') === '1') {
      pre.remove();
      return;
    }
    sessionStorage.setItem('fv-preloader-shown', '1');
    if (prefersReducedMotion()) {
      pre.remove();
      return;
    }
    var logo = pre.querySelector('.preloader-logo');
    gsap.timeline()
      .to(logo, { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' })
      .to(pre, { opacity: 0, duration: 0.4, ease: 'power1.out', delay: 0.3 })
      .set(pre, { display: 'none' });
  }
```

- [ ] **Step 4: Update `initMainPage()` to call `initPreloader()` FIRST**

```js
  function initMainPage() {
    initPreloader();
    initNavToggle();
    initScrollReveal();
    initCaseCardHover();
    initMagnetCursor();
    initHeroParallax();
    initCustomCursor();
    initHeroTypewriter();
    initProcessPin();
  }
```

- [ ] **Step 5: Verify in browser**

Open `http://localhost:8080/index.html` in a fresh private/incognito window (so `sessionStorage` is empty). Expected: a full-screen black overlay shows the "F" + red dot logo scaling/fading in for about half a second, then the whole overlay fades out over ~0.4s revealing the page underneath; page content and other animations (typewriter, etc.) are unaffected once the overlay is gone. Reload the SAME tab (not a new private window) — expected: no preloader appears the second time (sessionStorage already set). Open a fresh private window with reduced-motion emulation on — expected: no preloader overlay at all, page is immediately visible.

- [ ] **Step 6: Commit**

```bash
git add index.html css/main.css js/main.js
git commit -m "feat: add branded preloader shown once per session"
```

---

## Post-plan note

This plan intentionally does not touch `hochzeiten.html` or `css/wedding.css` — the wedding page's calm, animation-free design is an explicit, separate requirement from the original project spec and is unaffected by this round of enhancements.
