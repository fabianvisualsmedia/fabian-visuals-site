// Gear inventory: stat pills, category tabs, quantity steppers, edit sheet.

import { all, get, put, del, newId } from '../db.js';
import { esc, icon, aurora, GEAR_CATEGORIES, openSheet, confirmSheet, toast } from '../ui.js';

let activeCat = 'all'; // remembered for the session

const STAT_PALETTES = [
  '--g1:#f89abf;--g2:#a59af8;--g3:#f66515', // warm
  '--g1:#2236cc;--g2:#307af4;--g3:#a59af8', // primary
  '--g1:#ffb923;--g2:#f66515;--g3:#fd290d', // hot
];

function meta(item) {
  const parts = [];
  if (item.category === 'power' && item.batteryRuntimeMin) parts.push(`${item.batteryRuntimeMin} min Laufzeit`);
  if (item.category === 'camera' && item.bitrateMbps) parts.push(`${item.bitrateMbps} Mbit/s`);
  if (item.category === 'storage' && item.capacityGB) parts.push(item.capacityGB >= 1000 ? `${item.capacityGB / 1000} TB` : `${item.capacityGB} GB`);
  if (item.tags?.length) parts.push(item.tags.map((t) => `#${t}`).join(' '));
  return parts.map((p) => `<span>${esc(p)}</span>`).join('');
}

function itemRow(item) {
  const c = GEAR_CATEGORIES[item.category] || GEAR_CATEGORIES.misc;
  return `
  <div class="card gear-item" data-id="${esc(item.id)}">
    <span class="ico">${icon(c.icon, 22)}</span>
    <button class="gear-main" data-edit aria-label="${esc(item.name)} bearbeiten">
      <b>${esc(item.name)}</b>
      <span>${meta(item)}${item.needsCheck ? `<span class="badge-check">${icon('alert', 13, 2)} Werte prüfen</span>` : ''}</span>
    </button>
    <div class="stepper">
      <button data-qty="-1" aria-label="weniger">${icon('minus', 18, 2)}</button>
      <output>${item.quantity}</output>
      <button data-qty="1" aria-label="mehr">${icon('plus', 18, 2)}</button>
    </div>
  </div>`;
}

function stats(items) {
  const sum = (cat) => items.filter((i) => i.category === cat).reduce((n, i) => n + (i.quantity || 0), 0);
  const gb = items.filter((i) => i.category === 'storage' && i.capacityGB && !i.tags?.includes('backup'))
    .reduce((n, i) => n + i.capacityGB * (i.quantity || 0), 0);
  const cells = [
    ['Bodies', sum('camera'), ''],
    ['Akkus', items.filter((i) => i.batteryRuntimeMin).reduce((n, i) => n + (i.quantity || 0), 0), ''],
    ['Karten', gb, 'GB'],
  ];
  return `<div class="stat-row">${cells.map(([label, v, unit], i) => `
    <div class="stat-pill" style="${STAT_PALETTES[i]}">${aurora()}
      <small>${label}</small><b>${v}${unit ? `<em>${unit}</em>` : ''}</b>
    </div>`).join('')}</div>`;
}

function listHtml(items) {
  if (activeCat !== 'all') {
    const subset = items.filter((i) => i.category === activeCat);
    return subset.length ? `<div class="stack" style="margin-top:10px">${subset.map(itemRow).join('')}</div>`
      : '<p class="hint" style="margin-top:20px;text-align:center">Noch nichts in dieser Kategorie.</p>';
  }
  return Object.entries(GEAR_CATEGORIES).map(([k, c]) => {
    const subset = items.filter((i) => i.category === k);
    if (!subset.length) return '';
    return `<div class="group-label"><span>${esc(c.label)}</span><span>${subset.length}</span></div>
      <div class="stack">${subset.map(itemRow).join('')}</div>`;
  }).join('');
}

function editSheet(item, onDone) {
  const isNew = !item;
  const draft = item ? { ...item } : { id: newId(), name: '', category: activeCat === 'all' ? 'misc' : activeCat, quantity: 1, tags: [], needsCheck: false };

  const conditional = (cat) => {
    if (cat === 'power') return numField('batteryRuntimeMin', 'Reale Laufzeit pro Akku', 'min', draft.batteryRuntimeMin);
    if (cat === 'camera') return numField('bitrateMbps', 'Bitrate (dein typisches Codec-Setting)', 'Mbit/s', draft.bitrateMbps);
    if (cat === 'storage') return numField('capacityGB', 'Kapazität', 'GB', draft.capacityGB);
    return '';
  };
  const numField = (name, label, unit, val) => `
    <div class="field"><label for="g-${name}">${label}</label>
      <div class="unit-input"><input class="input" id="g-${name}" name="${name}" type="number" inputmode="decimal" min="0" value="${val ?? ''}" style="width:100%">${unit}</div>
    </div>`;

  openSheet(`
    <h2>${isNew ? 'Neues Equipment' : 'Equipment bearbeiten'}</h2>
    <form class="form" novalidate>
      <div class="field"><label for="g-name">Name</label>
        <input class="input" id="g-name" name="itemName" value="${esc(draft.name)}" placeholder="z. B. Sony FX3" autocomplete="off"></div>
      <div class="field"><span class="label">Kategorie</span>
        <div class="chips" data-cats>${Object.entries(GEAR_CATEGORIES).map(([k, c]) =>
          `<button type="button" class="tab" data-val="${k}" aria-pressed="${k === draft.category}">${icon(c.icon, 16)} ${esc(c.label)}</button>`).join('')}</div></div>
      <div class="field"><label for="g-qty">Anzahl</label>
        <input class="input" id="g-qty" name="quantity" type="number" inputmode="numeric" min="0" value="${draft.quantity}"></div>
      <div data-cond>${conditional(draft.category)}</div>
      <div class="field"><label for="g-tags">Tags</label>
        <input class="input" id="g-tags" name="tags" value="${esc((draft.tags || []).join(', '))}" placeholder="rain, night, wind …" autocomplete="off">
        <p class="hint">Tags steuern später die Packlisten-Regeln (z. B. <b>rain</b>, <b>night</b>, <b>wind</b>, <b>cold</b>, <b>sun</b>).</p></div>
      <label class="check-row"><input type="checkbox" name="verified" ${draft.needsCheck ? '' : 'checked'}>
        <span class="check-box">${icon('check', 18, 2.4)}</span>Werte geprüft</label>
      <p class="error-text" data-error hidden>Bitte einen Namen eingeben.</p>
      <div class="sheet-actions">
        <button class="btn block orb" type="submit">${icon('check', 20, 2)} Speichern</button>
        ${isNew ? '' : `<button class="btn block danger-ghost" type="button" data-delete>${icon('trash', 20)} Löschen</button>`}
      </div>
    </form>`, (sheet, close) => {
    const form = sheet.querySelector('form');
    const fe = form.elements;
    sheet.querySelector('[data-cats]').addEventListener('click', (e) => {
      const b = e.target.closest('[data-val]');
      if (!b) return;
      draft.category = b.dataset.val;
      sheet.querySelectorAll('[data-cats] [data-val]').forEach((x) => x.setAttribute('aria-pressed', x === b));
      sheet.querySelector('[data-cond]').innerHTML = conditional(draft.category);
    });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = fe.itemName.value.trim();
      if (!name) { sheet.querySelector('[data-error]').hidden = false; fe.itemName.classList.add('invalid'); return; }
      const num = (n) => (fe[n] && fe[n].value !== '' ? Number(fe[n].value) : undefined);
      const out = {
        ...draft,
        name,
        quantity: Math.max(0, Math.round(num('quantity') ?? 0)),
        tags: fe.tags.value.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean),
        needsCheck: !fe.verified.checked,
      };
      // keep profile values only for the category they belong to
      delete out.batteryRuntimeMin; delete out.bitrateMbps; delete out.capacityGB;
      if (draft.category === 'power' && num('batteryRuntimeMin') != null) out.batteryRuntimeMin = num('batteryRuntimeMin');
      if (draft.category === 'camera' && num('bitrateMbps') != null) out.bitrateMbps = num('bitrateMbps');
      if (draft.category === 'storage' && num('capacityGB') != null) out.capacityGB = num('capacityGB');
      await put('gear', out);
      close();
      toast(isNew ? 'Hinzugefügt' : 'Gespeichert');
      onDone();
    });
    sheet.querySelector('[data-delete]')?.addEventListener('click', async () => {
      close();
      const ok = await confirmSheet({ title: 'Equipment löschen?', text: `„${draft.name}“ wird aus dem Inventar entfernt.` });
      if (!ok) return;
      await del('gear', draft.id);
      toast('Gelöscht');
      onDone();
    });
  });
}

export async function render(page) {
  const draw = async () => {
    const items = (await all('gear')).sort((a, b) => a.name.localeCompare(b.name, 'de'));
    const counts = Object.fromEntries(Object.keys(GEAR_CATEGORIES).map((k) => [k, items.filter((i) => i.category === k).length]));
    const toCheck = items.filter((i) => i.needsCheck).length;

    page.innerHTML = `
      <header>
        <p class="greeting">${items.length} Teile im Inventar</p>
        <h1 class="display">Equipment</h1>
      </header>
      ${stats(items)}
      ${toCheck ? `<p class="hint" style="margin-top:14px"><span class="badge-check">${icon('alert', 14, 2)} ${toCheck} Startwerte sind Platzhalter</span> – tipp aufs Item und trag deine echten Laufzeiten/Bitraten ein.</p>` : ''}
      <div class="tabs" role="group" aria-label="Kategorien">
        <button class="tab" data-cat="all" aria-pressed="${activeCat === 'all'}">Alle <span class="c">${items.length}</span></button>
        ${Object.entries(GEAR_CATEGORIES).map(([k, c]) =>
          `<button class="tab" data-cat="${k}" aria-pressed="${activeCat === k}">${esc(c.label)} <span class="c">${counts[k]}</span></button>`).join('')}
      </div>
      <div data-list>${listHtml(items)}</div>
      <button class="btn block ghost" data-add style="margin-top:18px">${icon('plus', 20, 2)} Equipment hinzufügen</button>
    `;
  };

  page.addEventListener('click', async (e) => {
    const tab = e.target.closest('[data-cat]');
    if (tab) { activeCat = tab.dataset.cat; await draw(); return; }
    if (e.target.closest('[data-add]')) { editSheet(null, draw); return; }
    const row = e.target.closest('[data-id]');
    if (!row) return;
    const item = await get('gear', row.dataset.id);
    if (e.target.closest('[data-edit]')) { editSheet(item, draw); return; }
    const q = e.target.closest('[data-qty]');
    if (q) {
      item.quantity = Math.max(0, (item.quantity || 0) + Number(q.dataset.qty));
      await put('gear', item);
      row.querySelector('output').textContent = item.quantity;
      // refresh stat pills without re-rendering the whole list (keeps scroll position)
      const fresh = await all('gear');
      page.querySelector('.stat-row').outerHTML = stats(fresh);
    }
  });

  await draw();
}
