// Shared UI helpers: escaping, icons, constants, date formatting, sheet + toast.

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- Icons (24px grid, stroke-based) ----------

const ICONS = {
  back: '<path d="M15 5l-7 7 7 7"/>',
  chevron: '<path d="M9 5l7 7-7 7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  arrowUpRight: '<path d="M7 17L17 7M8 7h9v9"/>',
  list: '<rect x="3.5" y="4" width="17" height="16" rx="4"/><path d="M8 9h8M8 13h8M8 17h4"/>',
  gear: '<path d="M4 8.5A2.5 2.5 0 0 1 6.5 6H8l1.2-2h5.6L16 6h1.5A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z"/><circle cx="12" cy="12.5" r="3.5"/>',
  settings: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
  edit: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  trash: '<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="3.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  moon: '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>',
  cloud: '<path d="M7 18.5h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.2 11.6 3.5 3.5 0 0 0 7 18.5z"/>',
  car: '<path d="M5 16.5V12l2-5h10l2 5v4.5"/><path d="M3.5 16.5h17M7 19.5v-3M17 19.5v-3"/><circle cx="7.5" cy="13.5" r=".8"/><circle cx="16.5" cy="13.5" r=".8"/>',
  battery: '<rect x="3" y="7.5" width="16" height="9" rx="2.5"/><path d="M21 10.5v3M6.5 10.5v3M9.5 10.5v3"/>',
  card: '<path d="M7 3.5h7.5L18 7v13.5H7z"/><path d="M10 3.5v3.5M12.5 3.5v3.5M15 4.5v2.5"/>',
  box: '<path d="M3.5 8L12 3.5 20.5 8v8.5L12 21l-8.5-4.5z"/><path d="M3.5 8L12 12.5 20.5 8M12 12.5V21"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.1a4.3 4.3 0 0 1 7.5 2.7C19.5 15.4 12 20 12 20z"/>',
  briefcase: '<rect x="3.5" y="7" width="17" height="12.5" rx="3"/><path d="M9 7V5h6v2M3.5 12.5h17"/>',
  music: '<path d="M9 17.5V5.5l10-2v12"/><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="15.5" r="2.5"/>',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="3"/><path d="M11 18.5h2"/>',
  user: '<circle cx="12" cy="8.5" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>',
  star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z"/>',
  camera: '<path d="M4 8.5A2.5 2.5 0 0 1 6.5 6H8l1.2-2h5.6L16 6h1.5A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z"/><circle cx="12" cy="12.5" r="3.5"/>',
  lens: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><path d="M12 3.5v4M20.5 12h-4"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6"/>',
  light: '<path d="M9 17h6M10 20.5h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  grip: '<path d="M12 3.5v9M12 12.5L5.5 20.5M12 12.5l6.5 8M12 12.5v8"/><rect x="8.5" y="2.5" width="7" height="3" rx="1.5"/>',
  misc: '<circle cx="6" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18" cy="12" r="1.3"/>',
  alert: '<path d="M12 4l9 15.5H3z"/><path d="M12 10v4M12 17v.01"/>',
  monitor: '<rect x="3.5" y="4" width="17" height="12" rx="3"/><path d="M8.5 20h7M12 16v4"/>',
  indoor: '<path d="M4 11L12 4.5 20 11v9H4z"/><path d="M10 20v-5h4v5"/>',
  outdoor: '<path d="M3 19.5h18M6 19.5l4.5-8 3 5 2-3 3.5 6"/><circle cx="17" cy="6.5" r="2"/>',
  mixed: '<path d="M4 11L9 6.5l5 4.5v8.5H4z"/><path d="M14 19.5h7l-3.5-6"/>',
  photo: '<rect x="3.5" y="5" width="17" height="14" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="M20.5 15.5l-4.5-4.5-8.5 8"/>',
  video: '<rect x="3" y="6.5" width="12.5" height="11" rx="3"/><path d="M15.5 10.5l5.5-3v9l-5.5-3"/>',
  hybrid: '<rect x="3" y="6.5" width="12.5" height="11" rx="3"/><path d="M15.5 10.5l5.5-3v9l-5.5-3"/><circle cx="9.2" cy="12" r="2.4"/>',
  rain: '<path d="M7 15.5h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.2 8.6 3.5 3.5 0 0 0 7 15.5z"/><path d="M8 18.5l-1 2M12 18.5l-1 2M16 18.5l-1 2"/>',
  snow: '<path d="M7 15.5h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.2 8.6 3.5 3.5 0 0 0 7 15.5z"/><path d="M8 19h.01M12 20h.01M16 19h.01"/>',
  storm: '<path d="M7 15.5h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.2 8.6 3.5 3.5 0 0 0 7 15.5z"/><path d="M12.5 14l-2 3.5h3l-2 3.5"/>',
  wind: '<path d="M3 9h11a2.5 2.5 0 1 0-2.5-2.5M3 13h15a2.5 2.5 0 1 1-2.5 2.5M3 17h7"/>',
  drop: '<path d="M12 3.5s6 6.4 6 10.5a6 6 0 0 1-12 0c0-4.1 6-10.5 6-10.5z"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  route: '<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5"/>',
  sunrise: '<path d="M3 18h18M7 14.5a5 5 0 0 1 10 0M12 4v4M9.5 6.5L12 4l2.5 2.5M4.5 11l1.5 1M19.5 11L18 12"/>',
  sunset: '<path d="M3 18h18M7 14.5a5 5 0 0 1 10 0M12 4v4M9.5 5.5L12 8l2.5-2.5M4.5 11l1.5 1M19.5 11L18 12"/>',
  download: '<path d="M12 4v11M7 10.5l5 5 5-5M5 19.5h14"/>',
};

export function icon(name, size = 22, stroke = 1.6) {
  return `<svg class="i" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.misc}</svg>`;
}

export const aurora = () => '<div class="aurora" aria-hidden="true"><span></span><span></span><span></span></div>';

// ---------- Domain constants ----------

// Each shoot type gets its own aurora palette (inspired by warm / primary / cool glow studies).
export const SHOOT_TYPES = {
  wedding:    { label: 'Hochzeit',    icon: 'heart',     palette: ['#f89abf', '#a59af8', '#ffb923'] },
  commercial: { label: 'Commercial',  icon: 'briefcase', palette: ['#2236cc', '#307af4', '#a59af8'] },
  musicvideo: { label: 'Musikvideo',  icon: 'music',     palette: ['#fd290d', '#f66515', '#a59af8'] },
  social:     { label: 'Social',      icon: 'phone',     palette: ['#a59af8', '#ffb923', '#2fd38a'] },
  portrait:   { label: 'Porträt',     icon: 'user',      palette: ['#307af4', '#4fd2e6', '#9be3b0'] },
  event:      { label: 'Event',       icon: 'star',      palette: ['#ffb923', '#f66515', '#307af4'] },
  custom:     { label: 'Sonstiges',   icon: 'spark',     palette: ['#2365ff', '#6694ff', '#144ccd'] },
};

export const MODES = { photo: { label: 'Foto', icon: 'photo' }, video: { label: 'Video', icon: 'video' }, hybrid: { label: 'Hybrid', icon: 'hybrid' } };
export const IO = { indoor: { label: 'Indoor', icon: 'indoor' }, outdoor: { label: 'Outdoor', icon: 'outdoor' }, mixed: { label: 'Gemischt', icon: 'mixed' } };

export const PHASES = [
  { id: 'planned',   label: 'Geplant' },
  { id: 'packed',    label: 'Gepackt' },
  { id: 'shooting',  label: 'Am Set' },
  { id: 'wrapped',   label: 'Wrap' },
  { id: 'backed-up', label: 'Gesichert' },
];

export const GEAR_CATEGORIES = {
  camera:  { label: 'Kamera',    icon: 'camera' },
  lens:    { label: 'Objektive', icon: 'lens' },
  audio:   { label: 'Audio',     icon: 'mic' },
  light:   { label: 'Licht',     icon: 'light' },
  power:   { label: 'Strom',     icon: 'battery' },
  storage: { label: 'Speicher',  icon: 'card' },
  grip:    { label: 'Grip',      icon: 'grip' },
  misc:    { label: 'Sonstiges', icon: 'misc' },
};

export function paletteStyle(type) {
  const [a, b, c] = (SHOOT_TYPES[type] || SHOOT_TYPES.custom).palette;
  return `--g1:${a};--g2:${b};--g3:${c}`;
}

// ---------- Dates (all local time, dates stored as "YYYY-MM-DD") ----------

const pad = (n) => String(n).padStart(2, '0');
export const toISODate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayISO = () => toISODate(new Date());
export function addDaysISO(iso, n) {
  const d = parseDate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}
export function parseDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}
export function parseDateTime(iso, hhmm = '00:00') {
  const d = parseDate(iso);
  const [h, min] = hhmm.split(':').map(Number);
  d.setHours(h, min, 0, 0);
  return d;
}

// Whole calendar days between today and the given date (DST-safe via rounding).
export function daysUntil(iso, from = new Date()) {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return Math.round((parseDate(iso) - a) / 86400000);
}

// Duration call→wrap in minutes; a wrap earlier than call means it ends after midnight.
export function durationMin(call, wrap) {
  const [ch, cm] = call.split(':').map(Number);
  const [wh, wm] = wrap.split(':').map(Number);
  let d = wh * 60 + wm - (ch * 60 + cm);
  if (d <= 0) d += 24 * 60;
  return d;
}

/** "HH:MM" for a Date in local time. */
export const fmtTime = (d) => (d ? d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '–');

export function fmtDuration(min) {
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

const dtf = (opts) => new Intl.DateTimeFormat('de-DE', opts);
export const fmtDateLong = (iso) => dtf({ weekday: 'long', day: 'numeric', month: 'long' }).format(parseDate(iso));
export const fmtDateShort = (iso) => dtf({ weekday: 'short', day: '2-digit', month: '2-digit' }).format(parseDate(iso)).replace(',', '');
export const fmtWeekdayShort = (iso) => dtf({ weekday: 'short' }).format(parseDate(iso)).replace('.', '');
export const fmtMonthShort = (iso) => dtf({ month: 'short' }).format(parseDate(iso)).replace('.', '');

export function relativeDay(iso) {
  const n = daysUntil(iso);
  if (n === 0) return 'Heute';
  if (n === 1) return 'Morgen';
  if (n === -1) return 'Gestern';
  if (n > 1) return `in ${n} Tagen`;
  return `vor ${-n} Tagen`;
}

// Big countdown for the hero: number + unit.
export function countdown(shoot, now = new Date()) {
  const n = daysUntil(shoot.date, now);
  if (n > 0) return { big: String(n), unit: n === 1 ? 'Tag bis zum Dreh' : 'Tage bis zum Dreh' };
  const call = parseDateTime(shoot.date, shoot.callTime);
  const diffMin = Math.round((call - now) / 60000);
  if (diffMin > 0) {
    const h = Math.floor(diffMin / 60);
    return h > 0 ? { big: String(h), unit: h === 1 ? 'Stunde bis Call' : 'Stunden bis Call' } : { big: String(diffMin), unit: 'Min. bis Call' };
  }
  return { big: 'Heute', unit: 'am Set' };
}

export function greeting(name) {
  const h = new Date().getHours();
  const g = h < 5 ? 'Gute Nacht' : h < 11 ? 'Guten Morgen' : h < 17 ? 'Hey' : h < 22 ? 'Guten Abend' : 'Gute Nacht';
  return name ? `${g}, ${name}` : g;
}

// ---------- Toast ----------

let toastTimer;
export function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
}

// ---------- Bottom sheet ----------

export function openSheet(html, onMount) {
  const root = document.getElementById('sheet-root');
  root.innerHTML = `<div class="sheet-backdrop"></div><div class="sheet" role="dialog" aria-modal="true"><div class="handle"></div>${html}</div>`;
  const sheet = root.querySelector('.sheet');
  const backdrop = root.querySelector('.sheet-backdrop');
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    sheet.classList.add('closing');
    backdrop.classList.add('closing');
    document.removeEventListener('keydown', onKey);
    setTimeout(() => { root.innerHTML = ''; }, 240);
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  backdrop.addEventListener('click', close);
  document.addEventListener('keydown', onKey);
  window.addEventListener('hashchange', close, { once: true });
  onMount?.(sheet, close);
  return close;
}

export function confirmSheet({ title, text, confirm = 'Löschen', danger = true }) {
  return new Promise((resolve) => {
    let result = false;
    const close = openSheet(
      `<h2>${esc(title)}</h2>${text ? `<p class="lead">${esc(text)}</p>` : ''}
       <div class="sheet-actions">
         <button class="btn block ${danger ? 'danger-ghost' : 'orb'}" data-ok>${esc(confirm)}</button>
         <button class="btn block ghost" data-cancel>Abbrechen</button>
       </div>`,
      (sheet, close) => {
        sheet.querySelector('[data-ok]').onclick = () => { result = true; close(); };
        sheet.querySelector('[data-cancel]').onclick = close;
      }
    );
    // Resolve once the sheet is removed from the DOM.
    const root = document.getElementById('sheet-root');
    const obs = new MutationObserver(() => { if (!root.firstChild) { obs.disconnect(); resolve(result); } });
    obs.observe(root, { childList: true });
    void close;
  });
}
