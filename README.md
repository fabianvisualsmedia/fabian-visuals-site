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

- [ ] Formspree-Account anlegen, `REPLACE_ME_MAIN` (Hauptseite in `index.html`) und `REPLACE_ME_WEDDING` (Hochzeiten in `hochzeiten.html`) durch echte Formular-Endpunkt-URLs ersetzen
- [ ] Benzin-Font-Datei (`Benzin-Bold.woff2`) in `assets/fonts/` ablegen, Lizenz vorher klären — `css/main.css:12` referenziert die Datei bereits, `assets/fonts/` existiert aktuell noch nicht (bis dahin greift der Fallback `'Arial Black', sans-serif`)
- [ ] Echte Case-Grid-Kennzahlen eintragen (aktuell Platzhalter-Zahlen wie „2 Drehtage · 4 Reels · 80k Views")
- [ ] `git remote` setzen und auf GitHub pushen (siehe Deployment-Schritte oben) — aktuell hat dieses Repo keinen Remote
- [ ] Branch `animations-round-2` nach `main` mergen (aktueller Stand ist der Feature-Branch, nicht `main`)
- [ ] Domain `fabianvisuals.de` auf Cloudflare Pages verbinden
- [ ] Rechtstexte in `impressum.html`/`datenschutz.html` von Fabian gegenlesen lassen (Basisdaten aus dem Second-Brain-Kontext übernommen, kein Ersatz für Rechtsberatung)
