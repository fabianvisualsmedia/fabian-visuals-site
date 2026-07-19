# Polish Round 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Address Fabian's second round of live-site feedback: revert the case grid to generic placeholders (real client photography didn't read well — bad frames, mismatched crops), fix the client-logo marquee's boxed background, and add three new scroll-driven interaction patterns (nav-bar declutter, hero shrink, footer reveal) plus spacing/typography fixes in the Prozess section.

**Architecture:** All changes are additive/modifying DOM-CSS-JS in the existing `index.html` / `css/main.css` / `js/main.js` — no new pages, no new dependencies. New scroll-driven effects (nav shrink, hero shrink) use GSAP ScrollTrigger, consistent with the rest of the site. The footer redesign (dark→light theme flip for one section) follows the existing wedding-mode pattern of CSS custom properties scoped to a container, not new global tokens.

## Global Constraints

- Do not change `--color-bg`, `--color-fg`, `--color-accent`, `--font-headline`, `--font-body` (root tokens) — the footer's white/black flip must be scoped locally (e.g. `footer { ... }` overriding text/background color directly, not touching the root palette used everywhere else).
- Every new animation must have a `prefersReducedMotion()` fallback (static end-state, no motion) — established pattern throughout `js/main.js`.
- Every new/changed interactive element needs `:focus-visible` and ≥44×44px hit area.
- Video/image Android-hardening conventions from prior rounds stay as-is; this round removes case-grid photography rather than adding it, so no new video hardening is needed.
- Run `node js/tests/isTouchDevice.test.js && node js/tests/prefersReducedMotion.test.js && node js/tests/nextHeroMode.test.js` after every task.
- TikTok URL is not documented anywhere in the project — use `https://tiktok.com/@fabian.visuals` (matching the existing Instagram handle pattern) as a placeholder and flag it in the README as needing Fabian's confirmation, same treatment as other placeholder content in this repo.

---

## Task 1: Case grid — revert to generic placeholders

**Files:**
- Modify: `index.html` (`#projekte .case-grid`, all 3 `.case-card`s)
- Modify: `css/main.css` (`.case-media` — needs a placeholder-safe state with no `<img>`)

**Context:** The real client photography (1Studio/Heizungsfuchs24/Fouza, added in the previous redesign round) produced bad results in practice — a mistimed frame extraction showing a browser/Google-search transition mid-scene, an overexposed/washed-out Fouza still, and a caption overlay that reads oddly out of context. Fabian wants this reverted to three generic, category-based placeholder cards with no stats, no real photos or videos, exact final naming TBD by him later.

- [ ] **Step 1: Replace the case-grid markup**

Replace the entire `<div class="case-grid">...</div>` block in `index.html` with three placeholder cards, no images, no stats, no expand/detail (nothing to expand to yet):

```html
    <div class="case-grid">
      <div class="case-card case-card--placeholder">
        <div class="case-media case-media--placeholder">
          <span class="case-index" aria-hidden="true">01 / 03</span>
          <div class="case-info">
            <p class="case-category">Musikvideos</p>
            <h3>Platzhalter</h3>
          </div>
        </div>
      </div>
      <div class="case-card case-card--placeholder">
        <div class="case-media case-media--placeholder">
          <span class="case-index" aria-hidden="true">02 / 03</span>
          <div class="case-info">
            <p class="case-category">DJ-Sets</p>
            <h3>Platzhalter</h3>
          </div>
        </div>
      </div>
      <div class="case-card case-card--placeholder">
        <div class="case-media case-media--placeholder">
          <span class="case-index" aria-hidden="true">03 / 03</span>
          <div class="case-info">
            <p class="case-category">Taschen-Fotos</p>
            <h3>Platzhalter</h3>
          </div>
        </div>
      </div>
    </div>
```

- [ ] **Step 2: Style the placeholder media box**

The existing `.case-media` rule expects a real `<img>` filling it (`.case-media img { width:100%; height:100%; object-fit:cover }`) — with no image, give the box a plain dark placeholder fill so it doesn't render as a blank white gap. Add to `css/main.css` near the existing `.case-media` rules:

```css
.case-media--placeholder {
  background: #16161a;
  display: flex;
  align-items: flex-end;
}
```

(`.case-media`'s existing `aspect-ratio: 4/3` and `border-radius` still apply since the class stays on the element — this new rule only adds the fill color and flex alignment so `.case-info` still sits at the bottom exactly like it does over a real photo.)

- [ ] **Step 3: Remove now-unreferenced case-toggle/case-detail JS handling for placeholder cards**

`initCaseExpand()` in `js/main.js` calls `card.querySelector('.case-toggle')` and returns early (`if (!btn) return;`) when a card has no toggle button — since the new placeholder cards have no `.case-toggle`/`.case-detail` markup at all, this already degrades safely with zero changes needed. Confirm this by reading the current `initCaseExpand()` loop (`cards.forEach(function (card) { var btn = card.querySelector('.case-toggle'); if (!btn) return; ... })`) — no code change required here, just verify.

- [ ] **Step 4: Remove the now-orphaned real client media**

The `1studio/`, `heizungsfuchs24/`, `fouza/` folders under `assets/images/portfolio/` are no longer referenced anywhere. Confirm with `grep -rn "1studio\|heizungsfuchs24\|fouza" *.html` (case-grid and the Leistungen collage from the prior round both need checking — the collage's 3 images currently point at these same three folders and must be repointed, see Task 6 below for the collage fix, do not delete these folders until Task 6 also stops referencing them). Once nothing references them, `git rm -r assets/images/portfolio/1studio assets/images/portfolio/heizungsfuchs24 assets/images/portfolio/fouza`.

- [ ] **Step 5: Verify manually and commit**

Reload `#projekte`: three plain dark cards with category labels (Musikvideos / DJ-Sets / Taschen-Fotos) and "Platzhalter" heading, no images, no stats, no expand button. No console errors.

```bash
git add index.html css/main.css
git commit -m "feat: revert case grid to generic category placeholders"
```
(Do the `git rm` from Step 4 as part of this same commit, once Task 6's collage fix has landed — see the note there.)

---

## Task 2: Nav bar — scroll-away background, logo shrinks to wordmark

**Files:**
- Modify: `css/main.css` (`#site-nav`)
- Modify: `js/main.js` (new `initNavScrollState()`, called from `initMainPage()`)

**Context:** Currently `#site-nav` always shows a dark blurred background bar. Fabian wants that background to fade away once the user scrolls past the hero, leaving just the logo and nav links floating over the page — and wants the logo itself to shrink down to a minimal wordmark-only mark at that point (not the current icon).

**Interfaces:**
- Produces: a `.nav-scrolled` class toggled on `#site-nav` by scroll position, and expects a small wordmark asset to swap to.

- [ ] **Step 1: Add a minimal wordmark logo variant**

Reuse the existing `assets/images/logos/fabian-visuals-icon.png` — no new asset needed if it's already just the "F" mark; if it's a larger multi-element logo, crop/regenerate a tight "F"-only version at `assets/images/logos/fabian-visuals-icon.png` (check the current file's visual content first before assuming it needs changing — Fabian's request is about the *rendered size* shrinking to a minimal mark, which the existing 32px-tall icon crop already mostly satisfies; if so, only the CSS height needs to shrink further on scroll, no new asset needed).

- [ ] **Step 2: Add scroll-state CSS**

In `css/main.css`, add near the existing `#site-nav` rules:
```css
#site-nav { transition: background 400ms ease, backdrop-filter 400ms ease; }
#site-nav.nav-scrolled { background: transparent; backdrop-filter: none; }
#site-nav.nav-scrolled .logo img { height: 22px; transition: height 400ms ease; }
#site-nav .logo img { transition: height 400ms ease; }
```
Keep `#site-nav ul`/`.nav-cta` fully visible and interactive in the scrolled state — only the background/logo size change, per the brief ("Logo und Menü bleibt").

- [ ] **Step 3: Wire the scroll listener**

In `js/main.js`, add next to the other `init*()` functions:
```js
  function initNavScrollState() {
    var nav = document.getElementById('site-nav');
    if (!nav) return;
    function update() {
      nav.classList.toggle('nav-scrolled', window.scrollY > window.innerHeight * 0.8);
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }
```
Call `initNavScrollState();` from `initMainPage()` alongside the other init calls. This uses a plain scroll listener (not GSAP ScrollTrigger) since it's a simple threshold toggle, not a scrubbed/pinned effect — matches the complexity of the existing `initNavToggle()` pattern rather than over-engineering with GSAP for a binary state change. Reduced-motion note: the `transition` in CSS naturally respects the OS-level reduced-motion in most browsers only if explicitly gated — add `@media (prefers-reduced-motion: reduce) { #site-nav, #site-nav.nav-scrolled .logo img, #site-nav .logo img { transition: none; } }` inside the existing reduced-motion media query block in `css/main.css`.

- [ ] **Step 4: Verify manually and commit**

Scroll down past ~80% of viewport height: nav background fades to transparent, logo shrinks, nav links and pill CTA stay fully visible/clickable. Scroll back up: background and logo size restore. Test with reduced-motion enabled: state still toggles correctly, just without the transition animation.

```bash
git add css/main.css js/main.js
git commit -m "feat: fade nav background and shrink logo on scroll"
```

---

## Task 3: Hero — shrink-on-scroll animation

**Files:**
- Modify: `css/main.css` (`#hero`)
- Modify: `js/main.js` (new `initHeroShrink()`)

**Context:** Fabian wants the hero visual to shrink as the user starts scrolling past it (an Apple-product-page-style effect), rather than just sitting static/full-bleed until it scrolls out of view.

**Interfaces:**
- Consumes: existing `#hero` element, existing `prefersReducedMotion()`.

- [ ] **Step 1: Add a scrub-driven scale-down**

In `js/main.js`, add:
```js
  function initHeroShrink() {
    if (prefersReducedMotion()) return;
    var hero = document.querySelector('#hero');
    if (!hero) return;
    gsap.to(hero, {
      scale: 0.92,
      borderRadius: '24px',
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
    });
  }
```
Call `initHeroShrink();` from `initMainPage()`. Note: `#hero` currently has `overflow: hidden` and fills the full viewport width/height — animating `scale` on the whole section (rather than an inner wrapper) will shrink it symmetrically from the center by default; if this causes the hero to visually detach oddly from the fixed nav bar above it (nav is a sibling, not affected by hero's transform, so no interference expected — confirm this empirically), that's fine and matches the intended "shrinks smaller as you scroll" effect. Add `transform-origin: center top;` to `#hero` in CSS so it shrinks anchored to the top (staying attached to the nav) rather than shrinking toward the viewport center.

- [ ] **Step 2: Verify manually and commit**

Scroll from the top: hero visibly scales down slightly with rounding corners appearing as you scroll past it, smoothly tied to scroll position (not janky/delayed). Confirm hero-mode-switch (commercial↔wedding) still works correctly with the scale transform present. Confirm reduced-motion users see no shrink (hero stays full-size/sharp-cornered).

```bash
git add css/main.css js/main.js
git commit -m "feat: add scroll-driven shrink animation to hero section"
```

---

## Task 4: Client-logo marquee — remove boxed backgrounds

**Files:**
- Modify: `css/main.css` (`#kundenlogos .logo-card`)

**Context:** Client logos currently sit inside a light-gray rounded rectangle (`.logo-card { background: rgba(255,255,255,0.92); border-radius: 8px; ... }`). Fabian wants the logos to appear "cut out" — no visible card/background, just the logo mark floating on the dark page background.

- [ ] **Step 1: Strip the card background**

In `css/main.css`, change:
```css
#kundenlogos .logo-card {
  flex: none;
  width: 168px;
  height: 92px;
  background: rgba(255,255,255,0.92);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px 24px;
}
```
to:
```css
#kundenlogos .logo-card {
  flex: none;
  width: 168px;
  height: 92px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px 24px;
}
```
(Just remove `background` and `border-radius` — sizing/centering stays identical.)

- [ ] **Step 2: Check logo asset backgrounds**

Some of the 5 client logo PNGs (`oeltank24.png`, `one-studio.png`, `zaves.png`, `heizungsfuchs24.png`, `maass-raum-coaching.png`) may themselves have an opaque white background baked into the image file (common for logos exported from Canva/PDF) rather than being transparent PNGs — removing the CSS card background will only look "cut out" if the PNGs are actually transparent. Check each file: `for f in assets/images/logos/*.png; do echo "$f:"; python3 -c "from PIL import Image; im=Image.open('$f'); print(im.mode)"; done` (if PIL/Pillow isn't available, open each in an image viewer/Read tool and visually check for a white box around the logo). For any logo that has a baked-in white background (not true transparency), flag this in your report — do not attempt to remove backgrounds from raster logos yourself (that requires actual image editing / background-removal, which needs a judgment call on each specific logo and should go back to Fabian rather than being guessed at).

- [ ] **Step 3: Verify manually and commit**

Reload `#kundenlogos`: logos with real transparency now float directly on the dark background with no visible box; logos with baked-in white backgrounds will still show a box (documented as a known follow-up, not a code bug).

```bash
git add css/main.css
git commit -m "fix: remove boxed background from client-logo marquee"
```

---

## Task 5: Footer — light theme flip, more space, fade-in, social icons

**Files:**
- Modify: `index.html` (footer markup — add TikTok link, black-logo image)
- Modify: `css/main.css` (`footer` rules)
- Modify: `js/main.js` (scroll-reveal registration for the footer)

**Context:** Footer should flip to a white background with black text, show the black Fabian Visuals logo, have Instagram on one side and TikTok on the other, more breathing room (padding), and fade in with a scroll-triggered animation rather than just being static.

**Interfaces:**
- Consumes: `assets/images/logos/Fabian Visuals Logo schwarz.png` (already sitting untracked in the repo since an earlier session — copy it to a proper committed filename, matching how Task 1 of the prior redesign round handled the white logo variant).

- [ ] **Step 1: Commit the black logo asset under a proper filename**

```bash
cp "assets/images/logos/Fabian Visuals Logo schwarz.png" assets/images/logos/fabian-visuals-icon-black.png
```

- [ ] **Step 2: Restructure the footer markup**

Replace the current `<footer>...</footer>` block in `index.html` with:
```html
  <footer>
    <a href="https://instagram.com/Fabian.Visuals" target="_blank" rel="noopener" class="footer-social footer-social--left" aria-label="Instagram">Instagram</a>
    <div class="footer-center">
      <img src="assets/images/logos/fabian-visuals-icon-black.png" alt="Fabian Visuals" class="footer-logo">
      <p>&copy; 2026 Fabian Visuals — Bonn / Köln / Düsseldorf / Aachen</p>
      <p><a class="wedding-teaser" href="hochzeiten.html">Ihr heiratet? → Hochzeitsfotografie ansehen</a></p>
      <p class="legal-links"><a href="impressum.html">Impressum</a> · <a href="datenschutz.html">Datenschutz</a></p>
    </div>
    <a href="https://tiktok.com/@fabian.visuals" target="_blank" rel="noopener" class="footer-social footer-social--right" aria-label="TikTok">TikTok</a>
  </footer>
```
(The old `<nav class="socials">` wrapper is dropped in favor of two directly-positioned social links, per the "links Instagram, rechts TikTok" layout — this is a deliberate structural change, not an oversight.)

- [ ] **Step 2: Style the flipped footer**

Replace the existing `footer { ... }` block and everything through `.wedding-teaser`'s footer-specific overrides with:
```css
footer {
  position: relative;
  background: #FFFFFF;
  color: #000000;
  text-align: center;
  padding: 80px 24px;
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
}
footer .footer-logo { height: 28px; width: auto; margin-bottom: 16px; }
footer .footer-center p { color: rgba(0,0,0,0.7); }
footer .footer-social {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  color: #000000;
  font-weight: 700;
  text-decoration: underline;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}
footer .footer-social--left { left: 24px; }
footer .footer-social--right { right: 24px; }
footer .footer-social:focus-visible { outline: 3px solid #000000; outline-offset: 2px; }
.legal-links a { color: #000000; }
.wedding-teaser { border-color: #C9A876; color: #C9A876; }
```
(`.legal-links a` and `.wedding-teaser` already exist as rules elsewhere in the file with dark-theme colors — since the footer is now light, these need footer-scoped overrides here rather than editing the original rules, which may still apply the dark-theme colors to elements outside the footer if reused elsewhere. Check whether `.legal-links`/`.wedding-teaser` classes are used anywhere outside `<footer>` before deciding whether to edit the original rule directly or add a footer-scoped override — if they're footer-only, editing in place is cleaner than adding overrides.)

At small widths, the two absolutely-positioned social links can collide with the centered content — add to the existing mobile breakpoint or a new one:
```css
@media (max-width: 600px) {
  footer { flex-direction: column; gap: 24px; padding: 48px 24px 96px; }
  footer .footer-social { position: static; transform: none; }
}
```

- [ ] **Step 3: Add scroll-reveal fade-in**

In `js/main.js`, `initScrollReveal()` already handles a list of selectors with `gsap.fromTo(el, {opacity:0,y:24}, {opacity:1,y:0,...,scrollTrigger:{trigger:el,start:'top 85%'}})`. Add `footer` to that selector list (the existing `var targets = document.querySelectorAll('...')` string) so the footer fades in the same way other sections do — no new function needed, this reuses the established mechanism.

- [ ] **Step 4: Verify manually and commit**

Reload: footer is white with black text, black logo centered, Instagram link fixed to the left edge and TikTok to the right (both vertically centered on the footer), fades in on scroll like other sections, collapses to a stacked layout on narrow mobile widths without overlapping. Confirm focus-visible rings are visible on both social links (dark outline on white background).

```bash
git add index.html css/main.css js/main.js assets/images/logos/fabian-visuals-icon-black.png
git commit -m "feat: redesign footer with light theme, IG/TikTok links, and scroll fade-in"
```

---

## Task 6: Prozess section — spacing, edge padding, type size; Leistungen collage repoint

**Files:**
- Modify: `css/main.css` (`#prozess`, `#leistungen .service-collage img`)
- Modify: `index.html` (`.service-collage` image `src` attributes)

**Context:** Two issues in one section, plus one cleanup:
1. The Prozess section's pinned left column sits too close to the left viewport edge, and its heading is rendering larger than it should feel — needs more horizontal breathing room and a smaller heading size.
2. There should be more vertical space at the black-block transition into/around this section.
3. The Leistungen collage (added in the prior redesign round) still points at the now-removed `1studio/heizungsfuchs24/fouza` real-photo folders (Task 1 of this plan deletes those) — needs to point at something else now that there's no real case photography.

- [ ] **Step 1: Add horizontal padding and reduce heading size**

In `css/main.css`, change:
```css
#prozess .process-pinned { align-self: start; position: sticky; top: 120px; }
#prozess .process-logo { height: 28px; width: auto; margin-bottom: 24px; }
#prozess .process-pinned h2 { font-size: clamp(1.75rem, 4vw, 2.5rem); margin-bottom: 16px; }
```
to:
```css
#prozess .process-pinned { align-self: start; position: sticky; top: 120px; padding-left: 8px; }
#prozess .process-logo { height: 28px; width: auto; margin-bottom: 24px; }
#prozess .process-pinned h2 { font-size: clamp(1.5rem, 3vw, 2rem); margin-bottom: 16px; }
```
(`#prozess` itself already inherits the base `section { padding: 96px 24px; }` — this adds a small additional inset specifically to the pinned column so its content doesn't feel flush against that existing 24px edge, matching the screenshot's request for more visible margin. Reduce the `.process-pinned p` max-width slightly too if the smaller heading now makes the paragraph look disproportionately wide — use your judgment checking it visually.)

- [ ] **Step 2: Add more vertical space around the section**

Increase `#prozess`'s own top/bottom padding beyond the base `section` default:
```css
#prozess { padding-top: 160px; padding-bottom: 160px; }
```
(Add this as a new rule; it overrides the base `section` rule's `96px` via higher specificity from the ID selector.)

- [ ] **Step 3: Repoint the Leistungen collage**

In `index.html`, `.service-collage` currently has:
```html
        <img src="assets/images/portfolio/1studio/hero.jpg" alt="" loading="lazy">
        <img src="assets/images/portfolio/fouza/hero.jpg" alt="" loading="lazy">
        <img src="assets/images/portfolio/heizungsfuchs24/hero.jpg" alt="" loading="lazy">
```
Since Task 1 removes those folders, repoint these at existing, still-present imagery that makes sense for a services-collage context — the wedding portfolio photos (`assets/images/wedding/01.jpg`, `02.jpg`, `03.jpg`) are real, high-quality, already-committed photography, even though they're from the wedding side of the business; using them here is a reasonable stand-in for "real photography exists on this site" without needing new client photography. If this substitution feels wrong once you see it rendered (e.g. tonally mismatched with the dark commercial section), fall back to solid color blocks instead:
```css
#leistungen .service-collage img { object-fit: cover; }
#leistungen .service-collage { background: #16161a; }
```
and remove the `<img>` tags from the collage entirely, leaving three empty clipped divs with a dark fill (matching Task 1's placeholder treatment) — use your judgment on which reads better, and document which one you picked and why in your report.

- [ ] **Step 4: Verify manually and commit**

Reload `#prozess`: pinned column has visible left margin beyond the section's base padding, heading reads smaller/more proportionate, noticeably more vertical space before the section starts and after it ends. Leistungen collage shows either repurposed wedding photography or plain dark placeholder blocks (your call from Step 3), not a 404/broken image.

```bash
git add index.html css/main.css
git commit -m "fix: add Prozess section breathing room, repoint Leistungen collage off removed photos"
```

---

## Task 7: README — reflect placeholder/open-point changes

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update the open-points checklist**

Remove the now-stale "Case-Grid Bilder sind Platzhalter..." note (case grid is deliberately, cleanly placeholder again, not accidentally) and add:
```markdown
- [ ] Case-Grid final entscheiden: Kategorien (aktuell Musikvideos/DJ-Sets/Taschen-Fotos), Titel, echte Fotos/Videos nachreichen
- [ ] TikTok-URL im Footer bestätigen (aktuell Platzhalter `tiktok.com/@fabian.visuals`, geraten nach IG-Handle-Muster)
- [ ] Client-Logos mit weißem Hintergrund geprüft (siehe Task 4 Report) — ggf. freistellen für den jetzt hintergrundlosen Marquee-Look
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: update open-points checklist for placeholder case grid and footer TikTok link"
```
