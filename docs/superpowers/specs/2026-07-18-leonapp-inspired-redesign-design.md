# Leonapp-Inspired Redesign — Design

## Context

The commercial-mode main page (`index.html`) already ships a full black/white/red visual system with a working dual-mode hero toggle, GSAP scroll reveals, and a pinned-scroll process section. Fabian reviewed the live site (`fabian-visuals-site.pages.dev`) against `https://www.leonapp-production.de/#partners` and flagged six concrete gaps between the two, plus supplied real footage (previously untracked, dropped directly into `assets/images/`) to replace generic placeholder photography in the case grid. Two additional issues Fabian reported (case-detail images broken on expand, text overlapping/missing after expanding a case card) turned out to be regressions from the previous session, not design gaps — both are already fixed and deployed (commit `d37136d`): a missing `ScrollTrigger.refresh()` call after case-card expand/collapse left every scroll-reveal below stuck at `opacity: 0`, and two case cards referenced `detail-1.jpg`/`detail-2.jpg` files that never existed for their source folders.

This spec covers the six confirmed redesign items. It does not cover a full visual overhaul — colors, fonts, and the existing dual-mode toggle mechanism stay as they are; only the specific layout/interaction patterns below are new.

## Global Constraints

- No new build step. Stays vanilla HTML/CSS/JS, GSAP via the existing CDN `<script>` tags in `index.html`.
- Do not change `--color-bg`, `--color-fg`, `--color-accent`, `--font-headline`, `--font-body` in `css/main.css`, or any `--w-*` token in `css/wedding.css`.
- All new interactive elements need visible `:focus-visible` states and ≥44×44px touch targets, matching the existing repo convention (`css/main.css:59`, `:305`).
- All new/changed animation must respect `prefers-reduced-motion` (existing pattern: `prefersReducedMotion()` in `js/main.js`, static fallback instead of animating).
- Video assets must be transcoded to web-friendly H.264 MP4 (no raw `.MOV`/high-bitrate ProRes-style files committed) and kept as small as reasonably possible for a background loop (target: under ~4MB for the ~4s hero loop).
- New/changed videos reuse the existing Android-hardening pattern already applied to the portfolio case videos: `playsinline`, `disablepictureinpicture`, `muted` where autoplaying.
- Real client photos for the case grid come from Fabian's own footage (`assets/images/*.MP4/.MOV`, and the `Desktop/FABIAN.VISUALS/00_PROJEKTE/PROJ_01_Heizungsfuchs24/05_Exports/` exports) — no stock photography, no reuse of one client's footage under another client's name.

## 1. Header

**Current:** `#site-nav .logo` is a text wordmark (`FABIAN.VISUALS`), plain CTA button styling shared with the rest of the site (`css/main.css:29-42`).

**Change:** Replace the text logo with the `Fabian Visuals Logo weiß.png` icon (already sitting in `assets/images/logos/`, untracked). Nav link labels stay exactly as they are (Leistungen/Projekte/Prozess/Kontakt) — only the visual container changes. Add a new `.btn--pill` modifier (full border-radius, transparent background, 1.5px border, existing `--color-fg`/`--color-accent` on hover) for the header's own CTA link, visually closer to leonapp's "Book a Call" pill without introducing a new color.

## 2. Hero video (commercial mode only)

**Current:** `#hero .hero-bg--commercial` is a CSS background-image (`css/main.css:93-94`) with a dark gradient overlay.

**Change:** Add a `<video>` element inside `.hero-bg--commercial`, absolutely positioned to fill the same box the background-image currently fills, `autoplay muted loop playsinline disablepictureinpicture`, poster set to the existing `hero-bg.jpg`. Source: `Rhein_Fouza_CUT OUT_8.MOV` transcoded to `assets/images/hero-bg.mp4` (H.264, scaled/cropped to a sensible max width e.g. 1920px wide, no audio track). `hero-bg.jpg` stays as the CSS background (shows instantly, before the video loads, and is what renders under `prefers-reduced-motion: reduce` — the `<video>` gets `display:none` in that case, matching the existing reduced-motion pattern for other animations in this file). Wedding-mode hero is untouched (no matching footage exists for it).

## 3. Leistungen → accordion

**Current:** `#leistungen .service-grid` is a static 3-column grid, all three `.service-card` always fully visible (`css/main.css:235-248`).

**Change:** Restructure into a vertical accordion: three rows (`01 Commercials & Werbung`, `02 Musikvideos`, `03 Social Media & Strategie`), one expanded at a time (first one open by default), click toggles which is open — same interaction contract as the existing case-card expand (`aria-expanded`, `aria-controls`, height-tween via GSAP, `ScrollTrigger.refresh()` on complete — reusing the fix from the case-grid bug rather than re-introducing the same bug). To the right of the accordion list (desktop only; stacks below on mobile), a static image collage built from existing case-grid hero photos (diagonal-clipped column strips via `clip-path`, no new photography needed).

## 4. Prozess → two-column pinned layout

**Current:** `#prozess .process-grid` is 4 columns side by side, all four `.step` elements scrub-fade in together via one `ScrollTrigger` (`js/main.js` `initProcessPin()`, `css/main.css:338-346`). This mechanism (pin + scrub) is correct and stays — only the visual layout changes.

**Change:** Two columns. Left: pinned, holds the section headline + a small logo mark, does not scroll. Right: a vertical line with a dot marker whose vertical `y` position is scrubbed to overall scroll progress through the pinned range (same `scrollTrigger.scrub` value driving both the dot's position and each step's fade-in, so they stay in sync); the four steps stack vertically down this column instead of sitting side by side. `initProcessPin()` is rewritten to scrub the dot's `y` transform alongside the existing per-step opacity tweens, not a new second ScrollTrigger.

## 5. Footer legal links

**Current:** `.legal-links a { color: rgba(255,255,255,0.75); }` (`css/main.css`, added for the Impressum/Datenschutz links).

**Change:** `color: var(--color-fg)` (full white) so the row stands out against the dimmed `footer p` color around it, on both `index.html` and `hochzeiten.html`/`.w-footer`.

## 6. Case-grid real photography

**Current:** All three case cards (1Studio, Heizungsfuchs24, Fouza) reuse old generic `fotoshooting`/`musikvideo`/`musikvideo-2` placeholder photography that doesn't actually depict these clients.

**Change:** For each of the three clients, extract a still frame (via `ffmpeg`) from footage that's actually theirs, save as that client's new `hero.jpg` under a client-named `assets/images/portfolio/<client>/` folder, and where duration/quality allows, transcode a short clip as that card's expanded-detail video (matching the existing `<video controls preload="none" playsinline disablepictureinpicture>` pattern):

- **1Studio:** `1 studio.MP4` / `1 Studio 2.MP4` (1080×1920 vertical Reels footage) — one frame becomes the 4:3 `case-media` hero (via `object-fit: cover`, already how `.case-media img` renders); a short trimmed segment becomes the detail video.
- **Heizungsfuchs24:** exports under `Desktop/FABIAN.VISUALS/00_PROJEKTE/PROJ_01_Heizungsfuchs24/05_Exports/` (e.g. one of the `short_*.mov` clips or `So viel sparen Wärmepumpen wirklich.mp4`) — a frame + trimmed clip, not the text-heavy YouTube thumbnail PNGs (those don't fit the site's clean case-grid look).
- **Fouza:** the two raw clips NOT used for the hero background (`Studio_Fouza_CUT OUT_5.MOV` / `_7.MOV`) — a frame + trimmed clip.

Fabian can swap any of these stills/clips out later; this just replaces "wrong client's photo" with "a real photo of the right client."

## Testing

No new pure-logic units are introduced (accordion/hero-video/process-column changes are all DOM/CSS/GSAP wiring, verified by manual browser check — matching this repo's established convention for UI-visible work, see `docs/superpowers/plans/2026-07-14-hero-mode-switch.md`). The one reused logic path (`ScrollTrigger.refresh()` after an accordion-style height tween) is exercised by the same manual expand → scroll → check-opacity check already used to verify the case-grid fix.
