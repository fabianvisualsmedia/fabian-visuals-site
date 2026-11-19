// Timer logic. Only the START timestamp of a running entry is persisted (end === null),
// so elapsed time is always derived from the clock and survives reloads, closed tabs and
// locked phones. All functions take an explicit `now` so they are deterministic in tests.

import { uid } from '../db.js';

/** Entries shorter than this are discarded on stop (accidental double taps). */
export const MIN_ENTRY_MS = 10_000;

const ts = (v) => (v instanceof Date ? v.getTime() : typeof v === 'number' ? v : Date.parse(v));

/** Duration of an entry in ms. Running entries (end null) count up to `now`.
 *  Uses absolute timestamps, so midnight and DST changes are handled correctly. */
export function durationMs(start, end, now = Date.now()) {
  return Math.max(0, (end ? ts(end) : ts(now)) - ts(start));
}

export const entryMs = (e, now = Date.now()) => durationMs(e.start, e.end, now);

export const isRunning = (e) => !!e && !e.end;

export async function getRunning(store) {
  const all = await store.all('entries');
  // Defensive: if (through a bug or a second device import) several are running, newest wins.
  return all.filter(isRunning).sort((a, b) => ts(b.start) - ts(a.start))[0] || null;
}

/**
 * Starts a timer. Any running entry is stopped at exactly the same timestamp,
 * in the same transaction, so there is never more than one running timer.
 */
export async function startTimer(store, { projectId, phase, revisionRound = null, note = '' }, now = new Date()) {
  const nowISO = new Date(ts(now)).toISOString();
  const all = await store.all('entries');
  const running = all.filter(isRunning);
  const stopped = running.map((e) => ({ ...e, end: nowISO }));
  const toDelete = stopped.filter((e) => entryMs(e) < MIN_ENTRY_MS).map((e) => e.id);
  const toKeep = stopped.filter((e) => !toDelete.includes(e.id));
  const entry = {
    id: uid(),
    projectId,
    phase,
    start: nowISO,
    end: null,
    revisionRound: phase === 'revisions' ? revisionRound || 1 : null,
    note,
    manual: false,
  };
  await store.putMany('entries', [...toKeep, entry]);
  if (toDelete.length) await store.delMany('entries', toDelete);
  return { entry, stopped: toKeep, discarded: toDelete };
}

/** Stops the running timer (optionally at an explicit end time, e.g. forgotten-timer fix). */
export async function stopTimer(store, now = new Date(), endAt = null) {
  const running = (await store.all('entries')).filter(isRunning);
  if (!running.length) return null;
  const endISO = new Date(ts(endAt ?? now)).toISOString();
  const stopped = running.map((e) => ({ ...e, end: endISO }));
  const discard = stopped.filter((e) => entryMs(e) < MIN_ENTRY_MS).map((e) => e.id);
  const keep = stopped.filter((e) => !discard.includes(e.id));
  if (keep.length) await store.putMany('entries', keep);
  if (discard.length) await store.delMany('entries', discard);
  return { stopped: keep, discarded: discard };
}

/** True if the running entry exceeds the warn threshold (hours). */
export function isForgotten(entry, thresholdHours, now = Date.now()) {
  return isRunning(entry) && entryMs(entry, now) > thresholdHours * 3600_000;
}

/** Interval overlap test; touching intervals (end === start) do NOT overlap. */
export function overlaps(a, b, now = Date.now()) {
  const aS = ts(a.start), aE = a.end ? ts(a.end) : ts(now);
  const bS = ts(b.start), bE = b.end ? ts(b.end) : ts(now);
  return aS < bE && bS < aE;
}

/** All existing entries (across all projects) that overlap the candidate. */
export function findOverlaps(entries, candidate, now = Date.now()) {
  return entries.filter((e) => e.id !== candidate.id && overlaps(e, candidate, now));
}

/**
 * Builds start/end ISO strings from local form values.
 * dateStr "YYYY-MM-DD", fromStr "HH:MM", and either toStr "HH:MM" or durationHours.
 * If "to" is earlier than "from", the entry is assumed to end on the next day.
 */
export function buildInterval({ dateStr, fromStr, toStr = null, durationHours = null }) {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const [fh, fm] = fromStr.split(':').map(Number);
  const start = new Date(y, mo - 1, d, fh, fm, 0, 0);
  let end;
  if (durationHours != null) {
    end = new Date(start.getTime() + Math.round(durationHours * 3600_000));
  } else {
    const [th, tm] = toStr.split(':').map(Number);
    end = new Date(y, mo - 1, d, th, tm, 0, 0);
    if (end <= start) end = new Date(y, mo - 1, d + 1, th, tm, 0, 0);
  }
  return { start: start.toISOString(), end: end.toISOString() };
}

/** Last N distinct phases used on a project (most recent first). */
export function recentPhases(entries, n = 3) {
  const seen = [];
  [...entries]
    .sort((a, b) => ts(b.start) - ts(a.start))
    .forEach((e) => {
      if (!seen.includes(e.phase)) seen.push(e.phase);
    });
  return seen.slice(0, n);
}

/** Highest revision round used on a project (0 if none). */
export const maxRevisionRound = (entries) =>
  entries.reduce((m, e) => (e.phase === 'revisions' ? Math.max(m, e.revisionRound || 1) : m), 0);
