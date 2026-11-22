/* Kochbuch – App-Logik (Vanilla JS, kein Build). Daten liegen lokal in IndexedDB (Rezepte + Fotos). */
(() => {
"use strict";
const N = window.KBNutrition;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const ic = (name, cls = "") => `<svg class="icon ${cls}"><use href="#i-${name}"/></svg>`;
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const API = "/api/kochbuch";
const PLURAL = { Zehe: "Zehen", Dose: "Dosen", Prise: "Prisen", Tasse: "Tassen", Scheibe: "Scheiben", Zweig: "Zweige" };
const amt = (a, u) => [N.fmtAmount(a), a > 1 && PLURAL[u] ? PLURAL[u] : u].filter(Boolean).join(" ");

/* ---------- Stammdaten ---------- */
const CUISINES = {
  italienisch: ["Italienisch", "🇮🇹"], georgisch: ["Georgisch", "🇬🇪"], asiatisch: ["Asiatisch", "🥢"], mexikanisch: ["Mexikanisch", "🇲🇽"],
  orientalisch: ["Orientalisch", "🧆"], indisch: ["Indisch", "🇮🇳"], griechisch: ["Griechisch", "🇬🇷"], französisch: ["Französisch", "🇫🇷"],
  deutsch: ["Deutsch", "🇩🇪"], amerikanisch: ["Amerikanisch", "🇺🇸"], spanisch: ["Spanisch", "🇪🇸"], international: ["International", "🌍"]
};
const TAGS = { sweet: "Süß", savory: "Herzhaft", veggie: "Vegetarisch", fitness: "Fitness" };
// Rubriken: teils manuell (Tags), teils automatisch aus Nährwerten/Zeit.
const CATS = [
  { id: "lowcal", name: "Wenig Kalorien", test: r => r.nutrition?.kcal > 0 && r.nutrition.kcal <= 450, bg: "radial-gradient(circle at 15% 0%, #f4ff9a, transparent 55%), linear-gradient(125deg, #9fdc7c, #3fbf9f 70%, #1f7d6c)", glow: "rgba(63,191,159,.6)" },
  { id: "protein", name: "Viel Protein", test: r => (r.nutrition?.protein || 0) >= 30, bg: "radial-gradient(circle at 90% -20%, #f89abf, transparent 50%), linear-gradient(120deg, #307af4 20%, #2236cc 80%)", glow: "rgba(48,122,244,.6)" },
  { id: "fitness", name: "Fitness", test: r => r.tags?.includes("fitness"), bg: "radial-gradient(circle at 15% 0%, #f89abf, transparent 60%), linear-gradient(120deg, #c9b9ff, #a59af8 50%, #6b5fd6)", glow: "rgba(165,154,248,.6)" },
  { id: "sweet", name: "Süß", test: r => r.tags?.includes("sweet"), bg: "radial-gradient(circle at 85% 0%, #fff1b8, transparent 50%), linear-gradient(120deg, #f89abf, #ff9d6c 55%, #ffb923)", glow: "rgba(248,154,191,.6)" },
  { id: "savory", name: "Herzhaft", test: r => r.tags?.includes("savory"), bg: "radial-gradient(circle at 12% -10%, #ffb923, transparent 55%), linear-gradient(120deg, #f66515 10%, #fd290d 60%, #6a1206)", glow: "rgba(246,101,21,.6)" },
  { id: "veggie", name: "Vegetarisch", test: r => r.tags?.includes("veggie"), bg: "radial-gradient(circle at 85% 0%, #fffbd0, transparent 50%), linear-gradient(120deg, #e6ee6c, #9fdc7c 55%, #4f9e5c)", glow: "rgba(159,220,124,.5)", dark: true },
  { id: "quick", name: "Unter 25 Min.", test: r => r.time > 0 && r.time <= 25, bg: "radial-gradient(circle at 85% 120%, rgba(255,185,35,.6), transparent 55%), linear-gradient(180deg, #fffaf4, #f3e6d8)", glow: "rgba(255,220,180,.35)", dark: true }
];
const ORBS = {
  sweet: ["#f89abf", "#ffb923", "#a59af8"], fitness: ["#307af4", "#a59af8", "#f89abf"],
  veggie: ["#9fdc7c", "#ffb923", "#3fbf9f"], savory: ["#f66515", "#ffb923", "#fd290d"]
};
const SOURCES = [
  ["Chefkoch", "chefkoch.de", "Riesige deutsche Community", "#ffb923", "🧑‍🍳"],
  ["EAT SMARTER", "eatsmarter.de", "Gesund & mit Nährwerten", "#9fdc7c", "🥗"],
  ["Kitchen Stories", "kitchenstories.com", "Schritt-für-Schritt mit Fotos", "#f89abf", "📖"],
  ["Lecker", "lecker.de", "Alltagsküche & Klassiker", "#f66515", "🍲"],
  ["Springlane", "springlane.de", "Food-Magazin & Techniken", "#a59af8", "🔪"],
  ["Essen & Trinken", "essen-und-trinken.de", "Saisonal & raffiniert", "#307af4", "🍷"],
  ["BBC Good Food", "bbcgoodfood.com", "Englisch, wird übersetzt", "#3fbf9f", "🇬🇧"]
];

/* ---------- Speicher ---------- */
const DB_NAME = "kochbuch", DB_VER = 1;
let db;
function openDB() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB_NAME, DB_VER);
    r.onupgradeneeded = () => {
      const d = r.result;
      if (!d.objectStoreNames.contains("recipes")) d.createObjectStore("recipes", { keyPath: "id" });
      if (!d.objectStoreNames.contains("photos")) d.createObjectStore("photos");
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
const tx = (store, mode, fn) => new Promise((res, rej) => {
  const t = db.transaction(store, mode); const s = t.objectStore(store);
  const out = fn(s); t.oncomplete = () => res(out && "result" in out ? out.result : out); t.onerror = () => rej(t.error);
});
const dbAll = () => tx("recipes", "readonly", s => s.getAll());
const dbPut = r => tx("recipes", "readwrite", s => s.put(r));
const dbDel = id => tx("recipes", "readwrite", s => s.delete(id));
const photoGet = id => tx("photos", "readonly", s => s.get(id));
const photoPut = (id, blob) => tx("photos", "readwrite", s => s.put(blob, id));
const photoDel = id => tx("photos", "readwrite", s => s.delete(id));
const photoKeys = () => tx("photos", "readonly", s => s.getAllKeys());

const ls = {
  get(k, d) { try { const v = localStorage.getItem("kb." + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("kb." + k, JSON.stringify(v)); } catch {} }
};

/* ---------- Zustand ---------- */
const S = {
  recipes: [], photos: new Map(), // id → objectURL
  view: "home", query: "", filter: null, weekSel: null,
  ai: { ready: false, authorized: false, checked: false }
};

async function loadAll() {
  S.recipes = (await dbAll()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const keys = await photoKeys();
  for (const id of keys) if (!S.photos.has(id)) {
    const b = await photoGet(id); if (b) S.photos.set(id, URL.createObjectURL(b));
  }
}
async function seed(force) {
  if (!force && ls.get("seeded", false)) return;
  const now = Date.now();
  for (const [i, r] of window.KB_SEED.entries()) {
    if (!force && S.recipes.find(x => x.id === r.id)) continue;
    const ingredients = r.ingredients.map(N.parseLine).filter(Boolean);
    const n = N.estimate(ingredients, r.servings);
    await dbPut({ ...r, ingredients, nutrition: { kcal: n.kcal, protein: n.protein, carbs: n.carbs, fat: n.fat, source: "local", known: n.known, total: n.total }, favorite: false, source: { type: "own" }, createdAt: now - i * 3600e3 });
  }
  ls.set("seeded", true);
}
const byId = id => S.recipes.find(r => r.id === id);

/* ---------- KI-Status ---------- */
const code = () => ls.get("code", "");
async function api(path, body) {
  const res = await fetch(API + "/" + path, {
    method: body ? "POST" : "GET",
    headers: { "content-type": "application/json", "x-kochbuch-code": code() },
    body: body ? JSON.stringify(body) : undefined
  });
  let data = {};
  try { data = await res.json(); } catch { throw new Error(res.status === 404 ? "Server-Funktion nicht erreichbar (läuft die App über Cloudflare Pages?)." : "Unerwartete Antwort vom Server."); }
  if (!res.ok) throw new Error(data.error || "Fehler " + res.status);
  return data;
}
async function checkAI() {
  try { const s = await api("status"); S.ai = { ready: s.ai, authorized: s.authorized, checked: true, reachable: true }; }
  catch { S.ai = { ready: false, authorized: false, checked: true, reachable: false }; }
}
const aiOn = () => S.ai.ready && S.ai.authorized;

/* ---------- Helfer ---------- */
function toast(msg, ms = 2600) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), ms);
}
function hash(s) { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); }
function orbStyle(r) {
  const key = r.tags?.includes("sweet") ? "sweet" : r.tags?.includes("fitness") ? "fitness" : r.tags?.includes("veggie") ? "veggie" : "savory";
  const [a, b, c] = ORBS[key]; const h = hash(r.id || r.title);
  const x1 = 20 + (h % 30), y1 = 15 + (h % 25), x2 = 60 + (h % 25), y2 = 60 + ((h >> 3) % 25);
  return `--orb: radial-gradient(circle at ${x1}% ${y1}%, ${a}, transparent 45%), radial-gradient(circle at ${x2}% ${y2}%, ${b}, transparent 45%), radial-gradient(circle at 80% 20%, ${c}, transparent 40%), #1d1511`;
}
function cover(r) {
  const p = S.photos.get(r.id);
  return p ? `<div class="cover"><img src="${p}" alt="" loading="lazy"></div>`
           : `<div class="cover"><div class="orb" style="${orbStyle(r)}"><i>${esc(r.emoji || "🍽️")}</i></div></div>`;
}
const cuisineLabel = c => CUISINES[c] ? CUISINES[c][1] + " " + CUISINES[c][0] : "🌍 International";
const fmtTime = m => !m ? "–" : m < 60 ? m + " Min." : Math.floor(m / 60) + " Std." + (m % 60 ? " " + (m % 60) + " Min." : "");
const dateKey = d => { const z = new Date(d); z.setMinutes(z.getMinutes() - z.getTimezoneOffset()); return z.toISOString().slice(0, 10); };
function matches(r, q) {
  if (!q) return true;
  const hay = [r.title, r.description, CUISINES[r.cuisine]?.[0], ...(r.ingredients || []).map(i => i.name), ...(r.tags || []).map(t => TAGS[t])].join(" ").toLowerCase();
  return q.toLowerCase().split(/\s+/).every(w => hay.includes(w));
}
function applyFilter(list, f) {
  if (!f) return list;
  if (f.startsWith("cat:")) { const c = CATS.find(c => c.id === f.slice(4)); return c ? list.filter(c.test) : list; }
  if (f.startsWith("cu:")) return list.filter(r => r.cuisine === f.slice(3));
  return list;
}
function compressImage(file, max = 1400, q = 0.84) {
  return new Promise((res, rej) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas"); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      c.toBlob(b => b ? res(b) : rej(new Error("Bild konnte nicht verarbeitet werden.")), "image/jpeg", q);
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("Bildformat wird nicht unterstützt.")); };
    img.src = url;
  });
}
const blobToDataURL = b => new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); });
const dataURLToBlob = async d => (await fetch(d)).blob();
function pickFile(input) {
  return new Promise(res => {
    input.value = "";
    input.onchange = () => res([...input.files]);
    input.click();
  });
}

/* ---------- Ansichten ---------- */
function render() {
  $$(".dock button").forEach(b => b.classList.toggle("on", b.dataset.nav === S.view));
  const v = $("#view");
  v.innerHTML = S.view === "home" ? viewHome() : S.view === "list" ? viewList() : S.view === "favs" ? viewFavs() : viewSettings();
  if (S.view === "home") drawWeek();
}
function go(view, opts = {}) {
  S.view = view; Object.assign(S, opts); render(); window.scrollTo({ top: 0 });
}

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? "Gute Nacht" : h < 11 ? "Guten Morgen" : h < 14 ? "Mahlzeit" : h < 18 ? "Hallo" : h < 22 ? "Guten Abend" : "Gute Nacht";
}

function viewHome() {
  const R = S.recipes;
  const prot = R.filter(CATS[1].test).length;
  const favs = R.filter(r => r.favorite).length;
  const fresh = R.slice(0, 8);
  return `
  <header class="head">
    <div class="avatar">F</div>
    <div><div class="hello">${greeting()} 👋</div><h1>Fabian</h1></div>
    <button class="round" data-nav="settings" aria-label="Einstellungen">${ic("gear")}</button>
  </header>
  <label class="search">${ic("search")}<input id="home-search" type="search" placeholder="Rezept, Zutat, Küche …" autocomplete="off"><button class="spark" data-act="add" aria-label="Neues Rezept">${ic("spark")}</button></label>

  <section class="week" id="week"></section>

  <div class="tiles">
    <button class="tile g-ember" data-nav="list"><span class="t-label">Rezepte</span><span class="t-num">${R.length}<span class="badge">${R.filter(r => S.photos.has(r.id)).length} mit Foto</span></span></button>
    <button class="tile g-ocean" data-filter="cat:protein"><span class="t-label">Viel Protein</span><span class="t-num">${prot}</span></button>
    <button class="tile g-lilac" data-nav="favs"><span class="t-label">Favoriten</span><span class="t-num">${favs}</span></button>
    <button class="tile g-cream" data-act="add"><span class="t-label">Neues Rezept</span><span class="t-num">${ic("plus")}</span></button>
  </div>

  <div class="sec-head"><h2>Worauf hast du Lust?</h2></div>
  <div class="scroller">
    ${CATS.map(c => `<button class="cat ${c.dark ? "dark-text" : ""}" style="background:${c.bg};box-shadow:inset 0 2px 1px rgba(255,255,255,.3), inset 0 -18px 26px -14px rgba(0,0,0,.4), 0 14px 30px -18px ${c.glow}" data-filter="cat:${c.id}"><b>${c.name}</b><span>${R.filter(c.test).length} Rezepte</span></button>`).join("")}
  </div>

  <div class="sec-head"><h2>Küchen der Welt</h2></div>
  <div class="chips">
    ${Object.entries(CUISINES).map(([k, [name, flag]]) => { const n = R.filter(r => r.cuisine === k).length; return n ? `<button class="chip" data-filter="cu:${k}">${flag} ${name} <small>${n}</small></button>` : ""; }).join("")}
  </div>

  <div class="sec-head"><h2>Frisch im Kochbuch</h2><button data-nav="list">Alle ›</button></div>
  <div class="scroller">${fresh.map(card).join("") || `<div class="empty">Noch keine Rezepte.</div>`}</div>

  <div class="sec-head"><h2>Inspiration aus dem Netz</h2></div>
  <p class="hint" style="margin:-6px 4px 14px">Rezept finden → Link kopieren → hier auf <b>+</b> und „Link einfügen“.</p>
  <div class="sources">
    ${SOURCES.map(([n, d, sub, col, em]) => `<a class="src" href="https://www.${d}" target="_blank" rel="noopener"><span class="dot" style="background:radial-gradient(circle at 30% 30%, ${col}, ${col}55)">${em}</span><span><b>${n}</b><span>${sub}</span></span>${ic("arrow")}</a>`).join("")}
  </div>`;
}

function card(r) {
  const n = r.nutrition || {};
  return `<button class="rcard" data-open="${r.id}">
    ${cover(r)}
    ${r.favorite ? `<span class="fav">${ic("heart")}</span>` : ""}
    <span class="body"><h3>${esc(r.title)}</h3>
    <span class="meta"><span>${ic("clock")}${fmtTime(r.time)}</span>${n.kcal ? `<span>${ic("flame")}${n.kcal} kcal</span>` : ""}${n.protein ? `<span>${ic("dumbbell")}${n.protein} g</span>` : ""}</span></span>
  </button>`;
}

function filterChips() {
  const opts = [[null, "Alle"], ...CATS.map(c => ["cat:" + c.id, c.name]), ...Object.entries(CUISINES).filter(([k]) => S.recipes.some(r => r.cuisine === k)).map(([k, [n, f]]) => ["cu:" + k, f + " " + n])];
  return `<div class="chip-row">${opts.map(([v, l]) => `<button class="chip ${S.filter === v ? "on" : ""}" data-filter="${v ?? ""}">${l}</button>`).join("")}</div>`;
}
function viewList() {
  const list = applyFilter(S.recipes, S.filter).filter(r => matches(r, S.query));
  const title = S.filter?.startsWith("cat:") ? CATS.find(c => "cat:" + c.id === S.filter)?.name : S.filter?.startsWith("cu:") ? CUISINES[S.filter.slice(3)]?.[0] + " kochen" : "Rezepte";
  return `<h1 class="page-title">${esc(title)}<small>${list.length} ${list.length === 1 ? "Gericht" : "Gerichte"}</small></h1>
  <label class="search">${ic("search")}<input id="list-search" type="search" placeholder="Suchen …" value="${esc(S.query)}" autocomplete="off"></label>
  ${filterChips()}
  ${list.length ? `<div class="grid">${list.map(card).join("")}</div>` : `<div class="empty"><div class="big">🍳</div>Nichts gefunden.<br>Probier einen anderen Filter oder leg was Neues an.</div>`}`;
}
function viewFavs() {
  const list = S.recipes.filter(r => r.favorite);
  return `<h1 class="page-title">Favoriten<small>Deine Lieblinge auf einen Blick</small></h1>
  ${list.length ? `<div class="grid">${list.map(card).join("")}</div>` : `<div class="empty"><div class="big">🤍</div>Noch keine Favoriten.<br>Tippe in einem Rezept aufs Herz.</div>`}`;
}
function viewSettings() {
  const a = S.ai;
  const st = !a.checked ? ["", "Prüfe …"] : !a.reachable ? ["", "Server nicht erreichbar"] : !a.ready ? ["warn", "KI auf dem Server noch nicht eingerichtet"] : a.authorized ? ["ok", "KI aktiv"] : ["warn", "Zugangscode fehlt oder falsch"];
  return `<h1 class="page-title">Einstellungen</h1>
  <section class="panel">
    <h3>✨ KI-Zugang</h3>
    <p>Für Screenshots, Spracheingabe und genaue Nährwerte. Link-Import funktioniert bei den meisten Rezeptseiten auch ohne.</p>
    <div class="status ${st[0]}"><i></i>${st[1]}</div>
    <div class="field"><label for="code">Zugangscode</label><input class="inp" id="code" type="password" value="${esc(code())}" placeholder="dein KOCHBUCH_CODE" autocomplete="off"></div>
    <div class="btns"><button class="btn btn-light btn-sm" data-act="save-code">Speichern & testen</button></div>
    ${a.reachable && !a.ready ? `<p style="margin-top:16px">Einmalig in Cloudflare einrichten:</p><ol class="howto"><li>Cloudflare → Workers & Pages → <b>fabian-visuals-site</b> → Settings → Variables and Secrets</li><li><code>ANTHROPIC_API_KEY</code> als Secret anlegen (Key aus console.anthropic.com)</li><li><code>KOCHBUCH_CODE</code> anlegen: ein frei gewähltes Passwort</li><li>Neu deployen, dann denselben Code hier eintragen</li></ol>` : ""}
  </section>
  <section class="panel">
    <h3>💾 Daten</h3>
    <p>Alles liegt nur auf diesem Gerät. Mach ab und zu ein Backup, vor allem vor einem Handywechsel.</p>
    <div class="btns">
      <button class="btn btn-ghost btn-sm" data-act="export">${ic("download")} Backup speichern</button>
      <button class="btn btn-ghost btn-sm" data-act="import-backup">${ic("upload")} Backup laden</button>
      <button class="btn btn-ghost btn-sm" data-act="reseed">Startrezepte zurückholen</button>
    </div>
  </section>
  <section class="panel">
    <h3>📲 Als App installieren</h3>
    <p>iPhone: In Safari auf <b>Teilen</b> → <b>Zum Home-Bildschirm</b>. Danach startet das Kochbuch im Vollbild wie eine echte App.</p>
  </section>
  <p class="hint" style="text-align:center;margin-top:20px">Nährwerte sind Schätzungen pro Portion. Lokal berechnet aus einer Tabelle mit ~110 Grundzutaten oder per KI.</p>`;
}

/* ---------- Kochwoche ---------- */
function weekDays() {
  const now = new Date(); const day = (now.getDay() + 6) % 7;
  const mon = new Date(now); mon.setHours(12, 0, 0, 0); mon.setDate(now.getDate() - day);
  return [...Array(7)].map((_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return d; });
}
function drawWeek() {
  const el = $("#week"); if (!el) return;
  const log = ls.get("log", []);
  const days = weekDays();
  const keys = days.map(dateKey);
  const today = dateKey(new Date());
  const per = keys.map(k => log.filter(e => e.date === k));
  const kcal = per.map(es => es.reduce((s, e) => s + (e.kcal || 0), 0));
  const prot = per.map(es => es.reduce((s, e) => s + (e.protein || 0), 0));
  const total = per.reduce((s, es) => s + es.length, 0);
  if (S.weekSel == null || !keys.includes(S.weekSel)) S.weekSel = keys.includes(today) ? today : keys[0];
  const si = keys.indexOf(S.weekSel);

  // Welle: echte Werte oder (leer) sanfte Platzhalter-Welle
  const W = 320, H = 150, base = 120, top = 18;
  const max = Math.max(...kcal, 1);
  const vals = total ? kcal.map(v => v / max) : [0.12, 0.2, 0.15, 0.28, 0.18, 0.24, 0.14];
  const xs = vals.map((_, i) => 12 + i * ((W - 24) / 6));
  const ys = vals.map(v => base - v * (base - top));
  let d = `M ${xs[0]} ${ys[0]}`;
  for (let i = 0; i < xs.length - 1; i++) {
    const x0 = xs[Math.max(0, i - 1)], y0 = ys[Math.max(0, i - 1)], x1 = xs[i], y1 = ys[i], x2 = xs[i + 1], y2 = ys[i + 1], x3 = xs[Math.min(6, i + 2)], y3 = ys[Math.min(6, i + 2)];
    d += ` C ${x1 + (x2 - x0) / 6} ${y1 + (y2 - y0) / 6}, ${x2 - (x3 - x1) / 6} ${y2 - (y3 - y1) / 6}, ${x2} ${y2}`;
  }
  const area = d + ` L ${xs[6]} ${H} L ${xs[0]} ${H} Z`;
  const f = days[0], l = days[6];
  const mon = d => d.toLocaleDateString("de-DE", { day: "numeric", month: "short" });
  const selEntries = per[si];
  const selDate = days[si].toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" });
  const caption = !total
    ? `Tippe bei einem Rezept auf <b>„Heute gekocht“</b>, dann wächst hier deine Woche.`
    : selEntries.length
      ? `${selDate}: <b>${selEntries.map(e => esc(byId(e.id)?.title || e.title)).join(", ")}</b> · ${kcal[si]} kcal · ${prot[si]} g Protein`
      : `${selDate}: noch nichts gekocht`;
  const avgP = total ? Math.round(prot.reduce((a, b) => a + b, 0) / Math.max(1, prot.filter(Boolean).length)) : 0;

  el.innerHTML = `
    <div class="week-top"><div><h2>Deine Kochwoche</h2><div class="sub">${total ? `${total} ${total === 1 ? "Gericht" : "Gerichte"} gekocht · Ø ${avgP} g Protein/Tag` : "Noch nichts gekocht diese Woche"}</div></div>
    <button class="round" data-nav="list" aria-label="Alle Rezepte">${ic("arrow")}</button></div>
    <svg class="wave" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
      <defs><linearGradient id="wf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
      <line x1="0" x2="${W}" y1="${base}" y2="${base}" stroke="rgba(255,255,255,.28)" stroke-dasharray="2 6" vector-effect="non-scaling-stroke"/>
      <path d="${area}" fill="url(#wf)" opacity="${total ? 1 : .5}"/>
      <path d="${d}" fill="none" stroke="${total ? "#fbf3ea" : "rgba(251,243,234,.45)"}" stroke-width="2.2" vector-effect="non-scaling-stroke"/>
      ${total ? `<line x1="${xs[si]}" x2="${xs[si]}" y1="${ys[si]}" y2="${base}" stroke="#fff" stroke-width="2" vector-effect="non-scaling-stroke"/>` : ""}
    </svg>
    ${total ? `<div style="position:absolute;left:0;right:0;top:0;bottom:0;pointer-events:none;z-index:2"><span id="wdot" style="position:absolute;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;background:#fff;border:6px solid rgba(255,255,255,.3);background-clip:padding-box;box-shadow:0 0 18px rgba(255,255,255,.5)"></span></div>` : ""}
    <div class="days">${days.map((dd, i) => `<button class="day ${per[i].length ? "has" : ""} ${keys[i] === today ? "today" : ""} ${i === si ? "on" : ""}" data-day="${keys[i]}">${"MDMDFSS"[i]}</button>`).join("")}</div>
    <div class="caption">${caption}</div>
    <div class="caption" style="margin-top:6px;font-size:13px;opacity:.7">${mon(f)} – ${mon(l)}</div>`;
  if (total) { // Punkt exakt auf die Kurve setzen (SVG ist gestreckt)
    const svg = $(".wave", el), dot = $("#wdot", el);
    const sr = svg.getBoundingClientRect(), er = el.getBoundingClientRect();
    dot.style.left = (sr.left - er.left + xs[si] / W * sr.width) + "px";
    dot.style.top = (sr.top - er.top + ys[si] / H * sr.height) + "px";
  }
}

/* ---------- Overlays ---------- */
const stack = [];
function openLayer(html, cls = "") {
  const el = document.createElement("div");
  el.className = "layer " + cls; el.innerHTML = `<div class="layer-inner">${html}</div>`;
  $("#layers").append(el); stack.push(el);
  document.body.style.overflow = "hidden";
  history.pushState({ layer: stack.length }, "");
  return el;
}
function closeTop(fromPop) {
  const el = stack.pop(); if (!el) return;
  el.onclose?.();
  el.classList.add("out"); setTimeout(() => el.remove(), 250);
  if (el._scrim) { el._scrim.remove(); }
  if (!stack.length) document.body.style.overflow = "";
  if (!fromPop) history.back();
}
function closeAll() { while (stack.length) closeTop(); }
window.addEventListener("popstate", () => { if (stack.length) closeTop(true); });

function openSheet(html) {
  const scrim = document.createElement("div"); scrim.className = "scrim";
  const el = document.createElement("div"); el.className = "sheet"; el.innerHTML = `<div class="grab"></div>${html}`;
  el._scrim = scrim; scrim.onclick = () => closeTop();
  $("#layers").append(scrim, el); stack.push(el);
  document.body.style.overflow = "hidden";
  history.pushState({ layer: stack.length }, "");
  return el;
}

function loading(msgs) {
  const el = document.createElement("div"); el.className = "loading";
  el.innerHTML = `<div class="blob"></div><p></p><div class="dots">${"<span></span>".repeat(6)}</div>`;
  document.body.append(el);
  let i = 0; const p = $("p", el); p.textContent = msgs[0];
  const t = setInterval(() => { i = (i + 1) % msgs.length; p.textContent = msgs[i]; }, 2400);
  return () => { clearInterval(t); el.remove(); };
}

/* ---------- Rezept-Detail ---------- */
function openDetail(id) {
  const r = byId(id); if (!r) return;
  let serv = r.servings || 1;
  const done = new Set();
  const el = openLayer("");
  const draw = () => {
    const r = byId(id); if (!r) return closeTop();
    const n = r.nutrition || {};
    const f = serv / (r.servings || 1);
    const macroMax = Math.max(n.protein || 0, n.carbs || 0, n.fat || 0, 1);
    const macro = (label, v, col) => `<div class="macro"><span>${label}</span><span class="track"><span class="fill" style="width:${Math.round((v || 0) / macroMax * 100)}%;background:${col}"></span></span><b>${v || 0} g</b></div>`;
    const srcLabel = n.source === "ai" ? "✨ KI-Schätzung" : n.source === "web" ? "Laut Quelle" : n.source === "manual" ? "Eigene Angabe" : n.total ? `Lokal geschätzt · ${n.known}/${n.total} Zutaten erkannt` : "Lokal geschätzt";
    $(".layer-inner", el).innerHTML = `
      <div class="bar d-bar"><button class="round" data-act="close" aria-label="Zurück">${ic("back")}</button><span class="spacer"></span>
        <button class="round" data-act="fav" aria-label="Favorit" style="${r.favorite ? "color:var(--rose)" : ""}"><svg class="icon" style="${r.favorite ? "fill:var(--rose)" : ""}"><use href="#i-heart"/></svg></button>
        <button class="round" data-act="more" aria-label="Mehr">${ic("more")}</button></div>
      <div class="hero">${cover(r)}</div>
      <div class="d-body">
        <h1 class="d-title">${esc(r.title)}</h1>
        ${r.description ? `<p class="d-desc">${esc(r.description)}</p>` : ""}
        <div class="d-meta">
          <span class="chip">${ic("clock")}${fmtTime(r.time)}</span>
          <span class="chip">${cuisineLabel(r.cuisine)}</span>
          ${r.difficulty ? `<span class="chip">${ic("chef")}${esc(r.difficulty)}</span>` : ""}
          ${(r.tags || []).map(t => `<span class="chip">${TAGS[t] || t}</span>`).join("")}
          ${CATS.filter(c => ["lowcal", "protein"].includes(c.id) && c.test(r)).map(c => `<span class="chip">${c.name}</span>`).join("")}
        </div>
        <section class="nutri">
          <div class="nutri-top"><div><div class="per">pro Portion</div><div class="kcal">${n.kcal || "–"}<small>kcal</small></div></div>
          <button class="round" data-act="photo" aria-label="Foto hinzufügen" style="width:44px;height:44px">${ic("camera")}</button></div>
          ${macro("Protein", n.protein, "linear-gradient(90deg,#307af4,#a59af8)")}
          ${macro("Kohlenhydr.", n.carbs, "linear-gradient(90deg,#ffb923,#f66515)")}
          ${macro("Fett", n.fat, "linear-gradient(90deg,#f89abf,#fd290d)")}
          <div class="src-line"><span>${srcLabel}</span><button data-act="renutri">${ic("spark")}Neu berechnen</button></div>
        </section>

        <div class="d-sec"><h2>Zutaten</h2><div class="stepper"><button data-act="serv-" aria-label="Weniger">−</button><span>${serv} ${serv === 1 ? "Portion" : "Portionen"}</span><button data-act="serv+" aria-label="Mehr">+</button></div></div>
        <ul class="ings">${(r.ingredients || []).map((g, i) => `<li data-ing="${i}" class="${done.has(i) ? "done" : ""}"><span class="box">${done.has(i) ? ic("check") : ""}</span><span class="amt">${esc(amt(g.amount ? g.amount * f : null, g.unit))}</span><span class="name">${esc(g.name)}</span></li>`).join("")}</ul>

        <div class="d-sec"><h2>Zubereitung</h2></div>
        <ol class="steps">${(r.steps || []).map(s => `<li>${esc(s)}</li>`).join("")}</ol>
        ${r.notes ? `<div class="notes">💡 ${esc(r.notes)}</div>` : ""}

        <div class="d-actions">
          <button class="btn btn-light btn-block" data-act="cook">${ic("play")} Kochmodus starten</button>
          <div class="two"><button class="btn btn-ghost" data-act="cooked">${ic("check")} Heute gekocht</button><button class="btn btn-ghost" data-act="edit">${ic("pen")} Bearbeiten</button></div>
        </div>
        ${r.source?.url ? `<a class="source-link" href="${esc(r.source.url)}" target="_blank" rel="noopener">Quelle: ${esc(r.source.site || new URL(r.source.url).hostname)} ${ic("arrow")}</a>` : r.source?.type === "voice" ? `<p class="source-link">🎙 Eingesprochen</p>` : r.source?.type === "screenshot" ? `<p class="source-link">📸 Aus Screenshot</p>` : ""}
      </div>`;
  };
  el.redraw = draw;
  draw();
  el.addEventListener("click", async e => {
    const li = e.target.closest("[data-ing]");
    if (li) { const i = +li.dataset.ing; done.has(i) ? done.delete(i) : done.add(i); return draw(); }
    const a = e.target.closest("[data-act]")?.dataset.act; if (!a) return;
    const r = byId(id);
    if (a === "close") closeTop();
    else if (a === "serv-") { serv = Math.max(1, serv - 1); draw(); }
    else if (a === "serv+") { serv = Math.min(50, serv + 1); draw(); }
    else if (a === "fav") { r.favorite = !r.favorite; await dbPut(r); draw(); render(); toast(r.favorite ? "Zu Favoriten hinzugefügt 🤍" : "Aus Favoriten entfernt"); }
    else if (a === "photo") await setPhoto(r.id, draw);
    else if (a === "cook") openCook(r);
    else if (a === "cooked") {
      const log = ls.get("log", []); const n = r.nutrition || {};
      log.push({ date: dateKey(new Date()), id: r.id, title: r.title, kcal: n.kcal || 0, protein: n.protein || 0 });
      ls.set("log", log.slice(-400)); S.weekSel = dateKey(new Date()); render(); toast("Eingetragen in deine Kochwoche 🔥");
    }
    else if (a === "edit") openEditor(structuredClone(r), { onSave: draw });
    else if (a === "renutri") await renutri(r, draw);
    else if (a === "more") moreMenu(r, draw);
  });
}

async function setPhoto(id, after) {
  const [file] = await pickFile($("#pick-photo")); if (!file) return;
  try {
    const blob = await compressImage(file, 1400, 0.82);
    await photoPut(id, blob);
    if (S.photos.has(id)) URL.revokeObjectURL(S.photos.get(id));
    S.photos.set(id, URL.createObjectURL(blob));
    after?.(); render(); toast("Foto gespeichert 📸");
  } catch (e) { toast(e.message); }
}

async function renutri(r, after) {
  const lines = (r.ingredients || []).map(g => [N.fmtAmount(g.amount), g.unit, g.name].filter(Boolean).join(" "));
  if (aiOn()) {
    const stop = loading(["Wiege Zutaten ab …", "Rechne Makros …", "Gleiche mit Nährwerttabellen ab …"]);
    try {
      const { nutrition: n } = await api("nutrition", { ingredients: lines, servings: r.servings });
      r.nutrition = { kcal: n.kcal, protein: n.protein, carbs: n.carbs, fat: n.fat, source: "ai", note: n.note };
      await dbPut(r); toast("Nährwerte aktualisiert ✨");
    } catch (e) { toast(e.message, 4000); }
    finally { stop(); }
  } else {
    const n = N.estimate(r.ingredients, r.servings);
    r.nutrition = { kcal: n.kcal, protein: n.protein, carbs: n.carbs, fat: n.fat, source: "local", known: n.known, total: n.total };
    await dbPut(r);
    toast(n.unknown.length ? `Lokal berechnet. Nicht erkannt: ${n.unknown.slice(0, 3).join(", ")}${n.unknown.length > 3 ? " …" : ""}` : "Lokal berechnet ✓", 4200);
  }
  after?.(); render();
}

function moreMenu(r, after) {
  const sh = openSheet(`<h2>${esc(r.title)}</h2><p class="lead">Was möchtest du tun?</p>
    <div class="menu">
      <button data-m="photo">${ic("image")} ${S.photos.has(r.id) ? "Foto ändern" : "Foto hinzufügen"}</button>
      ${S.photos.has(r.id) ? `<button data-m="nophoto">${ic("x")} Foto entfernen</button>` : ""}
      <button data-m="share">${ic("share")} Rezept teilen</button>
      <button data-m="dup">${ic("clip")} Duplizieren</button>
      <button data-m="del" class="danger">${ic("trash")} Löschen</button>
    </div>`);
  sh.addEventListener("click", async e => {
    const m = e.target.closest("[data-m]")?.dataset.m; if (!m) return;
    closeTop();
    if (m === "photo") await setPhoto(r.id, after);
    if (m === "nophoto") { await photoDel(r.id); URL.revokeObjectURL(S.photos.get(r.id)); S.photos.delete(r.id); after(); render(); }
    if (m === "share") shareRecipe(r);
    if (m === "dup") { const c = { ...structuredClone(r), id: uid(), title: r.title + " (Kopie)", createdAt: Date.now(), favorite: false }; await dbPut(c); await loadAll(); render(); toast("Kopie angelegt"); }
    if (m === "del") {
      if (!confirm(`„${r.title}“ wirklich löschen?`)) return;
      await dbDel(r.id); await photoDel(r.id).catch(() => {}); S.photos.delete(r.id);
      await loadAll(); setTimeout(() => closeTop(), 280); render(); toast("Gelöscht");
    }
  });
}
async function shareRecipe(r) {
  const text = `${r.title}\n${r.description || ""}\n\nZutaten (${r.servings} Portionen):\n${(r.ingredients || []).map(g => "• " + [N.fmtAmount(g.amount), g.unit, g.name].filter(Boolean).join(" ")).join("\n")}\n\nZubereitung:\n${(r.steps || []).map((s, i) => `${i + 1}. ${s}`).join("\n")}${r.source?.url ? "\n\nQuelle: " + r.source.url : ""}`;
  try {
    if (navigator.share) await navigator.share({ title: r.title, text });
    else { await navigator.clipboard.writeText(text); toast("Rezept kopiert 📋"); }
  } catch {}
}

/* ---------- Kochmodus ---------- */
async function openCook(r) {
  let i = 0; let lock = null;
  try { lock = await navigator.wakeLock?.request("screen"); } catch {}
  const el = openLayer("", "");
  el.onclose = () => { try { lock?.release(); } catch {} };
  const steps = r.steps?.length ? r.steps : ["Keine Schritte hinterlegt."];
  const draw = () => {
    $(".layer-inner", el).innerHTML = `<div class="cook">
      <div class="bar"><button class="round" data-c="x" aria-label="Schließen">${ic("x")}</button><h2>${esc(r.title)}</h2><button class="round" data-c="ing" aria-label="Zutaten">${ic("book")}</button></div>
      <div class="cook-prog">${steps.map((_, k) => `<i class="${k <= i ? "on" : ""}"></i>`).join("")}</div>
      <div class="cook-main"><div class="n">Schritt ${i + 1} von ${steps.length}</div><p>${esc(steps[i])}</p></div>
      <div class="cook-ctrl"><button class="btn btn-ghost" data-c="prev" ${i === 0 ? "disabled" : ""}>${ic("back")} Zurück</button>
      ${i < steps.length - 1 ? `<button class="btn btn-light" data-c="next">Weiter ${ic("next")}</button>` : `<button class="btn btn-ember" data-c="done">Fertig 🎉</button>`}</div></div>`;
  };
  draw();
  el.addEventListener("click", e => {
    const c = e.target.closest("[data-c]")?.dataset.c; if (!c) return;
    if (c === "x") closeTop();
    if (c === "prev" && i > 0) { i--; draw(); }
    if (c === "next") { i++; draw(); }
    if (c === "ing") openSheet(`<h2>Zutaten</h2><p class="lead">${r.servings} Portionen</p><ul class="ings">${(r.ingredients || []).map(g => `<li><span class="amt">${esc(amt(g.amount, g.unit))}</span><span>${esc(g.name)}</span></li>`).join("")}</ul>`);
    if (c === "done") {
      closeTop();
      const log = ls.get("log", []); const n = r.nutrition || {};
      if (!log.some(e => e.id === r.id && e.date === dateKey(new Date()))) {
        log.push({ date: dateKey(new Date()), id: r.id, title: r.title, kcal: n.kcal || 0, protein: n.protein || 0 }); ls.set("log", log.slice(-400));
      }
      render(); toast("Guten Appetit! In deiner Kochwoche eingetragen 🔥");
    }
  });
  // Wischen
  let sx = null;
  el.addEventListener("touchstart", e => { sx = e.touches[0].clientX; }, { passive: true });
  el.addEventListener("touchend", e => {
    if (sx == null) return; const dx = e.changedTouches[0].clientX - sx; sx = null;
    if (dx < -60 && i < steps.length - 1) { i++; draw(); } else if (dx > 60 && i > 0) { i--; draw(); }
  });
}

/* ---------- Neues Rezept ---------- */
function openAdd() {
  const lock = aiOn() ? "" : `<span class="lock">KI nötig</span>`;
  const sh = openSheet(`<h2>Neues Rezept</h2><p class="lead">Wie soll's ins Kochbuch?</p>
    <div class="opts">
      <button class="opt g-ember" data-o="shot">${lock}<span class="ic">${ic("camera")}</span><span><b>Screenshot</b><span>Insta, TikTok, Kochbuchseite: wird ausgelesen</span></span></button>
      <button class="opt g-ocean" data-o="voice"><span class="ic">${ic("mic")}</span><span><b>Einsprechen</b><span>Erzähl einfach, wie du's gemacht hast</span></span></button>
      <button class="opt g-lilac" data-o="link"><span class="ic">${ic("link")}</span><span><b>Link einfügen</b><span>Chefkoch, Kitchen Stories & Co.</span></span></button>
      <button class="opt g-cream" data-o="manual"><span class="ic">${ic("pen")}</span><span><b>Selbst schreiben</b><span>Klassisch per Hand</span></span></button>
    </div>
    ${aiOn() ? "" : `<div class="banner" style="margin:16px 0 0">${ic("spark")}<span>Screenshot-Erkennung und smarte Spracheingabe brauchen den KI-Zugang. <a href="#" data-o="settings" style="color:var(--lavender)">Einrichten</a></span></div>`}`);
  sh.addEventListener("click", async e => {
    const o = e.target.closest("[data-o]")?.dataset.o; if (!o) return;
    e.preventDefault();
    closeTop();
    if (o === "shot") importShot();
    if (o === "voice") setTimeout(openVoice, 260);
    if (o === "link") setTimeout(openLink, 260);
    if (o === "manual") setTimeout(() => openEditor(blank()), 260);
    if (o === "settings") go("settings");
  });
}
const blank = () => ({ id: uid(), title: "", emoji: "🍽️", description: "", servings: 2, time: 30, difficulty: "leicht", cuisine: "international", tags: ["savory"], ingredients: [], steps: [], nutrition: null, notes: "", favorite: false, source: { type: "own" } });

async function importShot() {
  if (!aiOn()) { toast("Screenshot-Erkennung braucht den KI-Zugang (Einstellungen)", 3500); return; }
  const files = await pickFile($("#pick-shot")); if (!files.length) return;
  const stop = loading(["Lese deinen Screenshot …", "Schnipple die Zutaten …", "Sortiere die Schritte …", "Schätze die Nährwerte …"]);
  try {
    const blobs = await Promise.all(files.slice(0, 5).map(f => compressImage(f, 1568, 0.85)));
    const images = await Promise.all(blobs.map(blobToDataURL));
    const res = await api("import", { mode: "image", images });
    stop();
    openEditor(fromAI(res.recipe, res.source), { shot: blobs[0] });
  } catch (e) { stop(); toast(e.message, 4500); }
}

function fromAI(x, source) {
  if (x.isRecipe === false) toast("Hm, da war kein eindeutiges Rezept drin. Schau mal drüber.", 4000);
  return {
    ...blank(),
    title: x.title || "", emoji: x.emoji || "🍽️", description: x.description || "",
    servings: x.servings || 2, time: x.time || 30, difficulty: x.difficulty || "leicht",
    cuisine: CUISINES[x.cuisine] ? x.cuisine : "international",
    tags: (x.tags || []).filter(t => TAGS[t]),
    ingredients: (x.ingredients || []).map(g => ({ amount: g.amount || null, unit: g.unit || "", name: g.name })),
    steps: x.steps || [], notes: x.notes || "",
    nutrition: x.nutrition ? { ...x.nutrition, source: "ai" } : null,
    source: source || { type: "own" }
  };
}
// Link-Import ohne KI: strukturierte Daten der Seite direkt übernehmen.
function fromRaw(x, source) {
  const ingredients = (x.ingredientLines || []).map(N.parseLine).filter(Boolean);
  const txt = (x.title + " " + x.description + " " + (x.ingredientLines || []).join(" ")).toLowerCase();
  const sweet = /kuchen|torte|dessert|muffin|keks|plätzchen|pudding|eis\b|tiramisu|crêpe|pfannkuchen|waffel|brownie|cookie|mousse|süß/.test(txt);
  const meat = /fleisch|hähnchen|huhn|rind|schwein|speck|schinken|wurst|lachs|fisch|garnele|thunfisch|hack|pute|lamm|ente|chicken|beef|pork|bacon|salmon/.test(txt);
  const cu = Object.keys(CUISINES).find(k => (x.cuisine || "").includes(k.slice(0, 5))) ||
    (/khachapuri|lobio|chkmeruli|pkhali|khinkali|georgi/.test(txt) ? "georgisch" : /pasta|spaghetti|risotto|pizza|lasagne|parmesan|italien/.test(txt) ? "italienisch" : /soja|wok|curry|ramen|sushi|miso|teriyaki|kimchi|thai|asia/.test(txt) ? "asiatisch" : /taco|tortilla|burrito|enchilada|mexi/.test(txt) ? "mexikanisch" : "international");
  const r = { ...blank(), title: x.title, description: x.description, servings: x.servings, time: x.time, cuisine: cu, ingredients, steps: x.steps || [], tags: [sweet ? "sweet" : "savory", ...(meat ? [] : ["veggie"])], source };
  if (x.nutrition?.kcal) r.nutrition = { ...x.nutrition, source: "web" };
  else { const n = N.estimate(ingredients, r.servings); r.nutrition = { kcal: n.kcal, protein: n.protein, carbs: n.carbs, fat: n.fat, source: "local", known: n.known, total: n.total }; }
  r.emoji = sweet ? "🍰" : /suppe|eintopf|dal|curry/.test(txt) ? "🍲" : /salat/.test(txt) ? "🥗" : /pasta|spaghetti|nudel/.test(txt) ? "🍝" : meat ? "🍗" : "🍽️";
  return r;
}

function openLink() {
  const sh = openSheet(`<h2>Link einfügen</h2><p class="lead">Rezeptseite öffnen, Link kopieren, hier einfügen. Fertig.</p>
    <div class="field" style="display:flex;gap:8px"><input class="inp" id="url" type="url" inputmode="url" placeholder="https://www.chefkoch.de/rezepte/…" autocomplete="off">
    <button class="round" data-l="paste" aria-label="Einfügen" style="width:54px;height:54px">${ic("clip")}</button></div>
    <button class="btn btn-light btn-block" data-l="go">${ic("download")} Rezept holen</button>
    <p class="hint" style="margin-top:14px">Funktioniert mit fast allen großen Rezeptseiten (Chefkoch, EAT SMARTER, Kitchen Stories, Lecker, BBC Good Food …). ${aiOn() ? "Die KI übersetzt, räumt auf und rechnet Nährwerte." : "Mit KI-Zugang wird zusätzlich übersetzt und aufgeräumt."}</p>`);
  const inp = $("#url", sh);
  setTimeout(() => inp.focus(), 350);
  sh.addEventListener("click", async e => {
    const l = e.target.closest("[data-l]")?.dataset.l; if (!l) return;
    if (l === "paste") { try { inp.value = (await navigator.clipboard.readText()).trim(); } catch { toast("Einfügen nicht erlaubt, bitte manuell einfügen"); } return; }
    const url = (inp.value.match(/https?:\/\/\S+/) || [inp.value.trim()])[0];
    if (!/^https?:\/\//.test(url)) { toast("Bitte einen vollständigen Link einfügen"); return; }
    closeTop();
    const stop = loading(["Besuche die Seite …", "Suche das Rezept …", aiOn() ? "Übersetze & räume auf …" : "Übernehme Zutaten …", "Fast fertig …"]);
    try {
      const res = await api("import", { mode: "url", url });
      const draft = res.raw ? fromRaw(res.recipe, res.source) : fromAI(res.recipe, res.source);
      stop();
      openEditor(draft, { photo: res.photo ? await dataURLToBlob(res.photo) : null });
    } catch (err) { stop(); toast(err.message, 5000); }
  });
  inp.addEventListener("keydown", e => { if (e.key === "Enter") $("[data-l=go]", sh).click(); });
}

/* ---------- Spracheingabe ---------- */
function openVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const el = openLayer(`<div class="voice">
    <div class="bar"><button class="round" data-v="x" aria-label="Schließen">${ic("x")}</button><h2></h2><span style="width:46px"></span></div>
    <div class="voice-main">
      <h2>Erzähl mir dein Rezept</h2>
      <p class="lead">${SR ? "Tippe auf den Knopf und sprich los, ganz locker:" : "Tippe ins Feld und nutze das Mikro deiner Tastatur zum Diktieren:"} <i>„Ich hab 300 Gramm Nudeln gekocht, dann zwei Knoblauchzehen in Olivenöl angebraten …“</i></p>
      <canvas id="vwave"></canvas>
      <textarea class="inp" id="vtext" placeholder="${SR ? "Hier erscheint, was du sagst. Du kannst auch tippen." : "Hier diktieren oder tippen …"}"></textarea>
    </div>
    <div class="voice-ctrl">
      ${SR ? `<button class="recbtn" data-v="rec" aria-label="Aufnahme"><i>${ic("mic")}</i></button>` : ""}
      <button class="btn btn-light" data-v="go">${ic("spark")} Rezept erstellen</button>
    </div></div>`);
  const box = $(".voice", el), ta = $("#vtext", el), cv = $("#vwave", el);
  let rec = null, on = false, base = "", level = 0.15, raf;

  // Siri-artige Welle
  const ctx = cv.getContext("2d");
  const fit = () => { const r = cv.getBoundingClientRect(); cv.width = r.width * devicePixelRatio; cv.height = r.height * devicePixelRatio; };
  fit();
  const cols = ["#a59af8", "#307af4", "#ffb923", "#f66515", "#f89abf", "#3fbf9f"];
  let t = 0;
  const frame = () => {
    t += 0.045; const w = cv.width, h = cv.height, mid = h / 2;
    level += ((on ? 0.55 + Math.random() * 0.45 : 0.08) - level) * 0.08;
    ctx.clearRect(0, 0, w, h); ctx.globalCompositeOperation = "lighter";
    cols.forEach((c, k) => {
      const amp = h * 0.38 * level * (0.5 + 0.5 * Math.sin(t * 0.7 + k));
      const freq = 1.6 + k * 0.35, ph = t * (1 + k * 0.2) + k;
      const g = ctx.createLinearGradient(0, 0, w, 0); g.addColorStop(0, c + "00"); g.addColorStop(0.5, c + "cc"); g.addColorStop(1, c + "00");
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, mid);
      for (let x = 0; x <= w; x += 4) { const p = x / w; const env = Math.sin(Math.PI * p) ** 2; ctx.lineTo(x, mid - Math.sin(p * Math.PI * freq + ph) * amp * env); }
      for (let x = w; x >= 0; x -= 4) { const p = x / w; const env = Math.sin(Math.PI * p) ** 2; ctx.lineTo(x, mid + Math.sin(p * Math.PI * freq + ph) * amp * env * 0.6); }
      ctx.closePath(); ctx.fill();
    });
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(255,255,255,.75)"; ctx.fillRect(w * 0.1, mid - 0.75 * devicePixelRatio, w * 0.8, 1.5 * devicePixelRatio);
    raf = requestAnimationFrame(frame);
  };
  frame();

  const start = () => {
    rec = new SR(); rec.lang = "de-DE"; rec.continuous = true; rec.interimResults = true;
    base = ta.value ? ta.value.trim() + " " : "";
    rec.onresult = ev => {
      let fin = "", int = "";
      for (let k = 0; k < ev.results.length; k++) (ev.results[k].isFinal ? (fin += ev.results[k][0].transcript + " ") : (int += ev.results[k][0].transcript));
      ta.value = base + fin + int; ta.scrollTop = ta.scrollHeight;
    };
    rec.onerror = ev => { if (ev.error === "not-allowed") { toast("Mikrofon-Zugriff verweigert"); stopRec(); } };
    rec.onend = () => { if (on) { base = ta.value.trim() + " "; try { rec.start(); } catch {} } };
    try { rec.start(); on = true; box.classList.add("rec"); } catch { toast("Aufnahme konnte nicht starten"); }
  };
  const stopRec = () => { on = false; box.classList.remove("rec"); try { rec?.stop(); } catch {} };
  el.onclose = () => { stopRec(); cancelAnimationFrame(raf); };

  el.addEventListener("click", async e => {
    const v = e.target.closest("[data-v]")?.dataset.v; if (!v) return;
    if (v === "x") closeTop();
    if (v === "rec") on ? stopRec() : start();
    if (v === "go") {
      stopRec();
      const text = ta.value.trim();
      if (text.length < 10) { toast("Erzähl mir noch ein bisschen mehr 🙂"); return; }
      if (aiOn()) {
        const stop = loading(["Höre noch mal rein …", "Sortiere Zutaten und Mengen …", "Schreibe die Schritte …", "Schätze die Nährwerte …"]);
        try { const res = await api("import", { mode: "text", text }); stop(); closeTop(); setTimeout(() => openEditor(fromAI(res.recipe, res.source)), 260); }
        catch (err) { stop(); toast(err.message, 4500); }
      } else {
        closeTop(); setTimeout(() => openEditor(localFromText(text), { note: "Ohne KI grob vorsortiert: Mengenangaben → Zutaten, der Rest → Schritte. Bitte kurz drüberschauen." }), 260);
      }
    }
  });
}
// Fallback ohne KI: Sätze mit Mengen werden Zutaten, der Rest Schritte.
function localFromText(text) {
  const words = { ein: 1, eine: 1, einen: 1, zwei: 2, drei: 3, vier: 4, fünf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9, zehn: 10, halbe: 0.5, halben: 0.5 };
  const norm = text.replace(/\b(ein|eine|einen|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|halbe|halben)\b(?=\s+(gramm|g|kilo|ml|liter|esslöffel|teelöffel|el|tl|prise|dose|bund|zehe|zehen|stück|becher|tasse))/gi, m => words[m.toLowerCase()])
    .replace(/(\d)\s*gramm/gi, "$1 g").replace(/esslöffel/gi, "EL").replace(/teelöffel/gi, "TL");
  const parts = norm.split(/(?<=[.!?])\s+|\s+(?:dann|danach|anschließend|und dann)\s+/i).map(s => s.trim()).filter(Boolean);
  const ingredients = [], steps = [];
  for (const p of parts) {
    const found = [...p.matchAll(/(\d+(?:[.,]\d+)?)\s*(g|kg|ml|l|EL|TL|Prise|Dose|Dosen|Bund|Zehen?|Stück|Becher)?\s+([A-ZÄÖÜa-zäöüß-]+(?:\s+[A-ZÄÖÜ][a-zäöüß-]+)?)/g)];
    let any = false;
    for (const m of found) { const ing = N.parseLine(`${m[1]} ${m[2] || ""} ${m[3]}`); if (ing && N.findEntry(ing.name)) { ingredients.push(ing); any = true; } }
    if (p.split(" ").length > 3 || !any) steps.push(p.charAt(0).toUpperCase() + p.slice(1));
  }
  const r = { ...blank(), title: "", ingredients, steps, source: { type: "voice" } };
  const n = N.estimate(ingredients, r.servings);
  r.nutrition = { kcal: n.kcal, protein: n.protein, carbs: n.carbs, fat: n.fat, source: "local", known: n.known, total: n.total };
  return r;
}

/* ---------- Editor ---------- */
function openEditor(r, opt = {}) {
  const isNew = !byId(r.id);
  let photo = opt.photo || null; // neues Foto (Blob)
  const shot = opt.shot || null;
  const el = openLayer("");
  const ingText = () => (r.ingredients || []).map(g => [amt(g.amount, g.unit), g.name].filter(Boolean).join(" ")).join("\n");
  const photoURL = () => photo ? URL.createObjectURL(photo) : S.photos.get(r.id);
  const n = r.nutrition || {};
  $(".layer-inner", el).innerHTML = `
    <div class="bar solid"><button class="round" data-e="x" aria-label="Abbrechen">${ic("x")}</button><h2>${isNew ? "Neues Rezept" : "Bearbeiten"}</h2><button class="round" data-e="save" aria-label="Speichern" style="background:var(--cream);color:var(--ink)">${ic("check")}</button></div>
    <div class="ed">
      ${opt.note ? `<div class="banner">${ic("spark")}<span>${esc(opt.note)}</span></div>` : ""}
      ${r.source?.type === "screenshot" || r.source?.type === "voice" || r.source?.type === "web" ? `<div class="banner">${ic("spark")}<span>${r.source.type === "web" ? "Von " + esc(r.source.site) + " importiert." : r.source.type === "voice" ? "Aus deiner Sprachaufnahme erstellt." : "Aus deinem Screenshot ausgelesen."} Kurz checken und speichern.</span></div>` : ""}
      <button class="photo-pick" data-e="photo"><span class="cover" id="ed-cover">${photoURL() ? `<img src="${photoURL()}" alt="">` : `<div class="orb" style="${orbStyle(r)}"><i id="ed-emoji">${esc(r.emoji)}</i></div>`}</span><span class="pp-label">${ic("camera")} ${photoURL() ? "Foto ändern" : "Foto vom Gericht"}</span></button>
      ${shot ? `<button class="btn btn-ghost btn-sm btn-block" data-e="useshot" style="margin:-6px 0 18px">${ic("image")} Screenshot als Foto verwenden</button>` : ""}
      <div class="field"><label>Titel</label><input class="inp" name="title" value="${esc(r.title)}" placeholder="z. B. Omas Gulasch"></div>
      <div class="row-2" style="grid-template-columns:90px 1fr">
        <div class="field"><label>Emoji</label><input class="inp" name="emoji" value="${esc(r.emoji)}" maxlength="4" style="text-align:center;font-size:22px;padding:10px"></div>
        <div class="field"><label>Küche</label><select class="inp" name="cuisine">${Object.entries(CUISINES).map(([k, [nm, f]]) => `<option value="${k}" ${r.cuisine === k ? "selected" : ""}>${f} ${nm}</option>`).join("")}</select></div>
      </div>
      <div class="field"><label>Kurzbeschreibung</label><input class="inp" name="description" value="${esc(r.description)}" placeholder="Ein Satz, der Hunger macht"></div>
      <div class="row">
        <div class="field"><label>Portionen</label><input class="inp" name="servings" type="number" inputmode="numeric" min="1" value="${r.servings || 2}"></div>
        <div class="field"><label>Zeit (Min.)</label><input class="inp" name="time" type="number" inputmode="numeric" min="0" value="${r.time || ""}"></div>
        <div class="field"><label>Level</label><select class="inp" name="difficulty">${["leicht", "mittel", "anspruchsvoll"].map(d => `<option ${r.difficulty === d ? "selected" : ""}>${d}</option>`).join("")}</select></div>
      </div>
      <div class="field"><span class="lbl">Rubriken</span><div class="tagpick">${Object.entries(TAGS).map(([k, v]) => `<button class="chip ${r.tags?.includes(k) ? "on" : ""}" data-tag="${k}">${v}</button>`).join("")}</div>
        <p class="hint">„Wenig Kalorien“, „Viel Protein“ und „Unter 25 Min.“ werden automatisch aus Nährwerten und Zeit erkannt.</p></div>
      <div class="field"><label>Zutaten · eine pro Zeile</label><textarea class="inp" name="ingredients" rows="8" placeholder="200 g Spaghetti&#10;2 Zehen Knoblauch&#10;3 EL Olivenöl">${esc(ingText())}</textarea></div>
      <div class="field"><label>Zubereitung · ein Schritt pro Zeile</label><textarea class="inp" name="steps" rows="8" placeholder="Nudeln kochen.&#10;Knoblauch in Öl anbraten.">${esc((r.steps || []).join("\n"))}</textarea></div>
      <div class="field"><span class="lbl">Nährwerte pro Portion</span>
        <div class="row-4">${[["kcal", "kcal"], ["protein", "Protein g"], ["carbs", "KH g"], ["fat", "Fett g"]].map(([k, l]) => `<div><input class="inp" name="n_${k}" type="number" inputmode="numeric" value="${n[k] ?? ""}"><div class="mini">${l}</div></div>`).join("")}</div>
        <button class="btn btn-ghost btn-sm btn-block" data-e="calc" style="margin-top:10px">${ic("spark")} ${aiOn() ? "Mit KI berechnen" : "Automatisch berechnen"}</button>
        <p class="hint" id="calc-hint">${n.source === "ai" ? "✨ KI-Schätzung" : n.source === "web" ? "Werte von der Quelle" : n.total ? `Lokal geschätzt · ${n.known}/${n.total} Zutaten erkannt` : ""}</p></div>
      <div class="field"><label>Notizen & Tipps</label><textarea class="inp" name="notes" rows="3" placeholder="Varianten, Beilagen, was beim nächsten Mal anders …">${esc(r.notes || "")}</textarea></div>
      <button class="btn btn-light btn-block" data-e="save">${ic("check")} Speichern</button>
    </div>`;
  let nSource = n.source || null, nMeta = { known: n.known, total: n.total };
  const val = k => $(`[name=${k}]`, el).value;
  $$("[name^=n_]", el).forEach(i => i.addEventListener("input", () => { nSource = "manual"; $("#calc-hint", el).textContent = "Eigene Angabe"; }));
  $("[name=emoji]", el).addEventListener("input", e => { const em = $("#ed-emoji", el); if (em) em.textContent = e.target.value; });
  const collect = () => {
    r.title = val("title").trim() || "Ohne Titel";
    r.emoji = val("emoji").trim() || "🍽️";
    r.cuisine = val("cuisine"); r.description = val("description").trim();
    r.servings = Math.max(1, parseInt(val("servings")) || 1); r.time = parseInt(val("time")) || 0; r.difficulty = val("difficulty");
    r.tags = $$("[data-tag].on", el).map(b => b.dataset.tag);
    r.ingredients = val("ingredients").split("\n").map(N.parseLine).filter(Boolean);
    r.steps = val("steps").split("\n").map(s => s.replace(/^\s*\d+[.)]\s*/, "").trim()).filter(Boolean);
    r.notes = val("notes").trim();
    const nv = k => parseInt(val("n_" + k)) || 0;
    r.nutrition = { kcal: nv("kcal"), protein: nv("protein"), carbs: nv("carbs"), fat: nv("fat"), source: nSource || "manual", ...nMeta };
  };
  el.addEventListener("click", async e => {
    const tag = e.target.closest("[data-tag]"); if (tag) { tag.classList.toggle("on"); return; }
    const a = e.target.closest("[data-e]")?.dataset.e; if (!a) return;
    if (a === "x") { closeTop(); return; }
    if (a === "photo" || a === "useshot") {
      try {
        if (a === "useshot") photo = shot;
        else { const [f] = await pickFile($("#pick-photo")); if (!f) return; photo = await compressImage(f, 1400, 0.82); }
        $("#ed-cover", el).innerHTML = `<img src="${URL.createObjectURL(photo)}" alt="">`;
        $(".pp-label", el).innerHTML = `${ic("camera")} Foto ändern`;
      } catch (err) { toast(err.message); }
    }
    if (a === "calc") {
      collect();
      const setN = (x, src) => { ["kcal", "protein", "carbs", "fat"].forEach(k => { $(`[name=n_${k}]`, el).value = x[k]; }); nSource = src; };
      if (!r.ingredients.length) { toast("Erst Zutaten eintragen"); return; }
      if (aiOn()) {
        const stop = loading(["Wiege Zutaten ab …", "Rechne Makros …"]);
        try {
          const { nutrition: x } = await api("nutrition", { ingredients: val("ingredients").split("\n").filter(Boolean), servings: r.servings });
          setN(x, "ai"); nMeta = {}; $("#calc-hint", el).textContent = "✨ KI-Schätzung" + (x.note ? ": " + x.note : "");
        } catch (err) { toast(err.message, 4000); } finally { stop(); }
      } else {
        const x = N.estimate(r.ingredients, r.servings); setN(x, "local"); nMeta = { known: x.known, total: x.total };
        $("#calc-hint", el).textContent = `Lokal geschätzt · ${x.known}/${x.total} Zutaten erkannt` + (x.unknown.length ? ` · unbekannt: ${x.unknown.slice(0, 4).join(", ")}` : "");
      }
    }
    if (a === "save") {
      collect();
      if (!r.ingredients.length && !r.steps.length && r.title === "Ohne Titel") { toast("Gib dem Rezept wenigstens einen Titel"); return; }
      if (!r.nutrition.kcal && r.ingredients.length) {
        const x = N.estimate(r.ingredients, r.servings);
        r.nutrition = { kcal: x.kcal, protein: x.protein, carbs: x.carbs, fat: x.fat, source: "local", known: x.known, total: x.total };
      }
      r.createdAt = r.createdAt || Date.now(); r.updatedAt = Date.now();
      await dbPut(r);
      if (photo) { await photoPut(r.id, photo); if (S.photos.has(r.id)) URL.revokeObjectURL(S.photos.get(r.id)); S.photos.set(r.id, URL.createObjectURL(photo)); }
      await loadAll(); render();
      closeTop();
      if (opt.onSave) opt.onSave(); else setTimeout(() => openDetail(r.id), 280);
      toast(isNew ? "Im Kochbuch gespeichert 🍳" : "Gespeichert");
    }
  });
}

/* ---------- Backup ---------- */
async function exportBackup() {
  const photos = {};
  for (const id of await photoKeys()) photos[id] = await blobToDataURL(await photoGet(id));
  const data = { app: "kochbuch", version: 1, exported: new Date().toISOString(), recipes: S.recipes, photos, log: ls.get("log", []) };
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const name = `kochbuch-backup-${dateKey(new Date())}.json`;
  const file = new File([blob], name, { type: "application/json" });
  if (navigator.canShare?.({ files: [file] })) { try { await navigator.share({ files: [file], title: "Kochbuch-Backup" }); return; } catch {} }
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
async function importBackup() {
  const [f] = await pickFile($("#pick-backup")); if (!f) return;
  try {
    const data = JSON.parse(await f.text());
    if (data.app !== "kochbuch" || !Array.isArray(data.recipes)) throw new Error("Das ist kein Kochbuch-Backup.");
    for (const r of data.recipes) await dbPut(r);
    for (const [id, d] of Object.entries(data.photos || {})) await photoPut(id, await dataURLToBlob(d));
    if (Array.isArray(data.log)) { const log = ls.get("log", []); ls.set("log", [...log, ...data.log.filter(e => !log.some(x => x.id === e.id && x.date === e.date))]); }
    await loadAll(); render(); toast(`${data.recipes.length} Rezepte geladen ✓`);
  } catch (e) { toast(e.message || "Backup konnte nicht gelesen werden", 4000); }
}

/* ---------- Ereignisse ---------- */
document.addEventListener("click", async e => {
  if (e.target.closest(".layer, .sheet")) return;
  const nav = e.target.closest("[data-nav]");
  if (nav) { go(nav.dataset.nav, nav.dataset.nav === "list" ? { filter: null, query: "" } : {}); return; }
  const fl = e.target.closest("[data-filter]");
  if (fl) { S.filter = fl.dataset.filter || null; if (S.view !== "list") S.query = ""; go("list"); return; }
  const op = e.target.closest("[data-open]");
  if (op) { openDetail(op.dataset.open); return; }
  const day = e.target.closest("[data-day]");
  if (day) { S.weekSel = day.dataset.day; drawWeek(); return; }
  const act = e.target.closest("[data-act]")?.dataset.act;
  if (act === "add") { e.preventDefault(); openAdd(); }
  if (act === "save-code") { ls.set("code", $("#code").value.trim()); S.ai.checked = false; render(); await checkAI(); render(); toast(aiOn() ? "KI ist startklar ✨" : S.ai.ready ? "Code stimmt nicht" : "KI auf dem Server noch nicht eingerichtet", 3200); }
  if (act === "export") exportBackup();
  if (act === "import-backup") importBackup();
  if (act === "reseed") { await seed(true); await loadAll(); render(); toast("Startrezepte sind wieder da"); }
});
document.addEventListener("input", e => {
  if (e.target.id === "home-search") { S.query = e.target.value; S.filter = null; go("list"); const i = $("#list-search"); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
  if (e.target.id === "list-search") {
    S.query = e.target.value; const pos = e.target.selectionStart; render();
    const i = $("#list-search"); i.focus(); i.setSelectionRange(pos, pos);
  }
});
$("#fab").addEventListener("click", openAdd);
window.addEventListener("resize", () => { if (S.view === "home") drawWeek(); });

/* ---------- Start ---------- */
(async () => {
  try {
    db = await openDB();
    await loadAll(); await seed(false); await loadAll();
  } catch (e) { $("#view").innerHTML = `<div class="empty">Speicher nicht verfügbar (privater Modus?).<br>${esc(e.message)}</div>`; return; }
  render();
  checkAI().then(() => { if (S.view === "settings") render(); });
  if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("/kochbuch/sw.js", { scope: "/kochbuch/" }).catch(() => {});
})();
})();
