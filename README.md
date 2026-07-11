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
