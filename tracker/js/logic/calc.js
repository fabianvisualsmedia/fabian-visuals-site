// Project figures as pure functions. Phase 1 covers time totals only;
// money figures (real hourly rate, deviation, lost revenue …) follow in phase 2.

import { entryMs } from './timer.js';

export const sumMs = (entries, now = Date.now()) => entries.reduce((s, e) => s + entryMs(e, now), 0);

export function msByPhase(entries, now = Date.now()) {
  const out = {};
  for (const e of entries) out[e.phase] = (out[e.phase] || 0) + entryMs(e, now);
  return out;
}

export const estimatedHours = (project) =>
  Object.values(project?.estimate || {}).reduce((s, h) => s + (Number(h) || 0), 0);

/** Fee in cents, derived for daily projects. */
export function projectFee(project) {
  if (project.feeType === 'daily') return Math.round((project.dailyRate || 0) * (Number(project.days) || 0));
  return project.fee || 0;
}
