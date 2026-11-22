// Kochbuch: Zutaten-Parser + lokale Nährwert-Schätzung (ohne KI, offline).
// Werte pro 100 g: [kcal, Protein, Kohlenhydrate, Fett]. Quelle: gerundete Standardwerte (BLS/USDA-Größenordnung).
// Zusatzfelder: piece = g pro Stück, el = g pro Esslöffel, can = g pro Dose, bunch = g pro Bund, slice = g pro Scheibe, pack = g pro Päckchen.
// Keyword mit "=" davor muss als ganzes Wort vorkommen (verhindert z. B. "ei" in "Reis").
(function (global) {
  const DB = [
    { k: ["spaghetti", "nudeln", "pasta", "penne", "linguine", "rigatoni", "tagliatelle", "fusilli", "makkaroni", "farfalle", "orecchiette", "lasagneplatten"], v: [356, 12.5, 71, 1.5] },
    { k: ["reisnudeln", "glasnudeln"], v: [360, 6, 80, 1] },
    { k: ["mie-nudeln", "mienudeln", "ramen-nudeln", "ramennudeln", "udon"], v: [370, 10, 70, 5] },
    { k: ["=reis", "basmati", "jasminreis", "sushireis", "risottoreis", "arborio", "langkornreis"], v: [350, 7, 78, 0.6] },
    { k: ["quinoa"], v: [368, 14, 64, 6] },
    { k: ["couscous", "bulgur"], v: [360, 12, 72, 1.5] },
    { k: ["haferflocken", "hafer", "oats"], v: [372, 13.5, 59, 7], el: 8 },
    { k: ["mehl", "dinkelmehl", "weizenmehl"], v: [348, 10, 72, 1], el: 10, cup: 125 },
    { k: ["speisestärke", "stärke"], v: [350, 0.5, 86, 0.1], el: 9 },
    { k: ["trockenhefe", "hefe"], v: [325, 40, 41, 7.6], pack: 7, piece: 42 },
    { k: ["backpulver", "natron"], v: [50, 0, 12, 0], pack: 15, el: 10 },
    { k: ["brötchen", "baguette", "=brot", "ciabatta", "toast", "fladenbrot", "pita"], v: [260, 9, 49, 3], piece: 60, slice: 40 },
    { k: ["tortilla", "wraps", "=wrap"], v: [300, 8, 50, 7], piece: 60 },
    { k: ["löffelbiskuit"], v: [390, 8, 80, 4], piece: 6 },
    { k: ["vanillezucker"], v: [400, 0, 100, 0], pack: 8 },
    { k: ["puderzucker", "zucker", "rohrzucker", "kokosblütenzucker"], v: [400, 0, 100, 0], el: 12 },
    { k: ["honig"], v: [304, 0.3, 82, 0], el: 20 },
    { k: ["ahornsirup", "agavendicksaft", "sirup"], v: [260, 0, 67, 0], el: 20 },
    { k: ["rosinen"], v: [299, 3, 79, 0.5] },
    { k: ["schokolade", "zartbitter", "kuvertüre", "schokodrops"], v: [546, 5, 61, 31] },
    { k: ["kakao"], v: [228, 20, 58, 14], el: 7 },
    { k: ["butter"], v: [741, 0.7, 0.6, 83], el: 12 },
    { k: ["olivenöl", "rapsöl", "sesamöl", "sonnenblumenöl", "kokosöl", "erdnussöl", "pflanzenöl", "=öl", "bratöl"], v: [884, 0, 0, 100], el: 12, density: 0.92 },
    { k: ["eigelb", "eidotter"], v: [322, 16, 3.6, 27], piece: 18 },
    { k: ["eiweiß", "eiklar"], v: [48, 11, 0.7, 0.2], piece: 33 },
    { k: ["=ei", "=eier", "=eiern"], v: [143, 12.6, 0.7, 9.5], piece: 60 },
    { k: ["kokosmilch"], v: [197, 2, 3, 20], can: 400 },
    { k: ["milch", "hafermilch", "mandelmilch"], v: [64, 3.4, 4.8, 3.6], cup: 240 },
    { k: ["schlagsahne", "=sahne", "kochsahne"], v: [292, 2.4, 3.2, 30], cup: 200 },
    { k: ["crème fraîche", "creme fraiche", "schmand"], v: [292, 2.4, 2.6, 30], el: 15, cup: 200 },
    { k: ["saure sahne", "sauerrahm"], v: [117, 3, 4, 10], el: 15, cup: 200 },
    { k: ["skyr"], v: [63, 11, 4, 0.2], el: 15, cup: 150 },
    { k: ["magerquark", "quark"], v: [67, 12, 4, 0.3], el: 15, cup: 250 },
    { k: ["griechischer joghurt", "griech. joghurt"], v: [120, 6, 4, 10], el: 15, cup: 150 },
    { k: ["joghurt", "matsoni"], v: [61, 3.5, 4.7, 3.3], el: 15, cup: 150 },
    { k: ["hüttenkäse", "körniger frischkäse"], v: [98, 11, 3.4, 4.3], cup: 200 },
    { k: ["frischkäse"], v: [245, 6, 4, 23], el: 15 },
    { k: ["mascarpone"], v: [435, 4.6, 4, 44], cup: 250 },
    { k: ["mozzarella", "burrata"], v: [254, 18, 1, 19.5], piece: 125 },
    { k: ["parmesan", "pecorino", "grana padano", "parmigiano"], v: [392, 35, 0, 28], el: 6 },
    { k: ["feta", "hirtenkäse", "schafskäse", "imeruli"], v: [264, 14, 4, 21] },
    { k: ["sulguni", "gouda", "emmentaler", "bergkäse", "cheddar", "gruyère", "reibekäse", "=käse"], v: [356, 25, 0, 27] },
    { k: ["proteinpulver", "whey", "eiweißpulver"], v: [380, 75, 8, 6], piece: 30, el: 10 },
    { k: ["hähnchenschenkel", "hähnchenkeulen", "hähnchenoberschenkel", "hühnerschenkel"], v: [177, 18, 0, 11], piece: 200 },
    { k: ["hähnchenbrust", "hähnchenfilet", "hühnerbrust", "putenbrust", "putenfilet", "hähnchen", "huhn", "=pute"], v: [110, 23, 0, 1.5], piece: 150 },
    { k: ["rinderhack", "hackfleisch", "=hack", "gemischtes hack"], v: [250, 18, 0, 20] },
    { k: ["rindfleisch", "rinderfilet", "=steak", "rumpsteak", "=rind", "gulasch"], v: [180, 21, 0, 10], piece: 200 },
    { k: ["guanciale", "pancetta", "=speck", "bacon", "frühstücksspeck"], v: [450, 15, 0, 43], slice: 10 },
    { k: ["lachs"], v: [208, 20, 0, 13], piece: 125 },
    { k: ["garnelen", "shrimps", "crevetten", "scampi"], v: [85, 19, 0, 1], piece: 15 },
    { k: ["thunfisch"], v: [116, 26, 0, 1], can: 150 },
    { k: ["kabeljau", "seelachs", "dorsch", "weißfisch", "fischfilet"], v: [82, 18, 0, 0.7], piece: 150 },
    { k: ["tofu"], v: [120, 13, 1.5, 7], piece: 200 },
    { k: ["kichererbsen"], v: [120, 7, 16, 2.5], can: 240 },
    { k: ["kidneybohnen", "rote bohnen", "weiße bohnen", "schwarze bohnen", "cannellini", "=bohnen"], v: [110, 8, 15, 0.5], can: 250 },
    { k: ["edamame"], v: [121, 12, 9, 5] },
    { k: ["linsen", "rote linsen", "berglinsen"], v: [340, 24, 50, 1.5] },
    { k: ["erbsen"], v: [81, 5, 14, 0.4], can: 280 },
    { k: ["=mais", "maiskörner"], v: [86, 3.3, 19, 1.4], can: 140 },
    { k: ["tomatenmark"], v: [82, 4.3, 15, 0.5], el: 16 },
    { k: ["passierte tomaten", "passata", "stückige tomaten", "gehackte tomaten", "dosentomaten", "pizzatomaten", "geschälte tomaten"], v: [24, 1.2, 4, 0.2], can: 400 },
    { k: ["kirschtomaten", "cherrytomaten", "tomaten", "tomate", "rispentomaten"], v: [18, 0.9, 3.9, 0.2], piece: 120 },
    { k: ["frühlingszwiebel", "lauchzwiebel"], v: [32, 1.8, 7, 0.2], piece: 15 },
    { k: ["zwiebel", "schalotte"], v: [40, 1.1, 9, 0.1], piece: 100 },
    { k: ["knoblauch"], v: [149, 6.4, 33, 0.5], piece: 4, clove: 4 },
    { k: ["paprikaschote", "=paprika", "spitzpaprika"], v: [31, 1, 6, 0.3], piece: 160 },
    { k: ["zucchini"], v: [17, 1.2, 3, 0.3], piece: 250 },
    { k: ["aubergine"], v: [25, 1, 6, 0.2], piece: 300 },
    { k: ["karotte", "möhre", "karotten", "möhren"], v: [41, 0.9, 10, 0.2], piece: 80 },
    { k: ["brokkoli", "broccoli"], v: [34, 2.8, 7, 0.4], piece: 400, head: 400 },
    { k: ["blumenkohl"], v: [25, 1.9, 5, 0.3], piece: 700, head: 700 },
    { k: ["pak choi", "pak-choi", "mangold"], v: [13, 1.5, 2, 0.2], piece: 150 },
    { k: ["spinat", "blattspinat", "babyspinat"], v: [23, 2.9, 3.6, 0.4] },
    { k: ["salat", "rucola", "feldsalat", "eisbergsalat", "romanasalat"], v: [15, 1.4, 2.5, 0.2], head: 300, piece: 300 },
    { k: ["süßkartoffel"], v: [86, 1.6, 20, 0.1], piece: 250 },
    { k: ["kartoffel"], v: [77, 2, 17, 0.1], piece: 150 },
    { k: ["gurke", "salatgurke", "minigurke"], v: [15, 0.7, 3.6, 0.1], piece: 400 },
    { k: ["avocado"], v: [160, 2, 9, 15], piece: 150 },
    { k: ["champignons", "pilze", "shiitake", "egerlinge", "kräuterseitlinge"], v: [22, 3, 3.3, 0.3] },
    { k: ["kimchi"], v: [15, 1.1, 2.4, 0.5] },
    { k: ["banane"], v: [89, 1.1, 23, 0.3], piece: 120 },
    { k: ["=apfel", "äpfel"], v: [52, 0.3, 14, 0.2], piece: 150 },
    { k: ["heidelbeeren", "blaubeeren", "himbeeren", "erdbeeren", "beeren", "brombeeren"], v: [45, 0.8, 10, 0.4], cup: 150 },
    { k: ["granatapfel"], v: [83, 1.7, 19, 1.2], piece: 150 },
    { k: ["zitronensaft", "limettensaft"], v: [25, 0.4, 8, 0.2], el: 15 },
    { k: ["zitrone", "limette"], v: [29, 1.1, 9, 0.3], piece: 60 },
    { k: ["ingwer"], v: [80, 1.8, 18, 0.8], piece: 15 },
    { k: ["chilischote", "=chili", "=chilis", "peperoncino", "jalapeño"], v: [40, 2, 9, 0.4], piece: 10 },
    { k: ["sojasauce", "sojasoße", "tamari", "shoyu"], v: [53, 8, 5, 0.6], el: 16 },
    { k: ["fischsauce", "fischsoße"], v: [35, 5, 4, 0], el: 18 },
    { k: ["austernsauce", "austernsoße"], v: [51, 1.4, 11, 0.3], el: 18 },
    { k: ["sriracha", "sambal"], v: [93, 2, 19, 1], el: 15 },
    { k: ["mirin"], v: [230, 0.3, 43, 0], el: 18 },
    { k: ["balsamico"], v: [88, 0.5, 17, 0], el: 15 },
    { k: ["essig", "reisessig", "weißweinessig", "apfelessig", "rotweinessig"], v: [20, 0, 0.5, 0], el: 15 },
    { k: ["senf", "dijonsenf"], v: [66, 4.4, 5.8, 3.3], el: 15 },
    { k: ["erdnussbutter", "erdnussmus", "mandelmus"], v: [588, 25, 20, 50], el: 16 },
    { k: ["tahini", "sesampaste"], v: [595, 17, 21, 54], el: 15 },
    { k: ["walnüsse", "walnuss", "walnusskerne"], v: [654, 15, 14, 65], el: 8 },
    { k: ["mandeln", "haselnüsse", "cashews", "cashewkerne", "erdnüsse", "pinienkerne", "=nüsse", "pistazien"], v: [600, 20, 18, 52], el: 9 },
    { k: ["chiasamen", "leinsamen", "hanfsamen"], v: [486, 17, 42, 31], el: 12 },
    { k: ["sesam"], v: [573, 18, 23, 50], el: 9 },
    { k: ["weißwein", "rotwein", "=wein"], v: [82, 0.1, 2.6, 0] },
    { k: ["gemüsebrühe", "hühnerbrühe", "rinderbrühe", "=brühe", "=fond", "=fonds"], v: [5, 0.3, 0.5, 0.2], cup: 240 },
    { k: ["espresso", "kaffee"], v: [2, 0.1, 0, 0] },
    { k: ["=wasser", "eiswasser"], v: [0, 0, 0, 0] }
  ];
  // Gewürze & Kräuter: zählen als erkannt, aber ~0 kcal.
  const FREE = ["salz", "pfeffer", "paprikapulver", "kreuzkümmel", "cumin", "zimt", "oregano", "basilikum", "thai-basilikum", "petersilie", "koriander", "dill", "minze", "schnittlauch", "thymian", "rosmarin", "salbei", "lorbeer", "chiliflocken", "chilipulver", "cayenne", "kurkuma", "khmeli", "suneli", "utskho", "bockshornklee", "garam masala", "currypulver", "curry", "muskat", "nelken", "kardamom", "sternanis", "vanille", "piment", "majoran", "estragon", "kräuter", "fenchelsamen", "senfsaat", "zatar", "sumach", "ras el hanout", "fünf-gewürze", "backpapier", "eiswürfel"];

  const UNITS = [
    [/^(kg|kilo|kilogramm)$/, "kg"], [/^(g|gr|gramm)$/, "g"], [/^(mg)$/, "mg"],
    [/^(l|liter)$/, "l"], [/^(ml|milliliter)$/, "ml"], [/^(cl)$/, "cl"], [/^(dl)$/, "dl"],
    [/^(el|essl|esslöffel|tbsp|tablespoons?)$/, "EL"], [/^(tl|teel|teelöffel|tsp|teaspoons?)$/, "TL"],
    [/^(prise|prisen|pinch)$/, "Prise"], [/^(msp|messerspitze|messerspitzen)$/, "Msp"],
    [/^(stk|stück|st)$/, "Stk"], [/^(dose|dosen|can|cans)$/, "Dose"], [/^(bund|bd|bunch)$/, "Bund"],
    [/^(zehe|zehen|cloves?)$/, "Zehe"], [/^(becher)$/, "Becher"], [/^(tasse|tassen|cups?)$/, "Tasse"],
    [/^(scheibe|scheiben|slices?)$/, "Scheibe"], [/^(pck|päckchen|packung|packungen|pkg|pack)$/, "Pck"],
    [/^(handvoll)$/, "Handvoll"], [/^(glas|gläser)$/, "Glas"], [/^(kopf|köpfe)$/, "Kopf"],
    [/^(zweig|zweige|stiel|stiele|blatt|blätter|stängel)$/, "Zweig"], [/^(oz|unzen?)$/, "oz"], [/^(lb|lbs|pfund)$/, "lb"],
    [/^(filet|filets)$/, "Stk"], [/^(knolle|knollen)$/, "Stk"]
  ];
  const FRAC = { "½": 0.5, "¼": 0.25, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3, "⅛": 0.125 };

  function num(s) {
    s = String(s).trim();
    if (FRAC[s] != null) return FRAC[s];
    let m = s.match(/^(\d+)\s*([½¼¾⅓⅔⅛])$/); if (m) return +m[1] + FRAC[m[2]];
    m = s.match(/^(\d+)\s+(\d+)\/(\d+)$/); if (m) return +m[1] + m[2] / m[3];
    m = s.match(/^(\d+)\/(\d+)$/); if (m) return m[1] / m[2];
    m = s.match(/^(\d+(?:[.,]\d+)?)\s*[-–]\s*(\d+(?:[.,]\d+)?)$/); if (m) return (parseFloat(m[1].replace(",", ".")) + parseFloat(m[2].replace(",", "."))) / 2;
    const f = parseFloat(s.replace(",", "."));
    return isNaN(f) ? null : f;
  }

  const AMOUNT_RE = /^\s*(\d+\s+\d+\/\d+|\d+\s*[½¼¾⅓⅔⅛]|\d+\/\d+|[½¼¾⅓⅔⅛]|\d+(?:[.,]\d+)?(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?)\s*/;

  // "200 g Mehl (Type 405)" → { amount: 200, unit: "g", name: "Mehl (Type 405)" }
  function parseLine(line) {
    let s = String(line || "").replace(/^[\s•\-*–·▢☐□✓]+/, "").replace(/\s+/g, " ").trim();
    if (!s) return null;
    let amount = null, unit = "";
    const m = s.match(AMOUNT_RE);
    if (m) {
      amount = num(m[1]);
      s = s.slice(m[0].length);
      const w = s.match(/^([A-Za-zÄÖÜäöüß]+)\.?(\s+|$)/);
      if (w) {
        const hit = UNITS.find(([re]) => re.test(w[1].toLowerCase()));
        if (hit) { unit = hit[1]; s = s.slice(w[0].length); }
      }
    } else {
      // "Saft von 1 Zitrone", "Abrieb von ½ Limette"
      const v = s.match(/\bvon\s+(\d+(?:[.,]\d+)?|[½¼¾⅓⅔])\s/i);
      if (v) amount = num(v[1]);
    }
    return { amount, unit, name: s.trim() || String(line).trim() };
  }

  function findEntry(name) {
    const n = " " + name.toLowerCase().replace(/[(),;:]/g, " ") + " ";
    let best = null, bestLen = 0;
    for (const e of DB) {
      for (const raw of e.k) {
        const exact = raw[0] === "=";
        const k = exact ? raw.slice(1) : raw;
        let ok;
        if (exact) ok = new RegExp("[^a-zäöüß]" + k.replace(/[-]/g, "\\-") + "[^a-zäöüß]").test(n);
        else ok = n.includes(k);
        if (ok && k.length > bestLen) { best = e; bestLen = k.length; }
      }
    }
    return best;
  }
  function isFree(name) {
    const n = name.toLowerCase();
    return FREE.some(f => n.includes(f));
  }

  function grams(ing, e) {
    const a = ing.amount, u = ing.unit;
    if (a == null) return null;
    const d = e.density || 1;
    switch (u) {
      case "g": return a;
      case "kg": return a * 1000;
      case "mg": return a / 1000;
      case "ml": return a * d;
      case "cl": return a * 10 * d;
      case "dl": return a * 100 * d;
      case "l": return a * 1000 * d;
      case "EL": return a * (e.el || 15);
      case "TL": return a * ((e.el || 15) / 3);
      case "Prise": return a * 0.5;
      case "Msp": return a * 0.3;
      case "Dose": return a * (e.can || 400);
      case "Bund": return a * (e.bunch || 40);
      case "Zehe": return a * (e.clove || 4);
      case "Becher": return a * (e.cup || 200);
      case "Tasse": return a * (e.cup || 200);
      case "Scheibe": return a * (e.slice || 30);
      case "Pck": return a * (e.pack || 200);
      case "Handvoll": return a * 30;
      case "Glas": return a * 350;
      case "Kopf": return a * (e.head || e.piece || 500);
      case "Zweig": return a * 1;
      case "oz": return a * 28.35;
      case "lb": return a * 453.6;
      case "Stk": case "":
        return e.piece ? a * e.piece : null;
    }
    return null;
  }

  // Liefert Nährwerte pro Portion + wie viele Zutaten erkannt wurden.
  function estimate(ingredients, servings) {
    const tot = [0, 0, 0, 0];
    let known = 0, counted = 0;
    const unknown = [];
    for (const raw of ingredients || []) {
      const ing = typeof raw === "string" ? parseLine(raw) : raw;
      if (!ing || !ing.name) continue;
      const e = findEntry(ing.name);
      if (!e) {
        if (isFree(ing.name)) continue; // Gewürz: egal
        counted++; unknown.push(ing.name); continue;
      }
      counted++;
      const g = grams(ing, e);
      if (g == null) {
        if (ing.amount == null) { known++; continue; } // "Öl zum Braten" – zählt, ohne Menge
        unknown.push(ing.name); continue;
      }
      known++;
      for (let i = 0; i < 4; i++) tot[i] += e.v[i] * g / 100;
    }
    const s = Math.max(1, +servings || 1);
    return {
      kcal: Math.round(tot[0] / s), protein: Math.round(tot[1] / s),
      carbs: Math.round(tot[2] / s), fat: Math.round(tot[3] / s),
      known, total: counted, unknown, source: "local"
    };
  }

  function fmtAmount(a) {
    if (a == null || a === 0) return "";
    const r = Math.round(a * 100) / 100;
    const whole = Math.floor(r), frac = r - whole;
    const F = [[0.25, "¼"], [0.5, "½"], [0.75, "¾"], [1 / 3, "⅓"], [2 / 3, "⅔"]];
    for (const [v, c] of F) if (Math.abs(frac - v) < 0.03 && r < 10) return (whole ? whole + " " : "") + c;
    if (r >= 100) return String(Math.round(r / 5) * 5);
    if (r >= 10) return String(Math.round(r));
    return String(Math.round(r * 10) / 10).replace(".", ",");
  }

  global.KBNutrition = { parseLine, estimate, findEntry, fmtAmount };
  if (typeof module !== "undefined") module.exports = global.KBNutrition;
})(typeof window !== "undefined" ? window : globalThis);
