# Leonapp-Inspired Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the six items from `docs/superpowers/specs/2026-07-18-leonapp-inspired-redesign-design.md` — logo header, hero background video, accordion services, two-column pinned process section, white footer legal links, and real client photography in the case grid.

**Architecture:** Every change is additive DOM/CSS/GSAP wiring inside the existing `index.html` / `css/main.css` / `js/main.js` files — no new pages, no new dependencies. The accordion reuses the exact expand/collapse/`ScrollTrigger.refresh()` contract already proven in `initCaseExpand()`. The process rewrite extends the existing `initProcessPin()` scrollTrigger rather than adding a second one.

**Tech Stack:** Vanilla HTML/CSS/JS, GSAP + ScrollTrigger (already loaded via CDN), `ffmpeg`/`ffprobe` (already installed at `/opt/homebrew/bin/ffmpeg`) for one-time asset transcoding — not a runtime dependency of the site itself.

## Global Constraints

- Do not change `--color-bg`, `--color-fg`, `--color-accent`, `--font-headline`, `--font-body` (`css/main.css:2-7`) or any `--w-*` token (`css/wedding.css:2-8`).
- Every new interactive element needs `:focus-visible` and ≥44×44px hit area (repo convention, e.g. `css/main.css:305`).
- Every new animation must have a `prefersReducedMotion()` branch (see `js/main.js` `expand()`/`collapse()` for the existing pattern).
- All committed video files must be H.264 MP4, no raw `.MOV`/ProRes files. Autoplaying video must be `muted`; all video must have `playsinline disablepictureinpicture`.
- Verification for all tasks in this plan is manual browser check (this repo has no DOM test harness — see `docs/superpowers/plans/2026-07-14-hero-mode-switch.md` for the established convention), run via `python3 -m http.server 8080` from the repo root.
- Run the existing three unit tests after every task to confirm no regression: `node js/tests/isTouchDevice.test.js && node js/tests/prefersReducedMotion.test.js && node js/tests/nextHeroMode.test.js`.

---

## Task 1: Header logo + pill CTA

**Files:**
- Modify: `index.html:50` (nav logo link), `index.html:230` (hero CTA — no change needed, already `.btn`), `index.html` footer/nav CTA if present
- Modify: `css/main.css:55` (`.logo` rule), add new `.btn--pill` rule near `css/main.css:29-42`

**Interfaces:**
- Produces: `.btn--pill` class, usable anywhere `.btn` is used today.

- [ ] **Step 1: Swap the text logo for the icon**

In `index.html`, change:
```html
<a href="#hero" class="logo">FABIAN.VISUALS</a>
```
to:
```html
<a href="#hero" class="logo"><img src="assets/images/logos/fabian-visuals-icon.png" alt="Fabian Visuals" width="32" height="32"></a>
```

- [ ] **Step 2: Commit the logo asset under its final name**

The source file already exists, untracked, at `assets/images/logos/Fabian Visuals Logo weiß.png`. Copy it to the filename referenced above (no spaces, matches the rest of this repo's asset-naming convention):
```bash
cp "assets/images/logos/Fabian Visuals Logo weiß.png" assets/images/logos/fabian-visuals-icon.png
```

- [ ] **Step 3: Style the logo link and add the pill CTA modifier**

In `css/main.css:55`, change:
```css
#site-nav .logo { font-family: var(--font-headline); font-size: 1.25rem; }
```
to:
```css
#site-nav .logo { display: flex; align-items: center; min-height: 44px; }
#site-nav .logo img { height: 32px; width: auto; display: block; }
```

Near the existing `.btn` rules (`css/main.css:29-42`), add:
```css
.btn--pill {
  background: transparent;
  border: 1.5px solid var(--color-fg);
  border-radius: 999px;
  color: var(--color-fg);
}
.btn--pill:hover { background: var(--color-fg); color: var(--color-bg); box-shadow: none; transform: none; }
```

- [ ] **Step 4: Apply the pill style to the nav's own CTA**

The nav currently has no CTA link of its own (`#kontakt` is only reachable via the nav list). Add one after `#nav-list` in `index.html`:
```html
      <a href="#kontakt" class="btn btn--pill nav-cta">Angebot anfragen</a>
```
Add `#site-nav .nav-cta { margin-left: 24px; padding: 10px 24px; font-size: 0.9rem; }` to `css/main.css` near the other `#site-nav` rules, and hide it on the same breakpoint the hamburger appears (`@media (max-width: 767px)` block, `css/main.css:63`): add `#site-nav .nav-cta { display: none; }` inside that block.

- [ ] **Step 5: Verify manually**

`python3 -m http.server 8080`, open `index.html`, confirm: icon logo renders at 32px height and is a working link back to `#hero`; pill CTA visible on desktop widths, hidden below 767px; tab to both and confirm visible focus rings.

- [ ] **Step 6: Commit**

```bash
git add index.html css/main.css assets/images/logos/fabian-visuals-icon.png
git commit -m "feat: replace text logo with icon, add pill-style nav CTA"
```

---

## Task 2: Hero background video (commercial mode)

**Files:**
- Create: `assets/images/hero-bg.mp4` (transcoded)
- Modify: `index.html:61` (`.hero-bg--commercial` div)
- Modify: `css/main.css:93-95`, `css/main.css` reduced-motion block (`:448-449`)

**Interfaces:**
- Consumes: `prefersReducedMotion()` export from `js/main.js` is NOT needed here — this is pure CSS `prefers-reduced-motion` media query, matching the existing pattern at `css/main.css:448`.

- [ ] **Step 1: Transcode the source clip**

```bash
cd "/Users/fabianscholl/Zweites Gehirn/02 Projekte/Fabian Visuals Website Relaunch/Code"
ffmpeg -y -i "assets/images/4:3 Rhein_Fouza_CUT OUT_8.MOV" \
  -vf "scale=1920:-2,format=yuv420p" -c:v libx264 -crf 26 -preset slow -an \
  assets/images/hero-bg.mp4
ls -la assets/images/hero-bg.mp4
```
Expected: output file exists, well under 4MB (source is a 4s 2880×2160 clip; scaling to 1920px wide and dropping audio should land it in the 1-3MB range — if it's still over ~5MB, re-run with `-crf 30`).

- [ ] **Step 2: Add the `<video>` element to the commercial hero background**

In `index.html`, change:
```html
    <div class="hero-bg hero-bg--commercial" aria-hidden="true"></div>
```
to:
```html
    <div class="hero-bg hero-bg--commercial" aria-hidden="true">
      <video class="hero-bg-video" src="assets/images/hero-bg.mp4" poster="assets/images/hero-bg.jpg" autoplay muted loop playsinline disablepictureinpicture></video>
    </div>
```

- [ ] **Step 3: Style the video to fill the same box the background-image fills, keep the image as instant-paint fallback**

In `css/main.css:93-95`, change:
```css
#hero .hero-bg--commercial {
  background: linear-gradient(180deg, rgba(0,0,0,0.3), rgba(0,0,0,0.85)), url('../assets/images/hero-bg.jpg') center/cover;
}
```
to:
```css
#hero .hero-bg--commercial {
  background: linear-gradient(180deg, rgba(0,0,0,0.3), rgba(0,0,0,0.85)), url('../assets/images/hero-bg.jpg') center/cover;
  position: relative;
}
#hero .hero-bg-video {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  object-fit: cover;
  z-index: -1;
}
```
(The gradient stays on the parent `div` and paints over the video too, so the existing text-legibility contrast is unaffected — the video sits behind it via `z-index: -1`, the background-image stays as the immediate paint before the video's first frame decodes.)

- [ ] **Step 4: Hide the video under reduced motion, keep the static image**

In `css/main.css`, find the existing `@media (prefers-reduced-motion: reduce)` block (`:448-449` lists `#hero .hero-bg`, `#hero .hero-content` already) and add:
```css
  #hero .hero-bg-video { display: none; }
```
inside that same block.

- [ ] **Step 5: Verify manually**

Reload `index.html`, confirm the hero background is now a looping video (silent, no visible controls); toggle reduced-motion in browser devtools (Rendering tab → "Emulate CSS prefers-reduced-motion: reduce") and confirm it falls back to the static `hero-bg.jpg`; confirm hero headline/CTA are still fully legible over the video.

- [ ] **Step 6: Commit**

```bash
git add index.html css/main.css assets/images/hero-bg.mp4
git commit -m "feat: add looping background video to commercial hero"
```

---

## Task 3: Leistungen → accordion

**Files:**
- Modify: `index.html:96-115` (`#leistungen` section)
- Modify: `css/main.css:234-248` (`#leistungen` rules)
- Modify: `js/main.js` (new `initServiceAccordion()`, called from `initMainPage()`)

**Interfaces:**
- Consumes: same `prefersReducedMotion()` helper already in scope inside the `js/main.js` factory.
- Produces: nothing new consumed by later tasks.

- [ ] **Step 1: Restructure the markup**

Replace the `#leistungen` section body in `index.html`:
```html
  <section id="leistungen">
    <h2>Unsere Leistungen</h2>
    <div class="service-grid">
      <div class="service-card">
        <div class="num">01</div>
        <h3>Commercials &amp; Werbung</h3>
        <p>Wir schaffen visuelle Storytelling-Formate für deine Markenbotschaft. Von der Konzeption bis zum Schnitt begleiten wir dich mit professioneller Produktion und kreativer Leidenschaft — für TV, YouTube und Social Ads.</p>
      </div>
      <div class="service-card">
        <div class="num">02</div>
        <h3>Musikvideos</h3>
        <p>Wir verwandeln deine Musik in visuelle Erlebnisse. Mit kreativer Leidenschaft und technischer Präzision produzieren wir hochwertige Musikvideos, die deine Künstleridentität widerspiegeln.</p>
      </div>
      <div class="service-card">
        <div class="num">03</div>
        <h3>Social Media &amp; Strategie</h3>
        <p>Wir entwickeln strategische Content-Pläne, die deine Zielgruppe erreichen. Von hochwertigen Reels bis zur Analyse deiner Insights — damit du verstehst, was funktioniert.</p>
      </div>
    </div>
  </section>
```
with:
```html
  <section id="leistungen">
    <h2>Unsere Leistungen</h2>
    <div class="service-layout">
      <div class="service-accordion">
        <div class="service-item is-open">
          <button type="button" class="service-toggle" aria-expanded="true" aria-controls="service-detail-1">
            <span class="num">01</span>
            <span class="service-title">Commercials &amp; Werbung</span>
          </button>
          <div class="service-detail" id="service-detail-1">
            <p>Wir schaffen visuelle Storytelling-Formate für deine Markenbotschaft. Von der Konzeption bis zum Schnitt begleiten wir dich mit professioneller Produktion und kreativer Leidenschaft — für TV, YouTube und Social Ads.</p>
          </div>
        </div>
        <div class="service-item">
          <button type="button" class="service-toggle" aria-expanded="false" aria-controls="service-detail-2">
            <span class="num">02</span>
            <span class="service-title">Musikvideos</span>
          </button>
          <div class="service-detail" id="service-detail-2" hidden>
            <p>Wir verwandeln deine Musik in visuelle Erlebnisse. Mit kreativer Leidenschaft und technischer Präzision produzieren wir hochwertige Musikvideos, die deine Künstleridentität widerspiegeln.</p>
          </div>
        </div>
        <div class="service-item">
          <button type="button" class="service-toggle" aria-expanded="false" aria-controls="service-detail-3">
            <span class="num">03</span>
            <span class="service-title">Social Media &amp; Strategie</span>
          </button>
          <div class="service-detail" id="service-detail-3" hidden>
            <p>Wir entwickeln strategische Content-Pläne, die deine Zielgruppe erreichen. Von hochwertigen Reels bis zur Analyse deiner Insights — damit du verstehst, was funktioniert.</p>
          </div>
        </div>
      </div>
      <div class="service-collage" aria-hidden="true">
        <img src="assets/images/portfolio/1studio/hero.jpg" alt="">
        <img src="assets/images/portfolio/heizungsfuchs24/hero.jpg" alt="">
        <img src="assets/images/portfolio/fouza/hero.jpg" alt="">
      </div>
    </div>
  </section>
```
(The three collage images are created in Task 6 — if this task runs before Task 6, temporarily point at the existing `assets/images/portfolio/fotoshooting/hero.jpg`, `musikvideo/hero.jpg`, `musikvideo-2/hero.jpg` and update once Task 6 lands.)

- [ ] **Step 2: Style the accordion + collage**

Replace `css/main.css:234-248`:
```css
#leistungen h2 { font-size: clamp(1.75rem, 4vw, 2.5rem); margin-bottom: 48px; }
#leistungen .service-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
}
#leistungen .service-card .num {
  font-family: var(--font-headline);
  color: var(--color-accent);
  font-size: 2rem;
}
#leistungen .service-card h3 { margin: 12px 0; font-size: 1.25rem; }
#leistungen .service-card p { color: rgba(255,255,255,0.75); }
@media (max-width: 900px) {
  #leistungen .service-grid { grid-template-columns: 1fr; }
}
```
with:
```css
#leistungen h2 { font-size: clamp(1.75rem, 4vw, 2.5rem); margin-bottom: 48px; }
#leistungen .service-layout { display: grid; grid-template-columns: 1.1fr 1fr; gap: 48px; align-items: center; }
#leistungen .service-item { border-top: 1px solid rgba(255,255,255,0.15); }
#leistungen .service-item:last-child { border-bottom: 1px solid rgba(255,255,255,0.15); }
#leistungen .service-toggle {
  width: 100%; min-height: 44px;
  display: flex; align-items: center; gap: 20px;
  padding: 20px 0; background: transparent; border: none; color: var(--color-fg);
  text-align: left; cursor: pointer; font-size: 1.1rem;
}
#leistungen .service-toggle:hover { color: var(--color-accent); }
#leistungen .service-toggle:focus-visible { outline: 3px solid var(--color-fg); outline-offset: -3px; }
#leistungen .service-toggle .num { font-family: var(--font-headline); color: var(--color-accent); font-size: 1.5rem; flex: none; }
#leistungen .service-detail { overflow: hidden; height: 0; padding: 0; }
#leistungen .service-item.is-open .service-detail { padding: 0 0 24px 44px; }
#leistungen .service-detail p { color: rgba(255,255,255,0.75); max-width: 44ch; }
#leistungen .service-collage { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; height: 420px; }
#leistungen .service-collage img { width: 100%; height: 100%; object-fit: cover; border-radius: 4px; }
#leistungen .service-collage img:nth-child(1) { clip-path: polygon(15% 0, 100% 0, 85% 100%, 0 100%); }
#leistungen .service-collage img:nth-child(3) { clip-path: polygon(0 0, 85% 0, 100% 100%, 15% 100%); }
@media (max-width: 900px) {
  #leistungen .service-layout { grid-template-columns: 1fr; }
  #leistungen .service-collage { display: none; }
}
```

- [ ] **Step 3: Wire the expand/collapse behavior**

In `js/main.js`, add a new function next to `initCaseExpand()` (same file, same factory scope so it can reuse `prefersReducedMotion` and `gsap`):
```js
  function initServiceAccordion() {
    var items = document.querySelectorAll('#leistungen .service-item');
    if (!items.length) return;

    function setOpen(item, isOpen) {
      var btn = item.querySelector('.service-toggle');
      var detail = item.querySelector('.service-detail');
      item.classList.toggle('is-open', isOpen);
      btn.setAttribute('aria-expanded', String(isOpen));
      detail.hidden = false;
      if (prefersReducedMotion()) {
        detail.style.height = isOpen ? 'auto' : '0';
        if (!isOpen) detail.hidden = true;
        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
        return;
      }
      if (isOpen) {
        gsap.fromTo(detail, { height: 0 }, {
          height: 'auto', duration: 0.4, ease: 'power2.inOut',
          onComplete: function () { if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh(); }
        });
      } else {
        gsap.to(detail, {
          height: 0, duration: 0.3, ease: 'power2.inOut',
          onComplete: function () {
            detail.hidden = true;
            if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
          }
        });
      }
    }

    items.forEach(function (item) {
      item.querySelector('.service-toggle').addEventListener('click', function () {
        var alreadyOpen = item.classList.contains('is-open');
        items.forEach(function (other) { if (other !== item) setOpen(other, false); });
        setOpen(item, !alreadyOpen);
      });
    });
  }
```
Then add the call inside `initMainPage()` next to the other `init*()` calls (find the block containing `initCaseExpand();` or similar and add `initServiceAccordion();` immediately after it).

- [ ] **Step 4: Verify manually**

Reload, confirm item 01 is open by default, clicking 02 closes 01 and opens 02 (only one open at a time), collage images visible on desktop with the diagonal clip on the outer two, collage hidden below 900px, keyboard-tab through all three toggles shows focus rings.

- [ ] **Step 5: Commit**

```bash
git add index.html css/main.css js/main.js
git commit -m "feat: turn Leistungen section into a single-open accordion with image collage"
```

---

## Task 4: Prozess → two-column pinned layout

**Files:**
- Modify: `index.html:181-205` (`#prozess` section)
- Modify: `css/main.css:338-346` (`#prozess` rules)
- Modify: `js/main.js` `initProcessPin()` (`:219-237`)

**Interfaces:**
- Consumes: existing `ScrollTrigger` (already registered in `initScrollReveal()`, `js/main.js:37`).

- [ ] **Step 1: Restructure the markup into two columns**

Replace `index.html:181-205`:
```html
  <section id="prozess">
    <h2>Unser Prozess</h2>
    <div class="process-grid">
      <div class="step">
        <div class="num">01</div>
        <h3>Erstgespräch</h3>
        <p>Wir klären gemeinsam deine Vision und die Ziele deines Projekts.</p>
      </div>
      <div class="step">
        <div class="num">02</div>
        <h3>Konzept</h3>
        <p>Wir entwickeln ein klares Konzept und planen die visuelle Storyline.</p>
      </div>
      <div class="step">
        <div class="num">03</div>
        <h3>Produktionstag</h3>
        <p>Wir filmen und fotografieren mit höchster Präzision und Kreativität.</p>
      </div>
      <div class="step">
        <div class="num">04</div>
        <h3>Schnitt &amp; Posting</h3>
        <p>Wir editieren und veröffentlichen dein fertiges Video für maximale Reichweite.</p>
      </div>
    </div>
  </section>
```
with:
```html
  <section id="prozess">
    <div class="process-layout">
      <div class="process-pinned">
        <img class="process-logo" src="assets/images/logos/fabian-visuals-icon.png" alt="" aria-hidden="true">
        <h2>Unser Prozess</h2>
        <p>Vier Schritte, ein klarer Ablauf — von der ersten Idee bis zum fertigen Video.</p>
      </div>
      <div class="process-track">
        <div class="process-line" aria-hidden="true"><span class="process-dot"></span></div>
        <div class="process-steps">
          <div class="step">
            <div class="num">01</div>
            <h3>Erstgespräch</h3>
            <p>Wir klären gemeinsam deine Vision und die Ziele deines Projekts.</p>
          </div>
          <div class="step">
            <div class="num">02</div>
            <h3>Konzept</h3>
            <p>Wir entwickeln ein klares Konzept und planen die visuelle Storyline.</p>
          </div>
          <div class="step">
            <div class="num">03</div>
            <h3>Produktionstag</h3>
            <p>Wir filmen und fotografieren mit höchster Präzision und Kreativität.</p>
          </div>
          <div class="step">
            <div class="num">04</div>
            <h3>Schnitt &amp; Posting</h3>
            <p>Wir editieren und veröffentlichen dein fertiges Video für maximale Reichweite.</p>
          </div>
        </div>
      </div>
    </div>
  </section>
```

- [ ] **Step 2: Style the two-column layout, line, and dot**

Replace `css/main.css:338-346`:
```css
#prozess .process-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}
#prozess .step .num { font-family: var(--font-headline); color: var(--color-accent); font-size: 1.5rem; }
#prozess .step h3 { margin: 8px 0; font-size: 1.05rem; }
#prozess .step p { color: rgba(255,255,255,0.75); font-size: 0.95rem; }
@media (max-width: 900px) {
  #prozess .process-grid { grid-template-columns: 1fr; gap: 32px; }
}
```
with:
```css
#prozess .process-layout { display: grid; grid-template-columns: 1fr 1.4fr; gap: 64px; }
#prozess .process-pinned { align-self: start; position: sticky; top: 120px; }
#prozess .process-logo { height: 28px; width: auto; margin-bottom: 24px; }
#prozess .process-pinned h2 { font-size: clamp(1.75rem, 4vw, 2.5rem); margin-bottom: 16px; }
#prozess .process-pinned p { color: rgba(255,255,255,0.75); max-width: 32ch; }
#prozess .process-track { position: relative; display: flex; gap: 32px; }
#prozess .process-line { position: relative; width: 2px; background: rgba(255,255,255,0.15); flex: none; }
#prozess .process-dot { position: absolute; left: 50%; top: 0; width: 14px; height: 14px; margin-left: -7px; border-radius: 50%; background: var(--color-fg); }
#prozess .process-steps { flex: 1; display: flex; flex-direction: column; gap: 96px; padding: 8px 0; }
#prozess .step .num { font-family: var(--font-headline); color: var(--color-accent); font-size: 1.5rem; }
#prozess .step h3 { margin: 8px 0; font-size: 1.05rem; }
#prozess .step p { color: rgba(255,255,255,0.75); font-size: 0.95rem; }
@media (max-width: 900px) {
  #prozess .process-layout { grid-template-columns: 1fr; gap: 32px; }
  #prozess .process-pinned { position: static; }
  #prozess .process-line { display: none; }
  #prozess .process-steps { gap: 32px; }
}
```

- [ ] **Step 3: Rewrite `initProcessPin()` to scrub the dot alongside the step reveals**

Replace `js/main.js:219-237`:
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
with:
```js
  function initProcessPin() {
    if (prefersReducedMotion()) return;
    var track = document.querySelector('#prozess .process-track');
    var line = document.querySelector('#prozess .process-line');
    var dot = document.querySelector('#prozess .process-dot');
    var steps = document.querySelectorAll('#prozess .step');
    if (!track || !line || !dot || !steps.length) return;
    gsap.set(steps, { opacity: 0, y: 24 });
    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: track,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1
      }
    });
    tl.to(dot, { top: '100%', ease: 'none' }, 0);
    steps.forEach(function (step, i) {
      tl.to(step, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, i * 0.5);
    });
  }
```
(This drops `pin: true` on the section — the pinning effect now comes from `.process-pinned`'s `position: sticky` in CSS, which is what leonapp actually does and avoids the pin-spacer/`ScrollTrigger.refresh()` interaction entirely. The dot animates its `top` from 0% to 100% of `.process-line`'s height over the same scrubbed scroll range as the step reveals, so they track the same scroll progress by construction.)

- [ ] **Step 4: Verify manually**

Reload, scroll through `#prozess`: confirm the left column (logo + heading) stays pinned via CSS `position: sticky` while the right column scrolls; confirm the dot travels down the line as you scroll and each step fades in in sync with the dot passing it; confirm `js/tests/*.test.js` still pass (no behavior in those tests touches this function, but run them to be sure nothing else broke):
```bash
node js/tests/isTouchDevice.test.js && node js/tests/prefersReducedMotion.test.js && node js/tests/nextHeroMode.test.js
```

- [ ] **Step 5: Commit**

```bash
git add index.html css/main.css js/main.js
git commit -m "feat: rebuild Prozess as two-column sticky layout with scroll-synced progress dot"
```

---

## Task 5: Footer legal links — full white

**Files:**
- Modify: `css/main.css` (`.legal-links a` rule added in the previous session)
- Modify: `css/wedding.css` (`.w-footer .legal-links a` rule)

- [ ] **Step 1: Update the color**

In `css/main.css`, change:
```css
.legal-links a { color: rgba(255,255,255,0.75); text-decoration: underline; }
```
to:
```css
.legal-links a { color: var(--color-fg); text-decoration: underline; }
```

In `css/wedding.css`, change:
```css
.w-footer .legal-links a { color: var(--w-color-text); }
```
to:
```css
.w-footer .legal-links a { color: var(--w-color-text); font-weight: 600; }
```
(Wedding mode's footer text is already the dark `--w-color-text` on the light `--w-color-bg` — there's no "dim gray" to fix there, so the equivalent "make it stand out" treatment is `font-weight: 600` rather than a color change, keeping the change meaningful for both modes without introducing an unused token.)

- [ ] **Step 2: Verify manually**

Reload `index.html` and `hochzeiten.html`, confirm the Impressum/Datenschutz row is now full white on the dark footer and bold on the light wedding footer, confirm `:focus-visible` outline still shows on tab.

- [ ] **Step 3: Commit**

```bash
git add css/main.css css/wedding.css
git commit -m "fix: make footer legal-links row stand out (full white / bold)"
```

---

## Task 6: Real client photography for the case grid

**Files:**
- Create: `assets/images/portfolio/1studio/hero.jpg`, `assets/images/portfolio/1studio/video.mp4`
- Create: `assets/images/portfolio/heizungsfuchs24/hero.jpg`, `assets/images/portfolio/heizungsfuchs24/video.mp4`
- Create: `assets/images/portfolio/fouza/hero.jpg`, `assets/images/portfolio/fouza/video.mp4`
- Modify: `index.html` (case-grid `<img>`/`<video>` `src` attributes for all three cards, and the collage `<img src>` values from Task 3 if they were left pointing at the old placeholder folders)

- [ ] **Step 1: Extract and transcode 1Studio**

```bash
cd "/Users/fabianscholl/Zweites Gehirn/02 Projekte/Fabian Visuals Website Relaunch/Code"
mkdir -p assets/images/portfolio/1studio
ffmpeg -y -i "assets/images/1 studio.MP4" -ss 00:00:05 -frames:v 1 -q:v 3 assets/images/portfolio/1studio/hero.jpg
ffmpeg -y -i "assets/images/1 studio.MP4" -ss 00:00:03 -t 8 -vf "scale=1080:-2,format=yuv420p" -c:v libx264 -crf 24 -preset slow -c:a aac -b:a 96k assets/images/portfolio/1studio/video.mp4
```
Expected: both files exist; `hero.jpg` opens as a clean still frame (not mid-blink/motion-blur — if it looks bad, retry with `-ss 00:00:08` or another timestamp within the clip's 29s duration).

- [ ] **Step 2: Extract and transcode Heizungsfuchs24**

```bash
mkdir -p assets/images/portfolio/heizungsfuchs24
SRC="/Users/fabianscholl/Desktop/FABIAN.VISUALS/00_PROJEKTE/PROJ_01_Heizungsfuchs24/05_Exports/Final_Upload_HF24/Captions_63E509.mp4"
ffmpeg -y -i "$SRC" -ss 00:00:02 -frames:v 1 -q:v 3 assets/images/portfolio/heizungsfuchs24/hero.jpg
ffmpeg -y -i "$SRC" -vf "scale=1080:-2,format=yuv420p" -c:v libx264 -crf 24 -preset slow -c:a aac -b:a 96k assets/images/portfolio/heizungsfuchs24/video.mp4
```
Expected: both files exist (source is a 7s clip, no `-t` trim needed — the whole thing is short enough to use as-is).

- [ ] **Step 3: Extract and transcode Fouza**

```bash
mkdir -p assets/images/portfolio/fouza
ffmpeg -y -i "assets/images/4:3 Studio_Fouza_CUT OUT_5.MOV" -ss 00:00:02 -frames:v 1 -q:v 3 assets/images/portfolio/fouza/hero.jpg
ffmpeg -y -i "assets/images/4:3 Studio_Fouza_CUT OUT_5.MOV" -vf "scale=1080:-2,format=yuv420p" -c:v libx264 -crf 24 -preset slow -c:a aac -b:a 96k assets/images/portfolio/fouza/video.mp4
```
Expected: both files exist (source is a 6.8s clip, used in full).

- [ ] **Step 4: Point the case-grid markup at the new files**

In `index.html`, in the 1Studio `.case-card` (the one with `case-index` `01 / 03`), change every `assets/images/portfolio/fotoshooting/...` reference to `assets/images/portfolio/1studio/hero.jpg` (there is no detail gallery or video for this card today per the previous session's cleanup — add one if useful: a `<video>` tag right after the closing `</div>` of `.case-detail-gallery`'s parent, following the exact same pattern as the Heizungsfuchs24/Fouza cards' existing `<video ... playsinline disablepictureinpicture controlsList="nodownload noplaybackrate">` markup, pointing at `assets/images/portfolio/1studio/video.mp4`).

In the Heizungsfuchs24 `.case-card` (`02 / 03`), change every `assets/images/portfolio/musikvideo-2/...` reference to `assets/images/portfolio/heizungsfuchs24/...` (same filenames, `hero.jpg` and `video.mp4`).

In the Fouza `.case-card` (`03 / 03`), change every `assets/images/portfolio/musikvideo/...` reference to `assets/images/portfolio/fouza/...`.

- [ ] **Step 5: Update the Leistungen collage image paths (if Task 3 ran first with placeholder paths)**

In `index.html`, in `.service-collage`, change:
```html
        <img src="assets/images/portfolio/fotoshooting/hero.jpg" alt="">
        <img src="assets/images/portfolio/musikvideo/hero.jpg" alt="">
        <img src="assets/images/portfolio/musikvideo-2/hero.jpg" alt="">
```
to:
```html
        <img src="assets/images/portfolio/1studio/hero.jpg" alt="">
        <img src="assets/images/portfolio/fouza/hero.jpg" alt="">
        <img src="assets/images/portfolio/heizungsfuchs24/hero.jpg" alt="">
```

- [ ] **Step 6: Verify manually**

Reload, confirm all three case cards show real photography of the actual client (not a stand-in), expand each to confirm its video plays and controls work, confirm the Leistungen collage shows the same three real photos.

- [ ] **Step 7: Commit**

```bash
git add assets/images/portfolio/1studio assets/images/portfolio/heizungsfuchs24 assets/images/portfolio/fouza index.html
git commit -m "feat: replace case-grid placeholder photography with real client footage"
```

---

## Task 7: Final full-site regression pass

**Files:** none (verification only)

- [ ] **Step 1: Run the JS unit tests**
```bash
node js/tests/isTouchDevice.test.js && node js/tests/prefersReducedMotion.test.js && node js/tests/nextHeroMode.test.js
```
Expected: all three print their `... tests passed` line.

- [ ] **Step 2: Manual walkthrough**

`python3 -m http.server 8080`, open `index.html` and `hochzeiten.html`. Check: hero video loops silently and looks correct in both normal and reduced-motion mode; header logo + pill CTA render correctly at desktop and mobile widths; Leistungen accordion opens/closes correctly with only one item open at a time; Prozess left column stays sticky while stepping through the four steps with the dot in sync; footer legal links are visibly white/bold on both pages; all three case cards show correct real photography and their videos play without triggering Android picture-in-picture (verify the `disablepictureinpicture` attribute is present via devtools on all `<video>` tags site-wide).

- [ ] **Step 3: Push and confirm live deployment**
```bash
git push origin main
```
Cloudflare Pages auto-deploys on push (existing Git integration, confirmed working in the previous session) — wait ~15s, then re-run the same manual walkthrough against `https://fabian-visuals-site.pages.dev/`.
