// Settings: profile, appearance, travel defaults, reminder times. Auto-saves.

import { getSettings, setSetting, resetAll } from '../db.js';
import { applyTheme } from '../theme.js';
import { esc, icon, toast, confirmSheet } from '../ui.js';

const THEMES = { system: 'System', dark: 'Dunkel', light: 'Hell' };

export async function render(page) {
  const s = await getSettings();

  const num = (key, label, sub, unit, min = 0) => `
    <div class="set-row">
      <label for="s-${key}">${label}<small>${sub}</small></label>
      <span class="unit-input"><input class="input" id="s-${key}" data-key="${key}" type="number" inputmode="numeric" min="${min}" value="${esc(s[key])}">${unit}</span>
    </div>`;

  page.innerHTML = `
    <header>
      <p class="greeting">Alles bleibt lokal auf diesem Gerät</p>
      <h1 class="display">Einstellungen</h1>
    </header>

    <div class="section-head"><h3>Profil</h3></div>
    <div class="card set-group">
      <div class="set-row col">
        <label for="s-name">Dein Name<small>für die Begrüßung</small></label>
        <input class="input wide" id="s-name" data-key="name" value="${esc(s.name)}" autocomplete="given-name">
      </div>
    </div>

    <div class="section-head"><h3>Darstellung</h3></div>
    <div class="seg" role="group" aria-label="Farbmodus" data-theme-seg>
      ${Object.entries(THEMES).map(([k, l]) =>
        `<button type="button" data-val="${k}" aria-pressed="${k === s.theme}">${icon(k === 'light' ? 'sun' : k === 'dark' ? 'moon' : 'monitor', 18)} ${l}</button>`).join('')}
    </div>

    <div class="section-head"><h3>Anfahrt</h3></div>
    <div class="card set-group">
      <div class="set-row col">
        <label for="s-startAddress">Standard-Startadresse<small>Von hier aus planst du die Abfahrt</small></label>
        <input class="input wide" id="s-startAddress" data-key="startAddress" value="${esc(s.startAddress)}" placeholder="Straße, PLZ Ort" autocomplete="street-address">
      </div>
      ${num('bufferPct', 'Puffer', 'auf die Fahrzeit', '%')}
      ${num('bufferMinMin', 'Mindestpuffer', 'egal wie kurz die Fahrt', 'min')}
      ${num('setupMin', 'Aufbauzeit', 'vor der Call-Time vor Ort', 'min')}
    </div>

    <div class="section-head"><h3>Erinnerungen</h3></div>
    <div class="card set-group">
      <div class="set-row">
        <label for="s-evening">Vorabend-Check<small>Akkus laden, Karten leeren, packen</small></label>
        <input class="input" id="s-evening" data-key="eveningReminder" type="time" value="${esc(s.eveningReminder)}">
      </div>
      ${num('backupOffsetH', 'Backup-Reminder', 'Stunden nach Wrap', 'h')}
    </div>

    <div class="section-head"><h3>Daten</h3></div>
    <button class="btn block danger-ghost" data-reset>${icon('trash', 20)} Alles zurücksetzen</button>

    <p class="about">Shoot Day · Phase 1<br>Fabian Visuals</p>
  `;

  page.querySelector('[data-theme-seg]').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-val]');
    if (!b) return;
    page.querySelectorAll('[data-theme-seg] [data-val]').forEach((x) => x.setAttribute('aria-pressed', x === b));
    applyTheme(b.dataset.val);
    await setSetting('theme', b.dataset.val);
  });

  page.addEventListener('change', async (e) => {
    const key = e.target.dataset.key;
    if (!key) return;
    const raw = e.target.value;
    const value = e.target.type === 'number' ? Math.max(Number(e.target.min || 0), Number(raw) || 0) : raw.trim();
    if (e.target.type === 'number') e.target.value = value;
    await setSetting(key, value);
    toast('Gespeichert');
  });

  page.querySelector('[data-reset]').addEventListener('click', async () => {
    const ok = await confirmSheet({
      title: 'Alles zurücksetzen?',
      text: 'Alle Drehs, dein Equipment und die Einstellungen werden gelöscht. Das Start-Inventar wird neu angelegt.',
      confirm: 'Alles löschen',
    });
    if (!ok) return;
    await resetAll();
    applyTheme('system');
    toast('Zurückgesetzt');
    location.hash = '#/';
  });
}
