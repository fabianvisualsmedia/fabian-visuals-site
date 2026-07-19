# Fabian Visuals Website

Statische HTML/CSS/JS-Website (kein Build-Schritt). Ersetzt die vorherige Wix-Seite.

## Lokal ansehen

    python3 -m http.server 8080

Dann im Browser öffnen: http://localhost:8080/index.html oder /hochzeiten.html

## Deployment (Cloudflare Pages via GitHub)

**Status: live.** Repo ist unter `github.com/fabianvisualsmedia/fabian-visuals-site` (main), Cloudflare Pages-Projekt `fabian-visuals-site` ist bereits mit diesem Repo verbunden (Git-Integration existierte schon) und deployt automatisch bei jedem Push nach `main`. Aktuell erreichbar unter https://fabian-visuals-site.pages.dev — Build-Einstellungen bereits korrekt (kein Build-Command, kein Framework-Preset, Root als Output-Dir).

Cloudflare strippt `.html`-Endungen automatisch (308-Redirect `/impressum.html` → `/impressum`, `/hochzeiten.html` → `/hochzeiten` usw.) — funktioniert, kein Handlungsbedarf.

Offen: Custom Domain `fabianvisuals.de` unter dem Pages-Projekt-Tab "Custom domains" hinzufügen und den dortigen DNS-Anweisungen folgen.

## Vor dem Live-Schalten (offene Punkte)

- [x] Formspree-Endpunkte gesetzt: `maqrekge` (Hauptseite) / `xqerpjvq` (Hochzeiten)
- [ ] Benzin-Font-Datei (`Benzin-Bold.woff2`) in `assets/fonts/` ablegen, Lizenz noch nicht vorhanden — `css/main.css:12` referenziert die Datei bereits, `assets/fonts/` existiert aktuell noch nicht (bis dahin greift der Fallback `'Arial Black', sans-serif`). Kostenlose Alternativen geprüft, siehe Chat/Notiz zu Archivo Black / Anton — Entscheidung steht noch aus.
- [x] Case-Grid auf echte Kunden umgestellt: 1Studio (Content Creation), Heizungsfuchs24 (Channel Growth), Fouza (Rapvideo)
- [ ] Case-Grid final entscheiden: Kategorien (aktuell Musikvideos/DJ-Sets/Taschen-Fotos), Titel, echte Fotos/Videos nachreichen
- [ ] TikTok-URL im Footer bestätigen (aktuell Platzhalter `tiktok.com/@fabian.visuals`, geraten nach IG-Handle-Muster)
- [ ] Client-Logos mit weißem Hintergrund geprüft (siehe Task 4 Report) — ggf. freistellen für den jetzt hintergrundlosen Marquee-Look
- [ ] Domain `fabianvisuals.de` auf Cloudflare Pages verbinden (Deployment selbst läuft bereits live über `fabian-visuals-site.pages.dev`)
- [ ] Rechtstexte in `impressum.html`/`datenschutz.html` von Fabian gegenlesen lassen (Basisdaten aus dem Second-Brain-Kontext übernommen, kein Ersatz für Rechtsberatung)
- [ ] Beide im Chat geteilten Cloudflare-API-Tokens im Dashboard rotieren (Settings → API Tokens) — waren im Klartext in der Konversation
