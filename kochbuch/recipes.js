// Kochbuch: Startrezepte (eigene Fassungen klassischer Gerichte).
// Nährwerte werden beim ersten Start lokal aus den Zutaten geschätzt.
window.KB_SEED = [
  {
    id: "seed-aglio-olio", title: "Spaghetti Aglio e Olio", emoji: "🍝", cuisine: "italienisch",
    description: "Die Mitternachts-Pasta: Knoblauch, gutes Öl, Chili, fertig.",
    servings: 2, time: 20, difficulty: "leicht", tags: ["savory", "veggie"],
    ingredients: ["200 g Spaghetti", "4 Zehen Knoblauch", "4 EL Olivenöl", "1 Chilischote", "½ Bund Petersilie", "30 g Parmesan", "Salz"],
    steps: [
      "Spaghetti in kräftig gesalzenem Wasser bissfest kochen. Eine Tasse Nudelwasser aufheben.",
      "Knoblauch in feine Scheiben schneiden, Chili fein hacken.",
      "Öl in einer großen Pfanne sanft erhitzen, Knoblauch und Chili darin goldgelb ziehen lassen, nicht braun werden lassen.",
      "Nudeln tropfnass in die Pfanne geben, einen Schuss Nudelwasser dazu und schwenken, bis eine leicht cremige Emulsion entsteht.",
      "Gehackte Petersilie unterheben, mit Parmesan servieren."
    ]
  },
  {
    id: "seed-carbonara", title: "Spaghetti Carbonara", emoji: "🥓", cuisine: "italienisch",
    description: "Original ohne Sahne: Guanciale, Eigelb, Pecorino und viel Pfeffer.",
    servings: 2, time: 25, difficulty: "mittel", tags: ["savory"],
    ingredients: ["200 g Spaghetti", "100 g Guanciale", "3 Eigelb", "1 Ei", "50 g Pecorino", "Pfeffer, frisch gemahlen"],
    steps: [
      "Guanciale in Streifen schneiden und in einer kalten Pfanne langsam knusprig auslassen.",
      "Eigelbe, Ei und fein geriebenen Pecorino mit reichlich Pfeffer zu einer dicken Creme verrühren.",
      "Spaghetti in Salzwasser bissfest kochen, etwas Nudelwasser aufheben.",
      "Pfanne vom Herd nehmen. Nudeln zum Guanciale geben, kurz abkühlen lassen.",
      "Eiercreme mit einem Schuss Nudelwasser unterrühren, bis die Sauce seidig ist. Nicht mehr auf die heiße Platte stellen, sonst stockt das Ei."
    ]
  },
  {
    id: "seed-khachapuri", title: "Khachapuri Adjaruli", emoji: "🧀", cuisine: "georgisch",
    description: "Das georgische Käse-Schiffchen mit Ei und Butter in der Mitte.",
    servings: 2, time: 90, difficulty: "mittel", tags: ["savory", "veggie"],
    ingredients: ["250 g Mehl", "120 ml Milch", "7 g Trockenhefe", "1 TL Zucker", "1 EL Olivenöl", "½ TL Salz", "200 g Sulguni (oder Mozzarella)", "100 g Feta", "2 Eier", "30 g Butter"],
    steps: [
      "Milch lauwarm erwärmen, Hefe und Zucker einrühren, 5 Minuten stehen lassen.",
      "Mit Mehl, Öl und Salz zu einem glatten Teig kneten, abgedeckt 45 Minuten gehen lassen.",
      "Sulguni und Feta grob reiben bzw. zerbröseln und mischen.",
      "Teig halbieren, jeweils oval ausrollen, die Längsseiten einrollen und die Enden zu Spitzen drehen, sodass ein Boot entsteht.",
      "Käse in die Mitte füllen. Bei 230 °C ca. 12 Minuten backen.",
      "Eine Mulde in den Käse drücken, je ein Eigelb hineingeben, 2 Minuten weiterbacken. Mit Butter servieren und am Tisch verrühren."
    ]
  },
  {
    id: "seed-lobio", title: "Lobio", emoji: "🫘", cuisine: "georgisch",
    description: "Würziger Bohneneintopf mit Walnüssen, Koriander und Khmeli Suneli.",
    servings: 4, time: 35, difficulty: "leicht", tags: ["savory", "veggie"],
    ingredients: ["2 Dosen Kidneybohnen", "2 Zwiebeln", "3 Zehen Knoblauch", "60 g Walnüsse", "2 EL Olivenöl", "1 TL Khmeli Suneli", "1 Bund Koriander", "1 EL Weißweinessig", "Salz"],
    steps: [
      "Zwiebeln würfeln und im Öl glasig dünsten.",
      "Bohnen samt etwas Flüssigkeit zugeben und 10 Minuten köcheln lassen. Ein Drittel grob zerdrücken.",
      "Walnüsse mit Knoblauch und einer Prise Salz im Mörser zu einer Paste reiben.",
      "Walnusspaste, Khmeli Suneli und Essig unterrühren, weitere 5 Minuten ziehen lassen.",
      "Mit viel gehacktem Koriander servieren, dazu passt Maisbrot oder Fladenbrot."
    ]
  },
  {
    id: "seed-chkmeruli", title: "Chkmeruli", emoji: "🍗", cuisine: "georgisch",
    description: "Knuspriges Hähnchen in Knoblauch-Sahne-Sauce, direkt aus der Pfanne.",
    servings: 3, time: 50, difficulty: "mittel", tags: ["savory"],
    ingredients: ["600 g Hähnchenschenkel (ohne Knochen)", "6 Zehen Knoblauch", "200 ml Sahne", "100 ml Milch", "20 g Butter", "Salz", "Pfeffer", "½ Bund Koriander"],
    steps: [
      "Hähnchen trocken tupfen, salzen und pfeffern.",
      "Mit der Hautseite nach unten in einer Gusspfanne bei mittlerer Hitze 15 Minuten knusprig braten, wenden und weitere 10 Minuten garen.",
      "Knoblauch fein reiben und mit Sahne, Milch und einer Prise Salz verrühren.",
      "Fett abgießen, Butter in die Pfanne, dann die Knoblauchsahne angießen und 5 Minuten einköcheln lassen.",
      "Mit Koriander bestreuen und direkt in der Pfanne servieren."
    ]
  },
  {
    id: "seed-pkhali", title: "Pkhali mit Spinat", emoji: "🥬", cuisine: "georgisch",
    description: "Kleine Spinat-Walnuss-Bällchen mit Granatapfel, perfekt als Vorspeise.",
    servings: 4, time: 25, difficulty: "leicht", tags: ["savory", "veggie"],
    ingredients: ["500 g Spinat", "80 g Walnüsse", "2 Zehen Knoblauch", "½ Zwiebel", "1 TL Khmeli Suneli", "1 EL Weißweinessig", "50 g Granatapfelkerne", "Salz"],
    steps: [
      "Spinat kurz blanchieren, kalt abschrecken und sehr gut ausdrücken.",
      "Walnüsse, Knoblauch und Zwiebel im Mixer fein zerkleinern.",
      "Spinat dazugeben, mit Gewürz, Essig und Salz zu einer formbaren Masse mixen.",
      "Kleine Bällchen formen, leicht flach drücken und mit Granatapfelkernen garnieren."
    ]
  },
  {
    id: "seed-teriyaki-bowl", title: "Teriyaki-Hähnchen-Bowl", emoji: "🍱", cuisine: "asiatisch",
    description: "Glasiertes Hähnchen, Brokkoli und Reis: Meal-Prep-tauglich.",
    servings: 2, time: 25, difficulty: "leicht", tags: ["savory", "fitness"],
    ingredients: ["300 g Hähnchenbrust", "120 g Reis", "250 g Brokkoli", "3 EL Sojasauce", "2 EL Mirin", "1 EL Honig", "1 TL Sesamöl", "1 Stück Ingwer", "1 Frühlingszwiebel", "1 TL Sesam"],
    steps: [
      "Reis nach Packungsanweisung kochen.",
      "Für die Sauce Sojasauce, Mirin, Honig und fein geriebenen Ingwer verrühren.",
      "Hähnchen in Streifen schneiden und im Sesamöl rundum anbraten.",
      "Sauce angießen und unter Rühren einkochen lassen, bis das Fleisch glänzt.",
      "Brokkoli 4 Minuten dämpfen. Alles in Bowls anrichten, mit Frühlingszwiebel und Sesam toppen."
    ]
  },
  {
    id: "seed-kra-pao", title: "Pad Kra Pao", emoji: "🌶️", cuisine: "asiatisch",
    description: "Thailändisches Basilikum-Hähnchen mit Spiegelei: scharf, schnell, süchtig machend.",
    servings: 2, time: 20, difficulty: "leicht", tags: ["savory"],
    ingredients: ["300 g Hähnchenbrust", "120 g Jasminreis", "4 Zehen Knoblauch", "2 Chilischoten", "2 EL Sojasauce", "1 EL Fischsauce", "1 TL Zucker", "1 Handvoll Thai-Basilikum", "1 EL Öl", "2 Eier"],
    steps: [
      "Reis kochen. Hähnchen mit dem Messer grob hacken.",
      "Knoblauch und Chili im Mörser grob zerstoßen.",
      "Wok sehr heiß werden lassen, Öl, Knoblauch und Chili 20 Sekunden anbraten.",
      "Hähnchen zugeben und krümelig braten, mit Sojasauce, Fischsauce und Zucker würzen.",
      "Vom Herd nehmen, Basilikum unterheben. Eier separat als knusprige Spiegeleier braten und obenauf legen."
    ]
  },
  {
    id: "seed-smashed-cucumber", title: "Smashed Cucumber Salad", emoji: "🥒", cuisine: "asiatisch",
    description: "Zerdrückte Gurke mit Knoblauch, Sesam und Chili. 10 Minuten, null Reue.",
    servings: 2, time: 10, difficulty: "leicht", tags: ["savory", "veggie"],
    ingredients: ["1 Salatgurke", "1 Zehe Knoblauch", "1 EL Sojasauce", "1 EL Reisessig", "1 TL Sesamöl", "1 TL Sesam", "1 Prise Zucker", "Chiliflocken"],
    steps: [
      "Gurke mit einer flachen Messerklinge leicht zerdrücken, dann in mundgerechte Stücke brechen.",
      "Mit einer Prise Salz 5 Minuten ziehen lassen und das Wasser abgießen.",
      "Knoblauch reiben, mit Sojasauce, Essig, Sesamöl und Zucker verrühren.",
      "Dressing über die Gurke geben, mit Sesam und Chiliflocken servieren."
    ]
  },
  {
    id: "seed-overnight-oats", title: "Protein Overnight Oats", emoji: "🥣", cuisine: "international",
    description: "Am Abend vorbereitet, morgens 40 g Protein aus dem Kühlschrank.",
    servings: 1, time: 5, difficulty: "leicht", tags: ["sweet", "fitness", "veggie"],
    ingredients: ["50 g Haferflocken", "150 g Skyr", "100 ml Milch", "30 g Proteinpulver (Vanille)", "1 EL Chiasamen", "80 g Heidelbeeren", "1 TL Honig"],
    steps: [
      "Haferflocken, Skyr, Milch, Proteinpulver und Chiasamen in einem Glas verrühren.",
      "Abgedeckt über Nacht in den Kühlschrank stellen.",
      "Morgens umrühren, mit Heidelbeeren und Honig toppen."
    ]
  },
  {
    id: "seed-shakshuka", title: "Shakshuka", emoji: "🍳", cuisine: "orientalisch",
    description: "Pochierte Eier in würziger Paprika-Tomatensauce, direkt aus der Pfanne löffeln.",
    servings: 2, time: 30, difficulty: "leicht", tags: ["savory", "veggie"],
    ingredients: ["1 Dose stückige Tomaten", "1 rote Paprika", "1 Zwiebel", "2 Zehen Knoblauch", "4 Eier", "1 EL Olivenöl", "1 TL Kreuzkümmel", "1 TL Paprikapulver (geräuchert)", "50 g Feta", "Petersilie"],
    steps: [
      "Zwiebel und Paprika würfeln, im Öl 8 Minuten weich dünsten.",
      "Knoblauch und Gewürze kurz mitrösten, dann die Tomaten zugeben und 10 Minuten einkochen.",
      "Vier Mulden in die Sauce drücken, Eier hineinschlagen.",
      "Deckel auflegen und 6 bis 8 Minuten stocken lassen, das Eigelb bleibt flüssig.",
      "Mit Feta und Petersilie bestreuen, mit Brot servieren."
    ]
  },
  {
    id: "seed-zoodles-garnelen", title: "Zucchini-Nudeln mit Garnelen", emoji: "🍤", cuisine: "italienisch",
    description: "Low-Carb-Pasta-Gefühl: Zoodles, Knoblauch-Garnelen, Kirschtomaten.",
    servings: 2, time: 20, difficulty: "leicht", tags: ["savory", "fitness"],
    ingredients: ["2 Zucchini", "250 g Garnelen", "150 g Kirschtomaten", "2 Zehen Knoblauch", "1 EL Olivenöl", "½ Zitrone", "1 Chilischote", "Petersilie", "Salz"],
    steps: [
      "Zucchini mit dem Spiralschneider zu Nudeln drehen, leicht salzen.",
      "Garnelen in Olivenöl 2 Minuten pro Seite braten, Knoblauch und Chili kurz mitbraten.",
      "Kirschtomaten halbieren und 2 Minuten mitschwenken.",
      "Zoodles nur 1 bis 2 Minuten unterheben, damit sie knackig bleiben.",
      "Mit Zitronensaft und Petersilie abschmecken."
    ]
  },
  {
    id: "seed-tiramisu", title: "Tiramisu", emoji: "🍰", cuisine: "italienisch",
    description: "Der Klassiker mit Mascarpone und Espresso, ohne Schnickschnack.",
    servings: 6, time: 30, difficulty: "mittel", tags: ["sweet", "veggie"],
    ingredients: ["250 g Mascarpone", "3 Eier", "70 g Zucker", "200 g Löffelbiskuits", "250 ml Espresso (abgekühlt)", "2 EL Kakao"],
    steps: [
      "Eier trennen. Eigelbe mit Zucker 5 Minuten hell und cremig aufschlagen.",
      "Mascarpone unterrühren. Eiweiß steif schlagen und vorsichtig unterheben.",
      "Löffelbiskuits kurz in den Espresso tauchen und eine Form damit auslegen.",
      "Die Hälfte der Creme darauf verteilen, dann noch eine Lage Biskuits und Creme.",
      "Mindestens 4 Stunden kühlen und vor dem Servieren mit Kakao bestäuben."
    ]
  },
  {
    id: "seed-bananenbrot", title: "Bananenbrot", emoji: "🍌", cuisine: "international",
    description: "Saftig, mit Walnüssen und Zimt. Die Rettung für braune Bananen.",
    servings: 12, time: 70, difficulty: "leicht", tags: ["sweet", "veggie"],
    ingredients: ["3 reife Bananen", "2 Eier", "80 g Butter (geschmolzen)", "60 g Ahornsirup", "220 g Mehl", "1 TL Natron", "1 TL Zimt", "50 g Walnüsse", "1 Prise Salz"],
    steps: [
      "Ofen auf 175 °C vorheizen, Kastenform mit Backpapier auslegen.",
      "Bananen zerdrücken, mit Eiern, Butter und Ahornsirup verrühren.",
      "Mehl, Natron, Zimt und Salz mischen und nur kurz unterheben.",
      "Gehackte Walnüsse unterziehen, Teig in die Form füllen.",
      "55 Minuten backen (Stäbchenprobe), in der Form abkühlen lassen."
    ]
  },
  {
    id: "seed-dal", title: "Rotes Linsen-Dal", emoji: "🍛", cuisine: "indisch",
    description: "Cremig, wärmend, günstig und voller pflanzlichem Protein.",
    servings: 4, time: 35, difficulty: "leicht", tags: ["savory", "veggie"],
    ingredients: ["250 g rote Linsen", "1 Dose Kokosmilch", "1 Dose stückige Tomaten", "1 Zwiebel", "3 Zehen Knoblauch", "1 Stück Ingwer", "1 EL Öl", "2 TL Garam Masala", "1 TL Kurkuma", "500 ml Gemüsebrühe", "1 Limette", "Koriander"],
    steps: [
      "Zwiebel, Knoblauch und Ingwer fein hacken und im Öl anschwitzen.",
      "Gewürze 1 Minute mitrösten, bis es duftet.",
      "Linsen, Tomaten, Kokosmilch und Brühe zugeben, 20 Minuten sanft köcheln, gelegentlich rühren.",
      "Mit Limettensaft und Salz abschmecken und mit Koriander und Reis oder Naan servieren."
    ]
  },
  {
    id: "seed-lachs-bowl", title: "Lachs-Quinoa-Bowl", emoji: "🐟", cuisine: "asiatisch",
    description: "Omega-3, Edamame, Avocado. Bunt, satt und fitnesstauglich.",
    servings: 2, time: 25, difficulty: "leicht", tags: ["savory", "fitness"],
    ingredients: ["250 g Lachs", "120 g Quinoa", "1 Avocado", "½ Salatgurke", "100 g Edamame", "2 EL Sojasauce", "1 TL Sesam", "1 Limette"],
    steps: [
      "Quinoa gründlich waschen und 15 Minuten in der doppelten Menge Wasser garen.",
      "Lachs salzen und auf der Hautseite 5 Minuten kross braten, wenden, 2 Minuten fertig garen.",
      "Avocado und Gurke in Scheiben schneiden, Edamame auftauen.",
      "Alles auf Quinoa anrichten, mit Sojasauce, Limette und Sesam vollenden."
    ]
  },
  {
    id: "seed-fajitas", title: "Hähnchen-Fajita-Wraps", emoji: "🌯", cuisine: "mexikanisch",
    description: "Rauchige Paprika, saftiges Hähnchen, kühler Joghurt-Dip.",
    servings: 2, time: 25, difficulty: "leicht", tags: ["savory", "fitness"],
    ingredients: ["300 g Hähnchenbrust", "2 Paprika", "1 Zwiebel", "4 Tortillas", "1 EL Öl", "1 TL Paprikapulver", "1 TL Kreuzkümmel", "100 g Joghurt", "1 Limette"],
    steps: [
      "Hähnchen, Paprika und Zwiebel in Streifen schneiden.",
      "Hähnchen mit Gewürzen und Öl marinieren und in einer heißen Pfanne scharf anbraten.",
      "Gemüse zugeben und bissfest braten, mit Limettensaft ablöschen.",
      "Tortillas kurz ohne Fett erwärmen, füllen und mit Joghurt servieren."
    ]
  },
  {
    id: "seed-kaiserschmarrn", title: "Kaiserschmarrn", emoji: "🥞", cuisine: "deutsch",
    description: "Fluffig zerrupft, karamellisiert, mit Puderzucker. Hüttengefühl zu Hause.",
    servings: 2, time: 25, difficulty: "mittel", tags: ["sweet", "veggie"],
    ingredients: ["125 g Mehl", "250 ml Milch", "4 Eier", "30 g Zucker", "30 g Butter", "40 g Rosinen", "2 EL Puderzucker", "1 Prise Salz"],
    steps: [
      "Eier trennen. Eigelbe mit Mehl, Milch und Salz glatt rühren.",
      "Eiweiß mit Zucker steif schlagen und locker unter den Teig heben.",
      "Butter in einer großen Pfanne schmelzen, Teig hineingeben, Rosinen darüberstreuen.",
      "Bei mittlerer Hitze stocken lassen, vierteln, wenden und mit zwei Gabeln in Stücke reißen.",
      "Mit etwas Zucker karamellisieren und dick mit Puderzucker bestäuben."
    ]
  }
];
