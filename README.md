# Fabian Visuals Website

Statische HTML/CSS/JS-Website (kein Build-Schritt). Ersetzt die vorherige Wix-Seite.

## Lokal ansehen

    python3 -m http.server 8080

Dann im Browser öffnen: http://localhost:8080/index.html oder /hochzeiten.html

## Deployment (Cloudflare Pages via GitHub)

1. Push diesen Code zu GitHub (z. B. `fabianscholl/fabian-visuals-site` — Achtung: dort liegt aktuell noch ein veralteter 3-Commit-Stand ohne Dual-Mode/Wedding-Seite; der muss bewusst überschrieben oder durch ein neues Repo ersetzt werden, nicht stillschweigend).
2. Im Cloudflare-Dashboard: Workers & Pages → Create → Pages → Connect to Git → Repo auswählen.
3. Build-Einstellungen: **Framework preset: None**, **Build command: (leer lassen)**, **Build output directory: `/`**. Es gibt keinen Build-Schritt — reines statisches Dateisystem.
4. Deployen. Cloudflare liefert `index.html` auf der Domain-Wurzel aus; `hochzeiten.html`, `impressum.html`, `datenschutz.html` sind direkt über ihren Dateinamen erreichbar.
5. Custom Domain (`fabianvisuals.de`) unter dem Pages-Projekt-Tab "Custom domains" hinzufügen und den dortigen DNS-Anweisungen folgen.

## Vor dem Live-Schalten (offene Punkte)

- [x] Formspree-Endpunkte gesetzt: `maqrekge` (Hauptseite) / `xqerpjvq` (Hochzeiten)
- [ ] Benzin-Font-Datei (`Benzin-Bold.woff2`) in `assets/fonts/` ablegen, Lizenz noch nicht vorhanden — `css/main.css:12` referenziert die Datei bereits, `assets/fonts/` existiert aktuell noch nicht (bis dahin greift der Fallback `'Arial Black', sans-serif`). Kostenlose Alternativen geprüft, siehe Chat/Notiz zu Archivo Black / Anton — Entscheidung steht noch aus.
- [x] Case-Grid auf echte Kunden umgestellt: 1Studio (Content Creation), Heizungsfuchs24 (Channel Growth), Fouza (Rapvideo)
- [ ] Case-Grid-Bilder sind Platzhalter aus dem bestehenden Asset-Pool (`fotoshooting/`, `musikvideo/`, `musikvideo-2/` — nicht zwingend die echten 1Studio/Heizungsfuchs24/Fouza-Aufnahmen), durch echtes Bildmaterial ersetzen sobald verfügbar. `assets/images/portfolio/dj-set/` wird aktuell nicht mehr referenziert.
- [ ] Domain `fabianvisuals.de` auf Cloudflare Pages verbinden
- [ ] Rechtstexte in `impressum.html`/`datenschutz.html` von Fabian gegenlesen lassen (Basisdaten aus dem Second-Brain-Kontext übernommen, kein Ersatz für Rechtsberatung)
