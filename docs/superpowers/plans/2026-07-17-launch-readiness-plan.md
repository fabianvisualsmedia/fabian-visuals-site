# Launch Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the remaining gaps between the existing, reviewed `animations-round-2` implementation and a deployable-to-Cloudflare-Pages site: legal pages, SEO/OG metadata, a real favicon, Android video hardening, deferred a11y fixes, and a deploy-ready README — without touching the established design tokens (colors/fonts) or redoing any of the 20+2 already-shipped tasks.

**Architecture:** Two new static pages (`impressum.html`, `datenschutz.html`) reusing `css/main.css` tokens (neutral/commercial theme, since both `index.html` and `hochzeiten.html` link to them). Meta/OG tags and JSON-LD are added inline in the two existing page `<head>`s — no new files. Favicon is a hand-authored inline SVG (no image-conversion tooling available offline). Video hardening is two HTML attributes added to the four existing `<video>` tags. No JS framework, no build step, no new dependencies — matches the rest of the repo.

**Tech Stack:** Vanilla HTML/CSS/JS (no build step), Node's built-in `assert` for the one testable piece of logic (there is none new here — all tasks in this plan are markup/attribute changes verified by manual browser check + grep, matching this project's established convention for non-logic UI tasks, see `docs/superpowers/plans/2026-07-14-hero-mode-switch.md`).

## Global Constraints

- No build step: everything must work opened via `python3 -m http.server 8080` per existing `README.md`.
- Do NOT change any value in `css/main.css` `:root` (`--color-bg:#000`, `--color-fg:#fff`, `--color-accent:#E1272C`, `--font-headline:'Benzin'`, `--font-body`) or `css/wedding.css` `:root` (`--w-color-bg:#FAF8F5`, `--w-color-accent:#C9A876`, `--w-color-text:#3A3530`, `--w-font-headline:'Playfair Display'`, `--w-font-body:'Montserrat'`).
- Real business data (verified from `Zweites Gehirn/00 Kontext/Über mich.md` and `Branding.md` — do not invent or alter): Fabian Scholl, Röhfeldstraße 57, 53227 Bonn. E-Mail: kontakt@fabianvisuals.de. Telefon: +49 178 500 3656. Kleinunternehmer gemäß § 19 Abs. 1 UStG — keine Umsatzsteuer ausgewiesen.
- Touch targets ≥ 44×44px (existing project guideline, `docs/superpowers/plans/2026-07-11-fabian-visuals-website-plan.md` quality guardrails).
- All new/changed interactive elements need visible `:focus-visible` states (existing repo pattern, e.g. `css/main.css:59`).
- Respect `prefers-reduced-motion` for anything animated (none of these tasks add new animation).
- Legal pages must be reachable from the footer of both `index.html` and `hochzeiten.html`.
- Do not fabricate Formspree endpoint IDs, case-grid stats, or license-gated font files — these stay as documented open points in the README (Fabian must supply them).

---

## Task 1: Favicon (F + Rec-Dot)

**Files:**
- Create: `assets/icons/favicon.svg`
- Modify: `index.html:12`, `hochzeiten.html:12`

**Interfaces:**
- Produces: a valid `assets/icons/favicon.svg` file referenced by both pages' `<link rel="icon">`.

- [ ] **Step 1: Create the SVG favicon**

Per `Branding.md`: "Fabian Visuals – F + Rec-Dot, Schwarz/Weiß/Rot Akzent". Black square background, white "F", red recording dot top-right corner:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#000000"/>
  <text x="18" y="46" font-family="Arial Black, Arial, sans-serif" font-size="36" font-weight="900" fill="#FFFFFF">F</text>
  <circle cx="49" cy="15" r="7" fill="#E1272C"/>
</svg>
```

- [ ] **Step 2: Point both pages at the SVG favicon**

In `index.html:12` and `hochzeiten.html:12`, replace:

```html
<link rel="icon" href="assets/icons/favicon.ico">
```

with:

```html
<link rel="icon" type="image/svg+xml" href="assets/icons/favicon.svg">
```

- [ ] **Step 3: Verify manually**

Run `python3 -m http.server 8080` from the repo root, open `http://localhost:8080/index.html`, confirm the browser tab shows the black/white/red "F" icon (hard-refresh if the browser cached a 404 favicon).

- [ ] **Step 4: Commit**

```bash
git add assets/icons/favicon.svg index.html hochzeiten.html
git commit -m "feat: add F + rec-dot SVG favicon"
```

---

## Task 2: SEO meta tags, Open Graph, and JSON-LD

**Files:**
- Modify: `index.html:1-13`
- Modify: `hochzeiten.html:1-12`

**Interfaces:**
- Produces: `<meta>` OG/Twitter tags and a `<script type="application/ld+json">` LocalBusiness block on both pages. No JS interface — pure markup.

- [ ] **Step 1: Extend `index.html` `<head>`**

Replace the existing head block (lines 1-13) with:

```html
<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Fabian Visuals — Foto- & Videoproduktion in Bonn, Köln, Düsseldorf, Aachen</title>
  <meta name="description" content="Fabian Visuals produziert Commercials, Musikvideos und Social-Media-Content für Künstler und Unternehmen in Bonn, Köln, Düsseldorf und Aachen.">
  <link rel="canonical" href="https://fabianvisuals.de/">
  <meta name="robots" content="index, follow">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Fabian Visuals">
  <meta property="og:title" content="Fabian Visuals — Foto- & Videoproduktion in Bonn, Köln, Düsseldorf, Aachen">
  <meta property="og:description" content="Fabian Visuals produziert Commercials, Musikvideos und Social-Media-Content für Künstler und Unternehmen in Bonn, Köln, Düsseldorf und Aachen.">
  <meta property="og:image" content="https://fabianvisuals.de/assets/images/hero-bg.jpg">
  <meta property="og:url" content="https://fabianvisuals.de/">
  <meta property="og:locale" content="de_DE">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Fabian Visuals — Foto- & Videoproduktion in Bonn, Köln, Düsseldorf, Aachen">
  <meta name="twitter:description" content="Fabian Visuals produziert Commercials, Musikvideos und Social-Media-Content für Künstler und Unternehmen in Bonn, Köln, Düsseldorf und Aachen.">
  <meta name="twitter:image" content="https://fabianvisuals.de/assets/images/hero-bg.jpg">
  <link rel="stylesheet" href="css/reset.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400&family=Playfair+Display:wght@500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/main.css">
  <link rel="icon" type="image/svg+xml" href="assets/icons/favicon.svg">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Fabian Visuals",
    "founder": "Fabian Scholl",
    "email": "kontakt@fabianvisuals.de",
    "telephone": "+49 178 500 3656",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Röhfeldstraße 57",
      "postalCode": "53227",
      "addressLocality": "Bonn",
      "addressCountry": "DE"
    },
    "areaServed": ["Bonn", "Köln", "Düsseldorf", "Aachen"],
    "url": "https://fabianvisuals.de/",
    "sameAs": ["https://instagram.com/Fabian.Visuals"]
  }
  </script>
</head>
```

- [ ] **Step 2: Extend `hochzeiten.html` `<head>`**

Replace the existing head block (lines 1-12) with:

```html
<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Hochzeitsfotografie — Fabian Visuals</title>
  <meta name="description" content="Cinematische Hochzeitsfotografie und -filme von Fabian Visuals in Bonn, Köln, Düsseldorf und Aachen.">
  <link rel="canonical" href="https://fabianvisuals.de/hochzeiten.html">
  <meta name="robots" content="index, follow">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Fabian Visuals">
  <meta property="og:title" content="Hochzeitsfotografie — Fabian Visuals">
  <meta property="og:description" content="Cinematische Hochzeitsfotografie und -filme von Fabian Visuals in Bonn, Köln, Düsseldorf und Aachen.">
  <meta property="og:image" content="https://fabianvisuals.de/assets/images/wedding/hero.jpg">
  <meta property="og:url" content="https://fabianvisuals.de/hochzeiten.html">
  <meta property="og:locale" content="de_DE">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Hochzeitsfotografie — Fabian Visuals">
  <meta name="twitter:description" content="Cinematische Hochzeitsfotografie und -filme von Fabian Visuals in Bonn, Köln, Düsseldorf und Aachen.">
  <meta name="twitter:image" content="https://fabianvisuals.de/assets/images/wedding/hero.jpg">
  <link rel="stylesheet" href="css/reset.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400&family=Playfair+Display:wght@500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/wedding.css">
  <link rel="icon" type="image/svg+xml" href="assets/icons/favicon.svg">
</head>
```

- [ ] **Step 3: Verify manually**

`view-source:` both pages locally, confirm no duplicate `<head>` tags and the page still renders identically (only `<head>` changed).

- [ ] **Step 4: Commit**

```bash
git add index.html hochzeiten.html
git commit -m "feat: add SEO meta tags, Open Graph, and LocalBusiness JSON-LD"
```

---

## Task 3: Android video hardening (no PiP overlap)

**Files:**
- Modify: `index.html:126, 148, 170` (musikvideo, dj-set, musikvideo-2 videos — note: there are 3 `<video>` tags, not 4)

**Context:** These videos use native `controls` (no custom overlay), so there's no z-index/SurfaceView clipping bug here. The real Android issue: Chrome auto-triggers **picture-in-picture** when a playing `<video>` scrolls out of view, and the floating PiP window then overlaps the page's `position: fixed` nav (`css/main.css:44-47`, `z-index:100`). Fix: opt every video out of automatic PiP and force inline playback.

**Interfaces:**
- Produces: no new JS/CSS interface — pure HTML attribute additions.

- [ ] **Step 1: Add `playsinline` and `disablepictureinpicture` to all three video tags**

In `index.html`, change:

```html
<video src="assets/images/portfolio/musikvideo/video.mp4" poster="assets/images/portfolio/musikvideo/hero.jpg" controls preload="none"></video>
```

to:

```html
<video src="assets/images/portfolio/musikvideo/video.mp4" poster="assets/images/portfolio/musikvideo/hero.jpg" controls preload="none" playsinline disablepictureinpicture controlsList="nodownload noplaybackrate"></video>
```

Apply the same two attributes (`playsinline disablepictureinpicture`) and `controlsList="nodownload noplaybackrate"` to the `dj-set` (line 148) and `musikvideo-2` (line 170) `<video>` tags, keeping their existing `src`/`poster`/`controls`/`preload` values unchanged.

- [ ] **Step 2: Verify manually**

On an Android device or Chrome DevTools device emulation: expand a case card, start playback, scroll the video off-screen — confirm no floating PiP window appears and the fixed nav bar stays fully visible/uncovered.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "fix: disable auto picture-in-picture on portfolio videos to prevent Android overlap with fixed nav"
```

---

## Task 4: Impressum page

**Files:**
- Create: `impressum.html`

**Interfaces:**
- Produces: `impressum.html`, linked from both footers (Task 6).

- [ ] **Step 1: Create the page**

```html
<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Impressum — Fabian Visuals</title>
  <meta name="description" content="Impressum von Fabian Visuals, Fotografie & Videoproduktion in Bonn.">
  <meta name="robots" content="noindex, follow">
  <link rel="stylesheet" href="css/reset.css">
  <link rel="stylesheet" href="css/main.css">
  <link rel="stylesheet" href="css/legal.css">
  <link rel="icon" type="image/svg+xml" href="assets/icons/favicon.svg">
</head>
<body>
  <header>
    <nav id="site-nav">
      <a href="index.html" class="logo">FABIAN.VISUALS</a>
    </nav>
  </header>
  <main class="legal">
    <h1>Impressum</h1>
    <h2>Angaben gemäß § 5 TMG</h2>
    <p>Fabian Scholl<br>
    Fabian Visuals<br>
    Röhfeldstraße 57<br>
    53227 Bonn</p>

    <h2>Kontakt</h2>
    <p>Telefon: +49 178 500 3656<br>
    E-Mail: <a href="mailto:kontakt@fabianvisuals.de">kontakt@fabianvisuals.de</a></p>

    <h2>Umsatzsteuer</h2>
    <p>Kleinunternehmer gemäß § 19 Abs. 1 UStG. Es wird keine Umsatzsteuer ausgewiesen.</p>

    <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
    <p>Fabian Scholl (Anschrift wie oben)</p>

    <h2>EU-Streitschlichtung</h2>
    <p>Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener">https://ec.europa.eu/consumers/odr/</a>. Ich bin nicht verpflichtet und nicht bereit, an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>

    <p><a href="index.html">← Zurück zur Startseite</a></p>
  </main>
</body>
</html>
```

- [ ] **Step 2: Verify manually**

Open `http://localhost:8080/impressum.html`, confirm it renders with the commercial dark theme and all links work.

- [ ] **Step 3: Commit**

```bash
git add impressum.html
git commit -m "feat: add Impressum page (Kleinunternehmer § 19 UStG)"
```

---

## Task 5: Datenschutz page + shared legal stylesheet

**Files:**
- Create: `datenschutz.html`
- Create: `css/legal.css`

**Interfaces:**
- Consumes: `--color-bg`, `--color-fg`, `--color-accent`, `--font-headline`, `--font-body`, `--max-width` from `css/main.css:2-7` (already loaded on the legal pages via `<link rel="stylesheet" href="css/main.css">`).
- Produces: `css/legal.css` — a `.legal` content-width/readability layer reused by both `impressum.html` and `datenschutz.html`.

- [ ] **Step 1: Create `css/legal.css`**

```css
.legal {
  max-width: 720px;
  margin: 0 auto;
  padding: 160px 24px 96px;
  font-family: var(--font-body);
  line-height: 1.7;
}
.legal h1 { font-family: var(--font-headline); text-transform: uppercase; margin-bottom: 32px; }
.legal h2 { font-family: var(--font-headline); text-transform: uppercase; font-size: 1.1rem; margin: 40px 0 12px; }
.legal p { margin-bottom: 16px; }
.legal a { color: var(--color-accent); }
.legal a:focus-visible { outline: 3px solid var(--color-fg); outline-offset: 2px; }
```

- [ ] **Step 2: Add the stylesheet link to `impressum.html`**

This was already included in Task 4's `<head>` (`<link rel="stylesheet" href="css/legal.css">`) — no further change needed there.

- [ ] **Step 3: Create `datenschutz.html`**

```html
<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Datenschutzerklärung — Fabian Visuals</title>
  <meta name="description" content="Datenschutzerklärung von Fabian Visuals, Fotografie & Videoproduktion in Bonn.">
  <meta name="robots" content="noindex, follow">
  <link rel="stylesheet" href="css/reset.css">
  <link rel="stylesheet" href="css/main.css">
  <link rel="stylesheet" href="css/legal.css">
  <link rel="icon" type="image/svg+xml" href="assets/icons/favicon.svg">
</head>
<body>
  <header>
    <nav id="site-nav">
      <a href="index.html" class="logo">FABIAN.VISUALS</a>
    </nav>
  </header>
  <main class="legal">
    <h1>Datenschutzerklärung</h1>

    <h2>1. Verantwortlicher</h2>
    <p>Fabian Scholl, Fabian Visuals, Röhfeldstraße 57, 53227 Bonn.<br>
    E-Mail: <a href="mailto:kontakt@fabianvisuals.de">kontakt@fabianvisuals.de</a>, Telefon: +49 178 500 3656.</p>

    <h2>2. Hosting</h2>
    <p>Diese Website wird über Cloudflare Pages gehostet. Beim Aufruf der Seite verarbeitet Cloudflare, Inc. technisch notwendige Zugriffsdaten (u. a. IP-Adresse, Datum/Uhrzeit, angeforderte Datei, Referrer, Browsertyp) in Form von Server-Logfiles, um die Auslieferung der Website technisch zu ermöglichen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einer sicheren und stabilen Bereitstellung der Website).</p>

    <h2>3. Kontaktformular</h2>
    <p>Wenn Sie das Kontaktformular nutzen, werden die von Ihnen eingegebenen Daten (Name, E-Mail-Adresse, Nachricht sowie ggf. Datum, Location und gewünschtes Paket) über den Formular-Dienstleister Formspree verarbeitet und per E-Mail an mich weitergeleitet, um Ihre Anfrage zu bearbeiten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Anfrage) bzw. lit. f DSGVO (berechtigtes Interesse an der Bearbeitung eingehender Anfragen).</p>

    <h2>4. Keine Cookies, kein Tracking</h2>
    <p>Diese Website setzt keine Cookies zu Analyse- oder Marketingzwecken ein und bindet keine Tracking- oder Analyse-Tools von Drittanbietern ein.</p>

    <h2>5. Ihre Rechte</h2>
    <p>Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit sowie Widerspruch gegen die Verarbeitung Ihrer personenbezogenen Daten. Wenden Sie sich hierzu an die oben genannte Kontaktadresse. Zudem steht Ihnen ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde zu.</p>

    <p><a href="index.html">← Zurück zur Startseite</a></p>
  </main>
</body>
</html>
```

- [ ] **Step 4: Verify manually**

Open both legal pages locally, confirm consistent dark commercial styling, readable line length, working back-link.

- [ ] **Step 5: Commit**

```bash
git add css/legal.css datenschutz.html
git commit -m "feat: add Datenschutzerklärung page and shared legal stylesheet"
```

---

## Task 6: Footer wiring + deferred a11y fixes

**Files:**
- Modify: `index.html:232-238` (footer)
- Modify: `hochzeiten.html` (add a footer — currently has none)
- Modify: `css/main.css:55-59` (nav logo touch target, focus states)
- Modify: `js/main.js` (hamburger aria-label toggling)

**Context:** `progress.md` records several minor findings deferred from the original 20-task review that were never closed out: logo link touch-target < 44px, hamburger `aria-label` doesn't toggle open/closed text, nav hover-on-accent contrast borderline ~4.5:1, `.wedding-teaser` link missing `:focus-visible`, `.case-index` badges should be `aria-hidden="true"`. Closing these now while touching the same files is in scope for the "Apple-Stil-Feinschliff" goal — no color/font changes.

- [ ] **Step 1: Link legal pages from `index.html` footer**

Replace:

```html
  <footer>
    <p>&copy; 2026 Fabian Visuals — Bonn / Köln / Düsseldorf / Aachen</p>
    <nav class="socials" aria-label="Social Media">
      <a href="https://instagram.com/Fabian.Visuals" target="_blank" rel="noopener" aria-label="Instagram">IG</a>
    </nav>
    <p><a class="wedding-teaser" href="hochzeiten.html">Ihr heiratet? → Hochzeitsfotografie ansehen</a></p>
  </footer>
```

with:

```html
  <footer>
    <p>&copy; 2026 Fabian Visuals — Bonn / Köln / Düsseldorf / Aachen</p>
    <nav class="socials" aria-label="Social Media">
      <a href="https://instagram.com/Fabian.Visuals" target="_blank" rel="noopener" aria-label="Instagram">IG</a>
    </nav>
    <p><a class="wedding-teaser" href="hochzeiten.html">Ihr heiratet? → Hochzeitsfotografie ansehen</a></p>
    <p class="legal-links"><a href="impressum.html">Impressum</a> · <a href="datenschutz.html">Datenschutz</a></p>
  </footer>
```

- [ ] **Step 2: Add a footer to `hochzeiten.html`**

Immediately before `<script src="js/wedding-switch.js"></script>`, add:

```html
  <footer class="w-footer">
    <p>&copy; 2026 Fabian Visuals — Bonn / Köln / Düsseldorf / Aachen</p>
    <p class="legal-links"><a href="impressum.html">Impressum</a> · <a href="datenschutz.html">Datenschutz</a></p>
  </footer>
```

- [ ] **Step 3: Style both footers' legal links**

In `css/main.css`, near the existing `footer` rules, add:

```css
.legal-links { margin-top: 8px; font-size: 0.85rem; }
.legal-links a:focus-visible { outline: 3px solid var(--color-fg); outline-offset: 2px; }
```

In `css/wedding.css`, add the matching rule:

```css
.w-footer { text-align: center; padding: 48px 24px; }
.w-footer .legal-links { margin-top: 8px; font-size: 0.85rem; }
.w-footer .legal-links a { color: var(--w-color-text); }
.w-footer .legal-links a:focus-visible { outline: 3px solid var(--w-color-text); outline-offset: 2px; }
```

- [ ] **Step 4: Fix nav logo touch target**

In `css/main.css:55`, change:

```css
#site-nav .logo { font-family: var(--font-headline); font-size: 1.25rem; }
```

to:

```css
#site-nav .logo { font-family: var(--font-headline); font-size: 1.25rem; min-height: 44px; display: flex; align-items: center; }
```

- [ ] **Step 5: Add `:focus-visible` to `.wedding-teaser`**

In `css/main.css`, near the footer rules, add:

```css
.wedding-teaser:focus-visible { outline: 3px solid var(--color-fg); outline-offset: 2px; }
```

- [ ] **Step 6: Mark `.case-index` badges decorative**

Find the case-index badge markup in `index.html` (the `.case-index` elements added in the round-2 animation work) and add `aria-hidden="true"` to each, matching the pattern already used for `.case-toggle-icon`.

- [ ] **Step 7: Toggle hamburger aria-label text**

In `js/main.js`, find the nav-toggle click handler (around the `aria-expanded` toggle logic near line 28) and add label toggling. Locate:

```js
      var expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
```

Add immediately after:

```js
      toggle.setAttribute('aria-label', expanded ? 'Menü öffnen' : 'Menü schließen');
```

- [ ] **Step 8: Verify manually**

Reload both pages, tab through footer links (visible focus ring), confirm hamburger toggles between "Menü öffnen"/"Menü schließen" via screen reader/inspector, confirm logo link hit area is ≥44px tall in DevTools.

- [ ] **Step 9: Commit**

```bash
git add index.html hochzeiten.html css/main.css css/wedding.css js/main.js
git commit -m "feat: wire Impressum/Datenschutz into footers, close deferred a11y findings"
```

---

## Task 6b: CTA copy alignment per mode

**Files:**
- Modify: `index.html:33, 214`
- Modify: `hochzeiten.html` (contact form submit button)

**Context:** The mode-specific CTA wording is currently inconsistent — the Commercial hero/WhatsApp CTA reads "Jetzt Termin sichern" and the Wedding contact form submit reads "Anfrage senden". The spec calls for distinct, mode-appropriate CTA copy: Commercial → "Angebot anfragen" (a business client wants a quote), Wedding → "Termin sichern" (a couple wants to lock in their date).

- [ ] **Step 1: Update the Commercial hero CTA**

In `index.html:33`, change:

```html
<a href="#kontakt" class="btn">Jetzt Termin sichern</a>
```

to:

```html
<a href="#kontakt" class="btn">Angebot anfragen</a>
```

- [ ] **Step 2: Update the Commercial WhatsApp CTA**

In `index.html:214`, change:

```html
<a class="btn whatsapp-cta" href="https://wa.me/491785003656" target="_blank" rel="noopener">Jetzt Termin sichern (WhatsApp)</a>
```

to:

```html
<a class="btn whatsapp-cta" href="https://wa.me/491785003656" target="_blank" rel="noopener">Angebot anfragen (WhatsApp)</a>
```

- [ ] **Step 3: Update the Wedding contact form submit button**

In `hochzeiten.html`, change:

```html
<button type="submit" class="w-btn">Anfrage senden</button>
```

to:

```html
<button type="submit" class="w-btn">Termin sichern</button>
```

Leave the hero teaser link text on `index.html:38` ("Hochzeitsfotografie ansehen") unchanged — it navigates to the wedding page rather than submitting a booking, so "ansehen" (view) is the accurate verb there; the actual booking CTA is the wedding page's form button changed above.

- [ ] **Step 4: Verify manually**

Reload both pages, confirm button text matches: Commercial hero + WhatsApp both say "Angebot anfragen"; wedding contact form submit says "Termin sichern".

- [ ] **Step 5: Commit**

```bash
git add index.html hochzeiten.html
git commit -m "fix: align CTA copy per mode (Commercial: Angebot anfragen, Wedding: Termin sichern)"
```

---

## Task 7: README — deployment steps and open points

**Files:**
- Modify: `README.md`

**Interfaces:**
- Produces: updated `README.md` with a Cloudflare Pages deploy section and a refreshed, accurate open-points checklist (superseding the current one).

- [ ] **Step 1: Replace the "Vor dem Live-Schalten" section and append deployment instructions**

Replace the existing checklist block with:

```markdown
## Deployment (Cloudflare Pages via GitHub)

1. Push this repo to GitHub (e.g. `fabianscholl/fabian-visuals-site` — note: an old, out-of-date 3-commit version of this repo already exists there; it must be overwritten or replaced deliberately, not silently).
2. In the Cloudflare dashboard: Workers & Pages → Create → Pages → Connect to Git → select the repo.
3. Build settings: **Framework preset: None**, **Build command: (leave empty)**, **Build output directory: `/`**. There is no build step — this is a static file tree.
4. Deploy. Cloudflare serves `index.html` at the domain root; `hochzeiten.html`, `impressum.html`, `datenschutz.html` are reachable at their filenames directly.
5. Add the custom domain (`fabianvisuals.de`) under the Pages project's "Custom domains" tab and follow the DNS instructions Cloudflare shows.

## Vor dem Live-Schalten (offene Punkte)

- [ ] Formspree-Account anlegen, `REPLACE_ME_MAIN` (`index.html`) und `REPLACE_ME_WEDDING` (`hochzeiten.html`) durch echte Formular-Endpunkt-URLs ersetzen.
- [ ] Benzin-Font-Datei (`Benzin-Bold.woff2`) in `assets/fonts/` ablegen, Lizenz vorher klären — `css/main.css:12` referenziert die Datei bereits, `assets/fonts/` existiert aktuell noch nicht.
- [ ] `logos/one-studio.png` und `logos/zaves.png` in `assets/images/logos/` ablegen (die anderen drei Logos liegen bereits vor).
- [ ] Echte Case-Grid-Kennzahlen eintragen (aktuell Platzhalter-Zahlen im Prozess-/Projekte-Bereich).
- [ ] `git remote` setzen und auf GitHub pushen (siehe Deployment-Schritte oben) — aktuell hat dieses Repo keinen Remote.
- [ ] Domain `fabianvisuals.de` auf Cloudflare Pages verbinden.
```

- [ ] **Step 2: Verify manually**

`cat README.md`, confirm no leftover references to a nonexistent `favicon.ico`/`hero-bg.jpg`/wedding-image gaps that are actually already present in `assets/images/`.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add Cloudflare Pages deploy steps, refresh pre-launch checklist"
```

---

## Task 8 (manual, requires user confirmation before executing): Ship to GitHub

**Not part of the automated task sequence above** — this branch (`animations-round-2`) must first be merged to `main` and a remote configured. Both are hard-to-reverse/visible actions (this repo currently has zero remotes; a stale, unrelated 3-commit `fabian-visuals-site` repo already exists on the user's GitHub). Confirm with Fabian which of the following before running anything:

- Overwrite the existing stale GitHub repo's history with this one, or
- Create a new repo and point Cloudflare Pages at that instead.

Only after that decision: `git checkout main && git merge animations-round-2`, add the chosen remote, `git push`.
