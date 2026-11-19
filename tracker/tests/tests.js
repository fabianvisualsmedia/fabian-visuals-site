// Test runner + tests. Numbers in brackets refer to CLAUDE.md §8.
// Results are rendered as a green/red list and exposed as window.__results for automation.

import { createStore } from '../js/db.js';
import {
  durationMs, startTimer, stopTimer, getRunning, findOverlaps, buildInterval, isForgotten, MIN_ENTRY_MS,
} from '../js/logic/timer.js';
import { parseEUR, fmtEUR, parseHours, fmtClock } from '../js/format.js';
import {
  projectMetrics, projectWarnings, hourlyRate, deviation, lostRevenue, revisionStats, roundUpHours, trafficLight,
} from '../js/logic/calc.js';
import { DEFAULT_SETTINGS } from '../js/config.js';

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

/* ---------- [4]–[8] Figures ---------- */

// Helper: entries of given hours per phase, back to back from a fixed start.
function mkEntries(spec, startISO = '2026-11-02T08:00:00Z') {
  let t = Date.parse(startISO);
  return spec.map(([phase, hours, round = null], i) => {
    const e = { id: `e${i}`, projectId: 'p', phase, start: new Date(t).toISOString(), end: new Date(t + hours * H).toISOString(), revisionRound: round };
    t += hours * H;
    return e;
  });
}
const S = { ...DEFAULT_SETTINGS, targetHourlyRate: 7000, minHourlyRate: 4500, roundingMinutes: 15 };

group('[4] Echter Stundensatz');
test('Honorar 1.200 €, Kosten 150 €, 15 h → 70,00 €/h', () => eq(hourlyRate(120000 - 15000, 15), 7000));
test('Über projectMetrics (pauschal, geliefert)', () => {
  const p = { status: 'delivered', feeType: 'fixed', fee: 120000, costs: [{ amount: 15000 }], estimate: { edit: 15 } };
  const m = projectMetrics(p, mkEntries([['edit', 15]]), S);
  eq(m.realHourlyRate, 7000);
  eq(m.profit, 105000);
  eq(m.light, 'ok', 'Ampel bei genau Ziel:');
});
test('Ampel: grün ≥ Ziel, gelb dazwischen, rot unter Schmerzgrenze', () => {
  eq(trafficLight(7000, S), 'ok');
  eq(trafficLight(6999, S), 'warn');
  eq(trafficLight(4500, S), 'warn');
  eq(trafficLight(4499, S), 'bad');
  eq(trafficLight(null, S), null);
});
test('Ohne Stunden kein Stundensatz (keine Division durch 0)', () => eq(hourlyRate(100000, 0), null));

group('[5] Abweichung');
test('kalkuliert 12 h, real 19 h → +58,3 %', () => eq(Math.round(deviation(19, 12) * 1000) / 10, 58.3));
test('ohne Kalkulation → null', () => eq(deviation(5, 0), null));
test('pro Phase', () => {
  const p = { status: 'active', feeType: 'fixed', fee: 100000, costs: [], estimate: { shoot: 4, edit: 8 } };
  const m = projectMetrics(p, mkEntries([['shoot', 4], ['edit', 12]]), S);
  eq(m.phases.shoot.deviation, 0);
  eq(m.phases.edit.deviation, 0.5);
});

group('[6] Verschenkter Umsatz');
test('1.200 € − 150 €, kalk. 12 h, real 19 h → 7 h × 87,50 € = 612,50 €', () => eq(lostRevenue(19, 12, 105000), 61250));
test('0 bei Unterschreitung der Kalkulation', () => eq(lostRevenue(10, 12, 105000), 0));
test('0 ohne Kalkulation', () => eq(lostRevenue(10, 0, 105000), 0));
test('0 bei Stundenabrechnung (Mehraufwand wird bezahlt)', () => {
  const p = { status: 'active', feeType: 'hourly', hourlyRate: 7500, fee: 0, costs: [], estimate: { edit: 2 } };
  eq(projectMetrics(p, mkEntries([['edit', 5]]), S).lostRevenue, 0);
});

group('[7] Revisionen');
test('Zusatzaufwand zählt nur Runden über includedRevisions', () => {
  const es = mkEntries([['revisions', 1, 1], ['revisions', 1.5, 2], ['revisions', 2, 3], ['revisions', 0.5, 3], ['edit', 3]]);
  const r = revisionStats(es, 2);
  eq(r.rounds, 3);
  eq(r.maxRound, 3);
  eq(r.over, 1);
  eq(r.extraHours, 2.5);
});
test('Innerhalb der inkludierten Runden → 0 h Zusatz', () => eq(revisionStats(mkEntries([['revisions', 2, 1], ['revisions', 1, 2]]), 2).extraHours, 0));
test('Nachtragswert = Zusatzstunden × Ziel-Stundensatz', () => {
  const p = { status: 'active', feeType: 'fixed', fee: 100000, costs: [], includedRevisions: 2, estimate: {} };
  const m = projectMetrics(p, mkEntries([['revisions', 1, 1], ['revisions', 1, 2], ['revisions', 2.5, 3]]), S);
  eq(m.revisions.extraValue, 17500);
});

group('[8] Rundung');
test('1 h 7 min bei 15-min-Rundung → 1,25 h', () => eq(roundUpHours(67 * MIN, 15), 1.25));
test('genau 1 h bleibt 1 h', () => eq(roundUpHours(60 * MIN, 15), 1));
test('1 h 1 s → 1,25 h (angefangene Einheit)', () => eq(roundUpHours(60 * MIN + 1000, 15), 1.25));
test('Rundung 0 = exakt', () => eq(roundUpHours(67 * MIN, 0), 67 / 60));
test('Stundenabrechnung: 3 h 07 min × 75 €/h @15 → 3,25 h = 243,75 €', () => {
  const p = { status: 'active', feeType: 'hourly', hourlyRate: 7500, fee: 0, costs: [], estimate: {} };
  const m = projectMetrics(p, mkEntries([['edit', 3 + 7 / 60]]), S);
  eq(m.billableHours, 3.25);
  eq(m.billable, 24375);
});

group('Abnahme Phase 2: Testprojekt mit bekannten Zahlen');
// Musikvideo, 1.800 € pauschal, Kosten 250 € (Assistenz 200 €, Lizenz 50 €), 2 Runden inklusive.
// Kalkulation: Dreh 8, Schnitt 10, Revisionen 2 = 20 h. Real: Dreh 8, Schnitt 14, Rev R1 1 h, R2 1 h, R3 2 h = 26 h.
const abn = { status: 'active', feeType: 'fixed', fee: 180000, includedRevisions: 2,
  costs: [{ amount: 20000 }, { amount: 5000 }], estimate: { shoot: 8, edit: 10, revisions: 2 } };
const abnE = mkEntries([['shoot', 8], ['edit', 14], ['revisions', 1, 1], ['revisions', 1, 2], ['revisions', 2, 3]]);
const am = projectMetrics(abn, abnE, S);
test('Real 26 h, kalkuliert 20 h, Abweichung +30 %', () => {
  eq(am.realHours, 26);
  eq(am.estimatedHours, 20);
  eq(am.deviation, 0.3);
});
test('Kosten 250 €, Gewinn 1.550 €', () => { eq(am.totalCosts, 25000); eq(am.profit, 155000); });
test('Echter Satz 1.550 € ÷ 26 h = 59,62 €/h', () => eq(am.realHourlyRate, 5962));
test('Geplanter Satz 1.550 € ÷ 20 h = 77,50 €/h', () => eq(am.plannedHourlyRate, 7750));
test('Verschenkt: 6 h × 77,50 € = 465,00 €', () => eq(am.lostRevenue, 46500));
test('Revisionen: Runde 3 von 2, Zusatz 2 h ≈ 140 €', () => { eq(am.revisions.over, 1); eq(am.revisions.extraHours, 2); eq(am.revisions.extraValue, 14000); });
test('Prognose (aktiv): Projektion 26 h → 59,62 €/h, Ampel gelb', () => {
  eq(am.projectedHours, 26);
  eq(am.projectedHourlyRate, 5962);
  eq(am.light, 'warn');
});
test('Warnungen: Schnitt rot, Revisionen rot + Rundenhinweis', () => {
  const w = projectWarnings(abn, am, S);
  ok(w.some((x) => x.level === 'bad' && x.phase === 'edit'), 'Schnitt-Warnung fehlt');
  ok(w.some((x) => x.level === 'bad' && x.phase === 'revisions'), 'Revisionen-Warnung fehlt');
  ok(w.some((x) => x.text.includes('Runde 3 von 2')), 'Rundenhinweis fehlt');
  ok(!w.some((x) => x.text.includes('Schmerzgrenze')), 'Schmerzgrenze darf nicht greifen (59,62 > 45)');
});
test('80-%-Hinweis: Phase bei 85 % → gelb', () => {
  const p = { status: 'active', feeType: 'fixed', fee: 100000, costs: [], estimate: { edit: 10 } };
  const w = projectWarnings(p, projectMetrics(p, mkEntries([['edit', 8.5]]), S), S);
  eq(w.length, 1); eq(w[0].level, 'warn');
});
test('Tracking-Lücke: geliefert ohne Schnitt-Einträge → Hinweis', () => {
  const p = { status: 'delivered', feeType: 'fixed', fee: 100000, costs: [], estimate: { shoot: 4, edit: 6 } };
  const w = projectWarnings(p, projectMetrics(p, mkEntries([['shoot', 4]]), S), S, (k) => (k === 'edit' ? 'Schnitt' : k));
  ok(w.some((x) => x.level === 'info' && x.text.includes('Schnitt')));
});

/* ---------- Later phases ---------- */
group('Folgen in Phase 3–4');
['[9] Kalkulationsfaktor', '[10] CSV', '[11] Report ohne interne Werte'].forEach((n) => test(n, () => {}, { skip: true }));

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
