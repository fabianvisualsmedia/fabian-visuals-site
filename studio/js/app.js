import { store, newBrief, uid } from './store.js';
import { icon, weatherGlyph } from './icons.js';
import { sunPosition, lightPhases, phaseFor, skyPalette, compassLabel } from './sun.js';
import { fetchWeather, hourlyList, weatherAt, shootScore, scoreLabel, weatherText, weatherIcon, searchPlaces, reverseGeocode, currentPosition } from './weather.js';
import { generateBrief, generateHooks, PROJECT_TYPES, SHOT_TYPES } from './ai.js';
import { Recorder, startWave, speechSupported } from './voice.js';

/* ───────────────────────── Helpers ───────────────────────── */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtTime = (d) => d ? d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDate = (iso, opts = { weekday: 'short', day: 'numeric', month: 'short' }) => iso ? new Date(iso + 'T12:00').toLocaleDateString('de-DE', opts) : '';
const todayISO = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const PALETTES = {
  warm: ['#ff5e6c', '#9b5cff', '#3fd0ff'],
  primary: ['#7a5cff', '#2f6bff', '#3fd0ff'],
  cool: ['#2f6bff', '#2fd0e0', '#4fe39a'],
};
const STATUSES = [['idee', 'Idee'], ['geplant', 'Geplant'], ['gedreht', 'Gedreht'], ['geliefert', 'Geliefert']];
const statusLabel = (k) => (STATUSES.find(([s]) => s === k) || STATUSES[0])[1];

function setAurora(colors) {
  const r = document.documentElement.style;
  r.setProperty('--a1', colors[0]); r.setProperty('--a2', colors[1]); r.setProperty('--a3', colors[2]);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#05060a');
}

const skyBg = (pal) => `radial-gradient(130% 85% at 50% 118%, ${pal[2]} 0%, ${pal[1]} 34%, ${pal[0]} 62%, rgba(5,6,10,0) 92%), #05060a`;

function relTime(ms) {
  const m = Math.round(ms / 60000);
  if (Math.abs(m) < 60) return `${m} min`;
  const h = Math.floor(Math.abs(m) / 60), mm = Math.abs(m) % 60;
  return `${h} h ${String(mm).padStart(2, '0')} min`;
}
function hms(ms) {
  ms = Math.max(0, ms);
  const h = Math.floor(ms / 3600e3), m = Math.floor(ms / 60e3) % 60, s = Math.floor(ms / 1000) % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}<small class="mono">${String(s).padStart(2, '0')}</small>`;
}
function daysUntil(iso) {
  if (!iso) return null;
  const a = new Date(todayISO() + 'T12:00'), b = new Date(iso + 'T12:00');
  return Math.round((b - a) / 864e5);
}
const dayWord = (n) => n === 0 ? 'Heute' : n === 1 ? 'Morgen' : n === -1 ? 'Gestern' : n > 0 ? `in ${n} Tagen` : `vor ${-n} Tagen`;

function haptic(ms = 8) { try { navigator.vibrate?.(ms); } catch {} }

let toastTimer;
function toast(msg) {
  let el = $('.toast');
  if (!el) { el = document.createElement('div'); el.className = 'toast'; document.body.append(el); }
  el.textContent = msg;
  requestAnimationFrame(() => el.classList.add('show'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

/* ───────────────────────── Sheets ───────────────────────── */
function openSheet(html, onMount) {
  closeSheet(true);
  const back = document.createElement('div'); back.className = 'sheet-back';
  const sh = document.createElement('div'); sh.className = 'sheet';
  sh.innerHTML = `<div class="grab"></div>${html}`;
  document.body.append(back, sh);
  requestAnimationFrame(() => { back.classList.add('open'); sh.classList.add('open'); });
  back.addEventListener('click', () => closeSheet());
  // Swipe-down zum Schließen
  let y0 = null;
  sh.addEventListener('touchstart', (e) => { if (sh.scrollTop <= 0) y0 = e.touches[0].clientY; }, { passive: true });
  sh.addEventListener('touchmove', (e) => {
    if (y0 == null) return; const dy = e.touches[0].clientY - y0;
    if (dy > 0) { sh.style.transition = 'none'; sh.style.transform = `translateY(${dy}px)`; }
  }, { passive: true });
  sh.addEventListener('touchend', (e) => {
    if (y0 == null) return; const dy = e.changedTouches[0].clientY - y0; y0 = null;
    sh.style.transition = ''; sh.style.transform = '';
    if (dy > 110) closeSheet();
  });
  onMount?.(sh);
  return sh;
}
function closeSheet(instant) {
  $$('.sheet, .sheet-back').forEach((el) => {
    if (instant) return el.remove();
    el.classList.remove('open');
    setTimeout(() => el.remove(), 450);
  });
}

/* ───────────────────────── Router ───────────────────────── */
const app = $('#app');
let cleanup = [];
const onCleanup = (fn) => cleanup.push(fn);

function route() {
  const hash = location.hash.replace(/^#\/?/, '') || 'heute';
  const [name, id] = hash.split('/');
  const views = { heute: viewHeute, licht: viewLicht, projekte: viewProjekte, brief: viewBrief, voice: viewVoice, setup: viewSetup };
  const fn = views[name] || viewHeute;
  const run = () => {
    cleanup.forEach((c) => { try { c(); } catch {} }); cleanup = [];
    closeSheet(true);
    fn(id);
    updateDock(name);
    window.scrollTo(0, 0);
  };
  if (document.startViewTransition && !reduced) document.startViewTransition(run);
  else run();
}
window.addEventListener('hashchange', route);
const go = (h) => { location.hash = h; };

/* ───────────────────────── Dock ───────────────────────── */
function renderDock() {
  const wrap = document.createElement('div');
  wrap.className = 'dock-wrap';
  wrap.innerHTML = `
    <nav class="dock" aria-label="Navigation">
      <span class="indicator"></span>
      <a href="#/heute" data-tab="heute" aria-label="Heute">${icon.home()}</a>
      <a href="#/licht" data-tab="licht" aria-label="Licht">${icon.sun()}</a>
      <button class="orb" data-go="#/voice" aria-label="Voice Brief aufnehmen">${icon.mic(24)}</button>
      <a href="#/projekte" data-tab="projekte" aria-label="Projekte">${icon.folder()}</a>
      <a href="#/setup" data-tab="setup" aria-label="Einstellungen">${icon.gear()}</a>
    </nav>`;
  document.body.append(wrap);
  wrap.querySelector('.orb').addEventListener('click', () => { haptic(12); go('#/voice'); });
}
function updateDock(name) {
  const wrap = $('.dock-wrap');
  const map = { brief: 'projekte' };
  const tab = map[name] || name;
  wrap.classList.toggle('hide', name === 'voice');
  const links = $$('.dock a', wrap);
  links.forEach((a) => a.classList.toggle('active', a.dataset.tab === tab));
  const active = links.find((a) => a.dataset.tab === tab);
  const ind = $('.indicator', wrap);
  if (active) {
    ind.style.opacity = 1;
    ind.style.transform = `translateX(${active.offsetLeft - 7}px)`;
  } else ind.style.opacity = 0;
}

/* ───────────────────────── Licht-Logik ───────────────────────── */
function goldenWindows(day, loc) {
  const p = lightPhases(day, loc.lat, loc.lng);
  return [
    { kind: 'morning', label: 'Golden Hour · Morgen', start: p.goldenMorningStart, end: p.goldenMorningEnd },
    { kind: 'evening', label: 'Golden Hour · Abend', start: p.goldenEveningStart, end: p.goldenEveningEnd },
  ].filter((w) => w.start && w.end);
}
function nextGolden(loc) {
  const now = new Date();
  for (let i = 0; i < 3; i++) {
    const d = new Date(); d.setDate(d.getDate() + i);
    for (const w of goldenWindows(d, loc)) {
      if (now < w.end) return { ...w, active: now >= w.start, dayOffset: i };
    }
  }
  return null;
}

let weatherCache = null;
async function getWeather(loc) {
  try {
    const data = await fetchWeather(loc.lat, loc.lng);
    weatherCache = { key: `${loc.lat},${loc.lng}`, list: hourlyList(data), current: data.current };
    return weatherCache;
  } catch { return null; }
}

/* ───────────────────────── HEUTE ───────────────────────── */
function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Gute Nacht';
  if (h < 11) return 'Guten Morgen';
  if (h < 17) return 'Hey';
  if (h < 22) return 'Guten Abend';
  return 'Späte Schicht';
}

function viewHeute() {
  const { settings, briefs } = store.get();
  const loc = settings.location;
  const now = new Date();
  const alt = sunPosition(now, loc.lat, loc.lng).altitude;
  const pal = skyPalette(alt);
  setAurora([pal[0], pal[1], pal[2]]);
  const g = nextGolden(loc);
  const upcoming = briefs
    .filter((b) => b.date && daysUntil(b.date) >= 0 && b.status !== 'geliefert')
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const recent = [...briefs].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4);
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;

  app.innerHTML = `
  <section class="view">
    <header class="topbar rise" style="--i:0">
      <div class="brandmark"><span class="logo">${icon.logo()}</span>FV Studio</div>
      <span class="chip-pill mono">${now.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })}</span>
    </header>

    <h1 class="display rise" style="--i:1">${greeting()},<br><b>${esc(settings.name || 'Creator')}.</b></h1>

    <article class="glow hero rise" style="--i:2" data-go="#/licht">
      <div class="sky" style="background:${skyBg(pal)}"></div>
      <div class="spectrum" style="opacity:${g?.active ? .95 : .5}"></div>
      <div class="row between">
        <span class="eyebrow" style="color:rgba(255,255,255,.75)">${g ? (g.active ? 'Golden Hour läuft · noch' : 'Nächste Golden Hour in') : 'Licht'}</span>
        <span class="eyebrow" style="color:rgba(255,255,255,.75)">${icon.pin(12).replace('<svg', '<svg style="display:inline;vertical-align:-1px"')} ${esc(loc.name)}</span>
      </div>
      <div class="countdown" data-countdown="${g ? (g.active ? +g.end : +g.start) : ''}">${g ? hms((g.active ? g.end : g.start) - now) : '—'}</div>
      <div class="muted" style="color:rgba(255,255,255,.8)">${g ? `${g.dayOffset === 0 ? 'Heute' : g.dayOffset === 1 ? 'Morgen' : 'Übermorgen'} · ${fmtTime(g.start)} – ${fmtTime(g.end)} · ${g.kind === 'morning' ? 'morgens' : 'abends'}` : 'Keine Golden Hour (Polarnacht/-tag)'}</div>
      <div class="foot">
        <span class="score-badge" id="hero-score"><b>··</b>Wetter wird geladen</span>
        <span class="icon-btn" style="border-color:rgba(255,255,255,.35)">${icon.arrowRight(20)}</span>
      </div>
    </article>

    ${!standalone ? `
    <div class="glass card rise row" style="--i:3;margin-top:12px;padding:16px" id="install-card">
      <span style="width:42px;height:42px;border-radius:13px;display:grid;place-items:center;background:rgba(255,255,255,.08);flex:none">${icon.install(20)}</span>
      <div class="grow"><div class="row-title">Als App installieren</div><div class="row-sub">${isIOS ? 'Safari: Teilen → „Zum Home-Bildschirm“' : 'Für Vollbild & Offline-Modus'}</div></div>
      ${isIOS ? '' : `<button class="btn btn-white btn-sm" id="install-btn">Installieren</button>`}
    </div>` : ''}

    <article class="glass voice-cta rise" style="--i:4;margin-top:12px">
      <div class="row between" style="align-items:flex-start">
        <div>
          <div class="eyebrow">Voice → Briefing</div>
          <div style="font-size:21px;font-weight:500;letter-spacing:-.02em;margin-top:6px;line-height:1.2">Call gerade beendet?<br><span class="muted">Sprich 60 Sekunden rein.</span></div>
        </div>
        <button class="go" data-go="#/voice" aria-label="Aufnahme starten">${icon.mic(24)}</button>
      </div>
      <canvas id="mini-wave"></canvas>
      <div class="row-sub">Daraus werden Briefing, Shotlist (Audio | Visual) und 5 Hooks.</div>
    </article>

    <div class="quick rise" style="--i:5;margin-top:12px">
      <button class="glass" data-go="#/voice"><span class="ic">${icon.mic(18)}</span>Voice Brief</button>
      <button class="glass" data-action="new-brief"><span class="ic">${icon.plus(18)}</span>Neues Projekt</button>
      <button class="glass" data-go="#/licht"><span class="ic">${icon.sunset(18)}</span>Lichtplan</button>
    </div>

    ${upcoming ? `
    <div class="section-head rise" style="--i:6"><h3>Nächster Dreh</h3><a href="#/projekte">Alle</a></div>
    ${nextShootCard(upcoming, 7)}` : ''}

    <div class="section-head rise" style="--i:8"><h3>Zuletzt bearbeitet</h3><a href="#/projekte">Alle</a></div>
    <div class="stack">
      ${recent.length ? recent.map((b, i) => briefRow(b, 9 + i)).join('') : `<div class="glass card muted rise" style="--i:9">Noch keine Projekte. Tippe auf das Mikro und leg los.</div>`}
    </div>
  </section>`;

  bindCommon();
  const stopWave = startWave($('#mini-wave'), () => 0.22 + Math.sin(Date.now() / 900) * 0.08);
  onCleanup(stopWave);
  bindInstall();

  getWeather(loc).then((w) => {
    const el = $('#hero-score'); if (!el) return;
    if (!w || !g) { el.innerHTML = `<b>–</b>Offline · nur Lichtdaten`; return; }
    const mid = new Date((+g.start + +g.end) / 2);
    const wx = weatherAt(w.list, mid);
    const sc = shootScore(mid, loc.lat, loc.lng, wx);
    el.innerHTML = `<b>${sc}</b>${scoreLabel(sc)}${wx ? ` · ${weatherText(wx.code)}, ${Math.round(wx.temp)}°` : ''}`;
  });
}

function nextShootCard(b, i) {
  const done = b.shotlist.filter((s) => s.done).length, total = b.shotlist.length;
  const n = daysUntil(b.date);
  let light = '';
  if (b.locationGeo) {
    const ws = goldenWindows(new Date(b.date + 'T12:00'), b.locationGeo);
    const ev = ws.find((w) => w.kind === 'evening');
    if (ev) light = `${icon.sunset(14).replace('<svg', '<svg style="display:inline;vertical-align:-2px"')} Golden Hour ${fmtTime(ev.start)}`;
  }
  return `
  <article class="glass card rise" style="--i:${i}" data-go="#/brief/${b.id}">
    <div class="row between">
      <span class="status ${b.status}">${statusLabel(b.status)}</span>
      <span class="chip-pill" style="height:30px;font-size:13px">${dayWord(n)}</span>
    </div>
    <div style="font-size:24px;font-weight:500;letter-spacing:-.02em;margin:18px 0 6px;line-height:1.15">${esc(b.title)}</div>
    <div class="meta-line muted">
      ${b.client ? `<span>${icon.user(14)} ${esc(b.client)}</span>` : ''}
      <span>${icon.calendar(14)} ${fmtDate(b.date)}</span>
      ${b.location ? `<span>${icon.pin(14)} ${esc(b.location)}</span>` : ''}
    </div>
    <div class="row between" style="margin:18px 0 8px;font-size:13px"><span class="muted">${done}/${total} Shots im Kasten</span><span class="muted">${light}</span></div>
    <div class="progress"><i style="width:${total ? (done / total) * 100 : 0}%"></i></div>
  </article>`;
}

function briefRow(b, i) {
  const n = daysUntil(b.date);
  return `
  <div class="glass list-row rise" style="--i:${i}" data-go="#/brief/${b.id}">
    <span class="swatch ${b.palette}"></span>
    <div class="grow">
      <div class="row-title">${esc(b.title)}</div>
      <div class="row-sub">${esc([b.type, b.client, b.date ? dayWord(n) : ''].filter(Boolean).join(' · '))}</div>
    </div>
    <span class="status ${b.status}">${statusLabel(b.status)}</span>
  </div>`;
}

/* ───────────────────────── LICHT ───────────────────────── */
let lichtDay = 0;
function viewLicht() {
  const { settings } = store.get();
  const loc = settings.location;
  const day = new Date(); day.setDate(day.getDate() + lichtDay); day.setHours(0, 0, 0, 0);
  const phases = lightPhases(new Date(+day + 12 * 3600e3), loc.lat, loc.lng);
  const now = new Date();
  const isToday = lichtDay === 0;
  let scrub = isToday ? now : new Date(+day + 19 * 3600e3);
  if (!isToday && phases.goldenEveningStart) scrub = phases.goldenEveningStart;

  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d; });

  // Kurve berechnen
  const W = 400, H = 260, top = 34, bottom = 236;
  const maxA = Math.max(30, phases.maxAltitude + 10), minA = -24;
  const y = (a) => top + (maxA - Math.max(minA, Math.min(maxA, a))) / (maxA - minA) * (bottom - top);
  const x = (date) => ((date - day) / 864e5) * W;
  let path = '';
  for (let m = 0; m <= 1440; m += 8) {
    const d = new Date(+day + m * 60e3);
    const a = sunPosition(d, loc.lat, loc.lng).altitude;
    path += `${m ? 'L' : 'M'}${(m / 1440 * W).toFixed(1)},${y(a).toFixed(1)}`;
  }
  const area = `${path}L${W},${H}L0,${H}Z`;
  const yH = y(0);
  const hours = [0, 3, 6, 9, 12, 15, 18, 21, 24];

  const phaseRows = [
    { k: 'blue', label: 'Blaue Stunde', sub: 'morgens', a: phases.blueMorningStart, b: phases.blueMorningEnd, c: '#6694ff' },
    { k: 'golden', label: 'Golden Hour', sub: 'morgens', a: phases.goldenMorningStart, b: phases.goldenMorningEnd, c: '#ffb347' },
    { k: 'rise', label: 'Sonnenaufgang', sub: '', a: phases.sunrise, c: '#ffd27a' },
    { k: 'noon', label: 'Sonnenhöchststand', sub: `${Math.round(phases.maxAltitude)}°`, a: phases.noon, c: '#ffffff' },
    { k: 'set', label: 'Sonnenuntergang', sub: '', a: phases.sunset, c: '#ff7a6b' },
    { k: 'golden', label: 'Golden Hour', sub: 'abends', a: phases.goldenEveningStart, b: phases.goldenEveningEnd, c: '#ffb347' },
    { k: 'blue', label: 'Blaue Stunde', sub: 'abends', a: phases.blueEveningStart, b: phases.blueEveningEnd, c: '#6694ff' },
  ].filter((p) => p.a).sort((a, b) => a.a - b.a);

  const dl = phases.dayLength;

  app.innerHTML = `
  <section class="view">
    <header class="topbar rise" style="--i:0">
      <h2 class="title">Licht</h2>
      <button class="chip-pill" data-action="pick-location">${icon.pin(16)} ${esc(loc.name)}</button>
    </header>

    <div class="days rise" style="--i:1">
      ${days.map((d, i) => `<button class="${i === lichtDay ? 'on' : ''}" data-day="${i}"><span>${i === 0 ? 'Heute' : i === 1 ? 'Morgen' : d.toLocaleDateString('de-DE', { weekday: 'short' })}</span><b>${d.getDate()}</b></button>`).join('')}
    </div>

    <article class="glow skycard rise" style="--i:2" id="skycard">
      <div class="sky" id="sky"></div>
      <div class="info">
        <div>
          <div class="eyebrow" id="phase-label" style="color:rgba(255,255,255,.8)">—</div>
          <div class="clock" id="clock">--:--</div>
          <div style="font-size:14px;color:rgba(255,255,255,.75);margin-top:6px" id="sun-meta">—</div>
        </div>
        <div class="compass" title="Sonnenrichtung"><div class="needle" id="needle"></div><span id="az-label">—</span></div>
      </div>
      <svg class="curve" id="curve" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
        <defs>
          <linearGradient id="gArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
          <linearGradient id="gGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb347" stop-opacity=".0"/><stop offset=".5" stop-color="#ffb347" stop-opacity=".22"/><stop offset="1" stop-color="#ff7a6b" stop-opacity=".1"/></linearGradient>
          <clipPath id="above"><rect x="0" y="0" width="${W}" height="${yH}"/></clipPath>
          <filter id="sunGlow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="6"/></filter>
        </defs>
        ${hours.map((h) => `<line x1="${h / 24 * W}" y1="${top - 14}" x2="${h / 24 * W}" y2="${H}" stroke="#2f6bff" stroke-opacity=".35" stroke-width="1" vector-effect="non-scaling-stroke"/>`).join('')}
        <rect x="0" y="${y(6)}" width="${W}" height="${y(-4) - y(6)}" fill="url(#gGold)"/>
        <rect x="0" y="${y(-4)}" width="${W}" height="${y(-6) - y(-4)}" fill="#2f6bff" fill-opacity=".18"/>
        <path d="${area}" fill="url(#gArea)" clip-path="url(#above)"/>
        <line x1="0" y1="${yH}" x2="${W}" y2="${yH}" stroke="#fff" stroke-opacity=".7" stroke-width="1" vector-effect="non-scaling-stroke"/>
        <path d="${path}" class="draw" fill="none" stroke="#fff" stroke-width="2" vector-effect="non-scaling-stroke"/>
        <line id="scrub-line" x1="0" y1="0" x2="0" y2="${H}" stroke="#fff" stroke-opacity=".35" stroke-dasharray="3 4" vector-effect="non-scaling-stroke"/>
        <g id="sun-dot"><circle r="12" fill="#ffd27a" filter="url(#sunGlow)" opacity=".9"/><circle r="5.5" fill="#fff"/></g>
        ${hours.slice(1, -1).map((h) => `<text x="${h / 24 * W}" y="${H - 8}" fill="rgba(255,255,255,.55)" font-size="9" font-family="IBM Plex Mono, monospace" text-anchor="middle">${String(h).padStart(2, '0')}</text>`).join('')}
      </svg>
      <div class="scrub-hint" id="scrub-hint">← Ziehen, um durch den Tag zu scrubben →</div>
    </article>

    <div class="row rise" style="--i:3;margin-top:12px;gap:10px">
      <div class="glass grow" style="padding:14px 16px;border-radius:20px" id="wx-now"><span class="muted" style="font-size:13px">Wetter wird geladen…</span></div>
      ${isToday ? `<button class="btn btn-white btn-sm" data-action="scrub-now" style="height:56px">Jetzt</button>` : ''}
    </div>

    <div class="section-head rise" style="--i:4"><h3>Lichtphasen</h3><span class="muted" style="font-size:13px">${day.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}</span></div>
    <div class="phases">
      ${phaseRows.map((p, i) => {
        const active = isToday && p.b && now >= p.a && now <= p.b;
        const past = isToday && (p.b ? now > p.b : now > p.a);
        const until = isToday && now < p.a ? `in ${relTime(p.a - now)}` : active ? 'jetzt' : '';
        return `<div class="glass phase rise ${active ? 'active' : ''} ${past ? 'past' : ''}" style="--i:${5 + i};color:${p.c}" data-scrub="${+p.a}">
          <span class="dot"></span>
          <div class="grow" style="color:var(--text)"><div style="font-weight:500">${p.label} <span class="muted" style="font-weight:400">${p.sub}</span></div>${until ? `<div class="row-sub">${until}</div>` : ''}</div>
          <span class="t" style="color:var(--text)">${fmtTime(p.a)}${p.b ? ` – ${fmtTime(p.b)}` : ''}</span>
        </div>`;
      }).join('')}
    </div>

    <div class="section-head rise" style="--i:12"><h3>Shoot-Score</h3><span class="muted" style="font-size:13px" id="best-slot"></span></div>
    <div class="hours rise" style="--i:13" id="hours"><div class="muted" style="padding:20px 0;font-size:14px">Lade Vorhersage…</div></div>

    <div class="stats rise" style="--i:14;margin-top:14px">
      <div class="glass stat"><span class="eyebrow">Tageslänge</span><b>${dl ? `${Math.floor(dl / 3600e3)} h ${Math.round(dl / 60e3) % 60} min` : '—'}</b></div>
      <div class="glass stat"><span class="eyebrow">Max. Sonnenhöhe</span><b>${Math.round(phases.maxAltitude)}°</b></div>
      <div class="glass stat"><span class="eyebrow">Golden Hour abends</span><b>${phases.goldenEveningStart && phases.goldenEveningEnd ? `${Math.round((phases.goldenEveningEnd - phases.goldenEveningStart) / 60e3)} min` : '—'}</b></div>
      <div class="glass stat"><span class="eyebrow">Blaue Stunde abends</span><b>${phases.blueEveningStart && phases.blueEveningEnd ? `${Math.round((phases.blueEveningEnd - phases.blueEveningStart) / 60e3)} min` : '—'}</b></div>
    </div>
    <p class="faint" style="font-size:12px;margin:16px 4px 0">Golden Hour = Sonne zwischen −4° und +6°, Blaue Stunde = −6° bis −4°. Zeiten in der Zeitzone deines Geräts.</p>
  </section>`;

  bindCommon();

  // ── Scrubbing ──
  const svg = $('#curve'), sky = $('#sky'), dot = $('#sun-dot'), line = $('#scrub-line');
  let wx = null;
  const update = (date) => {
    scrub = date;
    const pos = sunPosition(date, loc.lat, loc.lng);
    const ph = phaseFor(pos.altitude);
    const pal = skyPalette(pos.altitude);
    sky.style.background = skyBg(pal);
    setAurora(pal);
    const px = x(date), py = y(pos.altitude);
    dot.setAttribute('transform', `translate(${px},${py})`);
    // Kreis nicht verzerren (preserveAspectRatio none) → Skalierung ausgleichen
    const r = svg.getBoundingClientRect();
    if (r.width) dot.setAttribute('transform', `translate(${px},${py}) scale(${(W / r.width) / (H / r.height) || 1},1)`);
    line.setAttribute('x1', px); line.setAttribute('x2', px);
    $('#clock').textContent = fmtTime(date);
    $('#phase-label').textContent = ph.label;
    $('#sun-meta').textContent = `Sonne ${pos.altitude.toFixed(1)}° · ${compassLabel(pos.azimuth)} ${Math.round(pos.azimuth)}°`;
    $('#needle').style.transform = `rotate(${pos.azimuth}deg)`;
    $('#az-label').textContent = compassLabel(pos.azimuth);
    if (wx) {
      const w = weatherAt(wx.list, date);
      const sc = shootScore(date, loc.lat, loc.lng, w);
      $('#wx-now').innerHTML = w
        ? `<div class="row" style="gap:12px">${weatherGlyph(weatherIcon(w.code), 26)}<div class="grow"><div style="font-weight:600">${Math.round(w.temp)}° · ${weatherText(w.code)}</div><div class="row-sub">${w.clouds}% Wolken · ${Math.round(w.wind)} km/h · ${w.rain}% Regen</div></div><span class="score-badge" style="background:rgba(255,255,255,.08)"><b>${sc}</b>${scoreLabel(sc)}</span></div>`
        : `<span class="muted" style="font-size:13px">Keine Vorhersage für diese Uhrzeit</span>`;
    }
  };
  update(scrub);

  let dragging = false;
  const fromEvent = (e) => {
    const r = svg.getBoundingClientRect();
    const f = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    return new Date(+day + f * 864e5);
  };
  svg.addEventListener('pointerdown', (e) => { dragging = true; svg.setPointerCapture(e.pointerId); update(fromEvent(e)); $('#scrub-hint').style.opacity = 0; haptic(6); });
  svg.addEventListener('pointermove', (e) => { if (dragging) update(fromEvent(e)); });
  svg.addEventListener('pointerup', () => { dragging = false; });
  svg.addEventListener('pointercancel', () => { dragging = false; });

  const animateTo = (target) => {
    const from = +scrub, to = +target, t0 = performance.now(), dur = reduced ? 1 : 900;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4);
      update(new Date(from + (to - from) * e));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  $$('[data-scrub]').forEach((el) => el.addEventListener('click', () => { animateTo(new Date(+el.dataset.scrub)); haptic(); window.scrollTo({ top: 0, behavior: 'smooth' }); }));
  $('[data-action="scrub-now"]')?.addEventListener('click', () => animateTo(new Date()));
  $$('[data-day]').forEach((b) => b.addEventListener('click', () => { lichtDay = +b.dataset.day; haptic(); route(); }));

  // Live mitlaufen, wenn heute und nicht gescrubbt
  if (isToday) {
    const iv = setInterval(() => { if (!dragging && Math.abs(scrub - Date.now()) < 120e3) update(new Date()); }, 30e3);
    onCleanup(() => clearInterval(iv));
  }

  // ── Wetter ──
  getWeather(loc).then((w) => {
    if (!w || !$('#hours')) { if ($('#hours')) $('#hours').innerHTML = `<div class="muted" style="padding:16px 0;font-size:14px">Offline – Wetter nicht verfügbar. Lichtdaten funktionieren trotzdem.</div>`; if ($('#wx-now')) $('#wx-now').innerHTML = '<span class="muted" style="font-size:13px">Offline</span>'; return; }
    wx = w;
    update(scrub);
    const list = w.list.filter((h) => sameDay(h.time, day) && h.time.getHours() >= 5 && h.time.getHours() <= 22);
    if (!list.length) { $('#hours').innerHTML = `<div class="muted" style="padding:16px 0;font-size:14px">Keine Vorhersage für diesen Tag.</div>`; return; }
    const scored = list.map((h) => ({ ...h, score: shootScore(new Date(+h.time + 30 * 60e3), loc.lat, loc.lng, h) }));
    const future = scored.filter((h) => !isToday || h.time > new Date(Date.now() - 3600e3));
    const best = (future.length ? future : scored).reduce((a, b) => (b.score > a.score ? b : a));
    $('#best-slot').textContent = `Bestes Fenster: ${fmtTime(best.time)} · ${best.score}`;
    $('#hours').innerHTML = scored.map((h, i) => {
      const col = h.score >= 80 ? 'linear-gradient(180deg,#ffd27a,#ff7a6b)' : h.score >= 60 ? 'linear-gradient(180deg,#6694ff,#2365ff)' : 'linear-gradient(180deg,#8a8fa8,#4a4e60)';
      const isNow = isToday && h.time.getHours() === new Date().getHours();
      return `<button class="hour ${h === best ? 'best' : ''} ${isNow ? 'now' : ''}" data-hour="${+h.time}" style="--i:${i}">
        <span class="mono muted" style="font-size:12px">${String(h.time.getHours()).padStart(2, '0')}</span>
        ${weatherGlyph(weatherIcon(h.code), 20)}
        <span>${Math.round(h.temp)}°</span>
        <span class="bar"><i style="height:${h.score}%;background:${col};--i:${i}"></i></span>
        <span class="mono" style="font-size:12px">${h.score}</span>
      </button>`;
    }).join('');
    $$('[data-hour]').forEach((b) => b.addEventListener('click', () => { animateTo(new Date(+b.dataset.hour + 30 * 60e3)); haptic(); }));
    const bestEl = $('.hour.best'); bestEl?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
    window.scrollTo(0, 0);
  });
}

/* ───────────────────────── Ort wählen ───────────────────────── */
function pickLocation(onPick) {
  openSheet(`
    <h3>Ort wählen</h3>
    <button class="btn btn-white btn-block" data-gps>${icon.locate(20)} Aktuellen Standort nutzen</button>
    <div style="height:14px"></div>
    <input class="input" id="loc-q" placeholder="Stadt oder Location suchen…" autocomplete="off" enterkeyhint="search">
    <div id="loc-res" style="margin-top:8px"></div>
  `, (sh) => {
    const q = $('#loc-q', sh), res = $('#loc-res', sh);
    let t;
    q.addEventListener('input', () => {
      clearTimeout(t);
      if (q.value.trim().length < 2) { res.innerHTML = ''; return; }
      t = setTimeout(async () => {
        res.innerHTML = `<div class="muted" style="padding:14px 6px"><span class="dots"><i></i><i></i><i></i></span></div>`;
        try {
          const list = await searchPlaces(q.value.trim());
          res.innerHTML = list.length ? list.map((p, i) => `<button class="menu-item" data-i="${i}">${icon.pin(18)}<div class="grow"><div>${esc(p.name)}</div><div class="row-sub">${esc(p.region)}</div></div></button>`).join('') : `<div class="muted" style="padding:14px 6px">Nichts gefunden.</div>`;
          $$('[data-i]', res).forEach((b) => b.addEventListener('click', () => { closeSheet(); onPick(list[+b.dataset.i]); }));
        } catch { res.innerHTML = `<div class="muted" style="padding:14px 6px">Suche gerade nicht möglich (offline?).</div>`; }
      }, 280);
    });
    $('[data-gps]', sh).addEventListener('click', async (e) => {
      const btn = e.currentTarget; btn.innerHTML = `<span class="dots"><i style="background:#000"></i><i style="background:#000"></i><i style="background:#000"></i></span>`;
      try {
        const p = await currentPosition();
        const name = await reverseGeocode(p.lat, p.lng);
        closeSheet(); onPick({ name, ...p });
      } catch (err) { btn.innerHTML = `${icon.locate(20)} ${esc(err.message)}`; }
    });
    setTimeout(() => q.focus(), 400);
  });
}

/* ───────────────────────── PROJEKTE ───────────────────────── */
let projFilter = 'alle';
function viewProjekte() {
  setAurora(PALETTES.cool);
  const { briefs } = store.get();
  const list = briefs.filter((b) => projFilter === 'alle' || b.status === projFilter).sort((a, b) => b.updatedAt - a.updatedAt);
  const fanList = [...briefs].sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999')).slice(0, 8);

  app.innerHTML = `
  <section class="view">
    <header class="topbar rise" style="--i:0">
      <h2 class="title">Projekte</h2>
      <button class="icon-btn solid" data-action="new-brief" aria-label="Neues Projekt">${icon.plus(22)}</button>
    </header>

    ${briefs.length ? `
    <div class="fan rise" style="--i:1" id="fan">
      ${fanList.map((b) => {
        const done = b.shotlist.filter((s) => s.done).length, total = b.shotlist.length || 1;
        return `<article class="folder ${b.palette}" data-go="#/brief/${b.id}">
          <div class="tint"></div>
          <div class="row between"><span class="status ${b.status}">${statusLabel(b.status)}</span><span class="mono" style="font-size:12px;opacity:.8">${b.date ? fmtDate(b.date, { day: '2-digit', month: '2-digit' }) : '––'}</span></div>
          <div class="pct" style="margin-top:22px">${Math.round((done / total) * 100)}<span style="font-size:18px;opacity:.7">%</span></div>
          <h4>${esc(b.title)}</h4>
          <div class="meta"><span style="opacity:.8">${esc(b.type)}</span><span style="opacity:.8">${b.shotlist.length} Shots</span></div>
        </article>`;
      }).join('')}
    </div>` : ''}

    <div class="filters rise" style="--i:2">
      ${[['alle', 'Alle'], ...STATUSES].map(([k, l]) => `<button class="${projFilter === k ? 'on' : ''}" data-filter="${k}">${l} <span class="${projFilter === k ? '' : 'muted'}" style="font-size:12px">${k === 'alle' ? briefs.length : briefs.filter((b) => b.status === k).length}</span></button>`).join('')}
    </div>

    <div class="stack">
      ${list.length ? list.map((b, i) => briefRow(b, 3 + i)).join('') : `
      <div class="empty rise" style="--i:3">
        <div class="glow primary"></div>
        <div style="font-size:20px;font-weight:500">Hier ist es noch leer</div>
        <p class="muted" style="margin:6px 0 18px">Sprich dein erstes Briefing ein. Ich mach den Rest.</p>
        <button class="btn btn-white" data-go="#/voice">${icon.mic(20)} Voice Brief</button>
      </div>`}
    </div>
  </section>`;

  bindCommon();
  $$('[data-filter]').forEach((b) => b.addEventListener('click', () => { projFilter = b.dataset.filter; haptic(); route(); }));

  // 3D-Fächer
  const fan = $('#fan');
  if (fan) {
    const cards = $$('.folder', fan);
    let raf;
    const tick = () => {
      const r = fan.getBoundingClientRect(), cx = r.left + r.width / 2;
      cards.forEach((c) => {
        const cr = c.getBoundingClientRect();
        const d = (cr.left + cr.width / 2 - cx) / cr.width; // −n … n
        const ad = Math.min(Math.abs(d), 3);
        const rot = Math.max(-55, Math.min(55, -d * 38));
        c.style.transform = `translateZ(${-ad * 90}px) rotateY(${rot}deg) translateY(${ad * 6}px)`;
        c.style.zIndex = String(100 - Math.round(ad * 10));
        c.style.opacity = String(1 - Math.min(0.55, ad * 0.22));
        c.classList.toggle('focus', ad < 0.5);
      });
    };
    fan.addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); }, { passive: true });
    tick();
  }
}

/* ───────────────────────── BRIEF-DETAIL ───────────────────────── */
const briefTab = {};
function viewBrief(id) {
  const b = store.brief(id);
  if (!b) { go('#/projekte'); return; }
  setAurora(PALETTES[b.palette] || PALETTES.primary);
  const tab = briefTab[id] || 'brief';
  const tabs = [['brief', 'Brief'], ['shots', 'Shotlist'], ['hooks', 'Hooks'], ['licht', 'Licht']];
  const done = b.shotlist.filter((s) => s.done).length;
  const n = daysUntil(b.date);

  app.innerHTML = `
  <section class="view print-all">
    <header class="topbar rise" style="--i:0">
      <button class="icon-btn" data-go="#/projekte" aria-label="Zurück">${icon.back(20)}</button>
      <div class="row" style="gap:8px">
        <button class="icon-btn" data-action="share" aria-label="Teilen">${icon.share(20)}</button>
        <button class="icon-btn" data-action="brief-menu" aria-label="Mehr">${icon.more(20)}</button>
      </div>
    </header>

    <article class="glow ${b.palette} brief-hero rise" style="--i:1">
      <div class="row between">
        <span class="tag solid">${icon.film(14)} ${esc(b.type)}</span>
        <button class="status ${b.status}" data-action="cycle-status" title="Status ändern">${statusLabel(b.status)}</button>
      </div>
      <h2>${esc(b.title)}</h2>
      <div class="meta-line">
        ${b.client ? `<span>${icon.user(14)} ${esc(b.client)}</span>` : ''}
        ${b.date ? `<span>${icon.calendar(14)} ${fmtDate(b.date)} · ${dayWord(n)}</span>` : ''}
        ${b.location ? `<span>${icon.pin(14)} ${esc(b.location)}</span>` : ''}
      </div>
    </article>

    <div class="seg rise" style="--i:2" id="seg">
      <span class="ind"></span>
      ${tabs.map(([k, l]) => `<button data-tab="${k}" class="${tab === k ? 'on' : ''}">${l}</button>`).join('')}
    </div>

    <!-- BRIEF -->
    <div class="tab-pane stack ${tab === 'brief' ? '' : 'pane-off'}" data-pane="brief">
      ${b.summary ? `<div class="glass field-block rise" style="--i:3"><span class="eyebrow">Idee</span><p>${esc(b.summary)}</p></div>` : ''}
      <div class="two">
        <div class="glass field-block rise" style="--i:4"><span class="eyebrow">Ziel</span><p>${esc(b.goal) || '<span class="faint">—</span>'}</p></div>
        <div class="glass field-block rise" style="--i:5"><span class="eyebrow">Zielgruppe</span><p>${esc(b.audience) || '<span class="faint">—</span>'}</p></div>
      </div>
      ${b.deliverables.length ? `<div class="glass field-block rise" style="--i:6"><span class="eyebrow">Deliverables</span><div class="tags">${b.deliverables.map((d) => `<span class="tag"><b class="mono" style="font-weight:500">${esc(d.format)}</b> ${esc(d.length)} · ${esc(d.platform)}</span>`).join('')}</div></div>` : ''}
      <div class="glass field-block rise" style="--i:7">
        <span class="eyebrow">Mood & Farbwelt</span>
        <div class="palette-strip ${b.palette}"></div>
        <div class="hexes" style="margin-bottom:12px">${PALETTES[b.palette].map((h) => `<span style="--h:${h}">${h}</span>`).join('')}</div>
        <div class="tags">${b.moodKeywords.map((k) => `<span class="tag solid">${esc(k)}</span>`).join('')}</div>
      </div>
      ${b.questions.length ? `<div class="glass field-block rise" style="--i:8"><span class="eyebrow">Offene Fragen</span>${b.questions.map((q) => `<div class="row" style="padding:6px 0;align-items:flex-start"><span style="color:var(--warn);margin-top:1px">●</span><span>${esc(q)}</span></div>`).join('')}</div>` : ''}
      ${b.gear.length ? `<div class="glass field-block rise" style="--i:9"><span class="eyebrow">Equipment</span><div class="tags">${b.gear.map((g) => `<span class="tag">${esc(g)}</span>`).join('')}</div></div>` : ''}
      ${b.transcript ? `<details class="glass field-block rise" style="--i:10"><summary class="eyebrow" style="cursor:pointer">Original-Transkript</summary><p class="muted" style="margin-top:10px;font-size:15px">${esc(b.transcript)}</p></details>` : ''}
      <button class="btn btn-ghost btn-block rise no-print" style="--i:11" data-action="edit-brief">${icon.edit(18)} Briefing bearbeiten</button>
    </div>

    <!-- SHOTLIST -->
    <div class="tab-pane ${tab === 'shots' ? '' : 'pane-off'}" data-pane="shots">
      <div class="glass field-block rise" style="--i:3;margin-bottom:12px">
        <div class="row between" style="margin-bottom:10px"><span style="font-weight:500">${done}/${b.shotlist.length} Shots im Kasten</span><span class="mono muted" style="font-size:13px">${b.shotlist.length ? Math.round(done / b.shotlist.length * 100) : 0}%</span></div>
        <div class="progress"><i style="width:${b.shotlist.length ? done / b.shotlist.length * 100 : 0}%"></i></div>
      </div>
      <div class="av-head eyebrow"><span>#</span><span>Visual / B-Roll</span><span>Audio / Voiceover</span><span></span></div>
      <div class="stack" id="shots">
        ${b.shotlist.map((s, i) => `
        <div class="glass shot av rise ${s.done ? 'done' : ''}" style="--i:${4 + i}" data-shot="${s.id}">
          <span class="num">${String(i + 1).padStart(2, '0')}</span>
          <div class="main">
            <div class="lbls"><span>${esc(s.shotType)}</span>${s.duration ? `<span>${esc(s.duration)}</span>` : ''}</div>
            <div class="visual">${esc(s.visual)}</div>
          </div>
          <div class="audio">${icon.speaker(15)}<span>${esc(s.audio) || '—'}</span></div>
          <button class="check" data-check="${s.id}" aria-label="Erledigt">${icon.check(16)}</button>
        </div>`).join('')}
      </div>
      <button class="btn btn-ghost btn-block no-print" style="margin-top:12px" data-action="add-shot">${icon.plus(18)} Shot hinzufügen</button>
      <p class="faint no-print" style="font-size:12px;margin:12px 4px">Tippen = bearbeiten · Kreis = abhaken (perfekt am Set)</p>
    </div>

    <!-- HOOKS -->
    <div class="tab-pane stack ${tab === 'hooks' ? '' : 'pane-off'}" data-pane="hooks">
      ${b.hooks.map((h, i) => `
      <div class="glass hook rise" style="--i:${3 + i}">
        <div class="row between">
          <div class="row" style="gap:10px"><span class="meter">${[1, 2, 3, 4, 5].map((k) => `<i class="${k <= h.level ? 'on' : ''}"></i>`).join('')}</span><span class="eyebrow">${esc(h.label)}</span></div>
          <button class="icon-btn no-print" style="width:36px;height:36px" data-copy="${i}" aria-label="Kopieren">${icon.copy(16)}</button>
        </div>
        <q>${esc(h.text)}</q>
      </div>`).join('') || '<div class="glass card muted">Noch keine Hooks.</div>'}
      <button class="btn btn-blue btn-block no-print rise" style="--i:9" data-action="more-hooks">${icon.sparkle(18)} Neue Hooks generieren</button>
    </div>

    <!-- LICHT -->
    <div class="tab-pane ${tab === 'licht' ? '' : 'pane-off'}" data-pane="licht" id="brief-licht"></div>
  </section>`;

  bindCommon();

  // Segment-Control
  const seg = $('#seg');
  const moveInd = (k) => {
    const i = tabs.findIndex(([t]) => t === k);
    $('.ind', seg).style.transform = `translateX(${i * 100}%)`;
  };
  moveInd(tab);
  $$('[data-tab]', seg).forEach((btn) => btn.addEventListener('click', () => {
    const k = btn.dataset.tab; briefTab[id] = k; haptic();
    $$('[data-tab]', seg).forEach((x) => x.classList.toggle('on', x === btn));
    moveInd(k);
    $$('.tab-pane').forEach((p) => {
      const on = p.dataset.pane === k;
      p.classList.toggle('pane-off', !on);
      if (on) $$('.rise', p).forEach((el) => { el.style.animation = 'none'; el.offsetHeight; el.style.animation = ''; });
    });
    if (k === 'licht') renderBriefLicht(b);
  }));
  if (tab === 'licht') renderBriefLicht(b);

  // Shots
  $$('[data-check]').forEach((c) => c.addEventListener('click', (e) => {
    e.stopPropagation();
    const s = b.shotlist.find((x) => x.id === c.dataset.check);
    s.done = !s.done; haptic(s.done ? 14 : 6);
    store.saveBrief(b);
    c.closest('.shot').classList.toggle('done', s.done);
    const d = b.shotlist.filter((x) => x.done).length;
    const pane = $('[data-pane="shots"]');
    $('.progress i', pane).style.width = `${d / b.shotlist.length * 100}%`;
    $('.row span', pane).textContent = `${d}/${b.shotlist.length} Shots im Kasten`;
    $('.row .mono', pane).textContent = `${Math.round(d / b.shotlist.length * 100)}%`;
    if (d === b.shotlist.length && s.done) toast('Alle Shots im Kasten. That\'s a wrap!');
  }));
  $$('[data-shot]').forEach((row) => row.addEventListener('click', () => editShot(b, row.dataset.shot)));
  $('[data-action="add-shot"]')?.addEventListener('click', () => editShot(b, null));

  $$('[data-copy]').forEach((btn) => btn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.hooks[+btn.dataset.copy].text); toast('Hook kopiert'); } catch { toast('Kopieren nicht möglich'); }
  }));
  $('[data-action="more-hooks"]')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.innerHTML = `<span class="dots"><i></i><i></i><i></i><i></i><i></i></span>`; btn.disabled = true;
    try {
      b.hooks = await generateHooks(b, store.get().settings.apiKey);
      store.saveBrief(b); briefTab[id] = 'hooks'; route(); toast('Frische Hooks sind da');
    } catch (err) { toast(err.message); btn.disabled = false; btn.innerHTML = `${icon.sparkle(18)} Neue Hooks generieren`; }
  });

  $('[data-action="cycle-status"]').addEventListener('click', () => {
    const i = STATUSES.findIndex(([s]) => s === b.status);
    b.status = STATUSES[(i + 1) % STATUSES.length][0];
    store.saveBrief(b); haptic(); route();
  });
  $('[data-action="edit-brief"]')?.addEventListener('click', () => editBrief(b));
  $('[data-action="share"]').addEventListener('click', () => shareBrief(b));
  $('[data-action="brief-menu"]').addEventListener('click', () => {
    openSheet(`
      <h3>${esc(b.title)}</h3>
      <button class="menu-item" data-m="edit">${icon.edit(20)} Bearbeiten</button>
      <button class="menu-item" data-m="share">${icon.share(20)} Als Text teilen</button>
      <button class="menu-item" data-m="pdf">${icon.doc(20)} Als PDF exportieren</button>
      <button class="menu-item" data-m="dup">${icon.copy(20)} Duplizieren</button>
      <button class="menu-item danger" data-m="del">${icon.trash(20)} Löschen</button>
    `, (sh) => {
      $$('[data-m]', sh).forEach((m) => m.addEventListener('click', () => {
        const k = m.dataset.m; closeSheet();
        if (k === 'edit') setTimeout(() => editBrief(b), 300);
        if (k === 'share') shareBrief(b);
        if (k === 'pdf') setTimeout(() => window.print(), 400);
        if (k === 'dup') { const c = newBrief({ ...JSON.parse(JSON.stringify(b)), id: uid(), title: b.title + ' (Kopie)', createdAt: Date.now() }); store.saveBrief(c); go(`#/brief/${c.id}`); }
        if (k === 'del') { if (confirm('Projekt wirklich löschen?')) { store.deleteBrief(b.id); toast('Gelöscht'); go('#/projekte'); } }
      }));
    });
  });
}

async function renderBriefLicht(b) {
  const el = $('#brief-licht'); if (!el) return;
  if (!b.date || !b.locationGeo) {
    el.innerHTML = `<div class="glass card rise" style="--i:3"><div style="font-weight:500;margin-bottom:6px">Lichtplan für den Drehtag</div><p class="muted" style="margin-bottom:16px">Trag Datum und Location ein. Dann bekommst du Golden Hour, Blaue Stunde und Wetter für genau diesen Tag.</p><button class="btn btn-white btn-sm" data-edit>${icon.edit(16)} Datum & Ort ergänzen</button></div>`;
    $('[data-edit]', el).addEventListener('click', () => editBrief(b));
    return;
  }
  const day = new Date(b.date + 'T12:00');
  const p = lightPhases(day, b.locationGeo.lat, b.locationGeo.lng);
  const rows = [
    ['Blaue Stunde', p.blueMorningStart, p.blueMorningEnd, '#6694ff'],
    ['Golden Hour', p.goldenMorningStart, p.goldenMorningEnd, '#ffb347'],
    ['Sonnenaufgang', p.sunrise, null, '#ffd27a'],
    ['Sonnenuntergang', p.sunset, null, '#ff7a6b'],
    ['Golden Hour', p.goldenEveningStart, p.goldenEveningEnd, '#ffb347'],
    ['Blaue Stunde', p.blueEveningStart, p.blueEveningEnd, '#6694ff'],
  ].filter((r) => r[1]);
  el.innerHTML = `
    <div class="glass field-block rise" style="--i:3;margin-bottom:10px" id="bl-wx"><span class="eyebrow">${fmtDate(b.date, { weekday: 'long', day: 'numeric', month: 'long' })} · ${esc(b.location)}</span><p class="muted" style="font-size:14px">Wetter wird geladen…</p></div>
    <div class="phases">${rows.map(([l, a, z, c], i) => `<div class="glass phase rise" style="--i:${4 + i};color:${c}"><span class="dot"></span><div class="grow" style="color:var(--text);font-weight:500">${l}</div><span class="t" style="color:var(--text)">${fmtTime(a)}${z ? ` – ${fmtTime(z)}` : ''}</span></div>`).join('')}</div>
    <button class="btn btn-ghost btn-block no-print" style="margin-top:12px" data-open-licht>${icon.sun(18)} Im Lichtplaner öffnen</button>`;
  $('[data-open-licht]', el).addEventListener('click', () => {
    store.setSettings({ location: { name: b.location, ...b.locationGeo } });
    const n = daysUntil(b.date); lichtDay = n >= 0 && n < 7 ? n : 0; go('#/licht');
  });
  const n = daysUntil(b.date);
  const wxEl = $('#bl-wx', el);
  if (n < 0 || n > 6) { $('p', wxEl).textContent = n < 0 ? 'Drehtag liegt in der Vergangenheit.' : 'Wetter gibt es ab 7 Tagen vorher.'; return; }
  try {
    const data = await fetchWeather(b.locationGeo.lat, b.locationGeo.lng);
    const list = hourlyList(data);
    const ev = p.goldenEveningStart ? new Date((+p.goldenEveningStart + +p.goldenEveningEnd) / 2) : day;
    const w = weatherAt(list, ev);
    const sc = shootScore(ev, b.locationGeo.lat, b.locationGeo.lng, w);
    if (w && $('p', wxEl)) $('p', wxEl).outerHTML = `<div class="row" style="gap:12px;margin-top:4px">${weatherGlyph(weatherIcon(w.code), 28)}<div class="grow"><div style="font-weight:600">${Math.round(w.temp)}° · ${weatherText(w.code)} zur Golden Hour</div><div class="row-sub">${w.clouds}% Wolken · ${Math.round(w.wind)} km/h Wind · ${w.rain}% Regen</div></div><span class="score-badge" style="background:rgba(255,255,255,.08)"><b>${sc}</b>${scoreLabel(sc)}</span></div>`;
  } catch { if ($('p', wxEl)) $('p', wxEl).textContent = 'Wetter offline nicht verfügbar.'; }
}

function briefText(b) {
  const L = [];
  L.push(`${b.title.toUpperCase()}`);
  L.push([b.type, b.client, b.date && fmtDate(b.date, { day: '2-digit', month: '2-digit', year: 'numeric' }), b.location].filter(Boolean).join(' · '));
  L.push('');
  if (b.summary) L.push(`IDEE\n${b.summary}\n`);
  if (b.goal) L.push(`ZIEL: ${b.goal}`);
  if (b.audience) L.push(`ZIELGRUPPE: ${b.audience}`);
  if (b.deliverables.length) L.push(`DELIVERABLES: ${b.deliverables.map((d) => `${d.format} ${d.length} (${d.platform})`).join(', ')}`);
  if (b.moodKeywords.length) L.push(`MOOD: ${b.moodKeywords.join(', ')}`);
  L.push('');
  if (b.shotlist.length) {
    L.push('SHOTLIST');
    b.shotlist.forEach((s, i) => L.push(`${String(i + 1).padStart(2, '0')}. [${s.shotType}${s.duration ? ' · ' + s.duration : ''}] ${s.visual}\n    Audio: ${s.audio || '—'}`));
    L.push('');
  }
  if (b.hooks.length) { L.push('HOOKS'); b.hooks.forEach((h) => L.push(`${'●'.repeat(h.level)}${'○'.repeat(5 - h.level)} ${h.text}`)); L.push(''); }
  if (b.questions.length) { L.push('OFFENE FRAGEN'); b.questions.forEach((q) => L.push(`– ${q}`)); L.push(''); }
  if (b.gear.length) L.push(`EQUIPMENT: ${b.gear.join(', ')}`);
  L.push('\n— erstellt mit FV Studio · Fabian Visuals');
  return L.join('\n');
}
async function shareBrief(b) {
  const text = briefText(b);
  if (navigator.share) { try { await navigator.share({ title: b.title, text }); return; } catch (e) { if (e.name === 'AbortError') return; } }
  try { await navigator.clipboard.writeText(text); toast('Briefing in die Zwischenablage kopiert'); } catch { toast('Teilen nicht möglich'); }
}

function editShot(b, shotId) {
  const s = shotId ? b.shotlist.find((x) => x.id === shotId) : { id: uid(), visual: '', audio: '', shotType: 'Medium', duration: '', done: false };
  openSheet(`
    <h3>${shotId ? 'Shot bearbeiten' : 'Neuer Shot'}</h3>
    <label class="field"><span>Visual / B-Roll</span><textarea id="s-visual" placeholder="Was sieht man? Bewegung, Licht, Perspektive…">${esc(s.visual)}</textarea></label>
    <label class="field"><span>Audio / Voiceover</span><textarea id="s-audio" style="min-height:70px" placeholder="VO, O-Ton, Musik, Sound-Design…">${esc(s.audio)}</textarea></label>
    <div class="two">
      <label class="field"><span>Einstellung</span><select id="s-type">${SHOT_TYPES.map((t) => `<option ${t === s.shotType ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
      <label class="field"><span>Dauer</span><input id="s-dur" value="${esc(s.duration)}" placeholder="z. B. 3s"></label>
    </div>
    <button class="btn btn-white btn-block" data-save>Speichern</button>
    ${shotId ? `<button class="btn btn-block" style="color:var(--bad);margin-top:6px" data-del>${icon.trash(18)} Shot löschen</button>` : ''}
  `, (sh) => {
    $('[data-save]', sh).addEventListener('click', () => {
      s.visual = $('#s-visual', sh).value.trim(); s.audio = $('#s-audio', sh).value.trim();
      s.shotType = $('#s-type', sh).value; s.duration = $('#s-dur', sh).value.trim();
      if (!s.visual) { toast('Beschreib kurz das Visual'); return; }
      if (!shotId) b.shotlist.push(s);
      store.saveBrief(b); briefTab[b.id] = 'shots'; closeSheet(); setTimeout(route, 250);
    });
    $('[data-del]', sh)?.addEventListener('click', () => {
      b.shotlist = b.shotlist.filter((x) => x.id !== shotId);
      store.saveBrief(b); closeSheet(); setTimeout(route, 250);
    });
  });
}

function editBrief(b, isNew = false) {
  openSheet(`
    <h3>${isNew ? 'Neues Projekt' : 'Briefing bearbeiten'}</h3>
    <label class="field"><span>Projekttitel</span><input id="f-title" value="${esc(isNew ? '' : b.title)}" placeholder="z. B. Imagefilm – Bäckerei Schmitz"></label>
    <div class="two">
      <label class="field"><span>Kunde</span><input id="f-client" value="${esc(b.client)}"></label>
      <label class="field"><span>Art</span><select id="f-type">${PROJECT_TYPES.map((t) => `<option ${t === b.type ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
    </div>
    <div class="two">
      <label class="field"><span>Drehtag</span><input id="f-date" type="date" value="${esc(b.date)}"></label>
      <label class="field"><span>Status</span><select id="f-status">${STATUSES.map(([k, l]) => `<option value="${k}" ${k === b.status ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    </div>
    <label class="field"><span>Location (Stadt oder Ort)</span><input id="f-loc" value="${esc(b.location)}" placeholder="z. B. Bonn, Rheinaue"></label>
    <label class="field"><span>Idee / Zusammenfassung</span><textarea id="f-summary">${esc(b.summary)}</textarea></label>
    <div class="two">
      <label class="field"><span>Ziel</span><input id="f-goal" value="${esc(b.goal)}"></label>
      <label class="field"><span>Zielgruppe</span><input id="f-aud" value="${esc(b.audience)}"></label>
    </div>
    <div class="field"><span>Farbwelt</span>
      <div class="radio-pal">${['warm', 'primary', 'cool'].map((p) => `<label><input type="radio" name="pal" value="${p}" ${b.palette === p ? 'checked' : ''}><div class="palette-strip ${p}"></div></label>`).join('')}</div>
    </div>
    <label class="field"><span>Mood-Keywords (mit Komma)</span><input id="f-mood" value="${esc(b.moodKeywords.join(', '))}"></label>
    <label class="field"><span>Deliverables (eine pro Zeile: Format · Länge · Plattform)</span><textarea id="f-del" style="min-height:70px">${esc(b.deliverables.map((d) => [d.format, d.length, d.platform].join(' · ')).join('\n'))}</textarea></label>
    <label class="field"><span>Offene Fragen (eine pro Zeile)</span><textarea id="f-q" style="min-height:70px">${esc(b.questions.join('\n'))}</textarea></label>
    <label class="field"><span>Equipment (mit Komma)</span><input id="f-gear" value="${esc(b.gear.join(', '))}"></label>
    <button class="btn btn-white btn-block" data-save>${isNew ? 'Projekt anlegen' : 'Speichern'}</button>
  `, (sh) => {
    $('[data-save]', sh).addEventListener('click', async (e) => {
      const v = (id) => $(id, sh).value.trim();
      const oldLoc = b.location;
      b.title = v('#f-title') || (v('#f-client') ? `${v('#f-type')} – ${v('#f-client')}` : 'Neues Projekt');
      b.client = v('#f-client'); b.type = v('#f-type'); b.date = v('#f-date'); b.status = v('#f-status');
      b.location = v('#f-loc'); b.summary = v('#f-summary'); b.goal = v('#f-goal'); b.audience = v('#f-aud');
      b.palette = $('input[name="pal"]:checked', sh)?.value || 'primary';
      b.moodKeywords = v('#f-mood').split(',').map((x) => x.trim()).filter(Boolean);
      b.deliverables = v('#f-del').split('\n').map((l) => l.split('·').map((x) => x.trim())).filter((p) => p[0]).map(([format, length = '', platform = '']) => ({ format, length, platform }));
      b.questions = v('#f-q').split('\n').map((x) => x.trim()).filter(Boolean);
      b.gear = v('#f-gear').split(',').map((x) => x.trim()).filter(Boolean);
      if (b.location && (b.location !== oldLoc || !b.locationGeo)) {
        e.currentTarget.innerHTML = `<span class="dots"><i style="background:#000"></i><i style="background:#000"></i><i style="background:#000"></i></span>`;
        b.locationGeo = await geocode(b.location);
      }
      if (!b.location) b.locationGeo = null;
      store.saveBrief(b); closeSheet();
      if (isNew) go(`#/brief/${b.id}`); else setTimeout(route, 250);
    });
  });
}

async function geocode(name) {
  try { const r = await searchPlaces(name.split(',')[0]); return r[0] ? { lat: r[0].lat, lng: r[0].lng } : null; } catch { return null; }
}

/* ───────────────────────── VOICE ───────────────────────── */
function viewVoice() {
  setAurora(['#1a2a8a', '#2365ff', '#6694ff']);
  const hasKey = !!store.get().settings.apiKey;
  app.innerHTML = `
  <section class="voice">
    <div class="topglow"></div>
    <div class="inner">
      <div class="row between">
        <button class="icon-btn" data-action="close-voice" aria-label="Schließen" style="border-color:rgba(255,255,255,.25)">${icon.close(20)}</button>
        <span class="chip-pill" style="border-color:rgba(255,255,255,.25);font-size:13px;height:34px">${hasKey ? `${icon.sparkle(14)} Claude` : 'Offline-Modus'}</span>
      </div>
      <div class="ai-orb pop">${icon.logo(26)}<sup>AI</sup></div>
      <div class="state" id="v-state">${speechSupported ? 'Tippe zum Aufnehmen' : 'Schreib oder diktiere'}</div>
      <div class="timer" id="v-timer">${speechSupported ? '00:00' : 'Tipp: Mikro-Taste auf deiner Tastatur'}</div>
      <canvas id="v-wave"></canvas>
      <textarea class="transcript" id="v-text" placeholder="Erzähl mir vom Projekt: Kunde, Idee, Drehtag, Location, Stimmung, Formate…" style="background:transparent;border:0;outline:0;resize:none;width:100%;color:var(--text)"></textarea>
      <div class="thinking-steps hidden" id="v-steps"></div>
      <div class="row between" id="v-controls" style="margin-top:12px;align-items:center">
        <button class="icon-btn" data-action="clear" aria-label="Leeren" style="width:52px;height:52px;border-color:rgba(255,255,255,.2)">${icon.trash(20)}</button>
        ${speechSupported ? `<button class="rec-btn" id="v-rec" aria-label="Aufnahme"><i></i></button>` : `<span style="width:76px"></span>`}
        <button class="icon-btn solid" id="v-go" aria-label="Briefing erstellen" style="width:52px;height:52px">${icon.arrowUp(22)}</button>
      </div>
    </div>
  </section>`;

  const ta = $('#v-text'), state = $('#v-state'), timer = $('#v-timer'), recBtn = $('#v-rec');
  let rec = null, t0 = 0, iv = null, thinking = false, thinkLevel = 0;

  const getLevel = () => thinking ? 0.35 + Math.sin(Date.now() / 260) * 0.15 : rec?.active ? rec.sample() : 0.06 + (ta.value ? 0.04 : 0);
  const stopWave = startWave($('#v-wave'), getLevel);
  onCleanup(stopWave);

  const stopRec = () => {
    if (!rec) return;
    rec.stop(); rec = null; clearInterval(iv);
    recBtn?.classList.remove('on');
    state.textContent = ta.value.trim() ? 'Bereit. Pfeil drücken zum Erstellen.' : 'Tippe zum Aufnehmen';
    ta.readOnly = false;
  };
  onCleanup(stopRec);

  recBtn?.addEventListener('click', async () => {
    haptic(14);
    if (rec) { stopRec(); return; }
    rec = new Recorder({
      onText: (final, interim) => { ta.value = (final + interim).trimStart(); ta.scrollTop = ta.scrollHeight; },
      onEnd: () => {},
      onError: (msg) => { toast(msg); stopRec(); },
    });
    ta.readOnly = true;
    await rec.start(ta.value);
    recBtn.classList.add('on');
    state.innerHTML = `Ich höre zu <span class="dots" style="margin-left:6px"><i></i><i></i><i></i><i></i><i></i></span>`;
    t0 = Date.now();
    iv = setInterval(() => { const s = Math.floor((Date.now() - t0) / 1000); timer.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; }, 250);
  });

  $('[data-action="clear"]').addEventListener('click', () => { ta.value = ''; haptic(); ta.focus(); });
  $('[data-action="close-voice"]').addEventListener('click', () => { stopRec(); history.length > 1 ? history.back() : go('#/heute'); });

  $('#v-go').addEventListener('click', async () => {
    stopRec();
    const text = ta.value.trim();
    if (text.length < 12) { toast('Erzähl mir noch ein bisschen mehr'); return; }
    thinking = true; haptic(18);
    $('#v-controls').classList.add('hidden'); ta.classList.add('hidden');
    const steps = $('#v-steps'); steps.classList.remove('hidden');
    state.innerHTML = `Thinking <span class="dots" style="margin-left:6px"><i></i><i></i><i></i><i></i><i></i></span>`;
    timer.textContent = '';
    const labels = ['Briefing strukturieren', 'Zielgruppe & Ziel schärfen', 'Shotlist bauen – Audio | Visual', 'Hooks von safe bis verrückt', 'Farbwelt wählen', 'Letzter Feinschliff'];
    let k = 0; steps.textContent = labels[0];
    const si = setInterval(() => { steps.style.opacity = 0; setTimeout(() => { k = (k + 1) % labels.length; steps.textContent = labels[k]; steps.style.opacity = 1; }, 250); }, 2200);
    onCleanup(() => clearInterval(si));
    try {
      const { data, source, warning } = await generateBrief(text, store.get().settings.apiKey);
      clearInterval(si);
      const b = newBrief({ ...data, transcript: text, status: 'idee' });
      if (b.location) b.locationGeo = await geocode(b.location);
      store.saveBrief(b);
      haptic(24);
      toast(warning ? `${warning}` : source === 'claude' ? 'Briefing steht. Viel Spaß beim Dreh!' : 'Briefing steht · Offline-Generator');
      location.replace(`#/brief/${b.id}`);
    } catch (err) {
      clearInterval(si);
      thinking = false;
      toast(err.message || 'Da ging was schief');
      $('#v-controls').classList.remove('hidden'); ta.classList.remove('hidden'); steps.classList.add('hidden');
      state.textContent = 'Nochmal versuchen?';
    }
  });

  if (!speechSupported) setTimeout(() => ta.focus(), 500);
}

/* ───────────────────────── SETUP ───────────────────────── */
function viewSetup() {
  setAurora(PALETTES.primary);
  const { settings, briefs } = store.get();
  app.innerHTML = `
  <section class="view">
    <header class="topbar rise" style="--i:0"><h2 class="title">Setup</h2><span class="brandmark"><span class="logo">${icon.logo()}</span></span></header>

    <div class="glass settings-group rise" style="--i:1">
      <label class="field" style="margin:14px 0"><span>Dein Name</span><input id="s-name" value="${esc(settings.name)}"></label>
      <button class="menu-item" data-action="pick-location">${icon.pin(20)}<div class="grow"><div>Standard-Ort</div><div class="row-sub">${esc(settings.location.name)} · ${settings.location.lat.toFixed(2)}, ${settings.location.lng.toFixed(2)}</div></div>${icon.arrowRight(18)}</button>
    </div>

    <div class="section-head rise" style="--i:2"><h3>KI-Engine</h3></div>
    <div class="glow primary card rise" style="--i:3;padding:20px 20px 26px">
      <div class="row" style="margin-bottom:10px">${icon.key(20)}<div style="font-weight:600">Claude API-Key</div><span class="tag solid" style="margin-left:auto;height:26px">${settings.apiKey ? 'Aktiv' : 'Offline-Modus'}</span></div>
      <p class="muted" style="font-size:14px;margin-bottom:14px">Mit eigenem Key schreibt Claude deine Briefings, Shotlists und Hooks. Ohne Key arbeitet ein Offline-Generator mit Vorlagen. Der Key bleibt nur auf diesem Gerät.</p>
      <div class="row" style="gap:8px">
        <input class="input grow" id="s-key" type="password" placeholder="sk-ant-…" value="${esc(settings.apiKey)}" autocomplete="off" spellcheck="false">
        <button class="icon-btn" data-action="toggle-key" aria-label="Anzeigen">${icon.edit(18)}</button>
      </div>
      <p class="faint" style="font-size:12px;margin-top:10px">Key erstellen: console.anthropic.com → API Keys. Kosten pro Briefing: wenige Cent.</p>
    </div>

    <div class="section-head rise" style="--i:4"><h3>Daten</h3><span class="muted" style="font-size:13px">${briefs.length} Projekte · lokal gespeichert</span></div>
    <div class="glass settings-group rise" style="--i:5">
      <button class="menu-item" data-action="export">${icon.download(20)}<div class="grow">Backup exportieren (.json)</div></button>
      <label class="menu-item" style="cursor:pointer">${icon.upload(20)}<div class="grow">Backup importieren</div><input type="file" accept="application/json,.json" id="s-import" hidden></label>
      <button class="menu-item danger" data-action="reset">${icon.trash(20)}<div class="grow">Alles zurücksetzen</div></button>
    </div>

    <div class="section-head rise" style="--i:6"><h3>Installieren</h3></div>
    <div class="glass card rise" style="--i:7">
      <div class="stack" style="font-size:15px">
        <div><b>iPhone:</b> <span class="muted">In Safari öffnen → Teilen <span class="kbd">⬆︎</span> → „Zum Home-Bildschirm“.</span></div>
        <div><b>Android:</b> <span class="muted">Chrome-Menü <span class="kbd">⋮</span> → „App installieren“.</span></div>
        <div><b>Desktop:</b> <span class="muted">Install-Symbol rechts in der Adressleiste.</span></div>
      </div>
    </div>
    <p class="faint mono" style="font-size:11px;text-align:center;margin-top:24px">FV STUDIO · v1.0 · Made for Fabian Visuals</p>
  </section>`;

  bindCommon();
  $('#s-name').addEventListener('change', (e) => { store.setSettings({ name: e.target.value.trim() || 'Fabian' }); toast('Gespeichert'); });
  $('#s-key').addEventListener('change', (e) => {
    const k = e.target.value.trim();
    if (k && !k.startsWith('sk-ant-')) toast('Der Key sieht ungewöhnlich aus. Trotzdem gespeichert.');
    else toast(k ? 'API-Key gespeichert' : 'Key entfernt, Offline-Modus aktiv');
    store.setSettings({ apiKey: k }); setTimeout(route, 400);
  });
  $('[data-action="toggle-key"]').addEventListener('click', () => { const i = $('#s-key'); i.type = i.type === 'password' ? 'text' : 'password'; });
  $('[data-action="export"]').addEventListener('click', () => {
    const data = JSON.parse(store.exportJSON()); data.settings.apiKey = ''; // Key nie ins Backup
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `fv-studio-backup-${todayISO()}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });
  $('#s-import').addEventListener('change', async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try { const key = store.get().settings.apiKey; store.importJSON(await f.text()); if (key && !store.get().settings.apiKey) store.setSettings({ apiKey: key }); toast('Backup importiert'); route(); } catch (err) { toast(err.message); }
  });
  $('[data-action="reset"]').addEventListener('click', () => { if (confirm('Alle Projekte und Einstellungen löschen?')) { store.reset(); toast('Zurückgesetzt'); route(); } });
}

/* ───────────────────────── Gemeinsame Bindings ───────────────────────── */
function bindCommon() {
  $$('[data-go]', app).forEach((el) => el.addEventListener('click', (e) => { if (e.target.closest('[data-check],[data-copy]')) return; haptic(); go(el.dataset.go); }));
  $$('[data-action="new-brief"]', app).forEach((el) => el.addEventListener('click', () => { const b = newBrief({ title: '' }); editBrief(b, true); }));
  $$('[data-action="pick-location"]', app).forEach((el) => el.addEventListener('click', () => pickLocation((p) => { store.setSettings({ location: { name: p.name, lat: p.lat, lng: p.lng } }); toast(`Ort: ${p.name}`); route(); })));
}

let deferredInstall = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredInstall = e; bindInstall(); });
function bindInstall() {
  const btn = $('#install-btn');
  if (!btn) return;
  if (!deferredInstall) { btn.textContent = 'So geht’s'; btn.onclick = () => go('#/setup'); return; }
  btn.textContent = 'Installieren';
  btn.onclick = async () => { deferredInstall.prompt(); const r = await deferredInstall.userChoice; if (r.outcome === 'accepted') $('#install-card')?.remove(); deferredInstall = null; };
}

/* Countdown-Ticker */
setInterval(() => {
  $$('[data-countdown]').forEach((el) => {
    const t = +el.dataset.countdown; if (!t) return;
    const left = t - Date.now();
    if (left <= 0 && location.hash.includes('heute')) { route(); return; }
    el.innerHTML = hms(left);
  });
}, 1000);

/* ───────────────────────── Start ───────────────────────── */
renderDock();
route();
window.addEventListener('resize', () => updateDock((location.hash.replace(/^#\/?/, '') || 'heute').split('/')[0]));

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
