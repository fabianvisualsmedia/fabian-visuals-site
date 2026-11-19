// Shoot day – the heart of the app. Top to bottom:
// departure, weather, sun timeline, batteries/storage, packlist, (phase 3: reminders, backup).
// Renders instantly from cache, then refreshes geocoding + weather in the background.

import { get, all, getSettings, saveShoot } from '../db.js';
import {
  esc, icon, aurora, SHOOT_TYPES, MODES, IO, PHASES, paletteStyle, toISODate,
  fmtDateLong, relativeDay, fmtDuration, fmtTime, daysUntil, parseDateTime, toast,
} from '../ui.js';
import { computeAutopilot } from '../logic/autopilot.js';
import { loadWeather, describeCode, FORECAST_DAYS } from '../logic/weather.js';
import { geocode } from '../logic/geocode.js';
import { routeUrl } from '../logic/travel.js';
import { compass } from '../logic/sun.js';
import { CATEGORY_LABELS, CATEGORY_ORDER, keyOf, fingerprint, sortChecklist } from '../logic/packlist.js';
import { storageLabel } from '../logic/power-storage.js';

const MAPS_SEARCH = 'https://www.google.com/maps/search/?api=1&query=';

function mapsUrl(loc) {
  if (loc.lat != null && loc.lon != null) return `${MAPS_SEARCH}${loc.lat},${loc.lon}`;
  return MAPS_SEARCH + encodeURIComponent([loc.label, loc.address].filter(Boolean).join(', '));
}

// ---------- Sections ----------

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

function departureCard(shoot, ap, settings) {
  const dep = ap.departure;
  const start = shoot.travel?.startAddress || settings.startAddress;
  const prevDay = dep && toISODate(dep.at) !== shoot.date;
  return `
  <section class="card depart">
    <div class="t-head"><span>Abfahrt spätestens</span>${icon('car', 18)}</div>
    <div class="depart-time">${dep ? fmtTime(dep.at) : '--:--'}${prevDay ? '<small>Vortag</small>' : ''}</div>
    <div class="t-sub">${dep
      ? `${dep.drive} min Fahrt + ${dep.buffer} min Puffer + ${dep.setup} min Aufbau`
      : 'Trag ein, wie lange du fährst – die App rechnet rückwärts ab Call-Time.'}</div>
    <div class="depart-row">
      <div class="stepper" data-drive>
        <button data-drive-step="-5" aria-label="5 Minuten weniger">${icon('minus', 18, 2)}</button>
        <label class="drive-field"><input type="number" inputmode="numeric" min="0" step="5" value="${shoot.travel?.driveMin ?? ''}" placeholder="–" aria-label="Fahrzeit in Minuten" data-drive-input><span>min</span></label>
        <button data-drive-step="5" aria-label="5 Minuten mehr">${icon('plus', 18, 2)}</button>
      </div>
      <a class="btn orb route-btn" href="${esc(routeUrl(shoot, start))}" target="_blank" rel="noopener">${icon('route', 20)} Route</a>
    </div>
    <p class="hint">${start ? `Start: ${esc(start)}` : 'Tipp: Startadresse in den Einstellungen hinterlegen.'}</p>
  </section>`;
}

function weatherSection(shoot, wx, ap) {
  const days = daysUntil(shoot.date);
  const stamp = wx.fetchedAt ? `Stand: ${new Date(wx.fetchedAt).toLocaleString('de-DE', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}` : '';
  const head = `<div class="section-head"><h3>Wetter</h3><span>${stamp}${days > 3 && ap.shootHours.length ? ' · <span class="chip sm warn">noch unsicher</span>' : ''}</span></div>`;

  const msg = {
    'no-location': 'Ort wird gesucht … Ohne Koordinaten kein Wetter und keine Sonnenzeiten.',
    'too-far': `Prognose gibt es erst ${FORECAST_DAYS} Tage vorher – ab ${wx.availableFrom ? new Date(wx.availableFrom).toLocaleDateString('de-DE') : 'später'}.`,
    past: 'Dreh liegt in der Vergangenheit.',
    offline: 'Gerade offline und noch kein Wetter gespeichert.',
  }[wx.status];
  if (msg || !ap.shootHours.length) return `${head}<div class="card notes muted">${esc(msg || 'Für die Drehzeit liegen noch keine Stunden vor.')}</div>`;

  const w = ap.weather;
  return `${head}
    <div class="wx-strip" role="list">
      ${ap.shootHours.map((h) => {
        const d = describeCode(h.code);
        const wet = h.rainProb >= 40;
        return `<div class="wx-hour${wet ? ' wet' : ''}" role="listitem">
          <small>${h.time.slice(11, 16)}</small>
          ${icon(d.icon, 22)}
          <b>${Math.round(h.temp)}°</b>
          <span>${icon('drop', 12, 2)}${h.rainProb}%</span>
        </div>`;
      }).join('')}
    </div>
    <div class="chips" style="margin-top:10px">
      <span class="chip sm${w.rainProb >= 40 ? ' warn' : ''}">${icon('drop', 14)} Regen max ${w.rainProb} %</span>
      <span class="chip sm${w.windMax > 30 ? ' warn' : ''}">${icon('wind', 14)} bis ${w.windMax} km/h</span>
      <span class="chip sm${w.tempMin < 5 ? ' warn' : ''}">${w.tempMin}–${w.tempMax} °C</span>
      ${wx.status === 'stale' ? '<span class="chip sm">offline · letzter Stand</span>' : ''}
    </div>`;
}

function sunSection(shoot, ap) {
  const head = '<div class="section-head"><h3>Licht</h3></div>';
  if (!ap.sun) return `${head}<div class="card notes muted">Sonnenzeiten erscheinen, sobald der Ort gefunden ist.</div>`;
  const s = ap.sun;
  const dayStart = parseDateTime(shoot.date, '00:00').getTime();
  const pct = (d) => Math.max(0, Math.min(100, ((d.getTime() - dayStart) / 864e5) * 100));
  const P = (d) => (d ? `${pct(d).toFixed(2)}%` : null);

  // hard-stop gradient: night | blue | golden | day | golden | blue | night
  const NIGHT = 'var(--sun-night)', BLUE = 'var(--sun-blue)', GOLD = 'var(--sun-gold)', DAY = 'var(--sun-day)';
  const stops = [];
  const seg = (color, a, b) => { if (a && b) stops.push(`${color} ${P(a)} ${P(b)}`); };
  stops.push(`${NIGHT} 0% ${P(s.dawn) || '0%'}`);
  if (s.blueMorning) seg(BLUE, ...s.blueMorning);
  if (s.goldenMorning) seg(GOLD, ...s.goldenMorning);
  if (s.goldenMorning && s.goldenEvening) seg(DAY, s.goldenMorning[1], s.goldenEvening[0]);
  if (s.goldenEvening) seg(GOLD, ...s.goldenEvening);
  if (s.blueEvening) seg(BLUE, ...s.blueEvening);
  stops.push(`${NIGHT} ${P(s.dusk) || '100%'} 100%`);

  const callP = pct(ap.callAt), wrapP = ap.wrapAt.getTime() - dayStart >= 864e5 ? 100 : pct(ap.wrapAt);
  const range = (r) => (r ? `${fmtTime(r[0])}–${fmtTime(r[1])}` : '–');
  const pos = ap.sunAtCall;

  return `${head}
  <div class="card sun-card">
    <div class="sun-bar" style="background:linear-gradient(90deg, ${stops.join(', ')})">
      <div class="sun-span" style="left:${callP}%;width:${Math.max(0.5, wrapP - callP)}%"></div>
      <span class="sun-mark" style="left:${callP}%"><em>Call ${esc(shoot.callTime)}</em></span>
      <span class="sun-mark end" style="left:${wrapP}%"><em>Wrap ${esc(shoot.wrapTime)}</em></span>
    </div>
    <div class="sun-scale"><span>0</span><span>6</span><span>12</span><span>18</span><span>24</span></div>
    <div class="sun-grid">
      <div>${icon('sunrise', 18)}<small>Sonnenaufgang</small><b>${fmtTime(s.sunrise)}</b></div>
      <div>${icon('sunset', 18)}<small>Sonnenuntergang</small><b>${fmtTime(s.sunset)}</b></div>
      <div class="gold"><i></i><small>Golden Hour morgens</small><b>${range(s.goldenMorning)}</b></div>
      <div class="gold"><i></i><small>Golden Hour abends</small><b>${range(s.goldenEvening)}</b></div>
      <div class="blue"><i></i><small>Blue Hour morgens</small><b>${range(s.blueMorning)}</b></div>
      <div class="blue"><i></i><small>Blue Hour abends</small><b>${range(s.blueEvening)}</b></div>
    </div>
    <p class="hint">Bei Call: Sonne ${pos.altitude < 0 ? 'unter dem Horizont' : `${Math.round(pos.altitude)}° hoch`} aus ${compass(pos.azimuth)} (${Math.round(pos.azimuth)}°) · Höchststand ${Math.round(s.noonAltitude)}° um ${fmtTime(s.solarNoon)}</p>
  </div>`;
}

function powerSection(ap) {
  const st = ap.storage, b = ap.batteries;
  const storageTile = `
    <div class="card tile">
      <div class="t-head"><span>Speicher</span>${icon('card', 18)}</div>
      <div class="t-val">≈ ${st.needGB}<em> GB</em></div>
      <div class="t-sub">${st.plan.picks.length ? `→ ${esc(storageLabel(st.plan))}` : 'Keine Karten im Inventar'}</div>
      ${!st.plan.enough ? `<div class="t-warn">${icon('alert', 14, 2)} Inventar reicht nicht (${st.plan.totalInventoryGB} GB)</div>` : ''}
    </div>`;
  const batteryTile = b ? `
    <div class="card tile">
      <div class="t-head"><span>Akkus</span>${icon('battery', 18)}</div>
      <div class="t-val">${b.need}<em> Stk.</em></div>
      <div class="t-sub">inkl. ${b.reserve} Reserve${b.reserve > 1 ? ' (Kälte)' : ''}</div>
      ${!b.enough ? `<div class="t-warn">${icon('alert', 14, 2)} Du hast nur ${b.available}</div>` : ''}
    </div>` : `
    <div class="card tile locked"><div class="t-head"><span>Akkus</span>${icon('battery', 18)}</div>
      <div class="t-sub">Trag bei deinem Kamera-Akku die Laufzeit ein (Gear).</div></div>`;
  return `
    <div class="section-head"><h3>Akku & Speicher</h3></div>
    <div class="tiles">${storageTile}${batteryTile}</div>
    <p class="hint" style="margin-top:10px">${Math.round(ap.share * 100)} % Aufnahmeanteil → ${fmtDuration(st.minutes)} Aufnahme${st.bitrate ? ` · ${ap.bodies.length} ${ap.bodies.length === 1 ? 'Body' : 'Bodies'} à ${ap.bodies.map((c) => c.bitrateMbps).join(' + ')} Mbit/s` : ''} · +30 % Puffer</p>
    ${ap.placeholders.length ? `<p class="hint"><span class="badge-check">${icon('alert', 13, 2)} Platzhalterwerte:</span> ${esc(ap.placeholders.join(', '))} – in Gear prüfen.</p>` : ''}`;
}

function packlistSection(shoot, ap) {
  const list = shoot.checklist;
  const done = list.filter((i) => i.checked).length;
  const groups = CATEGORY_ORDER.map((c) => [c, list.filter((i) => i.category === c)]).filter(([, l]) => l.length);
  return `
    <div class="section-head"><h3>Packliste</h3><span data-progress-text>${done}/${list.length} gepackt</span></div>
    <div class="progress"><span data-progress-bar style="width:${list.length ? (done / list.length) * 100 : 0}%"></span></div>
    ${ap.hints.map((h) => `<p class="hint-box">${icon('alert', 16, 2)} ${esc(h)}</p>`).join('')}
    ${groups.map(([cat, items]) => `
      <div class="group-label"><span>${esc(CATEGORY_LABELS[cat])}</span><span>${items.filter((i) => i.checked).length}/${items.length}</span></div>
      <div class="card pack-group">
        ${items.map((i) => `
          <div class="pack-item${i.checked ? ' is-checked' : ''}" data-key="${esc(keyOf(i))}">
            <label class="pack-check">
              <input type="checkbox" ${i.checked ? 'checked' : ''} data-check>
              <span class="check-box">${icon('check', 20, 2.6)}</span>
              <span class="pack-text">
                <b>${esc(i.label)}${i.qty ? ` <span class="qty">×${i.qty}</span>` : ''}</b>
                ${i.reasons?.length ? `<span class="reason">weil: ${esc(i.reasons.join(' · '))}</span>` : ''}
                ${!i.auto ? '<span class="reason manual">manuell</span>' : ''}
              </span>
            </label>
            <button class="pack-remove" data-remove aria-label="${esc(i.label)} entfernen">${icon('close', 16, 2)}</button>
          </div>`).join('')}
      </div>`).join('')}
    <form class="add-row" data-add>
      <input class="input" name="label" placeholder="Eigenes Item hinzufügen …" autocomplete="off" aria-label="Item">
      <select class="input" name="category" aria-label="Kategorie">
        ${CATEGORY_ORDER.map((c) => `<option value="${c}"${c === 'personal' ? ' selected' : ''}>${esc(CATEGORY_LABELS[c])}</option>`).join('')}
      </select>
      <button class="icon-btn orb" type="submit" aria-label="Hinzufügen">${icon('plus', 22, 2)}</button>
    </form>
    ${shoot.excluded?.length ? `<button class="link-btn" data-restore>${shoot.excluded.length} ausgeblendete Auto-Items wiederherstellen</button>` : ''}`;
}

// ---------- View ----------

export async function render(page, { id }) {
  let shoot = await get('shoots', id);
  if (!shoot) { location.replace('#/'); return; }
  const [gear, templates, settings] = await Promise.all([all('gear'), all('templates'), getSettings()]);
  const template = templates.find((t) => t.id === shoot.type) || templates.find((t) => t.id === 'custom');
  let wx = await loadWeather(shoot, { allowNetwork: false });
  let geoFailed = false;
  const routeHash = location.hash; // background refresh only redraws while we're still on this route

  const persist = () => saveShoot(shoot).then((s) => { shoot = s; });

  const draw = () => {
    const ap = computeAutopilot({ shoot, gear, template, settings, weatherHours: wx.hours });
    if (fingerprint(ap.checklist) !== fingerprint(shoot.checklist || [])) {
      shoot.checklist = ap.checklist;
      persist();
    }
    const t = SHOOT_TYPES[shoot.type] || SHOOT_TYPES.custom;
    const missingPlace = shoot.location.lat == null;

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
          <div><small>Dauer</small><b>${esc(fmtDuration(ap.durationMin))}</b></div>
        </div>
      </div>

      <div class="chips" style="margin-top:14px">
        <span class="chip">${icon(t.icon, 16)} ${esc(t.label)}</span>
        <span class="chip">${icon(MODES[shoot.mode]?.icon, 16)} ${esc(MODES[shoot.mode]?.label)}</span>
        <span class="chip">${icon(IO[shoot.indoorOutdoor]?.icon, 16)} ${esc(IO[shoot.indoorOutdoor]?.label)}</span>
        ${shoot.client ? `<span class="chip">${icon('user', 16)} ${esc(shoot.client)}</span>` : ''}
      </div>

      <div style="margin-top:22px">${departureCard(shoot, ap, settings)}</div>

      <a class="card loc-card" style="margin-top:10px" href="${esc(mapsUrl(shoot.location))}" target="_blank" rel="noopener">
        <span class="pin orb">${icon('pin', 22)}</span>
        <span class="row-body"><b>${esc(shoot.location.label)}</b><span>${esc(shoot.location.address || 'Keine Adresse hinterlegt')}</span></span>
        <span class="row-end">${icon('arrowUpRight', 18)}</span>
      </a>
      ${missingPlace && geoFailed ? `<p class="hint-box">${icon('alert', 16, 2)} Ort nicht gefunden – prüf die Adresse (Straße, PLZ Ort). Wetter & Sonne brauchen Koordinaten.</p>` : ''}

      ${weatherSection(shoot, wx, ap)}
      ${sunSection(shoot, ap)}
      ${powerSection(ap)}
      ${packlistSection(shoot, ap)}

      <div class="section-head"><h3>Status</h3></div>
      <div data-phases>${phaseStepper(shoot.phase)}</div>

      <div class="section-head"><h3>Erinnerungen & Backup</h3><span class="chip sm warn">Phase 3</span></div>
      <div class="tiles">
        <div class="card tile locked"><div class="t-head"><span>Kalender (.ics)</span>${icon('calendar', 18)}</div><div class="t-sub">Vorabend-Check, Dreh, Backup-Reminder</div></div>
        <div class="card tile locked"><div class="t-head"><span>Backup 3-2-1</span>${icon('download', 18)}</div><div class="t-sub">Checkliste nach dem Wrap</div></div>
      </div>

      ${shoot.notes ? `<div class="section-head"><h3>Notizen</h3></div><div class="card notes">${esc(shoot.notes)}</div>` : ''}
    `;
  };

  const updateProgress = () => {
    const done = shoot.checklist.filter((i) => i.checked).length;
    page.querySelector('[data-progress-text]').textContent = `${done}/${shoot.checklist.length} gepackt`;
    page.querySelector('[data-progress-bar]').style.width = `${shoot.checklist.length ? (done / shoot.checklist.length) * 100 : 0}%`;
  };

  const setDrive = async (val) => {
    const v = val === '' || val == null ? null : Math.max(0, Math.round(Number(val)));
    shoot.travel = { ...(shoot.travel || {}), driveMin: v };
    await persist();
    draw();
  };

  // ---------- Events (delegated; page element persists across draws) ----------

  page.addEventListener('change', async (e) => {
    if (e.target.matches('[data-check]')) {
      const row = e.target.closest('[data-key]');
      const item = shoot.checklist.find((i) => keyOf(i) === row.dataset.key);
      item.checked = e.target.checked;
      row.classList.toggle('is-checked', item.checked);
      updateProgress();
      await persist();
      if (shoot.checklist.every((i) => i.checked) && shoot.phase === 'planned') toast('Alles gepackt 🎬');
    }
    if (e.target.matches('[data-drive-input]')) setDrive(e.target.value);
  });

  page.addEventListener('click', async (e) => {
    const step = e.target.closest('[data-drive-step]');
    if (step) {
      const cur = shoot.travel?.driveMin ?? 25;
      return setDrive(Math.max(0, cur + Number(step.dataset.driveStep)));
    }
    const rm = e.target.closest('[data-remove]');
    if (rm) {
      const key = rm.closest('[data-key]').dataset.key;
      const item = shoot.checklist.find((i) => keyOf(i) === key);
      shoot.checklist = shoot.checklist.filter((i) => keyOf(i) !== key);
      if (item?.auto) shoot.excluded = [...new Set([...(shoot.excluded || []), key])];
      await persist();
      draw();
      toast(`${item?.label || 'Item'} entfernt`);
      return;
    }
    if (e.target.closest('[data-restore]')) {
      shoot.excluded = [];
      await persist();
      draw();
      return;
    }
    const ph = e.target.closest('[data-phase]');
    if (ph && ph.dataset.phase !== shoot.phase) {
      shoot.phase = ph.dataset.phase;
      // Phase 3 replaces this with a real backup checklist; for now the last phase marks backup as done.
      const backedUp = shoot.phase === 'backed-up';
      shoot.backup = { ...shoot.backup, done: backedUp, doneAt: backedUp ? new Date().toISOString() : null };
      await persist();
      page.querySelector('[data-phases]').innerHTML = phaseStepper(shoot.phase);
      toast(`Status: ${PHASES.find((p) => p.id === shoot.phase).label}`);
    }
  });

  page.addEventListener('submit', async (e) => {
    if (!e.target.matches('[data-add]')) return;
    e.preventDefault();
    const f = e.target.elements;
    const label = f.label.value.trim();
    if (!label) return;
    const item = { itemId: null, label, category: f.category.value, checked: false, auto: false, reasons: [] };
    shoot.checklist = sortChecklist([...shoot.checklist.filter((i) => keyOf(i) !== keyOf(item)), item]);
    shoot.excluded = (shoot.excluded || []).filter((k) => k !== keyOf(item));
    await persist();
    draw();
    toast('Hinzugefügt');
  });

  draw();

  // ---------- Background refresh: geocode, then weather ----------
  (async () => {
    if (!navigator.onLine) return;
    let changed = false;
    if (shoot.location.lat == null && (shoot.location.address || shoot.location.label)) {
      const hit = await geocode(shoot.location.address || shoot.location.label).catch(() => null)
        || (shoot.location.address ? await geocode(shoot.location.label).catch(() => null) : null);
      if (hit) {
        shoot.location = { ...shoot.location, lat: hit.lat, lon: hit.lon };
        await persist();
        changed = true;
      } else {
        geoFailed = true;
        changed = true;
      }
    }
    if (shoot.location.lat != null) {
      const fresh = await loadWeather(shoot);
      if (fresh.status !== 'offline' || !wx.hours.length) { wx = fresh; changed = true; }
    }
    if (changed && location.hash === routeHash) draw();
  })();
}
