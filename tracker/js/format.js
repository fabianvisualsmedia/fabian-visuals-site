// Pure formatting/parsing helpers. Money is always handled as integer cents.

const pad = (n) => String(n).padStart(2, '0');

const eurFmt = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

/** 123456 -> "1.234,56 €" */
export const fmtEUR = (cents) => eurFmt.format((cents || 0) / 100);

/** 7000 -> "70 €/h" (no decimals when whole) */
export function fmtRate(cents) {
  const whole = cents % 100 === 0;
  const n = (cents / 100).toLocaleString('de-DE', {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${n} €/h`;
}

/** Parses German money input ("1.200,50", "1200", "1200.5", "70 €") into cents. NaN on garbage. */
export function parseEUR(input) {
  if (input == null) return 0;
  let s = String(input).trim().replace(/[€\s]/g, '');
  if (!s) return 0;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n * 100) : NaN;
}

/** Cents -> value for an <input> ("1200" / "1200,50"), empty for 0/null. */
export function centsToInput(cents) {
  if (!cents) return '';
  return (cents / 100).toLocaleString('de-DE', {
    minimumFractionDigits: cents % 100 ? 2 : 0,
    maximumFractionDigits: 2,
    useGrouping: false,
  });
}

/** Parses hours input: "1,5" | "1.5" | "1:30" -> 1.5. NaN on garbage, 0 on empty. */
export function parseHours(input) {
  const s = String(input ?? '').trim();
  if (!s) return 0;
  const m = s.match(/^(\d+):(\d{1,2})$/);
  if (m) return Number(m[1]) + Number(m[2]) / 60;
  const n = Number(s.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : NaN;
}

export const hoursToInput = (h) =>
  h ? h.toLocaleString('de-DE', { maximumFractionDigits: 2, useGrouping: false }) : '';

/** ms -> "1:07:03" (hours may exceed 24) */
export function fmtClock(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 3600)}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

/** ms -> "1 h 07 min" / "42 min" */
export function fmtDur(ms) {
  const min = Math.round(Math.max(0, ms) / 60000);
  const h = Math.floor(min / 60);
  return h ? `${h} h ${pad(min % 60)} min` : `${min} min`;
}

/** ms -> "12,5 h" */
export const fmtHours = (ms, digits = 1) =>
  `${(ms / 3600000).toLocaleString('de-DE', { maximumFractionDigits: digits })} h`;

/** hours number -> "12,5 h" */
export const fmtH = (h, digits = 1) =>
  `${(h || 0).toLocaleString('de-DE', { maximumFractionDigits: digits })} h`;

export const fmtTime = (iso) => {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const fmtDay = (iso) =>
  new Date(iso).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });

export const fmtDate = (isoOrDate) =>
  isoOrDate
    ? new Date(isoOrDate).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '';

/** Local calendar day key "YYYY-MM-DD" for grouping. */
export function dayKey(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** ISO -> value for <input type="datetime-local"> in local time. */
export function toLocalInput(iso) {
  const d = new Date(iso);
  return `${dayKey(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const toTimeInput = (iso) => fmtTime(iso);

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 5) return 'Späte Session';
  if (h < 11) return 'Guten Morgen';
  if (h < 17) return 'Guten Tag';
  if (h < 22) return 'Guten Abend';
  return 'Späte Session';
}
