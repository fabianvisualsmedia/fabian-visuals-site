// Packlist rule engine. No AI – template + mode + declarative rules + calculator quantities.
// Manual edits survive recalculation: manual items (auto:false) are kept,
// removed auto items are remembered in shoot.excluded, checked state is preserved.

export const CATEGORY_ORDER = ['camera', 'lens', 'audio', 'light', 'power', 'storage', 'grip', 'misc', 'personal'];
export const CATEGORY_LABELS = {
  camera: 'Kamera', lens: 'Objektive', audio: 'Audio', light: 'Licht', power: 'Strom',
  storage: 'Speicher', grip: 'Grip', misc: 'Sonstiges', personal: 'Persönlich',
};

const AUDIO_ONLY_VIDEO = ['lav-kit', 'shotgun', 'recorder', 'headphones', 'deadcat'];

// Mode adjustments on top of the template.
export const MODE_RULES = {
  photo: { remove: [...AUDIO_ONLY_VIDEO, 'gimbal'] },
  video: { add: ['headphones'] },
  hybrid: { add: [] },
};

const hhmm = (d) => d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
const outdoorish = (ctx) => ctx.shoot.indoorOutdoor !== 'indoor';

/**
 * Declarative rules. Extend freely:
 *  when(ctx)  → boolean
 *  add        → gear ids
 *  extras     → non-inventory items [{ label, category }]
 *  hint       → note shown in the day view
 *  reason(ctx)→ short German reason shown next to each added item
 */
export const RULES = [
  {
    id: 'rain-gear',
    when: (ctx) => ctx.weather && ctx.weather.rainProb >= 40 && outdoorish(ctx),
    add: ['rain-cover', 'towel', 'umbrella', 'gaffer'],
    reason: (ctx) => `Regen ${ctx.weather.rainProb} %`,
  },
  {
    id: 'after-dark',
    when: (ctx) => ctx.sun?.sunset && ctx.wrapAt > ctx.sun.sunset,
    add: ['led-panel', 'light-stand', 'light-battery', 'headlamp'],
    reason: (ctx) => `Wrap nach Sonnenuntergang (${hhmm(ctx.sun.sunset)})`,
  },
  {
    id: 'sunny-outdoor',
    when: (ctx) => ctx.weather?.sunny && outdoorish(ctx),
    add: ['nd-filter', 'sunscreen'],
    extras: [{ label: 'Gegenlichtblenden', category: 'misc' }],
    reason: () => 'sonnig & draußen',
  },
  {
    id: 'wind',
    when: (ctx) => ctx.weather && ctx.weather.windMax > 30 && outdoorish(ctx),
    add: ['deadcat', 'sandbags'],
    reason: (ctx) => `Wind bis ${ctx.weather.windMax} km/h`,
  },
  {
    id: 'cold',
    when: (ctx) => ctx.weather && ctx.weather.tempMin < 5,
    add: ['hand-warmers'],
    hint: 'Kalt: Akkus körpernah tragen, sie verlieren sonst schnell Laufzeit.',
    reason: (ctx) => `nur ${ctx.weather.tempMin} °C`,
  },
  {
    id: 'long-day',
    when: (ctx) => ctx.durationMin > 8 * 60,
    add: ['powerbank'],
    extras: [{ label: 'Verpflegung & Wasser', category: 'personal' }],
    reason: (ctx) => `${Math.round(ctx.durationMin / 60)} h Drehtag`,
  },
];

export const keyOf = (item) => item.itemId || `x:${item.label.toLowerCase()}`;

/**
 * Build the automatic part of the list.
 * ctx: { shoot, template, gear, weather (summary|null), sun (times|null), wrapAt (Date), durationMin, quantities: { [gearId]: n } }
 * Returns { items, hints }.
 */
export function autoItems(ctx) {
  const gearById = new Map(ctx.gear.map((g) => [g.id, g]));
  const out = new Map(); // key → item
  const hints = [];

  const addGear = (id, reason) => {
    const g = gearById.get(id);
    if (!g) return; // item not in inventory (deleted) → skip silently
    const cur = out.get(id) || { itemId: id, label: g.name, category: g.category, auto: true, reasons: [] };
    if (reason && !cur.reasons.includes(reason)) cur.reasons.push(reason);
    out.set(id, cur);
  };
  const addExtra = (x, reason) => {
    const k = `x:${x.label.toLowerCase()}`;
    const cur = out.get(k) || { itemId: null, label: x.label, category: x.category || 'personal', auto: true, reasons: [] };
    if (reason && !cur.reasons.includes(reason)) cur.reasons.push(reason);
    out.set(k, cur);
  };

  // 1. template
  (ctx.template?.items || []).forEach((id) => addGear(id));
  (ctx.template?.extras || []).forEach((x) => addExtra(x));

  // 2. mode
  const mode = MODE_RULES[ctx.shoot.mode] || {};
  (mode.remove || []).forEach((id) => out.delete(id));
  (mode.add || []).forEach((id) => addGear(id));

  // 3. rules
  for (const rule of RULES) {
    if (!rule.when(ctx)) continue;
    const reason = rule.reason(ctx);
    (rule.add || []).forEach((id) => addGear(id, reason));
    (rule.extras || []).forEach((x) => addExtra(x, reason));
    if (rule.hint) hints.push(rule.hint);
  }

  // 4. quantities from the calculator
  for (const [id, qty] of Object.entries(ctx.quantities || {})) {
    if (!qty) continue;
    if (!out.has(id)) addGear(id, 'Rechner');
    const it = out.get(id);
    if (it) it.qty = qty;
  }

  return { items: [...out.values()], hints };
}

/** Merge a fresh automatic list with the stored checklist (keeps manual items + checks). */
export function mergeChecklist(auto, previous = [], excluded = []) {
  const prev = new Map(previous.map((i) => [keyOf(i), i]));
  const skip = new Set(excluded);
  const merged = auto
    .filter((i) => !skip.has(keyOf(i)))
    .map((i) => ({ ...i, checked: prev.get(keyOf(i))?.checked || false }));
  const autoKeys = new Set(merged.map(keyOf));
  for (const p of previous) {
    if (!p.auto && !autoKeys.has(keyOf(p))) merged.push(p);
  }
  return sortChecklist(merged);
}

export function sortChecklist(list) {
  const idx = (c) => { const i = CATEGORY_ORDER.indexOf(c); return i < 0 ? 99 : i; };
  return [...list].sort((a, b) => idx(a.category) - idx(b.category) || a.label.localeCompare(b.label, 'de'));
}

/** Comparable fingerprint so we only write to the DB when something changed. */
export const fingerprint = (list) => JSON.stringify(list.map((i) => [keyOf(i), i.checked, i.qty || 0, i.reasons || [], i.auto]));
