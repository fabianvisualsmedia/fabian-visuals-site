// Project figures as pure functions. Money is integer cents, time is hours (float) unless named *Ms.

import { entryMs } from './timer.js';

const MS_H = 3600_000;

export const sumMs = (entries, now = Date.now()) => entries.reduce((s, e) => s + entryMs(e, now), 0);

export function msByPhase(entries, now = Date.now()) {
  const out = {};
  for (const e of entries) out[e.phase] = (out[e.phase] || 0) + entryMs(e, now);
  return out;
}

export const estimatedHours = (project) =>
  Object.values(project?.estimate || {}).reduce((s, h) => s + (Number(h) || 0), 0);

export const totalCosts = (project) => (project?.costs || []).reduce((s, c) => s + (c.amount || 0), 0);

/** Contractual fee in cents (daily: rate × days; hourly: the offered amount, may be 0). */
export function projectFee(project) {
  if (project.feeType === 'daily') return Math.round((project.dailyRate || 0) * (Number(project.days) || 0));
  return project.fee || 0;
}

/**
 * Rounds a duration UP to the started unit. 67 min @ 15 → 1.25 h. minutes = 0 → exact hours.
 * A tiny epsilon keeps exact multiples (e.g. 60:00.000) from rounding up by float noise.
 */
export function roundUpHours(ms, minutes) {
  if (!minutes) return ms / MS_H;
  const unit = minutes * 60_000;
  return (Math.ceil(ms / unit - 1e-9) * minutes) / 60;
}

/** (real − estimate) ÷ estimate as fraction (0.583 = +58,3 %); null when no estimate. */
export const deviation = (realH, estH) => (estH > 0 ? (realH - estH) / estH : null);

/** Hourly rate in cents; null when there are no hours. */
export const hourlyRate = (profitCents, hours) => (hours > 0 ? Math.round(profitCents / hours) : null);

/** Revenue lost through overrun: (real − est) × planned rate, never negative. */
export function lostRevenue(realH, estH, plannedProfitCents) {
  if (!(estH > 0) || realH <= estH) return 0;
  return Math.round(((realH - estH) * plannedProfitCents) / estH);
}

/** Revisions: rounds used vs included, and time spent in rounds beyond the offer. */
export function revisionStats(entries, included = 0, now = Date.now()) {
  const rev = entries.filter((e) => e.phase === 'revisions');
  const rounds = new Set(rev.map((e) => e.revisionRound || 1));
  const maxRound = rounds.size ? Math.max(...rounds) : 0;
  const extraMs = rev.filter((e) => (e.revisionRound || 1) > (included || 0)).reduce((s, e) => s + entryMs(e, now), 0);
  return { rounds: rounds.size, maxRound, included: included || 0, over: Math.max(0, maxRound - (included || 0)), extraHours: extraMs / MS_H };
}

/** Traffic light for a rate in cents: 'ok' ≥ target, 'warn' ≥ min, 'bad' below; null if unknown. */
export function trafficLight(rateCents, settings) {
  if (rateCents == null) return null;
  if (rateCents >= settings.targetHourlyRate) return 'ok';
  if (rateCents >= settings.minHourlyRate) return 'warn';
  return 'bad';
}

export const COMPLETED = ['delivered', 'paid', 'archived'];

/** All figures for one project. */
export function projectMetrics(project, entries, settings, now = Date.now()) {
  const realMs = sumMs(entries, now);
  const realHours = realMs / MS_H;
  const estHours = estimatedHours(project);
  const costs = totalCosts(project);
  const hourly = project.feeType === 'hourly';
  const rounding = settings.roundingMinutes || 0;

  // Revenue: hourly projects earn rounded real hours × rate; others the agreed fee.
  const billableHours = hourly ? roundUpHours(realMs, rounding) : null;
  const billable = hourly ? Math.round(billableHours * (project.hourlyRate || 0)) : null;
  const offered = hourly ? project.fee || Math.round(estHours * (project.hourlyRate || 0)) : projectFee(project);
  const revenue = hourly ? billable : offered;

  const profit = revenue - costs;
  const plannedProfit = offered - costs;

  // Per phase, incl. phases that only exist in the estimate or only in entries.
  const byPhaseMs = msByPhase(entries, now);
  const keys = new Set([...Object.keys(project.estimate || {}), ...Object.keys(byPhaseMs)]);
  const phases = {};
  let projectedHours = 0;
  for (const k of keys) {
    const real = (byPhaseMs[k] || 0) / MS_H;
    const est = Number(project.estimate?.[k]) || 0;
    phases[k] = { real, est, deviation: deviation(real, est), ratio: est > 0 ? real / est : null };
    projectedHours += Math.max(real, est); // overruns stay, open phases assumed on plan
  }

  const realRate = hourlyRate(profit, realHours);
  const plannedRate = hourlyRate(plannedProfit, estHours);
  // Projection for running projects: if it continues like this, what will the hour be worth?
  const projectedRate = hourly ? realRate : hourlyRate(plannedProfit, projectedHours);
  const completed = COMPLETED.includes(project.status);
  const headlineRate = completed || !estHours ? realRate : projectedRate;

  const rev = revisionStats(entries, project.includedRevisions, now);
  const extraRate = hourly ? project.hourlyRate || 0 : settings.targetHourlyRate;

  return {
    realMs,
    realHours,
    estimatedHours: estHours,
    deviation: deviation(realHours, estHours),
    phases,
    totalCosts: costs,
    revenue,
    offered,
    billable,
    billableHours,
    profit,
    plannedProfit,
    realHourlyRate: realRate,
    plannedHourlyRate: plannedRate,
    projectedHours,
    projectedHourlyRate: projectedRate,
    headlineRate,
    headlineIsProjection: !completed && estHours > 0 && !hourly,
    light: trafficLight(headlineRate, settings),
    lostRevenue: hourly ? 0 : lostRevenue(realHours, estHours, plannedProfit),
    revisions: { ...rev, extraValue: Math.round(rev.extraHours * extraRate), extraRate },
  };
}

/**
 * Live warnings (§5.3) + tracking-discipline hints (§9).
 * Returns [{ level: 'warn'|'bad'|'info', phase?, text }]
 */
export function projectWarnings(project, m, settings, phaseLabel = (k) => k) {
  const out = [];
  const completed = COMPLETED.includes(project.status);
  for (const [k, p] of Object.entries(m.phases)) {
    if (!p.est || p.ratio == null) continue;
    if (p.ratio > 1) out.push({ level: 'bad', phase: k, text: `${phaseLabel(k)} über Kalkulation (+${pct(p.deviation)})` });
    else if (p.ratio >= 0.8 && !completed) out.push({ level: 'warn', phase: k, text: `${phaseLabel(k)} bei ${Math.round(p.ratio * 100)} % der Kalkulation` });
  }
  if (m.headlineRate != null && m.headlineRate < settings.minHourlyRate && (m.realHours > 0 || completed)) {
    out.unshift({ level: 'bad', text: m.headlineIsProjection ? 'Prognose unter deiner Schmerzgrenze' : 'Stundensatz unter deiner Schmerzgrenze' });
  }
  if (m.revisions.over > 0) {
    out.push({ level: 'warn', phase: 'revisions', text: `Runde ${m.revisions.maxRound} von ${m.revisions.included} inklusive` });
  }
  if (completed) {
    const missing = Object.entries(m.phases).filter(([, p]) => p.est >= 1 && p.real === 0).map(([k]) => phaseLabel(k));
    if (missing.length) out.push({ level: 'info', text: `Keine Einträge für ${missing.join(', ')} – vergessen zu tracken?` });
  }
  return out;
}

/** 0.583 → "58,3 %" (sign handled by caller) */
export const pct = (fraction, digits = 1) =>
  `${(Math.abs(fraction) * 100).toLocaleString('de-DE', { maximumFractionDigits: digits })}\u00a0%`;

export const signedPct = (fraction, digits = 1) =>
  fraction == null ? '–' : `${fraction > 0 ? '+' : fraction < 0 ? '−' : '±'}${pct(fraction, digits)}`;
