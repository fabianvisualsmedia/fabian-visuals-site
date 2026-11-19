// Create / edit a shoot. Minimal required fields, everything else defaults.

import { get, del, createShoot, saveShoot } from '../db.js';
import { esc, icon, aurora, SHOOT_TYPES, MODES, IO, paletteStyle, addDaysISO, todayISO, toast, confirmSheet, durationMin, fmtDuration } from '../ui.js';

const REQUIRED = ['title', 'date', 'callTime', 'wrapTime', 'locationLabel'];

function seg(name, options, value) {
  return `<div class="seg" role="group" data-seg="${name}">
    ${Object.entries(options).map(([k, o]) =>
      `<button type="button" data-val="${k}" aria-pressed="${k === value}">${icon(o.icon, 18)} ${esc(o.label)}</button>`).join('')}
  </div>`;
}

export async function render(page, { id }) {
  const existing = id ? await get('shoots', id) : null;
  if (id && !existing) { location.replace('#/'); return; }
  const shoot = existing || createShoot({ date: addDaysISO(todayISO(), 1) });
  const state = { type: shoot.type, mode: shoot.mode, indoorOutdoor: shoot.indoorOutdoor };

  page.innerHTML = `
    <div class="topbar">
      <a class="icon-btn" href="${existing ? `#/shoot/${esc(shoot.id)}` : '#/'}" aria-label="Zurück">${icon('back')}</a>
      <span class="topbar-title">${existing ? 'Dreh bearbeiten' : 'Neuer Dreh'}</span>
      <span style="width:52px"></span>
    </div>

    <form class="form" novalidate>
      <div class="field">
        <label for="f-title">Titel <span class="req">*</span></label>
        <input class="input" id="f-title" name="title" placeholder="z. B. Hochzeit Lisa & Tom" value="${esc(shoot.title)}" autocomplete="off">
      </div>

      <div class="field">
        <span class="label">Art des Drehs</span>
        <div class="type-grid" data-types>
          ${Object.entries(SHOOT_TYPES).map(([k, t]) => `
            <button type="button" class="type-opt" data-val="${k}" aria-pressed="${k === state.type}" style="${paletteStyle(k)}">
              ${aurora()}<span class="ico">${icon(t.icon, 18)}</span>${esc(t.label)}
            </button>`).join('')}
        </div>
      </div>

      <div class="field">
        <label for="f-client">Kunde</label>
        <input class="input" id="f-client" name="client" placeholder="optional" value="${esc(shoot.client)}" autocomplete="off">
      </div>

      <div class="field">
        <label for="f-date">Datum <span class="req">*</span></label>
        <input class="input" id="f-date" name="date" type="date" value="${esc(shoot.date)}">
      </div>

      <div class="grid-2">
        <div class="field">
          <label for="f-call">Call-Time <span class="req">*</span></label>
          <input class="input" id="f-call" name="callTime" type="time" value="${esc(shoot.callTime)}">
        </div>
        <div class="field">
          <label for="f-wrap">Wrap <span class="req">*</span></label>
          <input class="input" id="f-wrap" name="wrapTime" type="time" value="${esc(shoot.wrapTime)}">
        </div>
      </div>
      <p class="hint" data-duration></p>

      <div class="field">
        <label for="f-loc">Ort <span class="req">*</span></label>
        <input class="input" id="f-loc" name="locationLabel" placeholder="z. B. Schloss Drachenburg" value="${esc(shoot.location.label)}" autocomplete="off">
      </div>
      <div class="field">
        <label for="f-addr">Adresse</label>
        <input class="input" id="f-addr" name="address" placeholder="Straße, PLZ Ort (für Wetter & Sonne)" value="${esc(shoot.location.address)}" autocomplete="street-address">
      </div>

      <div class="field"><span class="label">Location</span>${seg('indoorOutdoor', IO, state.indoorOutdoor)}</div>
      <div class="field"><span class="label">Modus</span>${seg('mode', MODES, state.mode)}</div>

      <div class="field">
        <label for="f-notes">Notizen</label>
        <textarea class="input" id="f-notes" name="notes" placeholder="Ansprechpartner, Parken, Shotlist-Link …">${esc(shoot.notes)}</textarea>
      </div>

      <p class="error-text" data-error hidden></p>

      <button class="btn block orb" type="submit">${icon('check', 20, 2)} ${existing ? 'Speichern' : 'Dreh anlegen'}</button>
      ${existing ? `<button class="btn block danger-ghost" type="button" data-delete>${icon('trash', 20)} Dreh löschen</button>` : ''}
    </form>
  `;

  const form = page.querySelector('form');
  const fe = form.elements; // note: form.title would be the title attribute, so always go via elements
  const durEl = page.querySelector('[data-duration]');
  const updateDuration = () => {
    const c = fe.callTime.value, w = fe.wrapTime.value;
    durEl.textContent = c && w ? `Drehdauer: ${fmtDuration(durationMin(c, w))}${w <= c ? ' (endet nach Mitternacht)' : ''}` : '';
  };
  fe.callTime.addEventListener('input', updateDuration);
  fe.wrapTime.addEventListener('input', updateDuration);
  updateDuration();

  page.querySelector('[data-types]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-val]');
    if (!b) return;
    state.type = b.dataset.val;
    page.querySelectorAll('[data-types] [data-val]').forEach((x) => x.setAttribute('aria-pressed', x === b));
  });
  page.querySelectorAll('[data-seg]').forEach((g) => g.addEventListener('click', (e) => {
    const b = e.target.closest('[data-val]');
    if (!b) return;
    state[g.dataset.seg] = b.dataset.val;
    g.querySelectorAll('[data-val]').forEach((x) => x.setAttribute('aria-pressed', x === b));
  }));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const missing = REQUIRED.filter((n) => !fe[n].value.trim());
    REQUIRED.forEach((n) => fe[n].classList.toggle('invalid', missing.includes(n)));
    const err = page.querySelector('[data-error]');
    if (missing.length) {
      err.hidden = false;
      err.textContent = 'Bitte die markierten Felder ausfüllen.';
      fe[missing[0]].focus();
      return;
    }
    const addr = fe.address.value.trim();
    const addrChanged = addr !== shoot.location.address;
    const saved = await saveShoot({
      ...shoot,
      title: fe.title.value.trim(),
      client: fe.client.value.trim(),
      type: state.type,
      date: fe.date.value,
      callTime: fe.callTime.value,
      wrapTime: fe.wrapTime.value,
      location: {
        label: fe.locationLabel.value.trim(),
        address: addr,
        // coordinates are resolved by geocoding in phase 2; reset when the address changes
        lat: addrChanged ? null : shoot.location.lat,
        lon: addrChanged ? null : shoot.location.lon,
      },
      indoorOutdoor: state.indoorOutdoor,
      mode: state.mode,
      notes: fe.notes.value.trim(),
    });
    toast(existing ? 'Gespeichert' : 'Dreh angelegt');
    location.hash = `#/shoot/${saved.id}`;
  });

  page.querySelector('[data-delete]')?.addEventListener('click', async () => {
    const ok = await confirmSheet({ title: 'Dreh löschen?', text: `„${shoot.title}“ wird endgültig entfernt.`, confirm: 'Endgültig löschen' });
    if (!ok) return;
    await del('shoots', shoot.id);
    toast('Dreh gelöscht');
    location.hash = '#/';
  });
}
