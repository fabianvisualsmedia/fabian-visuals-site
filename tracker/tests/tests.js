// Test runner + tests. Numbers in brackets refer to CLAUDE.md §8.
// Results are rendered as a green/red list and exposed as window.__results for automation.

import { createStore } from '../js/db.js';
import {
  durationMs, startTimer, stopTimer, getRunning, findOverlaps, buildInterval, isForgotten, MIN_ENTRY_MS,
} from '../js/logic/timer.js';
import { parseEUR, fmtEUR, parseHours, fmtClock } from '../js/format.js';

const groups = [];
let current;
const group = (title) => groups.push((current = { title, tests: [] }));
const test = (name, fn, { skip = false } = {}) => current.tests.push({ name, fn, skip });

class AssertError extends Error {}
const eq = (actual, expected, msg = '') => {
  if (!Object.is(actual, expected)) throw new AssertError(`${msg} erwartet ${JSON.stringify(expected)}, erhalten ${JSON.stringify(actual)}`);
};
const ok = (cond, msg = 'Bedingung nicht erfüllt') => {
  if (!cond) throw new AssertError(msg);
};

const H = 3600_000, MIN = 60_000;
const isBerlin = Intl.DateTimeFormat().resolvedOptions().timeZone === 'Europe/Berlin';

/* ---------- [1] Timer duration ---------- */
group('[1] Timer-Dauer');

test('Start in der Vergangenheit, laufend → Dauer bis jetzt', () => {
  const now = Date.parse('2026-11-19T10:00:00Z');
  eq(durationMs('2026-11-19T09:55:00Z', null, now), 5 * MIN);
});
test('Über Mitternacht: 22:30 → 01:15 = 2 h 45 min', () => {
  eq(durationMs('2026-11-18T22:30:00+01:00', '2026-11-19T01:15:00+01:00'), 2 * H + 45 * MIN);
});
test('Zeitumstellung Herbst (25.10.2026): 01:30 MESZ → 03:30 MEZ = 3 h', () => {
  eq(durationMs('2026-10-25T01:30:00+02:00', '2026-10-25T03:30:00+01:00'), 3 * H);
});
test('Zeitumstellung Frühjahr (29.03.2026): 01:30 MEZ → 03:30 MESZ = 1 h', () => {
  eq(durationMs('2026-03-29T01:30:00+01:00', '2026-03-29T03:30:00+02:00'), 1 * H);
});
test('Lokale Eingabe über die Zeitumstellung (Europe/Berlin): 25.10. 01:30–03:30 = 3 h', () => {
  const iv = buildInterval({ dateStr: '2026-10-25', fromStr: '01:30', toStr: '03:30' });
  eq(durationMs(iv.start, iv.end), 3 * H);
}, { skip: !isBerlin });
test('Lokale Eingabe „bis“ vor „von“ → endet am Folgetag', () => {
  const iv = buildInterval({ dateStr: '2026-11-18', fromStr: '22:00', toStr: '01:30' });
  eq(durationMs(iv.start, iv.end), 3.5 * H);
});
test('Eingabe als Dauer 1:30 → 90 min', () => {
  const iv = buildInterval({ dateStr: '2026-11-18', fromStr: '09:00', durationHours: parseHours('1:30') });
  eq(durationMs(iv.start, iv.end), 90 * MIN);
});
test('Uhr-Format: 26 h 3 min 7 s → 26:03:07', () => eq(fmtClock(26 * H + 3 * MIN + 7000), '26:03:07'));
test('Vergessen-Schutz greift erst über der Schwelle', () => {
  const e = { start: '2026-11-18T08:00:00Z', end: null };
  eq(isForgotten(e, 10, Date.parse('2026-11-18T17:59:00Z')), false);
  eq(isForgotten(e, 10, Date.parse('2026-11-18T18:01:00Z')), true);
  eq(isForgotten({ ...e, end: '2026-11-18T20:00:00Z' }, 10, Date.parse('2026-11-19T08:00:00Z')), false);
});

/* ---------- [2] Single running timer ---------- */
group('[2] Ein Timer');

test('Neuer Start beendet den laufenden Eintrag mit exakt diesem Zeitpunkt', async () => {
  const store = createStore(`fv-test-${Math.random().toString(36).slice(2)}`);
  try {
    const t0 = new Date('2026-11-19T09:00:00Z');
    const t1 = new Date('2026-11-19T10:30:00Z');
    const { entry: a } = await startTimer(store, { projectId: 'p1', phase: 'shoot' }, t0);
    const { entry: b, stopped } = await startTimer(store, { projectId: 'p2', phase: 'edit' }, t1);
    const all = await store.all('entries');
    eq(all.length, 2, 'Anzahl Einträge:');
    eq(all.filter((e) => !e.end).length, 1, 'laufende Timer:');
    const aSaved = all.find((e) => e.id === a.id);
    eq(aSaved.end, t1.toISOString(), 'Ende von A:');
    eq(stopped[0].id, a.id);
    eq((await getRunning(store)).id, b.id, 'laufend ist B:');
    eq(durationMs(aSaved.start, aSaved.end), 90 * MIN);
  } finally {
    await store.destroy();
  }
});
test('Stopp beendet den Timer; danach läuft keiner mehr', async () => {
  const store = createStore(`fv-test-${Math.random().toString(36).slice(2)}`);
  try {
    await startTimer(store, { projectId: 'p1', phase: 'edit' }, new Date('2026-11-19T09:00:00Z'));
    const res = await stopTimer(store, new Date('2026-11-19T09:45:00Z'));
    eq(res.stopped[0].end, '2026-11-19T09:45:00.000Z');
    eq(await getRunning(store), null);
  } finally {
    await store.destroy();
  }
});
test(`Versehentlicher Doppeltipp (< ${MIN_ENTRY_MS / 1000} s) wird verworfen`, async () => {
  const store = createStore(`fv-test-${Math.random().toString(36).slice(2)}`);
  try {
    await startTimer(store, { projectId: 'p1', phase: 'edit' }, new Date('2026-11-19T09:00:00Z'));
    const r = await startTimer(store, { projectId: 'p1', phase: 'sound' }, new Date('2026-11-19T09:00:03Z'));
    eq(r.discarded.length, 1);
    eq((await store.all('entries')).length, 1);
  } finally {
    await store.destroy();
  }
});
test('Revisionsrunde wird nur bei Phase „Revisionen“ gespeichert', async () => {
  const store = createStore(`fv-test-${Math.random().toString(36).slice(2)}`);
  try {
    const { entry: a } = await startTimer(store, { projectId: 'p', phase: 'revisions', revisionRound: 3 }, new Date('2026-11-19T09:00:00Z'));
    const { entry: b } = await startTimer(store, { projectId: 'p', phase: 'edit', revisionRound: 3 }, new Date('2026-11-19T10:00:00Z'));
    eq(a.revisionRound, 3);
    eq(b.revisionRound, null);
  } finally {
    await store.destroy();
  }
});

/* ---------- [3] Overlap ---------- */
group('[3] Überschneidung');

const existing = [
  { id: 'a', start: '2026-11-18T10:00:00Z', end: '2026-11-18T12:00:00Z' },
  { id: 'r', start: '2026-11-18T14:00:00Z', end: null },
];
const NOW = Date.parse('2026-11-18T16:00:00Z');
test('Teilweise Überlappung wird erkannt', () => {
  eq(findOverlaps(existing, { id: 'n', start: '2026-11-18T11:30:00Z', end: '2026-11-18T13:00:00Z' }, NOW).map((e) => e.id).join(), 'a');
});
test('Eintrag komplett innerhalb wird erkannt', () => {
  eq(findOverlaps(existing, { id: 'n', start: '2026-11-18T10:15:00Z', end: '2026-11-18T10:45:00Z' }, NOW).length, 1);
});
test('Direkt anschließend (12:00–13:00) ist KEINE Überschneidung', () => {
  eq(findOverlaps(existing, { id: 'n', start: '2026-11-18T12:00:00Z', end: '2026-11-18T13:00:00Z' }, NOW).length, 0);
});
test('Überlappung mit laufendem Timer wird erkannt', () => {
  eq(findOverlaps(existing, { id: 'n', start: '2026-11-18T15:00:00Z', end: '2026-11-18T15:30:00Z' }, NOW).map((e) => e.id).join(), 'r');
});
test('Bearbeiteter Eintrag kollidiert nicht mit sich selbst', () => {
  eq(findOverlaps(existing, { ...existing[0], end: '2026-11-18T12:30:00Z' }, NOW).length, 0);
});

/* ---------- Money basics (§9) ---------- */
group('Geld in Cent');

test('„1.200,50“ → 120050 Cent', () => eq(parseEUR('1.200,50'), 120050));
test('„1200“, „1.200“, „70 €“, „0,1“', () => {
  eq(parseEUR('1200'), 120000);
  eq(parseEUR('1.200'), 120000);
  eq(parseEUR('70 €'), 7000);
  eq(parseEUR('0,1'), 10);
});
test('Unlesbare Eingabe → NaN', () => ok(Number.isNaN(parseEUR('abc'))));
test('Anzeige 123456 → „1.234,56 €“', () => eq(fmtEUR(123456).replace(/ /g, ' '), '1.234,56 €'));
test('Stunden „1,5“ / „1:45“ / „“', () => {
  eq(parseHours('1,5'), 1.5);
  eq(parseHours('1:45'), 1.75);
  eq(parseHours(''), 0);
});

/* ---------- Later phases ---------- */
group('Folgen in Phase 2–4');
['[4] Echter Stundensatz', '[5] Abweichung', '[6] Verschenkter Umsatz', '[7] Revisionen-Zusatzaufwand', '[8] Rundung',
  '[9] Kalkulationsfaktor', '[10] CSV', '[11] Report ohne interne Werte'].forEach((n) => test(n, () => {}, { skip: true }));

/* ---------- Runner ---------- */

const out = document.getElementById('out');
const results = [];
for (const g of groups) {
  const h = document.createElement('h2');
  h.textContent = g.title;
  const ol = document.createElement('ol');
  out.append(h, ol);
  for (const t of g.tests) {
    const li = document.createElement('li');
    let status = 'ok', message = '';
    if (t.skip) status = 'skip';
    else {
      try {
        await t.fn();
      } catch (e) {
        status = 'fail';
        message = e.message;
        console.error(t.name, e);
      }
    }
    li.className = status;
    li.textContent = t.name;
    if (message) li.insertAdjacentHTML('beforeend', `<small></small>`), (li.querySelector('small').textContent = message);
    ol.appendChild(li);
    results.push({ group: g.title, name: t.name, status, message });
  }
}
const failed = results.filter((r) => r.status === 'fail').length;
const passed = results.filter((r) => r.status === 'ok').length;
const skipped = results.filter((r) => r.status === 'skip').length;
const summary = document.getElementById('summary');
summary.textContent = `${passed} bestanden · ${failed} fehlgeschlagen · ${skipped} übersprungen${isBerlin ? '' : ' (Zeitzonen-Test nur in Europe/Berlin)'}`;
summary.className = failed ? 'fail' : 'ok';
window.__results = { passed, failed, skipped, results };
