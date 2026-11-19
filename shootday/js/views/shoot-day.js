// Shoot day view. Phase 1: header, phase stepper, location, notes.
// Autopilot modules (travel, weather, sun, power/storage, packlist) arrive in phase 2
// and are shown as placeholders so the final layout is already visible.

import { get, saveShoot } from '../db.js';
import {
  esc, icon, aurora, SHOOT_TYPES, MODES, IO, PHASES, paletteStyle,
  fmtDateLong, relativeDay, durationMin, fmtDuration, toast,
} from '../ui.js';

function mapsUrl(loc) {
  if (loc.lat != null && loc.lon != null) return `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lon}`;
  const q = [loc.label, loc.address].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

function phaseStepper(current) {
  const idx = PHASES.findIndex((p) => p.id === current);
  return `<div class="phases" role="group" aria-label="Status">
    ${PHASES.map((p, i) => {
      const cls = i === idx ? 'current orb' : i < idx ? 'done' : '';
      const n = i < idx ? icon('check', 16, 2.2) : i + 1;
      return `<button class="phase-btn ${cls}" data-phase="${p.id}" aria-pressed="${i === idx}"><span class="n">${n}</span>${esc(p.label)}</button>`;
    }).join('')}
  </div>`;
}

const locked = (ico, title, value, sub, wide = false) => `
  <div class="card tile locked${wide ? ' wide' : ''}">
    <div class="t-head"><span>${esc(title)}</span>${icon(ico, 18)}</div>
    <div class="t-val">${esc(value)}</div>
    <div class="t-sub">${esc(sub)}</div>
  </div>`;

export async function render(page, { id }) {
  const shoot = await get('shoots', id);
  if (!shoot) { location.replace('#/'); return; }
  const t = SHOOT_TYPES[shoot.type] || SHOOT_TYPES.custom;
  const dur = durationMin(shoot.callTime, shoot.wrapTime);

  page.innerHTML = `
    <div class="glow-card day-hero" style="${paletteStyle(shoot.type)}">
      ${aurora()}<div class="horizon"></div>
      <div class="hero-top">
        <a class="icon-btn glass" href="#/" aria-label="Zurück">${icon('back')}</a>
        <a class="icon-btn glass" href="#/shoot/${esc(shoot.id)}/edit" aria-label="Bearbeiten">${icon('edit', 20)}</a>
      </div>
      <h1>${esc(shoot.title)}</h1>
      <p class="sub">${esc(fmtDateLong(shoot.date))} · ${esc(relativeDay(shoot.date))}</p>
      <div class="hero-meta">
        <div><small>Call</small><b>${esc(shoot.callTime)}</b></div>
        <div><small>Wrap</small><b>${esc(shoot.wrapTime)}</b></div>
        <div><small>Dauer</small><b>${esc(fmtDuration(dur))}</b></div>
      </div>
    </div>

    <div class="chips" style="margin-top:14px">
      <span class="chip">${icon(t.icon, 16)} ${esc(t.label)}</span>
      <span class="chip">${icon(MODES[shoot.mode]?.icon, 16)} ${esc(MODES[shoot.mode]?.label)}</span>
      <span class="chip">${icon(IO[shoot.indoorOutdoor]?.icon, 16)} ${esc(IO[shoot.indoorOutdoor]?.label)}</span>
      ${shoot.client ? `<span class="chip">${icon('user', 16)} ${esc(shoot.client)}</span>` : ''}
    </div>

    <div class="section-head"><h3>Status</h3></div>
    <div data-phases>${phaseStepper(shoot.phase)}</div>

    <div class="section-head"><h3>Location</h3></div>
    <a class="card loc-card" href="${esc(mapsUrl(shoot.location))}" target="_blank" rel="noopener">
      <span class="pin orb">${icon('pin', 22)}</span>
      <span class="row-body"><b>${esc(shoot.location.label)}</b><span>${esc(shoot.location.address || 'Keine Adresse hinterlegt')}</span></span>
      <span class="row-end">${icon('arrowUpRight', 18)}</span>
    </a>

    <div class="section-head"><h3>Autopilot</h3><span class="chip sm warn">Phase 2</span></div>
    <div class="tiles">
      ${locked('car', 'Abfahrt spätestens', '--:--', 'Fahrzeit + Puffer + Aufbau', true)}
      ${locked('cloud', 'Wetter', '–', 'stündlich für die Drehzeit')}
      ${locked('sun', 'Golden Hour', '–', 'Sonnenstand am Ort')}
      ${locked('battery', 'Akkus', '–', 'inkl. Reserve')}
      ${locked('card', 'Speicher', '– GB', 'Karten aus deinem Inventar')}
      ${locked('box', 'Packliste', '0 / 0', 'automatisch nach Typ, Wetter & Licht', true)}
    </div>

    ${shoot.notes ? `<div class="section-head"><h3>Notizen</h3></div><div class="card notes">${esc(shoot.notes)}</div>` : ''}
  `;

  const phasesEl = page.querySelector('[data-phases]');
  phasesEl.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-phase]');
    if (!b || b.dataset.phase === shoot.phase) return;
    shoot.phase = b.dataset.phase;
    // Phase 3 replaces this with a real backup checklist; for now the last phase marks backup as done.
    const backedUp = shoot.phase === 'backed-up';
    shoot.backup = { ...shoot.backup, done: backedUp, doneAt: backedUp ? new Date().toISOString() : null };
    await saveShoot(shoot);
    phasesEl.innerHTML = phaseStepper(shoot.phase);
    toast(`Status: ${PHASES.find((p) => p.id === shoot.phase).label}`);
  });
}
