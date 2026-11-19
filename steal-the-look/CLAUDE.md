# CLAUDE.md – „Steal the Look“ LUT-Generator (Lumic Cloud)

> Briefing für Claude Code. Lies diese Datei komplett, bevor du Code schreibst.
> Arbeite die Phasen der Reihe nach ab. Nach jeder Phase: kurz zusammenfassen, was steht, und auf mein OK warten.

> **Ort im Repo:** Die App lebt im Unterordner `steal-the-look/` des Website-Repos (wird über Cloudflare Pages unter `/steal-the-look/` ausgeliefert). Alle Pfade unten sind relativ zu diesem Ordner.

---

## 1. Was wir bauen

Eine Web-App, in die man einen Screenshot aus einem Film, Reel oder Musikvideo lädt. Die App analysiert die Farbstimmung und erzeugt daraus einen **3D-LUT (.cube)**, den man in DaVinci Resolve, Final Cut Pro oder Premiere nutzen kann.

**Halbautomatisch:** Die App schlägt den Look automatisch vor, der User kann ihn mit wenigen Reglern feintunen und sieht live eine Vorher/Nachher-Vorschau.

**Business-Ziel:** Lead-Magnet und Funnel für **Lumic Cloud** (LUT-Shop). Kostenloser Basis-Export, Upgrade auf HD-Version/Packs, Empfehlung passender Pro-LUTs aus dem Shop.

**Zielgruppe:** Foto-/Videografen und Content Creator, die einen bestimmten Look nachbauen wollen, ohne tief in Color Grading einzusteigen.

---

## 2. Harte Vorgaben (nicht verhandelbar)

- **Kein Build-Step.** Reines HTML/CSS/JavaScript mit nativen ES-Modules. Kein React, kein Bundler, kein npm für die App selbst.
- **Alles läuft im Browser.** Bilder verlassen das Gerät nicht (Datenschutz + keine Serverkosten). Ausnahme ab Phase 5: ein kleiner Cloudflare Worker nur für Lizenzprüfung.
- **Deployment:** Cloudflare Pages (statisch).
- **Design:** dunkel, cinematic, minimalistisch. Viel Schwarz/Anthrazit, große Vorschau im Zentrum. Mobile-tauglich.
  - **Design-Update (Fabian, Moodboard):** Stil wie die Referenzen – tiefes Schwarz, „Licht von unten“-Cards mit gestapelten Inner Shadows (#144CCD / #6694FF / #FFFFFF / #2365FF), Aurora-Verläufe (Blau → Violett → Pink → Amber → Grün), Glass-Pills, weiße Pill-Buttons, dünne weiße Kurven auf blauem Raster, leuchtende Kapsel-Chips für Werte, feines Grain. Primärakzent Blau-Glow statt Bernstein; Amber bleibt Teil des Aurora-Verlaufs. Die Aurora übernimmt nach der Analyse die Farben des erkannten Looks.
  - Keine externen Fonts (DSGVO) – System-Font-Stack (SF Pro / Inter-Fallback).
- **Sprache der UI:** Deutsch (später EN als Option). Code, Variablen und Kommentare auf Englisch.
- **LUT-Ausgabe:** Standard-`.cube`, getestet mit DaVinci Resolve und Final Cut Pro.

---

## 3. Dateistruktur

```
steal-the-look/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── main.js          # UI-Logik, State, Event-Handling
│   ├── color.js         # Farbraum-Mathe (sRGB, linear, Oklab, V-Log)
│   ├── analyze.js       # Look-Extraktion aus dem Referenzbild
│   ├── look.js          # Look-Parameter → Farbtransformation (pro Pixel)
│   ├── lut.js           # 3D-LUT aus der Transformation generieren
│   ├── preview.js       # WebGL2-Vorschau mit 3D-Textur (+ CPU-Fallback)
│   ├── export.js        # .cube-Datei schreiben und downloaden
│   └── catalog.js       # (Phase 4) Matching gegen Lumic-Cloud-Katalog
├── assets/
│   ├── samples/         # 3–4 neutrale Testframes (Porträt, Landschaft, Street, Nacht)
│   └── catalog.json     # (Phase 4) Look-Parameter der Lumic-Cloud-LUTs
├── tests/
│   └── tests.html       # Browser-basierte Unit-Tests, ohne Framework
└── CLAUDE.md
```

---

## 4. Der Kern: wie aus einem Screenshot ein LUT wird

### 4.1 Farbraum

Arbeite für alle Analysen und Transformationen in **Oklab** (Björn Ottosson). Der Farbraum ist wahrnehmungsgleichmäßig und einfacher als CIELAB. Kette:

`sRGB (gamma) → linear sRGB → Oklab → [Look anwenden] → linear sRGB → sRGB (gamma)`

In `color.js` implementieren:
- `srgbToLinear`, `linearToSrgb` (offizielle sRGB-Transferfunktion)
- `linearSrgbToOklab`, `oklabToLinearSrgb`
- `oklabToOklch`, `oklchToOklab` (für Sättigung und Farbton)
- `vlogToLinear` (Panasonic V-Log, offizielle Formel) für den V-Log-Input-Modus

### 4.2 Referenzbild vorbereiten (`analyze.js`)

1. Bild auf max. 512 px lange Kante runterskalieren (Canvas).
2. **Letterbox-Balken erkennen und ignorieren:** Zeilen/Spalten am Rand, die fast komplett schwarz und gleichförmig sind.
3. Geclippte Pixel (nahe 0 oder 1 in allen Kanälen) aus der Statistik nehmen.
4. Alle Pixel nach Oklab konvertieren.

### 4.3 Look-Parameter extrahieren

Aus dem Referenzbild ein kompaktes Parameter-Objekt ableiten. Das ist das Herzstück und auch die Basis für Phase 4 (Katalog-Matching):

```js
look = {
  // Tonwerte (Helligkeit L in Oklab)
  blackPoint,     // 1. Perzentil von L → wie „milchig“ sind die Schatten
  whitePoint,     // 99. Perzentil von L → wie stark sind die Lichter gedeckelt
  midpoint,       // Median von L → Grundhelligkeit
  contrast,       // aus Interquartilsabstand von L, normiert

  // Split-Toning: mittlere Farbverschiebung pro Helligkeitsbereich
  shadowsTint:    { a, b },   // Pixel mit L < ~0.35 (weiche Gewichtung)
  midsTint:       { a, b },
  highlightsTint: { a, b },   // Pixel mit L > ~0.65

  // Farbe
  saturation,     // Median-Chroma der Referenz relativ zu einem neutralen Richtwert, geclamped 0.4–1.6
}
```

Die Bereiche Schatten/Mitten/Lichter sollen sich weich überlappen (z. B. Smoothstep-Gewichte), damit im LUT keine harten Übergänge entstehen. Für die Tints den **Median** statt dem Mittelwert nehmen (robuster gegen einzelne knallige Bildelemente).

### 4.4 Look anwenden (`look.js`)

Eine reine Funktion `applyLook(rgb, look, controls) → rgb`, die für jede Eingangsfarbe:

1. (optional) Input-Transformation: Rec.709 (Standard) oder V-Log → linear → einfaches Tone-Mapping nach Rec.709
2. nach Oklab konvertiert
3. **Tonkurve** auf L anwendet: Black-/White-Point anheben/absenken, Mitten verschieben, sanfte S-Kurve für Kontrast. Muss **monoton steigend** sein.
4. **Split-Toning** addiert: `a += w_s·shadows.a + w_m·mids.a + w_h·highlights.a` (analog für b), Gewichte abhängig von L
5. **Sättigung** in Oklch skaliert, dabei Hauttöne schützen (Farbton-Bereich ca. 30–70° Oklch-Hue weniger stark verändern)
6. zurück nach sRGB, mit **weicher Gamut-Kompression** statt hartem Clipping

`controls` sind die User-Regler (siehe 4.6). Alles neutral (Intensität 0) muss eine **Identitäts-Transformation** ergeben.

### 4.5 LUT generieren (`lut.js`)

- Gitter mit N³ Punkten (Standard N = 33, HD N = 65), Werte 0…1
- Für jeden Gitterpunkt `applyLook` aufrufen, Ergebnis in `Float32Array` speichern
- Reihenfolge exakt wie im .cube-Standard: **R läuft am schnellsten, dann G, dann B**
- Bei 65³ (274.625 Punkte) in einem Web Worker rechnen, damit die UI nicht einfriert

### 4.6 UI-Regler (halbautomatisch)

Nach der Analyse werden die Regler mit den erkannten Werten vorbelegt:

| Regler | Bereich | Wirkung |
|---|---|---|
| Intensität | 0–150 % | blendet den gesamten Look (Hauptregler) |
| Kontrast | −50 … +50 | Feinjustierung der Tonkurve |
| Sättigung | −50 … +50 | relativ zum erkannten Wert |
| Schatten-Tint | Farbrad klein | überschreibt/verschiebt shadowsTint |
| Lichter-Tint | Farbrad klein | überschreibt/verschiebt highlightsTint |
| Hauttöne schützen | an/aus | siehe 4.4 Schritt 5 |
| Input | Rec.709 / V-Log | Kameraprofil |

Dazu ein Button „Zurücksetzen auf Auto“.

### 4.7 Optionaler Profi-Modus: „Match to my footage“

Der User lädt zusätzlich ein eigenes Frame hoch. Dann wird statt der parametrischen Kurve ein **Histogramm-Matching in Oklab** gemacht (L-Kanal per CDF-Matching, a/b per Mittelwert/Standardabweichung). Die resultierende Kurve wird geglättet (Gauß) und auf Monotonie gezwungen, damit kein Banding entsteht. Erst in Phase 3 bauen.

### 4.8 Umsetzungsnotizen (Stand Phase 1)

- `NEUTRAL` in `look.js` = Statistik eines „typischen ungegradeten“ Frames; alle Look-Parameter wirken als Abweichung davon. Werte sind an echten Fotos vorkalibriert und werden in Phase 2 mit den Sample-Frames feinjustiert.
- Sättigung wird als **relative Chroma C/L** gemessen (Pixel mit L > 0.15), sonst würde jedes Nachtbild als „entsättigt“ gelten.
- Letterbox-Balken zählen nur, wenn sie **symmetrisch** sind (oben≈unten bzw. links≈rechts) – dunkle Szenenbereiche auf nur einer Seite bleiben in der Statistik.
- Intensität skaliert **alle** Deltas (auch User-Regler) → Intensität 0 ist exakt Identität.
- Gamut-Kompression: Chroma wird per Binärsuche bis zur Gamut-Grenze reduziert, L und Farbton bleiben erhalten (keine Farbton-Kipper wie beim Kanal-Clipping).
- `.cube`-TITLE nutzt ASCII-Bindestrich statt Halbgeviertstrich – nicht jede Grading-App liest UTF-8-Titel sauber.

---

## 5. Vorschau (`preview.js`)

- **WebGL2** mit dem LUT als `TEXTURE_3D` (RGB, Float oder 8-bit, `LINEAR`-Filterung = trilineare Interpolation)
- Fragment-Shader: Pixel des Testbilds als Koordinate in die 3D-Textur (Half-Texel-Offset beachten!)
- **Vorher/Nachher-Slider** (vertikale Linie zum Ziehen, Touch-fähig)
- Testbild: eigenes Upload-Frame **oder** eines der Samples aus `assets/samples/`
- Referenzbild klein als Thumbnail daneben, damit man vergleichen kann
- CPU-Fallback, falls WebGL2 fehlt (dann nur auf verkleinertem Bild)
- Regler-Änderungen: LUT in 17³ live neu berechnen (schnell), beim Export in voller Größe

---

## 6. Export (`export.js`)

Format:

```
TITLE "Lumic Look - <Name>"
# Created with Lumic Cloud Steal-the-Look
LUT_3D_SIZE 33
DOMAIN_MIN 0.0 0.0 0.0
DOMAIN_MAX 1.0 1.0 1.0
0.000000 0.000000 0.000000
...
```

- 6 Nachkommastellen, Punkt als Dezimaltrenner, `\n`-Zeilenenden
- Dateiname: `lumic_<lookname>_<size>_<rec709|vlog>.cube`
- Download per Blob + `<a download>`
- Look-Name: Eingabefeld, Default automatisch generiert (z. B. „Teal Dusk 01“). **Keine Film- oder Markennamen vorschlagen** (siehe Abschnitt 9).

---

## 7. Phasenplan

### Phase 1 – Kern ohne UI-Politur
- `color.js`, `analyze.js`, `look.js`, `lut.js`, `export.js`
- Minimal-HTML: Referenz hochladen → Auto-Look → .cube 33³ downloaden
- `tests/tests.html` mit den Tests aus Abschnitt 8
- **Abnahme:** Exportierter LUT lädt fehlerfrei in DaVinci Resolve und Final Cut Pro, Look ist erkennbar ähnlich zur Referenz

### Phase 2 – UI & Vorschau
- WebGL2-Vorschau mit Vorher/Nachher-Slider
- Alle Regler aus 4.6, Sample-Frames, Drag & Drop Upload
- Cinematic Dark Design, mobile Layout
- **Abnahme:** Regler reagieren flüssig (< 50 ms pro Update auf einem normalen Laptop)

### Phase 3 – Pro-Features
- V-Log-Input-Modus
- „Match to my footage“ (4.7)
- 65³-Export im Web Worker
- **Look-Pack:** aus einem Look drei Varianten exportieren (Soft 60 %, Standard 100 %, Strong 130 %) als ZIP (JSZip über CDN erlaubt, eine Datei, kein Build)

### Phase 4 – Lumic-Cloud-Funnel
- `catalog.json`: pro Shop-LUT ein Look-Parameter-Objekt (Format wie 4.3) + Name, Preis, Link, Vorschaubild
- `catalog.js`: Distanzmaß zwischen extrahiertem Look und Katalog-Looks (gewichtete euklidische Distanz der Parameter) → Top 3 anzeigen: „Diese Pro-LUTs kommen deinem Look am nächsten“
- Kleines Script/Seite, mit dem ich für meine eigenen LUTs die Parameter erzeuge (LUT auf neutrales Testbild anwenden → analysieren → JSON ausgeben)
- E-Mail-Feld vor dem Download (optional, nur Weitergabe-Link zu meinem Newsletter-Tool, keine eigene Datenbank)

### Phase 5 – Monetarisierung
- **Free:** 33³, Rec.709, einzelner LUT
- **Pro (Einmalkauf oder Credits):** 65³, V-Log-Version, Look-Packs, Match-Modus
- Zahlung über Lemon Squeezy oder Stripe Payment Links
- Lizenzschlüssel-Prüfung über einen **kleinen Cloudflare Worker** (einzige Server-Komponente). Freischaltung im Browser per Key, kein User-Account-System.
- Vorher mit mir klären, welcher Zahlungsanbieter

---

## 8. Tests (Pflicht ab Phase 1)

In `tests/tests.html`, Ergebnisse als grün/rot-Liste:

1. **Roundtrip:** sRGB → Oklab → sRGB, max. Abweichung < 1e-5
2. **Identität:** Look mit Intensität 0 → LUT ist Identität, max. Fehler < 1/1023
3. **Monotonie:** Tonkurve ist für 1000 Stützpunkte streng steigend
4. **Wertebereich:** alle LUT-Werte liegen in 0…1, keine NaN
5. **Cube-Format:** Header korrekt, genau N³ Datenzeilen, R-schnellste Reihenfolge (Gitterpunkt (1,0,0) steht in Zeile 2)
6. **Letterbox:** Testbild mit schwarzen Balken → Balken werden ignoriert, Statistik entspricht der ohne Balken
7. **V-Log:** bekannte Referenzwerte aus der Panasonic-Formel stimmen

---

## 9. Bekannte Grenzen & Regeln

- **Ein LUT kopiert nur Farbe und Tonwerte.** Licht, Grain, Linsencharakter, Kontrast der Szene selbst kann er nicht nachbauen. In der UI ehrlich kommunizieren (kleiner Info-Hinweis).
- **Screenshots sind komprimiert.** Bei stark komprimierten Bildern Hinweis anzeigen („Für bessere Ergebnisse: Screenshot in hoher Qualität“).
- **Rechtliches:** Die App darf Farbstatistik aus beliebigen Bildern ziehen, aber wir **benennen und vermarkten Looks nicht nach Filmen, Serien oder Marken**. Keine Filmtitel in Auto-Namen, Marketingtexten oder im Katalog.
- **Keine Bilder speichern oder hochladen.** Alles bleibt lokal im Browser.
- Wenn eine Entscheidung nicht in diesem Briefing steht: lieber fragen als raten.

---

## 10. Arbeitsweise für Claude Code

- Kleine, saubere Commits pro Feature
- Vor jeder Phase kurz den Plan nennen, nach jeder Phase Tests laufen lassen und Ergebnis zeigen
- Code lesbar halten, mathematische Funktionen mit kurzem Kommentar zur Formel
- Lokaler Test über einfachen Static-Server (`python3 -m http.server` im Repo-Root, dann `/steal-the-look/` bzw. `/steal-the-look/tests/tests.html` öffnen), weil ES-Modules nicht über `file://` laufen
