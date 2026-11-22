// Kochbuch-API (Cloudflare Pages Function) unter /api/kochbuch/*
//   GET  /api/kochbuch/status      → ist KI eingerichtet, stimmt der Zugangscode?
//   POST /api/kochbuch/import      → { mode: "image"|"text"|"url", images?, text?, url? } → Rezept-JSON
//   POST /api/kochbuch/nutrition   → { ingredients: [..], servings } → Nährwerte pro Portion
//
// Umgebungsvariablen (Cloudflare → Pages-Projekt → Settings → Variables and Secrets):
//   ANTHROPIC_API_KEY  – Claude-API-Key (als "Secret" anlegen)
//   KOCHBUCH_CODE      – frei gewählter Zugangscode, den du einmal in der App einträgst
//
// Claude wird per fetch gegen die REST-API aufgerufen: das Projekt hat keinen Build-Schritt
// und keine npm-Abhängigkeiten, daher kein SDK.

const MODEL = "claude-opus-5-5";
const CUISINES = ["italienisch", "georgisch", "asiatisch", "mexikanisch", "orientalisch", "indisch", "griechisch", "französisch", "deutsch", "amerikanisch", "spanisch", "international"];
const TAGS = ["sweet", "savory", "fitness", "veggie"];

const RECIPE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["isRecipe", "title", "emoji", "description", "servings", "time", "difficulty", "cuisine", "tags", "ingredients", "steps", "nutrition", "notes"],
  properties: {
    isRecipe: { type: "boolean", description: "false, wenn im Material kein Rezept/Gericht erkennbar ist" },
    title: { type: "string" },
    emoji: { type: "string", description: "genau ein passendes Food-Emoji" },
    description: { type: "string", description: "ein kurzer, appetitlicher Satz auf Deutsch" },
    servings: { type: "integer" },
    time: { type: "integer", description: "Gesamtzeit in Minuten" },
    difficulty: { type: "string", enum: ["leicht", "mittel", "anspruchsvoll"] },
    cuisine: { type: "string", enum: CUISINES },
    tags: { type: "array", items: { type: "string", enum: TAGS } },
    ingredients: {
      type: "array",
      items: {
        type: "object", additionalProperties: false, required: ["amount", "unit", "name"],
        properties: {
          amount: { type: "number", description: "0 = ohne Mengenangabe / nach Bedarf" },
          unit: { type: "string", description: "g, kg, ml, l, EL, TL, Prise, Stk, Dose, Bund, Zehe, Becher, Pck, Scheibe, Handvoll oder leer" },
          name: { type: "string" }
        }
      }
    },
    steps: { type: "array", items: { type: "string" } },
    nutrition: {
      type: "object", additionalProperties: false, required: ["kcal", "protein", "carbs", "fat"],
      properties: { kcal: { type: "integer" }, protein: { type: "integer" }, carbs: { type: "integer" }, fat: { type: "integer" } }
    },
    notes: { type: "string", description: "Tipps/Varianten aus der Quelle, sonst leer" }
  }
};

const NUTRITION_SCHEMA = {
  type: "object", additionalProperties: false, required: ["kcal", "protein", "carbs", "fat", "note"],
  properties: { kcal: { type: "integer" }, protein: { type: "integer" }, carbs: { type: "integer" }, fat: { type: "integer" }, note: { type: "string" } }
};

const SYSTEM = `Du bist die Rezept-Engine einer deutschsprachigen Kochbuch-App. Du bekommst Material (Screenshots, ein gesprochenes Transkript oder Daten einer Rezept-Webseite) und machst daraus ein sauberes, nachkochbares Rezept.

Regeln:
- Alles auf Deutsch, auch wenn die Quelle eine andere Sprache hat. Gerichtnamen mit Eigennamen (z. B. "Khachapuri", "Pad Kra Pao") bleiben erhalten.
- Metrische Einheiten (g, ml, EL, TL …). Cups/oz/lb umrechnen. Jede Zutat einzeln, Menge als Zahl (½ → 0.5), ohne Menge → amount 0.
- Schritte kurz, klar, in sinnvoller Reihenfolge, ohne Nummerierung im Text. Fehlen Schritte im Material, ergänze die naheliegenden Handgriffe knapp.
- Bei gesprochenen Transkripten: Füllwörter, Abschweifungen und Korrekturen ("ach nee, doch 300 Gramm") sauber auflösen. Erfinde keine Zutaten, die nicht erwähnt oder zwingend nötig sind.
- servings: aus der Quelle, sonst eine realistische Schätzung. time: Gesamtzeit in Minuten inkl. Ruhe-/Backzeit.
- nutrition: realistische Schätzung PRO PORTION auf Basis der Zutatenmengen (kcal, Protein g, Kohlenhydrate g, Fett g). Gibt die Quelle Nährwerte an, übernimm sie.
- tags: "sweet" (Dessert/süß) oder "savory" (herzhaft), zusätzlich "veggie" wenn ohne Fleisch/Fisch, "fitness" wenn proteinreich und eher kalorienbewusst.
- cuisine: die passendste Länderküche, sonst "international".
- Ist im Material kein Gericht erkennbar, setze isRecipe auf false und fülle die übrigen Felder minimal.`;

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});

export async function onRequest(ctx) {
  const { request, env, params } = ctx;
  const route = (params.route || []).join("/");
  const aiReady = !!(env.ANTHROPIC_API_KEY && env.KOCHBUCH_CODE);
  const authed = aiReady && request.headers.get("x-kochbuch-code") === env.KOCHBUCH_CODE;

  try {
    if (route === "status" && request.method === "GET") {
      return json({ ai: aiReady, authorized: authed });
    }
    if (request.method !== "POST") return json({ error: "Nicht gefunden." }, 404);
    const body = await request.json().catch(() => ({}));

    if (route === "import") {
      if (body.mode === "url") return json(await importUrl(body.url, env, authed));
      if (!aiReady) return json({ error: "KI ist noch nicht eingerichtet (ANTHROPIC_API_KEY und KOCHBUCH_CODE in Cloudflare setzen)." }, 503);
      if (!authed) return json({ error: "Zugangscode fehlt oder ist falsch. In den Einstellungen der App eintragen." }, 401);

      if (body.mode === "image") {
        const imgs = (body.images || []).slice(0, 5);
        if (!imgs.length) return json({ error: "Kein Bild erhalten." }, 400);
        const content = imgs.map(d => {
          const m = String(d).match(/^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/);
          if (!m) throw new UserError("Bildformat nicht unterstützt.");
          return { type: "image", source: { type: "base64", media_type: m[1], data: m[2] } };
        });
        content.push({ type: "text", text: imgs.length > 1 ? "Diese Screenshots gehören zu EINEM Rezept. Lies alles aus und baue das Rezept." : "Lies das Rezept aus diesem Bild aus. Ist nur ein Gericht ohne Rezept zu sehen, erkenne das Gericht und schreibe ein typisches Rezept dafür." });
        return json({ recipe: await claude(env, content, RECIPE_SCHEMA), source: { type: "screenshot" } });
      }
      if (body.mode === "text") {
        const text = String(body.text || "").trim();
        if (text.length < 10) return json({ error: "Zu wenig Text – erzähl ruhig ein bisschen mehr." }, 400);
        const content = [{ type: "text", text: `Gesprochenes Transkript (so wie es aufgenommen wurde):\n"""\n${text.slice(0, 20000)}\n"""\nMach daraus ein Rezept.` }];
        return json({ recipe: await claude(env, content, RECIPE_SCHEMA), source: { type: "voice" } });
      }
      return json({ error: "Unbekannter Modus." }, 400);
    }

    if (route === "nutrition") {
      if (!aiReady || !authed) return json({ error: "KI nicht verfügbar." }, aiReady ? 401 : 503);
      const list = (body.ingredients || []).map(String).filter(Boolean).slice(0, 80);
      const content = [{ type: "text", text: `Zutaten für ${+body.servings || 1} Portion(en):\n${list.map(l => "- " + l).join("\n")}\n\nSchätze die Nährwerte PRO PORTION (kcal, Protein g, Kohlenhydrate g, Fett g). In "note" ein kurzer Satz, welche Annahmen du getroffen hast.` }];
      return json({ nutrition: await claude(env, content, NUTRITION_SCHEMA, "Du bist Ernährungswissenschaftler:in und schätzt Nährwerte realistisch auf Basis üblicher Nährwerttabellen.") });
    }
    return json({ error: "Nicht gefunden." }, 404);
  } catch (e) {
    if (e instanceof UserError) return json({ error: e.message }, 422);
    console.error(e);
    return json({ error: "Da ist etwas schiefgelaufen: " + (e.message || e) }, 500);
  }
}

class UserError extends Error {}

async function claude(env, content, schema, system = SYSTEM) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2026-10-21",
      "anthropic-beta": "server-side-fallback-2026-07-01"
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 16000,
      fallbacks: "default",
      output_config: { effort: "medium", format: { type: "json_schema", schema } },
      system,
      messages: [{ role: "user", content }]
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message || res.statusText;
    if (res.status === 429 || res.status >= 500) throw new UserError("Die KI ist gerade ausgelastet, bitte gleich nochmal versuchen.");
    throw new Error(`Claude API ${res.status}: ${msg}`);
  }
  if (data.stop_reason === "refusal") throw new UserError("Die KI konnte dieses Material nicht verarbeiten.");
  if (data.stop_reason === "max_tokens") throw new UserError("Das Rezept war zu lang zum Auslesen.");
  const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
  try { return JSON.parse(text); } catch { throw new Error("Antwort der KI war kein gültiges JSON."); }
}

// ---------- Link-Import ----------

const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

async function importUrl(raw, env, authed) {
  let url;
  try { url = new URL(String(raw || "").trim()); } catch { throw new UserError("Das sieht nicht nach einem Link aus."); }
  if (!/^https?:$/.test(url.protocol)) throw new UserError("Nur http(s)-Links werden unterstützt.");

  const res = await fetch(url.toString(), {
    headers: { "user-agent": UA, "accept": "text/html,application/xhtml+xml", "accept-language": "de-DE,de;q=0.9,en;q=0.7" },
    redirect: "follow", cf: { cacheTtl: 300 }
  });
  if (!res.ok) throw new UserError(`Die Seite hat nicht geantwortet (HTTP ${res.status}). Tipp: Screenshot machen und den importieren.`);
  const html = (await res.text()).slice(0, 3_000_000);

  const ld = extractRecipeLd(html);
  const mapped = ld ? mapLd(ld) : null;
  const imageUrl = mapped?.image || metaContent(html, "og:image");
  const photo = imageUrl ? await fetchImage(new URL(imageUrl, url).toString()).catch(() => null) : null;
  const source = { type: "web", url: url.toString(), site: url.hostname.replace(/^www\./, "") };

  // Mit KI: Daten auf Deutsch normalisieren, Nährwerte + Tags ergänzen.
  if (env.ANTHROPIC_API_KEY && env.KOCHBUCH_CODE && authed) {
    const material = mapped
      ? `Strukturierte Rezeptdaten der Seite ${url.hostname}:\n${JSON.stringify({ ...mapped, image: undefined }).slice(0, 40000)}`
      : `Text der Seite ${url.hostname} (HTML entfernt):\n${htmlToText(html).slice(0, 60000)}`;
    const recipe = await claude(env, [{ type: "text", text: material + "\n\nBaue daraus das Rezept." }], RECIPE_SCHEMA);
    return { recipe, photo, source };
  }
  if (!mapped) throw new UserError(env.ANTHROPIC_API_KEY ? "Auf der Seite stecken keine Rezeptdaten. Mit Zugangscode kann die KI die Seite trotzdem auslesen." : "Auf der Seite habe ich keine strukturierten Rezeptdaten gefunden. Probier den Screenshot-Import.");
  return { recipe: { ...mapped, image: undefined, isRecipe: true }, photo, source, raw: true };
}

function extractRecipeLd(html) {
  const re = /<script[^>]*type=["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    let data;
    try { data = JSON.parse(m[1].trim()); } catch { try { data = JSON.parse(m[1].trim().replace(/[\u0000-\u001f]+/g, " ")); } catch { continue; } }
    const found = findRecipe(data);
    if (found) return found;
  }
  return null;
}
function findRecipe(node, depth = 0) {
  if (!node || depth > 6) return null;
  if (Array.isArray(node)) { for (const n of node) { const f = findRecipe(n, depth + 1); if (f) return f; } return null; }
  if (typeof node !== "object") return null;
  const t = node["@type"];
  if (t === "Recipe" || (Array.isArray(t) && t.includes("Recipe"))) return node;
  if (node["@graph"]) return findRecipe(node["@graph"], depth + 1);
  if (node.mainEntity) return findRecipe(node.mainEntity, depth + 1);
  return null;
}

const decode = s => String(s ?? "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/\s+/g, " ").trim();

function isoMinutes(s) {
  const m = String(s || "").match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/i);
  if (!m) return 0;
  return (+m[1] || 0) * 1440 + (+m[2] || 0) * 60 + (+m[3] || 0);
}
function steps(ins) {
  const out = [];
  const walk = x => {
    if (!x) return;
    if (typeof x === "string") { decode(x).split(/\n+|(?<=\.)\s{2,}/).forEach(s => s.trim() && out.push(s.trim())); return; }
    if (Array.isArray(x)) return x.forEach(walk);
    if (x.itemListElement) return walk(x.itemListElement);
    if (x.text) return out.push(decode(x.text));
    if (x.name) return out.push(decode(x.name));
  };
  walk(ins);
  return out.filter(Boolean);
}
function firstImage(img) {
  if (!img) return null;
  if (typeof img === "string") return img;
  if (Array.isArray(img)) return firstImage(img[0]);
  return img.url || img.contentUrl || null;
}
const nutr = v => { const n = parseFloat(String(v || "").replace(",", ".")); return isNaN(n) ? 0 : Math.round(n); };

function mapLd(r) {
  const yieldRaw = Array.isArray(r.recipeYield) ? r.recipeYield[0] : r.recipeYield;
  const servings = parseInt(String(yieldRaw || "").match(/\d+/)?.[0] || "0", 10) || 2;
  const n = r.nutrition || {};
  const kcal = nutr(n.calories);
  return {
    title: decode(r.name) || "Rezept",
    description: decode(r.description).slice(0, 240),
    servings,
    time: isoMinutes(r.totalTime) || (isoMinutes(r.prepTime) + isoMinutes(r.cookTime)) || 30,
    cuisine: decode(Array.isArray(r.recipeCuisine) ? r.recipeCuisine[0] : r.recipeCuisine).toLowerCase(),
    ingredientLines: (r.recipeIngredient || r.ingredients || []).map(decode).filter(Boolean),
    steps: steps(r.recipeInstructions),
    nutrition: kcal ? { kcal, protein: nutr(n.proteinContent), carbs: nutr(n.carbohydrateContent), fat: nutr(n.fatContent) } : null,
    image: firstImage(r.image)
  };
}
function metaContent(html, prop) {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']+)["']|<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${prop}["']`, "i");
  const m = html.match(re);
  return m ? decode(m[1] || m[2]) : null;
}
function htmlToText(html) {
  return decode(html.replace(/<(script|style|noscript|svg|nav|footer|header)[\s\S]*?<\/\1>/gi, " ").replace(/<\/(p|div|li|h\d|br|tr)>/gi, "\n"));
}
async function fetchImage(src) {
  const r = await fetch(src, { headers: { "user-agent": UA, accept: "image/*" } });
  if (!r.ok) return null;
  const type = (r.headers.get("content-type") || "").split(";")[0];
  if (!/^image\/(jpeg|png|webp)$/.test(type)) return null;
  const buf = new Uint8Array(await r.arrayBuffer());
  if (buf.length > 4_000_000) return null;
  let bin = "";
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
  return `data:${type};base64,${btoa(bin)}`;
}
