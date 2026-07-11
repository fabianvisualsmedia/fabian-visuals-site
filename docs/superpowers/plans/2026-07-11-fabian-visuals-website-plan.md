# Fabian Visuals Website (HTML/CSS/JS) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a two-page static website (main business page + standalone wedding-photography page) for Fabian Visuals, replacing the abandoned Wix build, exactly per the specs in the Obsidian vault at `/Users/fabianscholl/Zweites Gehirn/02 Projekte/Fabian Visuals Website Relaunch/Konzept.md` and `Technisches Konzept (HTML).md`.

**Architecture:** Two independent static HTML pages (`index.html`, `hochzeiten.html`) sharing only a minimal structural `reset.css` — no shared theme variables between them. The main page uses GSAP (via CDN) for scroll-reveal, hover-microinteractions, magnet-cursor, and parallax effects; the wedding page has zero animation. Both pages submit their contact forms to separate Formspree endpoints.

**Tech Stack:** Plain HTML5, CSS3 (no preprocessor), vanilla JS, GSAP 3 + ScrollTrigger (CDN), Formspree (forms), Google Fonts (Playfair Display), self-hosted Benzin font (pending files from Fabian). No build step, no npm, no framework.

## Global Constraints

- Main page colors: background `#000000`, text `#FFFFFF`, accent `#E1272C` (red) — never used on the wedding page
- Main page headline font: `Benzin` (self-hosted `@font-face`, files pending — fall back to `Arial Black, sans-serif` until files arrive)
- Wedding page colors: background `#FAF8F5`, accent `#C9A876`, text `#3A3530` — must never be overridden by or leak into `main.css`
- Wedding page headline font: `Playfair Display` (Google Fonts CDN), body font: `Montserrat` (Google Fonts CDN, weight 300)
- Animations (scroll-reveal, hover-microinteraction, magnet-cursor, parallax) exist ONLY in `js/main.js`, loaded ONLY by `index.html`. `hochzeiten.html` must not load GSAP or `main.js`.
- All animations must respect `prefers-reduced-motion: reduce` — check via the shared `prefersReducedMotion()` helper (Task 10), never re-implemented ad hoc
- Touch targets ≥ 44×44px; body text contrast ≥ 4.5:1; no horizontal scroll on any viewport ≥ 375px wide
- WhatsApp CTA target: `https://wa.me/491785003656`
- Contact forms submit to Formspree; main-page form and wedding form use two DIFFERENT Formspree endpoint IDs (constants `FORM_ENDPOINT_MAIN` / `FORM_ENDPOINT_WEDDING` in the HTML, both currently set to the placeholder `https://formspree.io/f/REPLACE_ME` until Fabian supplies real IDs — replacing them is a one-line edit per file, tracked in the README's "Before going live" checklist, not a coding task)
- Local dev/verification server: `python3 -m http.server 8080` from the project root, then open `http://localhost:8080/<page>.html`

---

### Task 1: Project scaffold, reset, base HTML skeletons

**Files:**
- Create: `README.md`
- Create: `.gitignore`
- Create: `css/reset.css`
- Create: `index.html`
- Create: `hochzeiten.html`

**Interfaces:**
- Produces: `css/reset.css` — a structural-only reset (box-sizing, margin/padding zero, `img { max-width: 100%; display: block; }`) with NO color or font values, importable by both pages without violating the "no shared theme" constraint
- Produces: base HTML5 document structure in both pages, each with `<html lang="de">`, `<meta charset="utf-8">`, `<meta name="viewport" content="width=device-width, initial-scale=1">`

- [ ] **Step 1: Create `.gitignore`**

```
.DS_Store
*.log
```

- [ ] **Step 2: Create `css/reset.css`**

```css
*, *::before, *::after { box-sizing: border-box; }
html, body, h1, h2, h3, h4, p, figure, blockquote, dl, dd { margin: 0; }
html { -webkit-text-size-adjust: 100%; }
body { min-height: 100dvh; line-height: 1.5; }
img, picture, video, canvas, svg { display: block; max-width: 100%; }
input, button, textarea, select { font: inherit; }
a { color: inherit; text-decoration: none; }
ul, ol { list-style: none; padding: 0; }
button { cursor: pointer; border: none; background: none; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 3: Create `index.html` skeleton**

```html
<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Fabian Visuals — Foto- & Videoproduktion in Bonn, Köln, Düsseldorf, Aachen</title>
  <meta name="description" content="Fabian Visuals produziert Commercials, Musikvideos und Social-Media-Content für Künstler und Unternehmen in Bonn, Köln, Düsseldorf und Aachen.">
  <link rel="stylesheet" href="css/reset.css">
  <link rel="stylesheet" href="css/main.css">
</head>
<body>
  <!-- HEADER_NAV_PLACEHOLDER: filled in Task 2 -->
  <!-- HERO_PLACEHOLDER: filled in Task 2 -->
  <!-- LOGOS_PLACEHOLDER: filled in Task 3 -->
  <!-- SERVICES_PLACEHOLDER: filled in Task 4 -->
  <!-- PORTFOLIO_PLACEHOLDER: filled in Task 5 -->
  <!-- PROCESS_PLACEHOLDER: filled in Task 6 -->
  <!-- TESTIMONIALS_PLACEHOLDER: filled in Task 7 -->
  <!-- ABOUT_PLACEHOLDER: filled in Task 8 -->
  <!-- CONTACT_FOOTER_PLACEHOLDER: filled in Task 9 -->
</body>
</html>
```

- [ ] **Step 4: Create `hochzeiten.html` skeleton**

```html
<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Hochzeitsfotografie — Fabian Visuals</title>
  <meta name="description" content="Cinematische Hochzeitsfotografie und -filme von Fabian Visuals in Bonn, Köln, Düsseldorf und Aachen.">
  <link rel="stylesheet" href="css/reset.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400&family=Playfair+Display:wght@500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/wedding.css">
</head>
<body>
  <!-- WEDDING_HERO_PLACEHOLDER: filled in Task 15 -->
  <!-- WEDDING_PORTFOLIO_PLACEHOLDER: filled in Task 16 -->
  <!-- WEDDING_ABOUT_PACKAGES_PLACEHOLDER: filled in Task 17 -->
  <!-- WEDDING_TESTIMONIALS_CONTACT_PLACEHOLDER: filled in Task 18 -->
</body>
</html>
```

- [ ] **Step 5: Create `README.md`**

```markdown
# Fabian Visuals Website

Statische HTML/CSS/JS-Website (kein Build-Schritt). Ersetzt die vorherige Wix-Seite.

## Lokal ansehen

    python3 -m http.server 8080

Dann im Browser öffnen: http://localhost:8080/index.html oder /hochzeiten.html

## Vor dem Live-Schalten

- [ ] Formspree-Account anlegen, `FORM_ENDPOINT_MAIN` und `FORM_ENDPOINT_WEDDING` in `index.html` und `hochzeiten.html` durch echte Formular-URLs ersetzen
- [ ] Benzin-Font-Dateien in `assets/fonts/` ablegen, Lizenz geklärt
- [ ] Echte Fotos in `assets/images/` ablegen (Hero, Portfolio, Hochzeitsfotos)
- [ ] Echte Case-Grid-Kennzahlen eintragen (aktuell Platzhalter-Zahlen)
- [ ] Hosting wählen (Netlify, Vercel oder FTP) und Domain verbinden
```

- [ ] **Step 6: Verify the skeleton loads**

Run: `cd ~/Projekte/fabian-visuals-website && python3 -m http.server 8080 &`
Then fetch: `curl -s http://localhost:8080/index.html | grep -o '<title>.*</title>'`
Expected: `<title>Fabian Visuals — Foto- & Videoproduktion in Bonn, Köln, Düsseldorf, Aachen</title>`
Then: `curl -s http://localhost:8080/hochzeiten.html | grep -o '<title>.*</title>'`
Expected: `<title>Hochzeitsfotografie — Fabian Visuals</title>`
Stop the server: `kill %1`

- [ ] **Step 7: Commit**

```bash
git add README.md .gitignore css/reset.css index.html hochzeiten.html
git commit -m "chore: scaffold project with base HTML skeletons and structural reset"
```

---

### Task 2: Main page — Header/Nav + Hero

**Files:**
- Create: `css/main.css`
- Modify: `index.html` (replace `HEADER_NAV_PLACEHOLDER` and `HERO_PLACEHOLDER`)

**Interfaces:**
- Produces: CSS custom properties on `:root` in `main.css` — `--color-bg: #000000`, `--color-fg: #FFFFFF`, `--color-accent: #E1272C`, `--font-headline: 'Benzin', 'Arial Black', sans-serif`, `--font-body: 'Helvetica Neue', Arial, sans-serif` — every later main-page task must reuse these variables, never hardcode the hex values again
- Produces: `<nav id="site-nav">` with anchor links `#leistungen`, `#projekte`, `#prozess`, `#kontakt` that later tasks' sections must match by `id`

- [ ] **Step 1: Create `css/main.css` with root variables, base typography, header/nav, hero**

```css
:root {
  --color-bg: #000000;
  --color-fg: #FFFFFF;
  --color-accent: #E1272C;
  --font-headline: 'Benzin', 'Arial Black', sans-serif;
  --font-body: 'Helvetica Neue', Arial, sans-serif;
  --max-width: 1200px;
}

@font-face {
  font-family: 'Benzin';
  src: url('../assets/fonts/Benzin-Bold.woff2') format('woff2');
  font-weight: 700;
  font-display: swap;
}

body {
  background: var(--color-bg);
  color: var(--color-fg);
  font-family: var(--font-body);
  font-size: 16px;
  overflow-x: hidden;
}

section { padding: 96px 24px; max-width: var(--max-width); margin: 0 auto; }

h1, h2, h3 { font-family: var(--font-headline); text-transform: uppercase; line-height: 1.05; }

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 14px 32px;
  background: var(--color-accent);
  color: var(--color-fg);
  font-weight: 700;
  border-radius: 4px;
  transition: transform 200ms ease, box-shadow 200ms ease;
}
.btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(225,39,44,0.35); }
.btn:focus-visible { outline: 3px solid var(--color-fg); outline-offset: 2px; }

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
}
#site-nav .logo { font-family: var(--font-headline); font-size: 1.25rem; }
#site-nav ul { display: flex; gap: 32px; }
#site-nav a { min-height: 44px; display: flex; align-items: center; }
#site-nav a:hover { color: var(--color-accent); }
#nav-toggle { display: none; }

@media (max-width: 767px) {
  #site-nav ul {
    position: fixed;
    top: 72px; left: 0; right: 0;
    flex-direction: column;
    gap: 0;
    background: var(--color-bg);
    transform: translateY(-150%);
    transition: transform 300ms ease;
  }
  #site-nav ul.open { transform: translateY(0); }
  #site-nav ul li { border-bottom: 1px solid rgba(255,255,255,0.1); width: 100%; }
  #site-nav ul li a { padding: 16px 24px; width: 100%; }
  #nav-toggle { display: block; min-width: 44px; min-height: 44px; color: var(--color-fg); font-size: 1.5rem; }
}

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
</style>
```

- [ ] **Step 2: Replace `HEADER_NAV_PLACEHOLDER` and `HERO_PLACEHOLDER` in `index.html`**

```html
<header>
  <nav id="site-nav">
    <a href="#hero" class="logo">FABIAN.VISUALS</a>
    <button id="nav-toggle" aria-label="Menü öffnen" aria-expanded="false">☰</button>
    <ul id="nav-list">
      <li><a href="#leistungen">Leistungen</a></li>
      <li><a href="#projekte">Projekte</a></li>
      <li><a href="#prozess">Prozess</a></li>
      <li><a href="#kontakt">Kontakt</a></li>
    </ul>
  </nav>
</header>

<section id="hero">
  <div class="hero-bg"></div>
  <h1>FABIAN.VISUALS. WE CRAFT YOUR VISUALS</h1>
  <p>Wir produzieren nicht nur Content für deinen Feed. Wir bauen die visuelle Welt, in der deine Kunden und Fans leben wollen.</p>
  <a href="#kontakt" class="btn">Jetzt Termin sichern</a>
</section>
```

- [ ] **Step 3: Add the nav-toggle script inline (temporary, moved into `js/main.js` in Task 10)**

Add just before `</body>` in `index.html`:

```html
<script>
  document.getElementById('nav-toggle').addEventListener('click', function () {
    var list = document.getElementById('nav-list');
    var expanded = this.getAttribute('aria-expanded') === 'true';
    this.setAttribute('aria-expanded', String(!expanded));
    list.classList.toggle('open');
  });
</script>
```

- [ ] **Step 4: Verify in browser**

Run: `python3 -m http.server 8080 &` then open `http://localhost:8080/index.html`
Expected: black page, hero headline "FABIAN.VISUALS. WE CRAFT YOUR VISUALS" visible, red "Jetzt Termin sichern" button, nav bar fixed at top. Resize to 375px width: hamburger icon appears, clicking it slides the menu down. `kill %1` when done.

- [ ] **Step 5: Commit**

```bash
git add css/main.css index.html
git commit -m "feat: add header nav and hero section to main page"
```

---

### Task 3: Main page — Kundenlogos-Leiste

**Files:**
- Modify: `css/main.css` (append)
- Modify: `index.html` (replace `LOGOS_PLACEHOLDER`)
- Copy: Fabian's 4 received logo files into `assets/images/logos/` as `one-studio.png`, `zaves.png`, `heizungsfuchs24.png`, `maass-raum-coaching.png` (pre love Deals logo added later once Fabian supplies a PNG/JPG)

**Interfaces:**
- Consumes: `--color-fg` from Task 2
- Produces: `#kundenlogos` section — no new IDs needed by later tasks

- [ ] **Step 1: Append logo strip styles to `css/main.css`**

```css
#kundenlogos { padding: 48px 24px; }
#kundenlogos .logo-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 48px;
}
#kundenlogos img {
  height: 40px;
  width: auto;
  filter: grayscale(100%) brightness(1.6);
  opacity: 0.6;
  transition: opacity 200ms ease, filter 200ms ease;
}
#kundenlogos img:hover { filter: none; opacity: 1; }
```

- [ ] **Step 2: Replace `LOGOS_PLACEHOLDER` in `index.html`**

```html
<section id="kundenlogos" aria-label="Referenzkunden">
  <div class="logo-row">
    <img src="assets/images/logos/one-studio.png" alt="One Studio" width="160" height="40">
    <img src="assets/images/logos/zaves.png" alt="ZAVES" width="160" height="40">
    <img src="assets/images/logos/heizungsfuchs24.png" alt="Heizungsfuchs24" width="160" height="40">
    <img src="assets/images/logos/maass-raum-coaching.png" alt="Maaß Raum Coaching" width="160" height="40">
  </div>
</section>
```

- [ ] **Step 3: Verify in browser**

Open `http://localhost:8080/index.html`, scroll below the hero. Expected: 4 greyscale logos in a centered row, each turns full-color on hover. If the image files aren't copied into `assets/images/logos/` yet, the browser shows broken-image icons — copy the 4 files before checking this off.

- [ ] **Step 4: Commit**

```bash
git add css/main.css index.html assets/images/logos
git commit -m "feat: add client logo strip to main page"
```

---

### Task 4: Main page — Service-Blöcke

**Files:**
- Modify: `css/main.css` (append)
- Modify: `index.html` (replace `SERVICES_PLACEHOLDER`)

**Interfaces:**
- Produces: `#leistungen` section, matching the nav's `#leistungen` anchor from Task 2

- [ ] **Step 1: Append service block styles**

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

- [ ] **Step 2: Replace `SERVICES_PLACEHOLDER` in `index.html`**

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

- [ ] **Step 3: Verify in browser**

Reload `index.html`. Expected: "Unsere Leistungen" heading, 3 columns (01/02/03) on desktop, stacked single column below 900px width.

- [ ] **Step 4: Commit**

```bash
git add css/main.css index.html
git commit -m "feat: add services section to main page"
```

---

### Task 5: Main page — Case-Grid / Portfolio

**Files:**
- Modify: `css/main.css` (append)
- Modify: `index.html` (replace `PORTFOLIO_PLACEHOLDER`)

**Interfaces:**
- Produces: `#projekte` section matching the nav anchor; `.case-card` class used as the hover-microinteraction target in Task 11 — later task's JS selector `document.querySelectorAll('.case-card')` depends on this exact class name

- [ ] **Step 1: Append case-grid styles**

```css
#projekte .case-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}
.case-card {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: 4px;
}
.case-card img { width: 100%; height: 100%; object-fit: cover; }
.case-card .case-info {
  position: absolute; left: 0; right: 0; bottom: 0;
  padding: 20px;
  background: linear-gradient(0deg, rgba(0,0,0,0.85), transparent);
}
.case-card .case-info h3 { font-size: 1.1rem; }
.case-card .case-info .stats { color: rgba(255,255,255,0.7); font-size: 0.9rem; margin-top: 4px; }
@media (max-width: 767px) {
  #projekte .case-grid { grid-template-columns: 1fr; }
}
```

- [ ] **Step 2: Replace `PORTFOLIO_PLACEHOLDER` in `index.html`**

```html
<section id="projekte">
  <h2>Projekte</h2>
  <div class="case-grid">
    <div class="case-card">
      <img src="assets/images/portfolio/fotoshooting.jpg" alt="Fotoshooting Projekt" loading="lazy">
      <div class="case-info">
        <h3>Fotoshooting</h3>
        <p class="stats">2 Drehtage · 4 Reels · 80k Views</p>
      </div>
    </div>
    <div class="case-card">
      <img src="assets/images/portfolio/musikvideo.jpg" alt="Musikvideo und Fotoshooting" loading="lazy">
      <div class="case-info">
        <h3>Musikvideo und Fotoshooting</h3>
        <p class="stats">3 Drehtage · 6 Reels · 150k Views</p>
      </div>
    </div>
    <div class="case-card">
      <img src="assets/images/portfolio/dj-set.jpg" alt="DJ-Set Dreh und Fotoshooting" loading="lazy">
      <div class="case-info">
        <h3>DJ-Set Dreh und Fotoshooting</h3>
        <p class="stats">1 Drehtag · 3 Reels · 60k Views</p>
      </div>
    </div>
    <div class="case-card">
      <img src="assets/images/portfolio/musikvideo-2.jpg" alt="Musikvideo und Fotoshooting" loading="lazy">
      <div class="case-info">
        <h3>Musikvideo und Fotoshooting</h3>
        <p class="stats">2 Drehtage · 5 Reels · 95k Views</p>
      </div>
    </div>
  </div>
</section>
```

Note: `stats` values above are placeholders in the agreed format — Fabian replaces them with real numbers per the README checklist.

- [ ] **Step 3: Verify in browser**

Reload. Expected: 2×2 image grid (1 column on mobile), each card shows title + stats line at the bottom over a dark gradient. Broken-image icons are expected until real photos are copied into `assets/images/portfolio/`.

- [ ] **Step 4: Commit**

```bash
git add css/main.css index.html
git commit -m "feat: add portfolio case-grid to main page"
```

---

### Task 6: Main page — Prozess-Schritte

**Files:**
- Modify: `css/main.css` (append)
- Modify: `index.html` (replace `PROCESS_PLACEHOLDER`)

**Interfaces:**
- Produces: `#prozess` section matching the nav anchor

- [ ] **Step 1: Append process step styles**

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

- [ ] **Step 2: Replace `PROCESS_PLACEHOLDER` in `index.html`**

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

- [ ] **Step 3: Verify in browser**

Reload. Expected: 4 steps in a row on desktop, stacked on mobile, in the order Erstgespräch → Konzept → Produktionstag → Schnitt & Posting on every viewport width.

- [ ] **Step 4: Commit**

```bash
git add css/main.css index.html
git commit -m "feat: add process steps section to main page"
```

---

### Task 7: Main page — Testimonials (prepared placeholder, no invented quotes)

**Files:**
- Modify: `css/main.css` (append)
- Modify: `index.html` (replace `TESTIMONIALS_PLACEHOLDER`)

**Interfaces:**
- Produces: `#kundenstimmen` section (not linked from nav — intentionally not a primary nav item)

- [ ] **Step 1: Append testimonial placeholder styles**

```css
#kundenstimmen { text-align: center; }
#kundenstimmen p.placeholder-note {
  color: rgba(255,255,255,0.5);
  font-style: italic;
}
```

- [ ] **Step 2: Replace `TESTIMONIALS_PLACEHOLDER` in `index.html`**

```html
<section id="kundenstimmen">
  <h2>Kundenstimmen</h2>
  <p class="placeholder-note">Kundenstimmen folgen in Kürze.</p>
</section>
```

Do NOT invent named customer quotes here — this exact issue was flagged and rejected in the earlier Wix attempt (see `Konzept.md`). Replace this markup with real quotes only once Fabian supplies them.

- [ ] **Step 3: Verify in browser**

Reload. Expected: centered heading "Kundenstimmen" with an italic grey placeholder line, no fabricated names or quotes anywhere in the page source (`curl -s http://localhost:8080/index.html | grep -iE "markus|sophie|bernard"` returns nothing).

- [ ] **Step 4: Commit**

```bash
git add css/main.css index.html
git commit -m "feat: add testimonials placeholder section to main page"
```

---

### Task 8: Main page — Über mich / Gründer-Story

**Files:**
- Modify: `css/main.css` (append)
- Modify: `index.html` (replace `ABOUT_PLACEHOLDER`)

**Interfaces:**
- Produces: `#ueber-mich` section (not in primary nav, reachable by scroll)

- [ ] **Step 1: Append about-section styles**

```css
#ueber-mich { display: flex; gap: 48px; align-items: center; flex-wrap: wrap; }
#ueber-mich .text { flex: 1 1 480px; }
#ueber-mich img { flex: 1 1 320px; border-radius: 4px; }
#ueber-mich h2 { margin-bottom: 24px; }
#ueber-mich p { color: rgba(255,255,255,0.8); font-size: 1.05rem; }
```

- [ ] **Step 2: Replace `ABOUT_PLACEHOLDER` in `index.html`**

```html
<section id="ueber-mich">
  <div class="text">
    <h2>Die Vision</h2>
    <p>Ich bin Fabian Scholl, Gründer von Fabian Visuals. Meine Leidenschaft für Videoproduktion begann mit Musikvideos und hat sich zu einem Studio entwickelt, das kleine bis mittelständische Künstler und Unternehmen in Bonn, Köln, Düsseldorf und Aachen begleitet. Ich setze auf Video-first Content, um deine Vision in hochwertige, kreative Werke zu verwandeln — und berate dich auch dann, wenn dein Budget noch klein ist, damit du mittelfristig selbst verstehst, was funktioniert.</p>
  </div>
  <img src="assets/images/fabian-at-work.jpg" alt="Fabian Scholl bei der Arbeit" loading="lazy">
</section>
```

- [ ] **Step 3: Verify in browser**

Reload. Expected: two-column layout (text + image) on desktop, stacked on mobile. Broken image icon expected until the real photo is added.

- [ ] **Step 4: Commit**

```bash
git add css/main.css index.html
git commit -m "feat: add about/founder-story section to main page"
```

---

### Task 9: Main page — Kontakt section + Footer

**Files:**
- Modify: `css/main.css` (append)
- Modify: `index.html` (replace `CONTACT_FOOTER_PLACEHOLDER`)

**Interfaces:**
- Produces: `#kontakt` section matching the nav anchor from Task 2 AND the Hero CTA's `href="#kontakt"` from Task 2 — both must resolve to this section's `id`
- Produces: `<form id="main-contact-form">` — its `action` attribute is the `FORM_ENDPOINT_MAIN` placeholder from Global Constraints

- [ ] **Step 1: Append contact/footer styles**

```css
#kontakt { text-align: center; }
#kontakt .whatsapp-cta { margin: 24px 0 48px; }
#kontakt form {
  display: grid;
  gap: 16px;
  max-width: 480px;
  margin: 0 auto;
  text-align: left;
}
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
#kontakt textarea { min-height: 120px; }
#kontakt input:focus-visible, #kontakt textarea:focus-visible { outline: 2px solid var(--color-accent); }
footer {
  padding: 32px 24px;
  text-align: center;
  color: rgba(255,255,255,0.5);
  font-size: 0.85rem;
}
footer .socials { display: flex; justify-content: center; gap: 20px; margin-top: 12px; }
footer .socials a { min-width: 44px; min-height: 44px; display: inline-flex; align-items: center; justify-content: center; }
```

- [ ] **Step 2: Replace `CONTACT_FOOTER_PLACEHOLDER` in `index.html`**

```html
<section id="kontakt">
  <h2>Kontakt</h2>
  <p>Lass uns über dein Projekt sprechen.</p>
  <a class="btn whatsapp-cta" href="https://wa.me/491785003656" target="_blank" rel="noopener">Jetzt Termin sichern (WhatsApp)</a>
  <form id="main-contact-form" action="https://formspree.io/f/REPLACE_ME" method="POST">
    <div>
      <label for="name">Name</label>
      <input type="text" id="name" name="name" required>
    </div>
    <div>
      <label for="email">E-Mail</label>
      <input type="email" id="email" name="email" required>
    </div>
    <div>
      <label for="message">Nachricht</label>
      <textarea id="message" name="message" required></textarea>
    </div>
    <button type="submit" class="btn">Nachricht senden</button>
  </form>
</section>

<footer>
  <p>&copy; 2026 Fabian Visuals — Bonn / Köln / Düsseldorf / Aachen</p>
  <nav class="socials" aria-label="Social Media">
    <a href="https://instagram.com/Fabian.Visuals" target="_blank" rel="noopener" aria-label="Instagram">IG</a>
  </nav>
</footer>
```

- [ ] **Step 3: Verify in browser**

Reload, click a nav "Kontakt" link and the Hero CTA — both must scroll to the same section. Expected: WhatsApp button opens `https://wa.me/491785003656` in a new tab; the form shows Name/E-Mail/Nachricht fields with visible labels; tabbing through the form shows a visible red focus ring on each field.

- [ ] **Step 4: Commit**

```bash
git add css/main.css index.html
git commit -m "feat: add contact section and footer to main page"
```

---

### Task 10: GSAP setup + scroll-reveal animations + reduced-motion helper

**Files:**
- Create: `js/main.js`
- Create: `js/tests/prefersReducedMotion.test.js`
- Modify: `index.html` (add GSAP CDN scripts + `js/main.js`, remove the inline nav-toggle script from Task 2 Step 3 since it moves into `main.js`)

**Interfaces:**
- Produces: `prefersReducedMotion()` — exported (Node) / global (browser) function returning `boolean`. Every later animation task (11, 12, 13) MUST call this before running any GSAP tween and skip the effect entirely when it returns `true`.
- Consumes: `.case-card` (Task 5), `#nav-toggle`/`#nav-list` (Task 2), `section h2`/`.service-card`/`.step` as scroll-reveal targets

- [ ] **Step 1: Write the failing test for `prefersReducedMotion`**

Create `js/tests/prefersReducedMotion.test.js`:

```js
const assert = require('assert');
global.window = {
  matchMedia: (query) => ({ matches: query === '(prefers-reduced-motion: reduce)' })
};
const { prefersReducedMotion } = require('../main.js');

assert.strictEqual(prefersReducedMotion(), true, 'should return true when matchMedia reports reduced motion');

global.window.matchMedia = () => ({ matches: false });
delete require.cache[require.resolve('../main.js')];
const { prefersReducedMotion: fn2 } = require('../main.js');
assert.strictEqual(fn2(), false, 'should return false when matchMedia reports no preference');

console.log('prefersReducedMotion tests passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node js/tests/prefersReducedMotion.test.js`
Expected: `Error: Cannot find module '../main.js'` (file doesn't exist yet)

- [ ] **Step 3: Write `js/main.js`**

```js
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    var api = factory();
    root.prefersReducedMotion = api.prefersReducedMotion;
    root.initMainPage = api.initMainPage;
  }
})(typeof window !== 'undefined' ? window : this, function () {

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function initNavToggle() {
    var toggle = document.getElementById('nav-toggle');
    var list = document.getElementById('nav-list');
    if (!toggle || !list) return;
    toggle.addEventListener('click', function () {
      var expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      list.classList.toggle('open');
    });
  }

  function initScrollReveal() {
    if (prefersReducedMotion()) return;
    gsap.registerPlugin(ScrollTrigger);
    var targets = document.querySelectorAll('#hero h1, #hero p, .service-card, .case-card, #prozess .step, #ueber-mich .text, #kundenstimmen h2');
    targets.forEach(function (el, i) {
      gsap.fromTo(el,
        { opacity: 0, y: 24 },
        {
          opacity: 1, y: 0, duration: 0.3, ease: 'power2.out',
          delay: (i % 4) * 0.04,
          scrollTrigger: { trigger: el, start: 'top 85%' }
        }
      );
    });
  }

  function initMainPage() {
    initNavToggle();
    initScrollReveal();
  }

  return { prefersReducedMotion: prefersReducedMotion, initMainPage: initMainPage };
});

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function () {
    window.initMainPage();
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node js/tests/prefersReducedMotion.test.js`
Expected: `prefersReducedMotion tests passed`

- [ ] **Step 5: Wire GSAP + main.js into `index.html`, remove the inline script from Task 2**

Remove the `<script>...nav-toggle...</script>` block added in Task 2 Step 3. Add just before `</body>` instead:

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"></script>
<script src="js/main.js"></script>
```

- [ ] **Step 6: Verify in browser**

Open `http://localhost:8080/index.html` with browser dev tools console open. Expected: no console errors; hero headline and paragraph fade+slide in on load; service cards and case cards fade in as you scroll to them. Then in OS settings enable "reduce motion" (or in Chrome DevTools: Rendering tab → "Emulate CSS prefers-reduced-motion: reduce"), reload — expected: all content is immediately visible with no fade/slide.

- [ ] **Step 7: Commit**

```bash
git add js/main.js js/tests/prefersReducedMotion.test.js index.html
git commit -m "feat: add GSAP scroll-reveal animations with reduced-motion support"
```

---

### Task 11: Hover microinteraction on case-grid cards

**Files:**
- Modify: `js/main.js`

**Interfaces:**
- Consumes: `prefersReducedMotion()` (Task 10), `.case-card` (Task 5)

- [ ] **Step 1: Add hover microinteraction to `initMainPage`**

In `js/main.js`, add a new function and call it from `initMainPage`:

```js
  function initCaseCardHover() {
    if (prefersReducedMotion()) return;
    document.querySelectorAll('.case-card').forEach(function (card) {
      var yTo = gsap.quickTo(card, 'y', { duration: 0.25, ease: 'power2.out' });
      var scaleTo = gsap.quickTo(card, 'scale', { duration: 0.25, ease: 'power2.out' });
      card.addEventListener('mouseenter', function () { yTo(-4); scaleTo(1.02); });
      card.addEventListener('mouseleave', function () { yTo(0); scaleTo(1); });
    });
  }
```

Update `initMainPage`:

```js
  function initMainPage() {
    initNavToggle();
    initScrollReveal();
    initCaseCardHover();
  }
```

- [ ] **Step 2: Verify in browser**

Reload `index.html`, hover over each of the 4 case-grid cards. Expected: card lifts slightly (-4px) and scales up 2% smoothly, reverses on mouse-leave, no stuck/hovering state after fast mouse movement. With reduced-motion emulation on, hovering does nothing (no error in console).

- [ ] **Step 3: Commit**

```bash
git add js/main.js
git commit -m "feat: add hover microinteraction to case-grid cards"
```

---

### Task 12: Magnet-cursor effect on primary CTAs + touch-device helper

**Files:**
- Modify: `js/main.js`
- Create: `js/tests/isTouchDevice.test.js`

**Interfaces:**
- Produces: `isTouchDevice()` — exported (Node) / used internally (browser) function returning `boolean`, checked before attaching the magnet-cursor listener
- Consumes: `prefersReducedMotion()` (Task 10), `.btn` elements (Tasks 2 and 9 — hero CTA and WhatsApp CTA)

- [ ] **Step 1: Write the failing test**

Create `js/tests/isTouchDevice.test.js`:

```js
const assert = require('assert');
global.window = { matchMedia: (query) => ({ matches: query === '(pointer: coarse)' }) };
const { isTouchDevice } = require('../main.js');
assert.strictEqual(isTouchDevice(), true, 'coarse pointer should be detected as touch device');

global.window.matchMedia = () => ({ matches: false });
delete require.cache[require.resolve('../main.js')];
const { isTouchDevice: fn2 } = require('../main.js');
assert.strictEqual(fn2(), false, 'fine pointer should not be detected as touch device');

console.log('isTouchDevice tests passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node js/tests/isTouchDevice.test.js`
Expected: `TypeError: isTouchDevice is not a function` (not yet exported)

- [ ] **Step 3: Add `isTouchDevice` and the magnet-cursor effect to `js/main.js`**

Add near `prefersReducedMotion`:

```js
  function isTouchDevice() {
    return window.matchMedia('(pointer: coarse)').matches;
  }

  function initMagnetCursor() {
    if (prefersReducedMotion() || isTouchDevice()) return;
    var targets = [document.querySelector('#hero .btn'), document.querySelector('#kontakt .whatsapp-cta')].filter(Boolean);
    targets.forEach(function (el) {
      var xTo = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'elastic.out(1,0.4)' });
      var yTo = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'elastic.out(1,0.4)' });
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.3);
        yTo((e.clientY - r.top - r.height / 2) * 0.3);
      });
      el.addEventListener('mouseleave', function () { xTo(0); yTo(0); });
    });
  }
```

Update the module's returned object and `initMainPage`:

```js
  return { prefersReducedMotion: prefersReducedMotion, isTouchDevice: isTouchDevice, initMainPage: initMainPage };
```

```js
  function initMainPage() {
    initNavToggle();
    initScrollReveal();
    initCaseCardHover();
    initMagnetCursor();
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node js/tests/isTouchDevice.test.js`
Expected: `isTouchDevice tests passed`

- [ ] **Step 5: Verify in browser**

Reload `index.html` on desktop, move the mouse near (not just over) the hero CTA and the WhatsApp button. Expected: button subtly pulls toward the cursor, springs back on mouse-leave. Using Chrome DevTools device emulation (touch device), reload — expected: no magnet effect, buttons stay static, no console errors.

- [ ] **Step 6: Commit**

```bash
git add js/main.js js/tests/isTouchDevice.test.js
git commit -m "feat: add magnet-cursor effect to primary CTAs with touch-device detection"
```

---

### Task 13: Parallax on hero background

**Files:**
- Modify: `js/main.js`
- Modify: `css/main.css` (hero-bg needs `will-change` toggling handled in JS, no new CSS rule required beyond what Task 2 already added)

**Interfaces:**
- Consumes: `prefersReducedMotion()` (Task 10), `.hero-bg` (Task 2)

- [ ] **Step 1: Add parallax to `js/main.js`**

```js
  function initHeroParallax() {
    if (prefersReducedMotion()) return;
    var bg = document.querySelector('#hero .hero-bg');
    if (!bg) return;
    gsap.to(bg, {
      yPercent: 12,
      ease: 'none',
      scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true }
    });
  }
```

Update `initMainPage`:

```js
  function initMainPage() {
    initNavToggle();
    initScrollReveal();
    initCaseCardHover();
    initMagnetCursor();
    initHeroParallax();
  }
```

- [ ] **Step 2: Verify in browser**

Reload `index.html`, scroll from the top past the hero section. Expected: the hero background image moves slightly slower than the foreground text (subtle depth effect), text itself does not parallax. With reduced-motion emulation on, the background stays static.

- [ ] **Step 3: Commit**

```bash
git add js/main.js
git commit -m "feat: add parallax effect to hero background"
```

---

### Task 14: Responsive QA pass — main page

**Files:**
- Modify: `css/main.css` (fix any issues found)

**Interfaces:** None new — this task only verifies and patches existing CSS from Tasks 2–9.

- [ ] **Step 1: Verify at 375px width**

Open `http://localhost:8080/index.html`, resize browser (or DevTools device toolbar) to 375×812. Expected: hamburger menu, no horizontal scrollbar, all text readable without zoom, hero CTA and WhatsApp button ≥44px tall.

- [ ] **Step 2: Verify at 768px, 1024px, 1440px**

Resize through each breakpoint. Expected: service grid transitions from 1 to 3 columns, case-grid from 1 to 2 columns, process steps from 1 to 4 columns, no horizontal scroll at any width, nav switches from hamburger to full inline menu at 768px.

- [ ] **Step 3: Fix any overflow found**

If horizontal scroll appears at any width, find the overflowing element with:

```
document.querySelectorAll('*').forEach(el => { if (el.scrollWidth > document.documentElement.clientWidth) console.log(el); })
```

run in the browser console, then constrain that element's width in `css/main.css` (e.g. add `max-width: 100%;` or fix a hardcoded pixel width).

- [ ] **Step 4: Commit** (only if fixes were needed)

```bash
git add css/main.css
git commit -m "fix: resolve responsive layout issues on main page"
```

---

### Task 15: Wedding page — CSS foundation + Hero

**Files:**
- Create: `css/wedding.css`
- Modify: `hochzeiten.html` (replace `WEDDING_HERO_PLACEHOLDER`)

**Interfaces:**
- Produces: CSS custom properties `--w-color-bg: #FAF8F5`, `--w-color-accent: #C9A876`, `--w-color-text: #3A3530`, `--w-font-headline: 'Playfair Display', serif`, `--w-font-body: 'Montserrat', sans-serif` — every later wedding-page task reuses these, never hardcodes the hex values, and NEVER reuses `main.css`'s `--color-*` variables

- [ ] **Step 1: Create `css/wedding.css`**

```css
:root {
  --w-color-bg: #FAF8F5;
  --w-color-accent: #C9A876;
  --w-color-text: #3A3530;
  --w-font-headline: 'Playfair Display', serif;
  --w-font-body: 'Montserrat', sans-serif;
  --w-max-width: 1100px;
}

body {
  background: var(--w-color-bg);
  color: var(--w-color-text);
  font-family: var(--w-font-body);
  font-weight: 300;
  font-size: 16px;
  overflow-x: hidden;
}

section { padding: 96px 24px; max-width: var(--w-max-width); margin: 0 auto; }
h1, h2, h3 { font-family: var(--w-font-headline); font-weight: 600; line-height: 1.15; }

.w-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 14px 32px;
  background: var(--w-color-accent);
  color: #FFFFFF;
  border-radius: 2px;
  transition: opacity 200ms ease;
}
.w-btn:hover { opacity: 0.85; }
.w-btn:focus-visible { outline: 2px solid var(--w-color-text); outline-offset: 2px; }

#w-hero {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  position: relative;
  padding-left: 48px;
}
#w-hero .w-hero-bg {
  position: absolute; inset: 0;
  background: linear-gradient(180deg, rgba(250,248,245,0) 40%, rgba(250,248,245,0.95)), url('../assets/images/wedding/hero.jpg') center/cover;
  z-index: -1;
}
#w-hero h1 { font-size: clamp(2rem, 6vw, 3.5rem); max-width: 640px; }
#w-hero p { margin-top: 20px; max-width: 480px; }
#w-hero .scroll-indicator { margin-top: 48px; font-size: 0.85rem; color: var(--w-color-text); opacity: 0.6; }
```

- [ ] **Step 2: Replace `WEDDING_HERO_PLACEHOLDER` in `hochzeiten.html`**

```html
<section id="w-hero">
  <div class="w-hero-bg"></div>
  <h1>Eure Geschichte, festgehalten wie ein Film</h1>
  <p>Cinematische Hochzeitsfotografie und -filme — für Paare, die ihren Tag so erleben wollen, wie er wirklich war.</p>
  <p class="scroll-indicator">↓ Scrollen</p>
</section>
```

- [ ] **Step 3: Verify in browser**

Open `http://localhost:8080/hochzeiten.html`. Expected: off-white background, serif headline in dark warm-grey, no red/black anywhere, no GSAP/console script loaded (check Network tab — no request to `gsap.min.js`).

- [ ] **Step 4: Commit**

```bash
git add css/wedding.css hochzeiten.html
git commit -m "feat: add wedding page CSS foundation and hero section"
```

---

### Task 16: Wedding page — Portfolio-Galerie

**Files:**
- Modify: `css/wedding.css` (append)
- Modify: `hochzeiten.html` (replace `WEDDING_PORTFOLIO_PLACEHOLDER`)

- [ ] **Step 1: Append gallery styles**

```css
#w-portfolio .w-gallery {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
#w-portfolio .w-gallery img { aspect-ratio: 1; object-fit: cover; border-radius: 2px; }
@media (max-width: 767px) {
  #w-portfolio .w-gallery { grid-template-columns: repeat(2, 1fr); }
}
```

- [ ] **Step 2: Replace `WEDDING_PORTFOLIO_PLACEHOLDER` in `hochzeiten.html`**

```html
<section id="w-portfolio">
  <h2>Portfolio</h2>
  <div class="w-gallery">
    <img src="assets/images/wedding/01.jpg" alt="Hochzeitsfoto 1" loading="lazy">
    <img src="assets/images/wedding/02.jpg" alt="Hochzeitsfoto 2" loading="lazy">
    <img src="assets/images/wedding/03.jpg" alt="Hochzeitsfoto 3" loading="lazy">
    <img src="assets/images/wedding/04.jpg" alt="Hochzeitsfoto 4" loading="lazy">
    <img src="assets/images/wedding/05.jpg" alt="Hochzeitsfoto 5" loading="lazy">
    <img src="assets/images/wedding/06.jpg" alt="Hochzeitsfoto 6" loading="lazy">
  </div>
</section>
```

Fabian adds his real wedding photos as `assets/images/wedding/01.jpg` through at least `15.jpg`–`20.jpg` per the spec's "15–20 curated photos" — extend the `<img>` list to match however many he provides.

- [ ] **Step 3: Verify in browser**

Reload `hochzeiten.html`. Expected: 3-column grid on desktop, 2-column on mobile, square-cropped images, no layout shift once images load (aspect-ratio reserves the space).

- [ ] **Step 4: Commit**

```bash
git add css/wedding.css hochzeiten.html
git commit -m "feat: add portfolio gallery to wedding page"
```

---

### Task 17: Wedding page — Über mich + Services & Pakete

**Files:**
- Modify: `css/wedding.css` (append)
- Modify: `hochzeiten.html` (replace `WEDDING_ABOUT_PACKAGES_PLACEHOLDER`)

- [ ] **Step 1: Append about + packages styles**

```css
#w-about { display: flex; gap: 40px; align-items: center; flex-wrap: wrap; }
#w-about img { flex: 1 1 300px; border-radius: 2px; }
#w-about .text { flex: 1 1 400px; }

#w-packages .w-package-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}
#w-packages .w-package {
  border: 1px solid rgba(58,53,48,0.15);
  padding: 32px 24px;
  text-align: center;
}
#w-packages .w-package h3 { font-size: 1.3rem; margin-bottom: 12px; }
#w-packages .w-package .price { color: var(--w-color-accent); font-size: 1.5rem; font-family: var(--w-font-headline); margin: 16px 0; }
@media (max-width: 900px) {
  #w-packages .w-package-grid { grid-template-columns: 1fr; }
}
```

- [ ] **Step 2: Replace `WEDDING_ABOUT_PACKAGES_PLACEHOLDER` in `hochzeiten.html`**

```html
<section id="w-about">
  <img src="assets/images/wedding/fabian-at-work.jpg" alt="Fabian bei der Arbeit" loading="lazy">
  <div class="text">
    <h2>Über mich</h2>
    <p>Ich bin Fabian, cinematischer Videograf aus Bonn. Anders als der klassische Hochzeitsfotograf sehe ich euren Tag durch die Linse des Films — mit Bewegung, Licht und echten Momenten statt gestellter Posen. Ich möchte, dass ihr eure Hochzeit später nicht nur anschaut, sondern noch einmal fühlt.</p>
  </div>
</section>

<section id="w-packages">
  <h2>Pakete</h2>
  <div class="w-package-grid">
    <div class="w-package">
      <h3>Elopement / Micro-Wedding</h3>
      <p class="price">ab 590€</p>
      <p>Kurze Coverage, minimalistisch — ideal für kleine, intime Feiern.</p>
    </div>
    <div class="w-package">
      <h3>Ganztags-Fotografie</h3>
      <p class="price">ab 1.590€</p>
      <p>Kompletter Hochzeitstag, von den Vorbereitungen bis zur Feier.</p>
    </div>
    <div class="w-package">
      <h3>Fotografie + Film</h3>
      <p class="price">ab 2.290€</p>
      <p>Das Kombi-Paket — Fotos und ein cinematischer Film in einem.</p>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Verify in browser**

Reload. Expected: about section with photo + text, 3 package cards with prices in the sand accent color, single column below 900px.

- [ ] **Step 4: Commit**

```bash
git add css/wedding.css hochzeiten.html
git commit -m "feat: add about and packages sections to wedding page"
```

---

### Task 18: Wedding page — Testimonials (hidden) + Kontaktformular

**Files:**
- Modify: `css/wedding.css` (append)
- Modify: `hochzeiten.html` (replace `WEDDING_TESTIMONIALS_CONTACT_PLACEHOLDER`)

**Interfaces:**
- Produces: `<form id="wedding-contact-form">` — its `action` is the separate `FORM_ENDPOINT_WEDDING` placeholder from Global Constraints (must differ from `main-contact-form`'s endpoint)

- [ ] **Step 1: Append hidden-testimonials + form styles**

```css
#w-testimonials[hidden] { display: none; }

#w-contact form {
  display: grid;
  gap: 16px;
  max-width: 480px;
  margin: 0 auto;
  text-align: left;
}
#w-contact label { font-size: 0.9rem; }
#w-contact input, #w-contact select, #w-contact textarea {
  width: 100%;
  min-height: 44px;
  padding: 12px;
  background: #FFFFFF;
  border: 1px solid rgba(58,53,48,0.25);
  color: var(--w-color-text);
  border-radius: 2px;
}
#w-contact textarea { min-height: 120px; }
```

- [ ] **Step 2: Replace `WEDDING_TESTIMONIALS_CONTACT_PLACEHOLDER` in `hochzeiten.html`**

```html
<section id="w-testimonials" hidden>
  <h2>Was Brautpaare sagen</h2>
  <blockquote>Platzhalter für zukünftige Zitate.</blockquote>
</section>

<section id="w-contact">
  <h2>Anfrage senden</h2>
  <form id="wedding-contact-form" action="https://formspree.io/f/REPLACE_ME" method="POST">
    <div>
      <label for="w-date">Datum</label>
      <input type="date" id="w-date" name="date" required>
    </div>
    <div>
      <label for="w-location">Location</label>
      <input type="text" id="w-location" name="location" required>
    </div>
    <div>
      <label for="w-package">Gewünschtes Paket</label>
      <select id="w-package" name="package" required>
        <option value="">Bitte wählen</option>
        <option value="elopement">Elopement / Micro-Wedding</option>
        <option value="ganztags">Ganztags-Fotografie</option>
        <option value="foto-film">Fotografie + Film</option>
      </select>
    </div>
    <div>
      <label for="w-message">Nachricht</label>
      <textarea id="w-message" name="message" required></textarea>
    </div>
    <button type="submit" class="w-btn">Anfrage senden</button>
  </form>
</section>
```

- [ ] **Step 3: Verify in browser**

Reload `hochzeiten.html`. Expected: no "Was Brautpaare sagen" heading visible on the rendered page (confirm via `document.getElementById('w-testimonials').hidden === true` in console — should print `true`), but present in page source via `curl -s http://localhost:8080/hochzeiten.html | grep -c 'w-testimonials'` (should be ≥1). Contact form shows Datum/Location/Paket-dropdown/Nachricht fields, all with visible labels.

- [ ] **Step 4: Commit**

```bash
git add css/wedding.css hochzeiten.html
git commit -m "feat: add hidden testimonials placeholder and contact form to wedding page"
```

---

### Task 19: Teaser button from main page to wedding page

**Files:**
- Modify: `css/main.css` (append, scoped class only — must not touch `:root` variables)
- Modify: `index.html` (add teaser button inside `<footer>`, just before the closing `</footer>` tag added in Task 9)

**Interfaces:**
- Consumes: `footer` (Task 9)

- [ ] **Step 1: Append a scoped teaser-button style to `css/main.css`**

```css
.wedding-teaser {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 24px;
  margin-top: 16px;
  background: transparent;
  border: 1px solid #C9A876;
  color: #C9A876;
  border-radius: 4px;
  transition: background 200ms ease, color 200ms ease;
}
.wedding-teaser:hover { background: #C9A876; color: var(--color-bg); }
```

This is the only place `#C9A876` appears in `main.css` — it is a one-off accent for this single link, not a reusable variable, so it does not violate the "no shared theme" constraint from Global Constraints.

- [ ] **Step 2: Add the teaser link in `index.html`, inside `<footer>` before `</footer>`**

```html
  <p><a class="wedding-teaser" href="hochzeiten.html">Ihr heiratet? → Hochzeitsfotografie ansehen</a></p>
```

- [ ] **Step 3: Verify in browser**

Reload `index.html`, scroll to the footer. Expected: a sand-bordered outline button distinct from the red `.btn` style used elsewhere, clicking it navigates to `hochzeiten.html`, browser back button returns cleanly to `index.html`.

- [ ] **Step 4: Commit**

```bash
git add css/main.css index.html
git commit -m "feat: add wedding page teaser link to main page footer"
```

---

### Task 20: Accessibility/SEO polish + final QA

**Files:**
- Modify: `index.html`, `hochzeiten.html` (add favicon link, lang attributes already present, verify alt text)
- Modify: `README.md` (finalize "before going live" checklist)

- [ ] **Step 1: Add a favicon placeholder link to both pages' `<head>`**

Add to both `index.html` and `hochzeiten.html`:

```html
<link rel="icon" href="assets/icons/favicon.ico">
```

(Fabian supplies `assets/icons/favicon.ico` — an F+Rec-Dot icon per the brand, per `Konzept.md`.)

- [ ] **Step 2: Audit alt text**

Run: `grep -o '<img[^>]*>' index.html hochzeiten.html`
Expected: every `<img>` tag has a non-empty `alt="..."` attribute — confirm by eye against the output; there are no purely decorative images in this plan, so none should have `alt=""`.

- [ ] **Step 3: Run the reduced-motion + touch-device unit tests together**

Run: `node js/tests/prefersReducedMotion.test.js && node js/tests/isTouchDevice.test.js`
Expected: both print their "tests passed" message with no errors

- [ ] **Step 4: Full click-through QA**

With `python3 -m http.server 8080` running, open `index.html`: click every nav link (scrolls to matching section), hover every case card, hover the hero CTA and WhatsApp button, tab through the contact form (visible focus rings throughout), click the wedding teaser link, then on `hochzeiten.html` tab through its form and confirm no GSAP-related console errors (GSAP is never loaded there).

- [ ] **Step 5: Responsive QA pass — wedding page**

Resize `hochzeiten.html` to 375px, 768px, 1024px, 1440px (same breakpoints as Task 14). Expected: portfolio gallery goes from 2 to 3 columns, package cards go from 1 to 3 columns, no horizontal scroll at any width, hero headline stays readable without zoom at 375px. Fix any overflow the same way as Task 14 Step 3, in `css/wedding.css` instead of `main.css`.

- [ ] **Step 6: Finalize `README.md`** — confirm the "Vor dem Live-Schalten" checklist from Task 1 still matches reality; add any newly-discovered open item (e.g. exact favicon file, missing photos).

- [ ] **Step 7: Commit**

```bash
git add index.html hochzeiten.html README.md
git commit -m "chore: accessibility polish and final QA pass"
```

---

## Post-plan note

This plan does not include a task for actually deploying/hosting the site (Fabian hadn't decided on a host at spec time) — once he picks Netlify, Vercel, or FTP, that's a short follow-up task (connect repo or upload the folder), not covered here.
