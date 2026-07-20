# White Theme Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Flip the commercial site's base theme from black-background/white-text to white-background/black-text (Apple-style), per Fabian's explicit direction — with two deliberate exceptions that stay dark: the `#hero` section (video/image showcase, dark for contrast) and `#site-nav` (floating overlay bar, stays dark/white-text so it reads over both the dark hero and the new white sections beneath it, matching the text-shadow approach already shipped for it). Red (`--color-accent: #E1272C`) stays the accent color throughout. A new `--color-bg-alt: #F2F2F2` token gives elevated surfaces (cards, placeholders, form inputs) a light-gray Apple-card look instead of sitting flat on pure white.

**Architecture:** CSS custom properties already exist at `:root` (`--color-bg`, `--color-fg`, `--color-accent`). The cleanest way to keep `#hero` and `#site-nav` dark while everything else flips is to **redeclare `--color-bg`/`--color-fg` locally on those two selectors** — CSS custom properties cascade, so every descendant rule that already reads `var(--color-fg)`/`var(--color-bg)` (nav links, hero CTA button, hero focus rings, etc.) automatically picks up the local dark values with zero changes to those individual rules. Only rules using **hardcoded rgba(255,255,255,...) literals** (not tokens) need manual updates to their opposite (rgba(0,0,0,...)), since those never respond to the root token flip.

## Global Constraints

- `--color-accent: #E1272C` stays exactly as-is everywhere — do not touch it.
- `wedding.css` / `hochzeiten.html` are a completely separate, already-correct light theme (`--w-*` tokens) — out of scope, do not touch.
- `css/legal.css` / `impressum.html` / `datenschutz.html` are token-driven with no hardcoded colors — they inherit the new theme automatically; verify but don't expect to need edits there.
- Every contrast-relevant change must be verified in a real browser wherever possible (this plan's prior rounds repeatedly found real bugs — stacking contexts, cache issues, stale hardcoded colors — that static reading missed).
- Run `node js/tests/isTouchDevice.test.js && node js/tests/prefersReducedMotion.test.js && node js/tests/nextHeroMode.test.js` after every task.
- Do not change `--font-headline`/`--font-body`.

---

## Task 1: Root token flip + dark-scope overrides for Hero and Nav + cursor fix

**Files:**
- Modify: `css/main.css` (`:root`, `#hero`, `#site-nav`, `.cursor-dot`/`.cursor-ring`)

**Context:** This is the foundational task everything else depends on. Getting the scoping right here means most other rules need zero changes (they already read the tokens).

- [ ] **Step 1: Flip the root tokens, add the alt-surface token**

Change:
```css
:root {
  --color-bg: #000000;
  --color-fg: #FFFFFF;
  --color-accent: #E1272C;
  --font-headline: 'Benzin', 'Arial Black', sans-serif;
  --font-body: 'Helvetica Neue', Arial, sans-serif;
  --max-width: 1200px;
}
```
to:
```css
:root {
  --color-bg: #FFFFFF;
  --color-bg-alt: #F2F2F2;
  --color-fg: #000000;
  --color-accent: #E1272C;
  --font-headline: 'Benzin', 'Arial Black', sans-serif;
  --font-body: 'Helvetica Neue', Arial, sans-serif;
  --max-width: 1200px;
}
```

- [ ] **Step 2: Give `#hero` its own dark-scoped tokens**

`#hero` currently starts:
```css
#hero {
  min-height: 100dvh;
  max-width: none;
  margin: 0;
  padding: 96px 0 0;
  position: relative;
  overflow: hidden;
  transform-origin: center top;
}
```
Change to:
```css
#hero {
  --color-bg: #000000;
  --color-fg: #FFFFFF;
  background: var(--color-bg);
  color: var(--color-fg);
  min-height: 100dvh;
  max-width: none;
  margin: 0;
  padding: 96px 0 0;
  position: relative;
  overflow: hidden;
  transform-origin: center top;
}
```
(The redeclared `--color-bg`/`--color-fg` only apply within `#hero`'s subtree — every existing `#hero ...` child rule and every element inside it that inherits `color` normally now renders exactly as it did before the root flip, with no further changes needed inside the hero. The two `background`/`color` declarations here are what actually paint the hero black with white inherited text — needed because `body` no longer provides that via the old root tokens.)

- [ ] **Step 3: Give `#site-nav` the same dark-scoped tokens**

`#site-nav` currently starts:
```css
#site-nav {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: rgba(0,0,0,0.85);
  backdrop-filter: blur(6px);
  transition: background 400ms ease, backdrop-filter 400ms ease;
}
```
Add the token redeclaration (background/color stay as they are — the nav's own background is already the literal `rgba(0,0,0,0.85)`, not tied to a token):
```css
#site-nav {
  --color-bg: #000000;
  --color-fg: #FFFFFF;
  color: var(--color-fg);
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: rgba(0,0,0,0.85);
  backdrop-filter: blur(6px);
  transition: background 400ms ease, backdrop-filter 400ms ease;
}
```
This makes the mobile dropdown rule `#site-nav ul { background: var(--color-bg); }` (inside the `@media (max-width: 767px)` block) automatically stay black, and every nav rule using `var(--color-fg)` (focus rings, `.btn--pill` border/color, the scrolled-state text-shadow rules) stays white — no other nav rule needs to change.

- [ ] **Step 4: Fix the custom cursor so it stays visible over both the dark hero and the new white sections**

Current:
```css
.cursor-dot { width: 8px; height: 8px; background: var(--color-accent); }
.cursor-ring {
  width: 36px; height: 36px;
  border: 1px solid var(--color-fg);
  transition: width 200ms ease, height 200ms ease, border-color 200ms ease;
}
.cursor-ring.is-active { width: 56px; height: 56px; border-color: var(--color-accent); }
```
The `.cursor-dot`/`.cursor-ring` elements live near the end of `<body>`, outside both `#hero` and `#site-nav`'s scoped overrides, so they'd resolve `var(--color-fg)` to the new global **black** — making the ring nearly invisible against the still-dark hero background once the mouse is over it. Fix with the standard cursor-visible-on-any-background trick, `mix-blend-mode: difference` against a fixed white base color (difference-blending white against a black background yields black-on-white-ish inversion, and against white yields black — always visible either way):
```css
.cursor-dot { width: 8px; height: 8px; background: #FFFFFF; mix-blend-mode: difference; }
.cursor-ring {
  width: 36px; height: 36px;
  border: 1px solid #FFFFFF;
  mix-blend-mode: difference;
  transition: width 200ms ease, height 200ms ease, border-color 200ms ease;
}
.cursor-ring.is-active { width: 56px; height: 56px; }
```
(`border-color: var(--color-accent)` on `.is-active` is dropped — `mix-blend-mode: difference` doesn't blend predictably with a non-grayscale color like the red accent, it would produce an odd off-color; a plain white ring that inverts via blend mode already gives clear "active" feedback through the width/height change alone. If this looks wrong once you see it live, you can keep a `border-color` change for the active state instead of relying on blend mode — use your judgment after visual testing, but the width/height change is the primary signal either way.)

- [ ] **Step 5: Verify manually**

Serve locally, load `index.html`: page background is white, hero section is black with white text/red CTA exactly as before, nav bar is black/white exactly as before (scrolled-state fade-to-transparent-with-shadow still works), custom cursor ring/dot are visible both over the dark hero and once scrolled onto the (still-black-background-at-this-point, since later tasks haven't landed yet) rest of the page. Confirm mobile nav dropdown is still black with white links.

- [ ] **Step 6: Commit**

```bash
git add css/main.css
git commit -m "feat: flip root theme to white/black, keep hero and nav dark-scoped, fix cursor visibility"
```

---

## Task 2: Kundenlogos — verify on white, fix one-studio.png's baked-in black background

**Files:**
- Modify: `assets/images/logos/one-studio.png` (or add a scoped CSS fix)
- Modify: `css/main.css` if a CSS-only fix is chosen instead

**Context:** A prior round found `one-studio.png` has a **baked-in black background** (not real transparency) — at the time this was harmless because the whole page was black. After Task 1, the `#kundenlogos` section is now white, so this logo will show as an obvious black rectangle among logos that float freely. This must be fixed now, not just documented.

- [ ] **Step 1: Inspect the logo**

View `assets/images/logos/one-studio.png` directly. If the logo art itself is simple (e.g., a flat-color mark with a clean edge against the black background, no complex gradients/anti-aliasing gradients blending into the black), use Python/Pillow to key out the black background to transparency:
```python
from PIL import Image
im = Image.open("assets/images/logos/one-studio.png").convert("RGBA")
data = im.getdata()
new_data = []
for r, g, b, a in data:
    # adjust the threshold based on what you actually see in the image
    if r < 20 and g < 20 and b < 20:
        new_data.append((r, g, b, 0))
    else:
        new_data.append((r, g, b, a))
im.putdata(new_data)
im.save("assets/images/logos/one-studio.png")
```
Check the result visually afterward (composite it over a mid-gray test background to confirm no harsh fringing/halo around the logo's edges from naive thresholding — if the result looks bad, e.g. the logo itself contains dark colors that also got keyed out, don't force it).

If the naive threshold approach doesn't produce a clean result (logo has dark elements of its own that would get wrongly keyed out too), do NOT force a bad crop — instead apply a CSS-only fallback: give this specific logo's `.logo-card` a dark chip background so the black rectangle reads as an intentional design choice rather than a bug:
```css
#kundenlogos .logo-card:has(img[src*="one-studio"]) {
  background: var(--color-bg-alt);
  border-radius: 8px;
}
```
(Note: `:has()` is supported in all current evergreen browsers; this is a static marketing site without legacy-browser requirements per the rest of this codebase's conventions, so this is safe to use.)

Document in your report which approach you took and why.

- [ ] **Step 2: Verify manually and commit**

Reload `#kundenlogos` on the now-white page: all 5 logos read cleanly, no jarring black box (either because the logo is now genuinely transparent, or because it has an intentional-looking light chip behind it matching the marquee's new white context).

```bash
git add assets/images/logos/one-studio.png css/main.css
git commit -m "fix: resolve one-studio.png's baked-in black background against the new white marquee"
```

---

## Task 3: Content sections — flip hardcoded white-on-dark text/border colors to dark-on-white

**Files:**
- Modify: `css/main.css` (`#leistungen`, `#prozess`, `#kundenstimmen`, `#ueber-mich`, `#kontakt` rules)

**Context:** These sections already read `var(--color-fg)` correctly for their main text (auto-flips to black via Task 1) — but several rules use **hardcoded `rgba(255,255,255,X)`** for secondary/muted text and borders, which do NOT respond to the token flip and need manual inversion to `rgba(0,0,0,X)`. Also flips a few literal dark surface colors to the new `--color-bg-alt` light-gray token.

- [ ] **Step 1: Leistungen**

```css
#leistungen .service-item { border-top: 1px solid rgba(255,255,255,0.15); }
#leistungen .service-item:last-child { border-bottom: 1px solid rgba(255,255,255,0.15); }
```
→
```css
#leistungen .service-item { border-top: 1px solid rgba(0,0,0,0.15); }
#leistungen .service-item:last-child { border-bottom: 1px solid rgba(0,0,0,0.15); }
```
```css
#leistungen .service-detail p { color: rgba(255,255,255,0.75); max-width: 44ch; }
```
→
```css
#leistungen .service-detail p { color: rgba(0,0,0,0.75); max-width: 44ch; }
```
```css
#leistungen .service-collage-block { width: 100%; height: 100%; border-radius: 4px; background: #16161a; }
```
→
```css
#leistungen .service-collage-block { width: 100%; height: 100%; border-radius: 4px; background: var(--color-bg-alt); }
```

- [ ] **Step 2: Prozess**

```css
#prozess .process-pinned p { color: rgba(255,255,255,0.75); max-width: 30ch; font-size: 0.9rem; }
```
→
```css
#prozess .process-pinned p { color: rgba(0,0,0,0.75); max-width: 30ch; font-size: 0.9rem; }
```
```css
#prozess .process-line { position: relative; width: 2px; background: rgba(255,255,255,0.15); flex: none; }
```
→
```css
#prozess .process-line { position: relative; width: 2px; background: rgba(0,0,0,0.15); flex: none; }
```
```css
#prozess .step p { color: rgba(255,255,255,0.75); font-size: 0.85rem; max-width: 40ch; }
```
→
```css
#prozess .step p { color: rgba(0,0,0,0.75); font-size: 0.85rem; max-width: 40ch; }
```
(`#prozess .process-dot { background: var(--color-fg); }` already auto-flips to black via the token — a solid black dot on the white page reads fine, no change needed.)

- [ ] **Step 3: Kundenstimmen, Über mich**

```css
#kundenstimmen p.placeholder-note {
  color: rgba(255,255,255,0.5);
  font-style: italic;
}
```
→
```css
#kundenstimmen p.placeholder-note {
  color: rgba(0,0,0,0.5);
  font-style: italic;
}
```
```css
#ueber-mich p { color: rgba(255,255,255,0.8); font-size: 1.05rem; }
```
→
```css
#ueber-mich p { color: rgba(0,0,0,0.8); font-size: 1.05rem; }
```

- [ ] **Step 4: Kontakt**

```css
#kontakt label { font-size: 0.9rem; color: rgba(255,255,255,0.75); }
#kontakt input, #kontakt textarea {
  width: 100%;
  min-height: 44px;
  padding: 12px;
  background: #111;
  border: 1px solid rgba(255,255,255,0.2);
  color: var(--color-fg);
  border-radius: 4px;
}
```
→
```css
#kontakt label { font-size: 0.9rem; color: rgba(0,0,0,0.75); }
#kontakt input, #kontakt textarea {
  width: 100%;
  min-height: 44px;
  padding: 12px;
  background: var(--color-bg-alt);
  border: 1px solid rgba(0,0,0,0.2);
  color: var(--color-fg);
  border-radius: 4px;
}
```

- [ ] **Step 5: Verify manually and commit**

Reload each section: Leistungen accordion borders/muted text visible and legible on white, service-collage blocks show as light-gray panels; Prozess muted paragraph text and line legible; Kundenstimmen placeholder-note legible; Über-mich paragraph legible; Kontakt form labels legible, input/textarea fields show as light-gray boxes with a visible border, typed text is black and readable, focus ring (red, unaffected) still visible.

```bash
git add css/main.css
git commit -m "fix: invert hardcoded light-on-dark text/border colors to dark-on-white across content sections"
```

---

## Task 4: Case grid — card surfaces, placeholder scrim legibility, detail text

**Files:**
- Modify: `css/main.css` (`.case-card`, `.case-media`, `.case-toggle`, `.case-detail` rules)

**Context:** The case-grid cards need to become light-gray elevated surfaces (`--color-bg-alt`) instead of near-black. The `.case-media .case-info` block sits on its own dark gradient scrim (for legibility over a future real photo) **regardless of the page's theme** — so `.case-media` needs the same local dark-scope-override treatment as `#hero`/`#site-nav` from Task 1, otherwise its text (which currently relies on the root `--color-fg` cascading down) would flip to black-on-dark-gradient and become unreadable. Everything below the media (the toggle button, detail text) sits on the card's own now-light background and should just follow the new black text color like the rest of the page.

- [ ] **Step 1: Card and placeholder surfaces**

```css
.case-card {
  position: relative;
  border-radius: 4px;
  background: #0d0d0d;
}
```
→
```css
.case-card {
  position: relative;
  border-radius: 4px;
  background: var(--color-bg-alt);
}
```
```css
.case-media--placeholder {
  background: #16161a;
  display: flex;
  align-items: flex-end;
}
```
→
```css
.case-media--placeholder {
  background: #0d0d0d;
  display: flex;
  align-items: flex-end;
}
```
(The placeholder box itself stays dark — it's standing in for a future photo, and `.case-info`'s text sitting on it needs the dark-gradient-legibility treatment below regardless of whether the box shows a photo or a plain dark fill. Keeping it a dark neutral, rather than switching it to the light `--color-bg-alt`, is deliberate: a light placeholder box wouldn't need or match the white-text overlay treatment that real photos there will need later.)

- [ ] **Step 2: Give `.case-media` its own dark-scoped tokens (mirrors Task 1's `#hero`/`#site-nav` pattern)**

```css
.case-media {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: 4px;
}
```
→
```css
.case-media {
  --color-fg: #FFFFFF;
  color: var(--color-fg);
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: 4px;
}
```
(This makes `.case-media .case-index`'s `color: var(--color-fg)` and the info block's inherited `h3` color both stay white automatically — matching the existing dark gradient scrim (`.case-info { background: linear-gradient(0deg, rgba(0,0,0,0.85), transparent); }`, already hardcoded and unaffected by the root flip) and the already-hardcoded-white `.stats` color. No other `.case-media` child rule needs to change.)

- [ ] **Step 3: Case toggle button and detail text (sit on the card's own new light background, NOT inside `.case-media`'s dark scope)**

```css
.case-toggle {
  ...
  border-top: 1px solid rgba(255,255,255,0.1);
  color: var(--color-fg);
  ...
}
```
→ change only the hardcoded border (the `color: var(--color-fg)` already auto-flips to black correctly since `.case-toggle` is outside `.case-media`'s scope):
```css
.case-toggle {
  ...
  border-top: 1px solid rgba(0,0,0,0.1);
  color: var(--color-fg);
  ...
}
```
```css
.case-detail p { color: rgba(255,255,255,0.8); font-size: 0.95rem; margin-bottom: 16px; }
```
→
```css
.case-detail p { color: rgba(0,0,0,0.8); font-size: 0.95rem; margin-bottom: 16px; }
```

- [ ] **Step 4: Verify manually and commit**

Reload `#projekte`: all 3 placeholder cards show a light-gray card body with a dark placeholder media box, white "In Kürze" heading/category legible on the dark box, black "Mehr erfahren" toggle text legible on the light card body below it. Expand a real case card if any exist with photos (none currently do — all 3 are placeholders per the previous round — so this specific check may not be exercisable yet; if so, note that in your report rather than skipping the verification silently).

```bash
git add css/main.css
git commit -m "fix: flip case-grid card surfaces to light theme, keep media scrim dark-scoped for future photos"
```

---

## Task 5: Full-site regression pass

**Files:** none (verification only)

- [ ] **Step 1: Run the JS unit tests**
```bash
node js/tests/isTouchDevice.test.js && node js/tests/prefersReducedMotion.test.js && node js/tests/nextHeroMode.test.js
```

- [ ] **Step 2: Full manual walkthrough of `index.html`**

Check every section in order: Hero (dark, video, white text, red CTA, hero-mode-switch still crossfades correctly to wedding content), Kundenlogos (white strip, all logos legible, no black box), Leistungen (white bg, accordion legible, collage light-gray panels), Projekte (light-gray cards, dark placeholder media legible), Prozess (white bg, sticky column, dot, legible muted text), Kundenstimmen, Über-mich (photo + legible paragraph), Kontakt (light-gray form fields, legible labels, red focus ring), Footer (already white from a prior round — confirm it still looks consistent with the rest of the now-white page, not jarringly different). Confirm nav looks and behaves correctly scrolling over both the dark hero and the new white sections (text-shadow legibility). Confirm custom cursor is visible everywhere. Check browser console for errors throughout.

- [ ] **Step 3: Check `hochzeiten.html`, `impressum.html`, `datenschutz.html`**

Confirm `hochzeiten.html` is completely unaffected (separate stylesheet). Confirm `impressum.html`/`datenschutz.html` render with the new white/black theme correctly (they load `main.css` + `legal.css`, both token-driven) — legible black text, red links, nav bar at top still dark/white per Task 1's `#site-nav` scoping.

- [ ] **Step 4: Push and confirm live deployment**
```bash
git push origin main
```
Cloudflare Pages auto-deploys on push. Wait, then re-verify against `https://fabian-visuals-site.pages.dev/` — **hard-refresh / bypass cache** when checking, this project has repeatedly hit stale-browser-cache confusion when verifying visual changes.
