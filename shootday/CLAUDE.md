# CLAUDE.md – Shoot-Day-Autopilot (Fabian Visuals)

> Briefing für Claude Code. Lies diese Datei komplett, bevor du Code schreibst.
> Arbeite die Phasen der Reihe nach ab. Nach jeder Phase: kurz zusammenfassen, was steht, und auf Fabians OK warten.

**Ort im Repo:** Die App liegt in `shootday/` innerhalb der Website `fabian-visuals-site` und wird mit ihr über Cloudflare Pages unter `/shootday/` ausgeliefert. Alle Pfade unten sind relativ zu `shootday/`.

**Status:** Phase 1 + 2 erledigt. Nächster Schritt: Phase 3 (Erinnerungen & Backup).

---

## 1. Was wir bauen

Eine Web-App (PWA) für Foto- und Videografen. Man legt einen Drehtermin an, die App baut daraus automatisch alles, was man für den Drehtag braucht:

- **Packliste** passend zu Shoot-Typ, Wetter und Tageszeit
- **Akku- und Speicherkarten-Rechner** (wie viele Akkus, wie viele GB)
- **Anfahrt** mit Abfahrtszeit inkl. Puffer
- **Sonnenstand** (Sonnenaufgang/-untergang, Golden Hour, Blue Hour) am Drehort
- **Wetter** für den Drehtag
- **Erinnerungen:** am Vorabend (Akkus laden, Karten formatieren, packen) und nach dem Dreh (Backup machen, Rohdaten sichern)

**Ziel:** Kein vergessenes Equipment mehr, keine leeren Akkus, kein verlorenes Footage. Erst für Fabian selbst, später ggf. als Produkt für andere Creator.

---

## 2. Harte Vorgaben (nicht verhandelbar)

- **Kein Build-Step.** Reines HTML/CSS/JavaScript mit nativen ES-Modules. Kein React, kein Bundler.
- **Kein eigener Server, keine Accounts.** Daten lokal im Browser (IndexedDB). Export/Import als JSON für Backup und Gerätewechsel.
- **Deployment:** Cloudflare Pages (statisch).
- **PWA:** installierbar auf dem Homescreen (iPhone + Android), offline nutzbar (Service Worker). Am Drehort gibt es oft kein Netz.
- **Externe APIs nur ohne API-Key** (siehe Abschnitt 5).
- **Design:** cinematic, minimalistisch, **Dark und Light Mode** (System/Dunkel/Hell in den Settings). Große Touch-Flächen (min. 44–48 px), weil die App am Set mit einer Hand bedient wird.
- **UI-Sprache:** Deutsch. Code, Variablen und Kommentare auf Englisch.

### 2.1 Design-System (umgesetzt in Phase 1, `css/style.css`)

- **Aurora-Glows mit Grain:** dunkle Karten (`.glow-card`) mit drei weichgezeichneten Farbflächen (`.aurora`) von unten + Rauschtextur. Jeder Shoot-Typ hat eine eigene Palette (`SHOOT_TYPES` in `js/ui.js`).
- **Orb:** blauer Inner-Shadow-Glow (`.orb`) für Primär-Buttons, „heute“, aktuelle Phase.
- **Warmer Akzent (Bernstein `--warm`)** für Zeitkritisches und Warnungen (z. B. „Werte prüfen“, später Abfahrtszeit).
- **Pill-Steuerung:** Segmented Controls, Tabs, schwebendes Dock unten (schwarze Pille + blauer Plus-Orb).
- Farben nur über Tokens auf `:root` / `:root[data-theme="light"]`. Das Theme wird per JS auf `data-theme` aufgelöst (`js/theme.js` + Inline-Script in `index.html`).

---

## 3. Dateistruktur

```
shootday/
├── index.html
├── manifest.webmanifest     # Phase 4
├── sw.js                    # Phase 4: Service Worker (Offline-Cache)
├── css/style.css
├── js/
│   ├── main.js              # Routing (Hash-Router), App-Start
│   ├── theme.js             # Dark/Light/System
│   ├── ui.js                # Icons, Konstanten, Datums-Helfer, Sheet, Toast
│   ├── db.js                # IndexedDB-Wrapper (Shoots, Gear, Templates, Settings)
│   ├── views/
│   │   ├── shoots-list.js   # Übersicht kommender/vergangener Drehs
│   │   ├── shoot-edit.js    # Dreh anlegen/bearbeiten
│   │   ├── shoot-day.js     # Drehtag-Ansicht (das Herzstück)
│   │   ├── gear.js          # Equipment-Inventar
│   │   └── settings.js      # Profil, Templates, Export/Import
│   ├── logic/               # Phase 2+
│   │   ├── packlist.js      # Regel-Engine für die Packliste
│   │   ├── power-storage.js # Akku- und Speicherrechner
│   │   ├── sun.js           # Sonnenstand-Berechnung (lokal, offline)
│   │   ├── weather.js       # Open-Meteo-Abfrage + Cache
│   │   ├── geocode.js       # Adresse → Koordinaten
│   │   ├── travel.js        # Abfahrtszeit + Maps-Deeplink
│   │   └── reminders.js     # .ics-Erzeugung mit Alarmen
│   └── data/
│       ├── default-gear.js      # Start-Inventar (editierbar)
│       └── default-templates.js # Shoot-Typ-Vorlagen
├── tests/tests.html         # Browser-basierte Unit-Tests ohne Framework
└── CLAUDE.md
```

---

## 4. Datenmodell (IndexedDB, DB-Name `shootday`)

```js
// Store: shoots
shoot = {
  id, title, client,
  type,            // "wedding" | "commercial" | "musicvideo" | "social" | "portrait" | "event" | "custom"
  date,            // ISO-Datum "YYYY-MM-DD" (lokal)
  callTime,        // "08:30"
  wrapTime,        // "18:00" (früher als callTime = endet nach Mitternacht)
  location: { label, address, lat, lon },
  indoorOutdoor,   // "indoor" | "outdoor" | "mixed"
  mode,            // "photo" | "video" | "hybrid"
  notes,
  checklist: [{ itemId, label, category, checked, auto: true|false }],
  phase,           // "planned" | "packed" | "shooting" | "wrapped" | "backed-up"
  backup: { done: false, doneAt: null, copies: 0 },
  createdAt, updatedAt
}

// Store: gear
gearItem = {
  id, name, category,   // "camera" | "lens" | "audio" | "light" | "power" | "storage" | "grip" | "misc"
  batteryRuntimeMin,    // nur Akkus
  bitrateMbps,          // nur Kameras
  capacityGB,           // nur Karten/Speicher
  quantity,
  tags,                 // z. B. ["rain", "night", "wind", "cold", "sun"]
  needsCheck            // true = Platzhalterwert, User soll prüfen
}

// Store: templates (Shoot-Typ → Basis-Packliste, recordShare, extras)
// Store: settings ({ key, value }; Defaults in db.js DEFAULT_SETTINGS)
```

**Wichtig:** Keine Herstellerwerte (Laufzeiten, Bitraten) hartcodieren. Alle Zahlen kommen aus dem Geräteprofil und sind editierbar. Die Default-Werte im Start-Inventar sind als „bitte prüfen“ markiert (`needsCheck`).

---

## 5. Externe Dienste (alle ohne API-Key)

| Zweck | Dienst | Hinweis |
|---|---|---|
| Wetter | Open-Meteo Forecast API | stündlich: Temperatur, Niederschlagswahrscheinlichkeit, Wind, Bewölkung. Bis 16 Tage im Voraus. |
| Geocoding | Open-Meteo Geocoding API, Fallback Nominatim | Nominatim: Nutzungsrichtlinie beachten (max. 1 Request/s, sinnvoller Referer) |
| Anfahrt | Google-Maps-Deeplink (`https://www.google.com/maps/dir/?api=1&destination=lat,lon`) | keine Fahrzeit-API. Fahrzeit trägt der User ein, die App rechnet die Abfahrtszeit. |
| Sonnenstand | **lokal berechnet** (NOAA-Algorithmus bzw. SunCalc-Logik als eigenes Modul) | muss offline funktionieren |

Alle API-Antworten in IndexedDB cachen, damit die Drehtag-Ansicht offline den letzten Stand zeigt (mit „Stand: …“-Hinweis).

---

## 6. Kernlogik

### 6.1 Packliste (`packlist.js`)

Regel-Engine, keine KI. Die Liste wird aus Bausteinen zusammengesetzt:

1. **Basis-Template** des Shoot-Typs
2. **Modus:** Foto/Video/Hybrid fügt passende Items hinzu oder entfernt sie
3. **Bedingungs-Regeln**, z. B.:
   - Regenwahrscheinlichkeit ≥ 40 % → Regencover, Handtücher, Gaffer, Schirm
   - Dreh endet nach Sonnenuntergang → Licht-Kit, Ersatzakkus fürs Licht, Stirnlampe
   - outdoor + sonnig → ND-Filter, Sonnenblende, Sonnencreme
   - Wind > 30 km/h → Fell/Windschutz fürs Mikro, Sandsäcke
   - Temperatur < 5 °C → Akkus extra warm halten (Hinweis), Handwärmer
   - Drehdauer > 8 h → Powerbank, Verpflegung
4. **Akku/Karten-Mengen** aus dem Rechner (6.2) als konkrete Zahlen
5. Manuelle Änderungen bleiben bei Neuberechnung erhalten (`auto: false`).

Regeln als deklarative Liste:

```js
{ id: "rain-gear", when: (ctx) => ctx.weather.rainProb >= 40 && ctx.shoot.indoorOutdoor !== "indoor",
  add: ["rain-cover", "towel", "umbrella"], reason: "Regen 40 %+" }
```

In der UI bei jedem automatisch hinzugefügten Item den Grund anzeigen („weil: Regen 55 %“).
Kategorien: Kamera, Objektive, Audio, Licht, Strom, Speicher, Grip, Sonstiges, Persönlich.

### 6.2 Akku- und Speicherrechner (`power-storage.js`)

- **Speicher:** `GB = bitrateMbps × aufnahmeMinuten × 60 / 8 / 1000`, plus 30 % Puffer → Anzahl Karten anhand der Kapazitäten im Inventar
- **Akkus:** `aufnahmeMinuten / batteryRuntimeMin`, aufrunden, plus 1 Reserve, bei Kälte plus 1 weitere
- Ausgabe: „Du brauchst ca. 180 GB → 3× 64-GB-Karten. Akkus: 5 (inkl. Reserve).“
- Warnung, wenn das Inventar nicht reicht

### 6.3 Sonnenstand (`sun.js`)

Sonnenaufgang/-untergang, Golden Hour (ca. −4° bis +6°), Blue Hour (ca. −4° bis −6°), Höchststand, Azimut zur Call-Time, Tageslicht-Zeitleiste mit Call/Wrap.

### 6.4 Anfahrt (`travel.js`)

Startadresse aus Settings (pro Dreh änderbar), Fahrzeit manuell + Puffer (Default 20 %, min. 15 min) + Aufbauzeit (Default 30 min) → **„Abfahrt spätestens 06:55“**, Button „Route öffnen“.

### 6.5 Erinnerungen (`reminders.js`)

Keine Web-Push als Hauptweg. Stattdessen **.ics mit VALARM**, drei Einträge pro Dreh: Vorabend-Check (Default 19:00), der Dreh selbst (Alarm zur Abfahrt), Backup-Reminder (Default 2 h nach Wrap). RFC 5545 (CRLF, Faltung 75 Zeichen, TZID Europe/Berlin oder UTC, stabile UIDs, DTSTAMP, steigende SEQUENCE bei Updates).

### 6.6 Backup-Flow nach dem Dreh

Checkliste ab Phase „wrapped“: Karten ausgelesen, Kopie 1, Kopie 2, Kopie 3 optional, erst danach formatieren. Rotes Badge in der Übersicht bis alles abgehakt ist. (Phase 1: Status „Gesichert“ setzt `backup.done` provisorisch.)

---

## 7. Views

- **Übersicht:** Wochenleiste, nächster Dreh groß (Countdown, später Wetter + Abfahrt), „Backup offen“, „Demnächst“, Archiv.
- **Dreh anlegen:** Pflicht: Titel, Datum, Call, Wrap, Ort, Typ (Typ hat Default). Danach direkt Drehtag-Ansicht.
- **Drehtag-Ansicht:** Abfahrt + Route, Wetter-Streifen, Sonnen-Zeitleiste, Akku/Speicher, Packliste mit Fortschritt, .ics-Button, Backup-Checkliste.
- **Gear:** Inventar nach Kategorien, Mengen-Stepper, Profilwerte.
- **Settings:** Name, Theme, Startadresse, Puffer, Erinnerungszeiten, Templates, JSON-Export/-Import.

---

## 8. Phasenplan

- **Phase 1 – Fundament** ✅ IndexedDB, Hash-Router, Layout, Dark/Light-Design, Drehs CRUD, Übersicht, Gear mit Defaults.
- **Phase 2 – Autopilot-Logik** ✅ Packliste, Akku/Speicher, Sonne, Geocoding + Wetter mit Cache, Anfahrt, Drehtag-Ansicht komplett. Abnahme: „Hochzeit, Bonn, Samstag 10–22 Uhr, outdoor“ liefert sinnvolle Liste inkl. Licht und korrekte Sonnenzeiten.
- **Phase 3 – Erinnerungen & Backup:** .ics, Backup-Checkliste + Badges, In-App-Banner.
- **Phase 4 – PWA & Offline:** Manifest, Icons, Service Worker, iPhone-Homescreen-Hinweis, JSON-Export/-Import.
- **Phase 5 – Nice to have (nach Rücksprache):** mehrtägige Drehs, Crew-Read-only-Link, Spotfinder-Integration, Notion-Export.

---

### Umsetzungsnotizen Phase 2
- `logic/autopilot.js` bündelt alles (reine Funktion) – die Drehtag-Ansicht ruft nur `computeAutopilot()`.
- Sonne: Meeus/NOAA-Koordinaten + Bisektion (nicht SunCalc – SunCalc weicht um die Tagundnachtgleiche >2 min ab).
- Geocoding: Straßenadressen → Nominatim zuerst (Open-Meteo kann nur Ortsnamen), Fallback Ortsname aus PLZ-Zeile.
- Speicher: Bodies = Kameras in der Packliste (vom User entfernte zählen nicht), Video über Bitrate, Foto über Settings `photoGBPerHour` (Schätzwert). Backup-SSD (Tag `backup`) zählt nicht als Karte.
- Akkus: Profil mit Tag `camera`; Bodies × ceil(Aufnahme/Laufzeit) + 1 Reserve (+1 bei < 5 °C).
- Entfernte Auto-Items landen in `shoot.excluded`, manuelle Items haben `auto: false`.

## 9. Tests (`tests/tests.html`)

Laufen im Browser, Ergebnis als grün/rot-Liste und in `window.__testResults`. Zeitumstellungs-Tests brauchen Gerätezeitzone Europe/Berlin (sonst übersprungen). Sonnen-Referenz = NOAA-Spreadsheet-Formeln im Test (unabhängiger Rechenweg) + Almanach-Plausibilität ±5 min. Tests nutzen eine eigene DB (`useDatabase`). Ab Phase 2 Pflicht: Sonnenzeiten Bonn 21.06./21.12. (±2 min), Speicher-, Akkurechner, Regel-Engine, manuelle Items, Abfahrtszeit über Mitternacht, .ics-Format, Zeitumstellung.

---

## 10. Regeln & Grenzen

- Wetter immer mit „Stand: <Zeit>“, ab 3 Tagen vorher Hinweis „noch unsicher“.
- Keine Fahrzeit-API (bewusst). Fahrzeit ist User-Eingabe.
- Keine Kundendaten außer Name/Titel. Alles bleibt lokal.
- Wenn eine Entscheidung nicht im Briefing steht: lieber fragen als raten.

## 11. Arbeitsweise

- Kleine, saubere Commits pro Feature.
- Vor jeder Phase Plan nennen, danach Tests laufen lassen.
- Lokal testen: im Repo-Root `python3 -m http.server 8080`, dann `http://localhost:8080/shootday/` bzw. `/shootday/tests/tests.html`.
