# CLAUDE.md – Footage-to-Invoice-Tracker (Fabian Visuals)

> Briefing für Claude Code. Lies diese Datei komplett, bevor du Code schreibst.
> Arbeite die Phasen der Reihe nach ab. Nach jeder Phase: kurz zusammenfassen, was steht, und auf mein OK warten.

> **Ort im Repo:** Die App liegt im Unterordner `tracker/` der Website und wird über Cloudflare Pages unter `/tracker/` ausgeliefert. Alle Pfade in der App sind relativ.
> **Look:** Moodboard = dunkle App-UIs mit Glow-Verläufen von unten (gestapelte Inner Shadows), Pill-Buttons, schwebende Dock-Navigation, gebogener Auswahl-Picker (Arc). Akzent Bernstein (#FFB923 → #F66515), weitere Akzente (Electric Blue, Lavender) in den Einstellungen umschaltbar.

---

## 1. Was wir bauen

Eine Web-App (PWA), mit der ich pro Projekt meine echte Arbeitszeit tracke, aufgeteilt nach Phasen (Dreh, Schnitt, Revisionen usw.), und sie mit meiner Kalkulation vergleiche.

Am Ende eines Projekts sehe ich:

- **Kalkuliert vs. real:** „Kalkuliert 12 h, real 19 h (+58 %)“
- **Echter Stundensatz:** (Honorar − Projektkosten) ÷ reale Stunden
- **Wo die Zeit hingeht:** welche Phase aus dem Ruder läuft (meist Schnitt und Revisionen)
- **Welche Kunden sich lohnen:** Ranking nach echtem Stundensatz
- **Bessere Angebote:** „Musikvideos dauern bei dir im Schnitt 40 % länger als kalkuliert“ → Kalkulationsvorschlag für das nächste Angebot

**Was die App NICHT ist:** kein Rechnungsprogramm und keine Buchhaltung. Rechnungen schreibe ich weiter in meinem bestehenden System (Notion). Die App liefert die Zahlen und einen exportierbaren Leistungsnachweis.

---

## 2. Harte Vorgaben (nicht verhandelbar)

- **Kein Build-Step.** Reines HTML/CSS/JavaScript mit nativen ES-Modules. Kein React, kein Bundler.
- **Kein eigener Server, keine Accounts.** Daten lokal im Browser (IndexedDB). JSON-Export/-Import für Backup und Gerätewechsel.
- **Deployment:** Cloudflare Pages (statisch).
- **PWA:** installierbar (Handy für den Dreh, Desktop für den Schnitt), offline nutzbar.
- **Steuerlicher Kontext:** Ich bin Kleinunternehmer nach §19 UStG. Alle Beträge sind Endbeträge ohne Umsatzsteuer. Als Einstellung umschaltbar machen (falls sich das ändert), Default: Kleinunternehmer, keine USt-Felder anzeigen.
- **Design:** dunkel, cinematic, minimalistisch. Anthrazit/Schwarz, ein warmer Akzent (Bernstein/Orange). Der laufende Timer ist immer sichtbar und mit einem Tipp stoppbar.
- **UI-Sprache:** Deutsch. Code, Variablen und Kommentare auf Englisch.
- **Charts:** als eigenes Inline-SVG (bevorzugt) oder Chart.js als UMD-Script über CDN mit fester Version. Kein Build.

---

## 3. Dateistruktur

```
tracker/
├── index.html
├── manifest.webmanifest
├── sw.js
├── css/
│   └── style.css
├── js/
│   ├── main.js              # Hash-Router, App-Start, globaler Timer-Balken
│   ├── db.js                # IndexedDB-Wrapper
│   ├── config.js            # Default-Phasen, Projekttypen, Status, Settings-Defaults
│   ├── format.js            # Geld (Cent), Dauer, Datum – reine Funktionen
│   ├── icons.js             # Inline-SVG-Icons
│   ├── ui.js                # Sheets, Dialoge, Toasts
│   ├── phase-picker.js      # Gebogener Phasen-Wähler (Arc)
│   ├── views/
│   │   ├── projects-list.js # Übersicht aktiver/abgeschlossener Projekte
│   │   ├── project-edit.js  # Projekt anlegen + Kalkulation
│   │   ├── project-detail.js# Timer, Einträge, Soll/Ist, Auswertung
│   │   ├── entry-sheet.js   # Eintrag nachtragen/bearbeiten
│   │   ├── clients.js       # Kunden + Kunden-Ranking
│   │   ├── insights.js      # Dashboard über alle Projekte
│   │   └── settings.js      # Ziel-Stundensatz, Phasen, Export/Import
│   ├── logic/
│   │   ├── timer.js         # Timer-Logik (robust gegen Reload/Schließen)
│   │   ├── calc.js          # Stundensatz, Abweichungen, Kennzahlen
│   │   ├── insights.js      # Auswertungen + Kalkulationsvorschläge
│   │   ├── report.js        # Leistungsnachweis (druckbares HTML → PDF über Browser)
│   │   └── export.js        # CSV/JSON-Export
│   └── charts/
│       └── svg-charts.js    # Balken, Soll/Ist, Ranking
├── tests/
│   ├── tests.html
│   └── tests.js
└── CLAUDE.md
```

---

## 4. Datenmodell (IndexedDB)

```js
// Store: clients
client = { id, name, notes, archived }

// Store: projects
project = {
  id, clientId, title,
  type,            // "wedding" | "commercial" | "musicvideo" | "social" | "portrait" | "event" | "retainer" | "custom"
  status,          // "offer" | "active" | "delivered" | "paid" | "archived"
  fee,             // vereinbartes Honorar in Cent (Endbetrag)
  feeType,         // "fixed" | "hourly" | "daily"
  hourlyRate,      // Cent, nur bei feeType "hourly"
  dailyRate, days, // Cent / Anzahl, nur bei feeType "daily" (fee = dailyRate × days)
  includedRevisions, // im Angebot enthaltene Korrekturschleifen, z. B. 2
  estimate: {      // Kalkulation in Stunden pro Phase
    prep, travel, shoot, backup, edit, color, sound, revisions, communication, admin
  },
  costs: [{ id, label, amount, category }], // Fremdkosten: Assistent, Miete, Musiklizenz, Fahrtkosten …
  startDate, deliveryDate,
  notes
}

// Store: entries (Zeiteinträge)
entry = {
  id, projectId,
  phase,           // eine der Phasen oben
  start,           // ISO-Timestamp
  end,             // ISO-Timestamp oder null (läuft)
  revisionRound,   // nur bei phase "revisions": 1, 2, 3 …
  note,
  manual: true|false  // nachgetragen statt getimt
}

// Store: kv  (key "settings")
settings = {
  targetHourlyRate,   // Cent, mein Ziel-Stundensatz, z. B. für die Ampel
  minHourlyRate,      // Cent, Schmerzgrenze
  phases,             // Liste der Phasen inkl. Labels/Reihenfolge, erweiterbar
  smallBusiness: true,// §19 UStG
  roundingMinutes,    // Rundung für den Leistungsnachweis (0 = keine), Default 15
  timerWarnHours,     // Vergessen-Schutz, Default 10
  accent              // "amber" | "blue" | "lavender"
}
```

**Phasen (Default, in Settings anpassbar):**
Vorbereitung, Anfahrt, Dreh, Datensicherung, Schnitt, Color Grading, Sound, Revisionen, Kommunikation, Admin.

Kommunikation und Admin bewusst mittracken: Das ist die unsichtbare Zeit, die in Kalkulationen fast immer fehlt.

---

## 5. Kernlogik

### 5.1 Timer (`timer.js`)

- Es läuft immer **maximal ein Timer** gleichzeitig. Starten eines neuen stoppt den alten automatisch.
- Gespeichert wird nur der **Start-Timestamp** in IndexedDB, nicht ein hochzählender Wert. Dadurch läuft der Timer korrekt weiter, auch wenn der Tab geschlossen, das Handy gesperrt oder die App neu geladen wird.
- Globaler Timer-Balken oben in jeder Ansicht: Projekt, Phase, laufende Zeit, Stopp-Button, Phase-wechseln-Button.
- **Vergessen-Schutz:** Läuft ein Timer länger als 10 h (in Settings änderbar), beim nächsten Öffnen nachfragen: „Timer läuft seit 14 h. Wann hast du aufgehört?“ mit Zeitauswahl.
- **Schnellstart:** Auf der Übersicht pro aktivem Projekt Buttons für die drei zuletzt genutzten Phasen.
- Manuelles Nachtragen von Einträgen (Datum, von–bis oder Dauer, Phase, Notiz). Überschneidungen mit bestehenden Einträgen erkennen und warnen.

### 5.2 Kennzahlen pro Projekt (`calc.js`)

- `realHours` = Summe aller Einträge
- `estimatedHours` = Summe der Kalkulation
- `deviation` = (real − kalkuliert) ÷ kalkuliert, in %
- `deviationByPhase` = dasselbe pro Phase
- `totalCosts` = Summe der Fremdkosten
- `profit` = Honorar − Kosten
- `realHourlyRate` = profit ÷ realHours
- `plannedHourlyRate` = profit ÷ estimatedHours
- `lostRevenue` = (realHours − estimatedHours) × plannedHourlyRate, nur wenn positiv. Anzeige: „Durch Mehraufwand verschenkt: ca. 340 €“
- **Revisionen:** Anzahl Runden vs. `includedRevisions`. Ab Überschreitung Hinweis: „Runde 3 von 2 inklusive. Zusatzaufwand bisher 2,5 h ≈ 190 € Nachtrag möglich.“
- Bei `feeType: "hourly"` ist der Stundensatz fix; dann zeigt die App stattdessen den abrechenbaren Betrag (reale Stunden × Satz, mit Rundung) und den Vergleich zum Angebot.
- Bei `feeType: "daily"`: Tagessatz × Tage als Honorar, ansonsten wie fixed.

**Ampel für den echten Stundensatz:**
- grün: ≥ Ziel-Stundensatz
- gelb: zwischen Schmerzgrenze und Ziel
- rot: unter Schmerzgrenze

### 5.3 Live-Warnungen während des Projekts

- Phase erreicht 80 % der kalkulierten Zeit → gelber Hinweis
- Phase überschreitet 100 % → roter Hinweis + aktueller echter Stundensatz, falls es so weitergeht
- Gesamtprojekt rutscht unter Schmerzgrenze → deutlicher Hinweis in der Übersicht

### 5.4 Insights über alle Projekte (`insights.js`)

Nur abgeschlossene Projekte (Status delivered/paid/archived) einbeziehen, mindestens 3 pro Gruppe, sonst „zu wenig Daten“ anzeigen.

- **Kunden-Ranking:** echter Stundensatz pro Kunde (gewichtet nach Stunden), Anzahl Projekte, Umsatz gesamt, Ø Revisionsrunden
- **Projekttyp-Vergleich:** Ø Abweichung und Ø echter Stundensatz pro Typ
- **Zeitfresser:** welche Phase im Schnitt am stärksten überzieht
- **Kalkulationsfaktor pro Typ und Phase:** z. B. Schnitt bei Musikvideos real Faktor 1,6
- **Kalkulationsvorschlag:** Beim Anlegen eines neuen Projekts kann ich „Vorschlag aus Erfahrungswerten“ tippen. Die App nimmt meine Schätzung und multipliziert pro Phase mit dem gelernten Faktor, plus Hinweis auf das daraus folgende Mindesthonorar für meinen Ziel-Stundensatz: „Für 70 €/h solltest du mindestens 1.540 € ansetzen.“
- **Zeitraum-Filter:** letzte 3/6/12 Monate, Jahr, alles

### 5.5 Leistungsnachweis (`report.js`)

Druckbare HTML-Ansicht pro Projekt (Browser „Als PDF drucken“), im Fabian-Visuals-Look:
- Kunde, Projekt, Zeitraum
- Stunden pro Phase (gerundet laut Settings), optional mit Einzelnachweis
- Bei Stundenabrechnung: Betrag
- Bei §19: Hinweis „Gemäß §19 UStG wird keine Umsatzsteuer berechnet.“
- **Interne Werte wie echter Stundensatz, Kosten, Abweichung erscheinen NIE im Kundenreport.** Klar getrennt halten.

### 5.6 Export (`export.js`)

- CSV pro Projekt und gesamt (Semikolon-getrennt, Komma als Dezimaltrenner, UTF-8 mit BOM, damit Excel/Numbers in Deutschland es direkt richtig öffnen)
- JSON-Komplett-Backup + Import (mit Bestätigung vor dem Überschreiben)
- Spalten so wählen, dass ich sie später in Notion importieren kann

---

## 6. Views

**Übersicht:** laufender Timer groß, darunter aktive Projekte als Karten (Fortschritt real/kalkuliert als Balken, Ampel, Schnellstart-Buttons), dann „zur Abrechnung bereit“ (delivered, nicht paid).

**Projekt anlegen:** Kunde (auswählen oder neu), Titel, Typ, Honorar + Art, inkludierte Revisionen, Kalkulation pro Phase (Stunden, alles optional, Felder mit 0 erlaubt), Button „Vorschlag aus Erfahrungswerten“ (ab Phase 3).

**Projekt-Detail:** oben Kennzahlen (real/kalkuliert, echter Stundensatz mit Ampel, Gewinn), dann Soll/Ist-Balken pro Phase, dann Einträge chronologisch (bearbeitbar), dann Kosten, dann Revisionen-Zähler, dann Report- und Export-Buttons.

**Kunden:** Liste + Ranking.

**Insights:** Dashboard aus 5.4.

**Settings:** Ziel- und Mindest-Stundensatz, Phasen, Rundung, §19-Schalter, Timer-Warnschwelle, Export/Import.

---

## 7. Phasenplan

### Phase 1 – Fundament + Timer
- IndexedDB, Router, Grundlayout, Dark Design
- Kunden und Projekte anlegen/bearbeiten
- Timer (5.1) inkl. globalem Balken, Reload-Festigkeit, manuellen Einträgen
- **Abnahme:** Timer starten, Tab schließen, 5 min später öffnen → Zeit stimmt. Zweiter Timer stoppt den ersten.

### Phase 2 – Kennzahlen
- Kalkulation, Kosten, alle Berechnungen aus 5.2
- Ampel, Live-Warnungen (5.3), Revisionen-Zähler
- Projekt-Detail mit Soll/Ist-Chart
- **Abnahme:** Testprojekt mit bekannten Zahlen liefert exakt die erwarteten Werte

### Phase 3 – Insights
- Kunden-Ranking, Projekttyp-Vergleich, Zeitfresser
- Gelernte Kalkulationsfaktoren + Kalkulationsvorschlag (5.4)
- Seed-Button „Demodaten laden“ (nur in Settings, deutlich markiert), damit Insights direkt testbar sind
- **Abnahme:** Mit Demodaten sind Ranking und Vorschläge plausibel, „zu wenig Daten“ greift korrekt

### Phase 4 – Report, Export, PWA
- Leistungsnachweis (5.5), CSV/JSON (5.6)
- Manifest, Icons, Service Worker, offline nutzbar
- **Abnahme:** Report druckt sauber auf A4, enthält keine internen Zahlen. CSV öffnet in Numbers/Excel korrekt mit Umlauten und Dezimalkomma.

### Phase 5 – Nice to have (erst nach Rücksprache)
- Retainer-Projekte mit Monatsbudget in Stunden („Hair by SK: 6 von 8 h verbraucht“)
- Verknüpfung mit dem Shoot-Day-Autopilot (Drehzeit automatisch als Eintrag)
- Notion-Sync über einen Cloudflare Worker
- Wochenübersicht: Stunden pro Woche, Verhältnis kreative vs. Admin-Zeit

---

## 8. Tests (Pflicht ab Phase 1)

In `tests/tests.html`, Ergebnisse als grün/rot-Liste:

1. **Timer-Dauer:** Start-Timestamp in der Vergangenheit → korrekte Dauer, auch über Mitternacht und Zeitumstellung
2. **Ein Timer:** neuer Start beendet den laufenden Eintrag mit korrektem End-Timestamp
3. **Überschneidung:** manueller Eintrag, der einen bestehenden überlappt, wird erkannt
4. **Echter Stundensatz:** Honorar 1.200 €, Kosten 150 €, 15 h → 70,00 €/h
5. **Abweichung:** kalkuliert 12 h, real 19 h → +58,3 %
6. **Verschenkter Umsatz:** korrekt, und 0 bei Unterschreitung der Kalkulation
7. **Revisionen:** Zusatzaufwand zählt nur Runden über `includedRevisions`
8. **Rundung:** 1 h 7 min bei 15-min-Rundung → 1,25 h (aufrunden auf angefangene Einheit, in Settings änderbar)
9. **Kalkulationsfaktor:** Mittelwert über ≥ 3 Projekte, „zu wenig Daten“ bei weniger
10. **CSV:** BOM vorhanden, Semikolon, Dezimalkomma, Umlaute korrekt
11. **Report:** enthält keine Felder für Kosten, echten Stundensatz oder Abweichung

---

## 9. Regeln & Grenzen

- Geldbeträge intern in **Cent als Integer** rechnen, um Rundungsfehler zu vermeiden. Anzeige im Format `1.234,56 €`.
- Interne Kennzahlen und Kunden-Report strikt trennen (siehe 5.5).
- Die Insights sind nur so gut wie die Disziplin beim Tracken. In der App dezent darauf hinweisen, wenn ein Projekt auffällig wenig Einträge hat (z. B. Projekt geliefert, aber keine Schnitt-Einträge).
- Keine Steuerberechnung, keine Buchhaltung. Wenn eine Funktion in diese Richtung geht: nachfragen.
- Wenn eine Entscheidung nicht in diesem Briefing steht: lieber fragen als raten.

---

## 10. Arbeitsweise für Claude Code

- Kleine, saubere Commits pro Feature
- Vor jeder Phase kurz den Plan nennen, nach jeder Phase Tests laufen lassen und Ergebnis zeigen
- Berechnungen als reine Funktionen in `calc.js`/`insights.js`, damit sie testbar sind
- Lokaler Test über `python3 -m http.server` (im Repo-Root, dann `http://localhost:8000/tracker/`), weil ES-Modules und Service Worker nicht über `file://` laufen
- Tests: `http://localhost:8000/tracker/tests/tests.html`
