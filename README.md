# Fabian Visuals Website

Statische HTML/CSS/JS-Website (kein Build-Schritt). Ersetzt die vorherige Wix-Seite.

## Lokal ansehen

    python3 -m http.server 8080

Dann im Browser öffnen: http://localhost:8080/index.html oder /hochzeiten.html

## Vor dem Live-Schalten

- [ ] Formspree-Account anlegen, `REPLACE_ME_MAIN` (Hauptseite in `index.html`) und `REPLACE_ME_WEDDING` (Hochzeiten in `hochzeiten.html`) durch echte Formular-URLs ersetzen
- [ ] Benzin-Font-Dateien (`Benzin-Bold.woff2`) in `assets/fonts/` ablegen, Lizenz geklärt
- [ ] `assets/icons/favicon.ico` ablegen (F + Rec-Dot Icon nach Branding, siehe `Konzept.md`) — Ordner ist aktuell leer
- [ ] Echte Fotos/Logos in `assets/images/` ablegen — aktuell fehlen:
  - `hero-bg.jpg` (Hauptseite Hero-Hintergrund)
  - `logos/one-studio.png` und `logos/zaves.png` (die anderen zwei Referenzlogos, `heizungsfuchs24.png` und `maass-raum-coaching.png`, liegen schon vor)
  - `portfolio/fotoshooting.jpg`, `portfolio/musikvideo.jpg`, `portfolio/dj-set.jpg`, `portfolio/musikvideo-2.jpg`
  - `fabian-at-work.jpg` (Über-mich-Sektion Hauptseite)
  - `wedding/hero.jpg`, `wedding/01.jpg` bis `wedding/06.jpg`, `wedding/fabian-at-work.jpg` (komplette Hochzeitsseite)
- [ ] Echte Case-Grid-Kennzahlen eintragen (aktuell Platzhalter-Zahlen)
- [ ] Hosting wählen (Netlify, Vercel oder FTP) und Domain verbinden
