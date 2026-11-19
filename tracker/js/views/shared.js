// Shared view helpers: data loading, project cards, chips, wave graphic.

import { PROJECT_TYPES, STATUSES, labelOf } from '../config.js';
import { escapeHtml, fmtH, fmtDur } from '../format.js';
import { phaseIcon, icon } from '../icons.js';
import { sumMs, estimatedHours, projectMetrics } from '../logic/calc.js';
import { fmtRate } from '../format.js';
import { recentPhases, isRunning } from '../logic/timer.js';

export async function loadAll(store) {
  const [clients, projects, entries] = await Promise.all([
    store.all('clients'),
    store.all('projects'),
    store.all('entries'),
  ]);
  const clientById = new Map(clients.map((c) => [c.id, c]));
  const entriesByProject = new Map();
  for (const e of entries) {
    if (!entriesByProject.has(e.projectId)) entriesByProject.set(e.projectId, []);
    entriesByProject.get(e.projectId).push(e);
  }
  return { clients, projects, entries, clientById, entriesByProject };
}

export const statusChip = (status) =>
  `<span class="status s-${status}">${escapeHtml(labelOf(STATUSES, status))}</span>`;

export const typeLabel = (type) => labelOf(PROJECT_TYPES, type);

const DEFAULT_QUICK = ['prep', 'shoot', 'edit'];

/** Time progress markup (real vs. estimate) with optional live ticking. */
export function progressBlock(entries, project, running) {
  const realMs = sumMs(entries);
  const est = estimatedHours(project);
  const pct = est ? (realMs / 3600000 / est) * 100 : 0;
  const tone = pct > 100 ? 'bad' : pct >= 80 ? 'warn' : '';
  const runningHere = running && running.projectId === project.id;
  const baseMs = runningHere ? realMs - (Date.now() - Date.parse(running.start)) : realMs;
  const real = runningHere
    ? `<span data-tick="${running.start}" data-base="${Math.round(baseMs)}" data-fmt="dur">${fmtDur(realMs)}</span>`
    : `<span>${fmtDur(realMs)}</span>`;
  return `
    <div class="progress ${tone}" role="img" aria-label="${Math.round(pct)} % der Kalkulation">
      <span style="width:${Math.min(100, pct).toFixed(1)}%"></span>
    </div>
    <div class="progress-meta">
      ${real}
      <span class="muted">${est ? `von ${fmtH(est)} kalkuliert` : 'keine Kalkulation'}</span>
    </div>`;
}

const LIGHT = { ok: 'Ziel erreicht', warn: 'Unter Ziel', bad: 'Unter Schmerzgrenze' };

/** Compact rate + traffic light line for cards. */
export function rateLine(m) {
  if (m.headlineRate == null) return '';
  return `<div class="card-rate">
    <span class="light-pill sm l-${m.light}"><i></i>${fmtRate(m.headlineRate)}</span>
    <span class="muted">${m.headlineIsProjection ? 'Prognose' : 'echter Satz'} · ${LIGHT[m.light]}</span>
  </div>`;
}

export function projectCard(project, { client, entries = [], running, phases, quick = true, settings }) {
  const m = settings ? projectMetrics(project, entries, settings) : null;
  const runningHere = running && running.projectId === project.id;
  const quickPhases = [...recentPhases(entries, 3)];
  for (const k of DEFAULT_QUICK) if (quickPhases.length < 3 && !quickPhases.includes(k)) quickPhases.push(k);
  const phaseLabel = (k) => phases.find((p) => p.key === k)?.label ?? k;
  return `
    <article class="pcard ${runningHere ? 'is-running' : ''}">
      <a class="pcard-main" href="#/project/${project.id}">
        <div class="pcard-top">
          <span class="type-tag">${escapeHtml(typeLabel(project.type))}</span>
          ${runningHere ? `<span class="live-pill"><span class="rec-dot"></span>${escapeHtml(phaseLabel(running.phase))}</span>` : statusChip(project.status)}
        </div>
        <h3>${escapeHtml(project.title)}</h3>
        <p class="muted">${escapeHtml(client?.name || 'Ohne Kunde')}</p>
        ${progressBlock(entries, project, running)}
        ${m ? rateLine(m) : ''}
      </a>
      ${quick ? `<div class="quick" aria-label="Schnellstart">
        ${quickPhases
          .map((k) => {
            const active = runningHere && running.phase === k;
            return `<button class="chip phase ${active ? 'on' : ''}" data-action="${active ? 'stop' : 'quick'}" data-id="${project.id}" data-phase="${k}" aria-label="${active ? 'Stoppen' : 'Start'}: ${escapeHtml(phaseLabel(k))}">
              ${active ? icon('stop', 14) : phaseIcon(k, 16)}<span>${escapeHtml(phaseLabel(k))}</span></button>`;
          })
          .join('')}
        <button class="chip icon-only" data-action="pick" data-id="${project.id}" aria-label="Andere Phase starten">${icon('plus', 16)}</button>
      </div>` : ''}
    </article>`;
}

/** Animated oscilloscope wave (seamless loop: path is 2× wide and slides by half). */
export function waveSvg(running) {
  const W = 1600, mid = 40;
  const mk = (amp, k, phase = 0) => {
    let d = '';
    for (let x = 0; x <= W; x += 8) {
      const y = mid + Math.sin((x / W) * Math.PI * 2 * k + phase) * amp * (running ? 1 : 0.04);
      d += `${x ? 'L' : 'M'}${x} ${y.toFixed(2)}`;
    }
    return d;
  };
  return `
    <svg class="wave ${running ? 'on' : ''}" viewBox="0 0 800 80" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="wg" x1="0" x2="1">
          <stop offset="0" stop-color="var(--acc-hot)"/>
          <stop offset=".3" stop-color="var(--acc)"/>
          <stop offset=".5" stop-color="#fff"/>
          <stop offset=".7" stop-color="#F89ABF"/>
          <stop offset="1" stop-color="#307AF4"/>
        </linearGradient>
      </defs>
      <g class="w1"><path d="${mk(18, 16)}"/></g>
      <g class="w2"><path d="${mk(10, 24, 1.3)}"/></g>
    </svg>`;
}

export const emptyState = (title, text, action = '') => `
  <div class="card empty">
    <h3>${escapeHtml(title)}</h3>
    <p class="muted">${escapeHtml(text)}</p>
    ${action}
  </div>`;

export { isRunning };
