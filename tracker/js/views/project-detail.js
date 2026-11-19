// Project detail: timer controls, time per phase, chronological entries.

import { STATUSES, phaseColor } from '../config.js';
import { escapeHtml, fmtDur, fmtHours, fmtH, fmtTime, fmtDay, dayKey, fmtEUR, fmtRate, fmtDate } from '../format.js';
import { icon, phaseIcon } from '../icons.js';
import { delegate, toast } from '../ui.js';
import { entryMs, recentPhases } from '../logic/timer.js';
import { sumMs, msByPhase, estimatedHours, projectFee } from '../logic/calc.js';
import { typeLabel, statusChip, progressBlock } from './shared.js';
import { openEntrySheet } from './entry-sheet.js';

export async function renderProjectDetail(el, ctx, id) {
  const { store, settings } = ctx;
  const project = await store.get('projects', id);
  if (!project) throw new Error('Projekt nicht gefunden – evtl. gelöscht.');
  const client = project.clientId ? await store.get('clients', project.clientId) : null;
  const entries = (await store.byIndex('entries', 'projectId', id)).sort((a, b) => Date.parse(b.start) - Date.parse(a.start));
  const r = ctx.running;
  const runningHere = r && r.projectId === id;

  const byPhase = msByPhase(entries);
  const realMs = sumMs(entries);
  const est = estimatedHours(project);
  const phaseRows = settings.phases.filter((p) => byPhase[p.key] || project.estimate?.[p.key]);
  // Phases that exist in entries but were removed from settings still need a row.
  for (const key of Object.keys(byPhase)) if (!phaseRows.some((p) => p.key === key)) phaseRows.push({ key, label: key });

  const fee = projectFee(project);
  const feeLine =
    project.feeType === 'hourly'
      ? `${fmtRate(project.hourlyRate || 0)}${fee ? ` · Angebot ${fmtEUR(fee)}` : ''}`
      : project.feeType === 'daily'
        ? `${fmtEUR(project.dailyRate || 0)} × ${project.days} ${Number(project.days) === 1 ? 'Tag' : 'Tage'} = ${fmtEUR(fee)}`
        : fee ? `${fmtEUR(fee)} pauschal` : 'Kein Honorar hinterlegt';

  // Group entries by local day.
  const days = new Map();
  for (const e of entries) {
    const k = dayKey(e.start);
    if (!days.has(k)) days.set(k, []);
    days.get(k).push(e);
  }

  const quick = recentPhases(entries, 4);
  for (const k of ['shoot', 'edit', 'communication']) if (quick.length < 4 && !quick.includes(k)) quick.push(k);

  el.innerHTML = `
    <header class="page-head compact">
      <a class="icon-btn" href="#/projects" aria-label="Zurück">${icon('back', 20)}</a>
      <h1 class="page-title-sm">${escapeHtml(typeLabel(project.type))}</h1>
      <a class="icon-btn" href="#/project/${id}/edit" aria-label="Projekt bearbeiten">${icon('edit', 18)}</a>
    </header>

    <section class="hero detail ${runningHere ? 'glow-card is-running' : ''}">
      <div class="hero-top">
        ${runningHere ? `<span class="live-pill"><span class="rec-dot"></span>${escapeHtml(ctx.phaseLabel(r.phase))}${r.revisionRound ? ` · R${r.revisionRound}` : ''}</span>` : statusChip(project.status)}
        ${client ? `<a class="hero-client-link" href="#/clients">${escapeHtml(client.name)}</a>` : ''}
      </div>
      <h2 class="hero-project">${escapeHtml(project.title)}</h2>
      <p class="hero-client">${escapeHtml(feeLine)}</p>
      <div class="kpis">
        <div class="kpi">
          <span class="kpi-label">Real</span>
          ${runningHere
            ? `<span class="kpi-value" data-tick="${r.start}" data-base="${Math.round(realMs - entryMs(r))}" data-fmt="h">${fmtHours(realMs, 2)}</span>`
            : `<span class="kpi-value">${fmtHours(realMs, 2)}</span>`}
        </div>
        <div class="kpi">
          <span class="kpi-label">Kalkuliert</span>
          <span class="kpi-value">${est ? fmtH(est, 2) : '–'}</span>
        </div>
        <div class="kpi">
          <span class="kpi-label">Einträge</span>
          <span class="kpi-value">${entries.length}</span>
        </div>
      </div>
      ${progressBlock(entries, project, r)}
      <div class="hero-actions">
        ${runningHere
          ? `<button class="btn glass" data-action="swap">${icon('swap', 18)}Phase wechseln</button>
             <button class="stop-btn lg" data-action="stop" aria-label="Timer stoppen">${icon('stop', 22)}</button>`
          : `<button class="btn primary glow-btn" data-action="pick">${icon('play', 16)}Timer starten</button>
             <button class="btn ghost" data-action="add">${icon('history', 18)}Nachtragen</button>`}
      </div>
      ${runningHere ? `<button class="btn link-btn" data-action="add">${icon('history', 16)}Zeit nachtragen</button>` : ''}
    </section>

    <div class="chip-row scroll" aria-label="Schnellstart">
      ${quick.map((k) => {
        const on = runningHere && r.phase === k;
        return `<button class="chip phase ${on ? 'on' : ''}" data-action="${on ? 'stop' : 'quick'}" data-phase="${k}">${on ? icon('stop', 14) : phaseIcon(k, 16)}<span>${escapeHtml(ctx.phaseLabel(k))}</span></button>`;
      }).join('')}
    </div>

    <section class="block">
      <div class="block-head"><h2>Status</h2></div>
      <div class="chip-row scroll">
        ${STATUSES.map((s) => `<button class="chip ${s.key === project.status ? 'on' : ''}" data-action="status" data-status="${s.key}">${escapeHtml(s.label)}</button>`).join('')}
      </div>
    </section>

    <section class="block">
      <div class="block-head"><h2>Zeit pro Phase</h2>${est ? `<span class="count">Soll ${fmtH(est, 2)}</span>` : ''}</div>
      ${phaseRows.length
        ? `<div class="card phase-list">${phaseRows.map((p) => {
            const ms = byPhase[p.key] || 0;
            const estH = project.estimate?.[p.key] || 0;
            const pct = estH ? (ms / 3600000 / estH) * 100 : 0;
            const live = runningHere && r.phase === p.key;
            return `<div class="phase-row">
              <span class="phase-ic" style="--c:${phaseColor(p.key)}">${phaseIcon(p.key, 16)}</span>
              <div class="phase-mid">
                <div class="phase-line"><span>${escapeHtml(ctx.phaseLabel(p.key))}</span>
                  <span class="phase-val">${live ? `<b data-tick="${r.start}" data-base="${Math.round(ms - entryMs(r))}" data-fmt="dur">${fmtDur(ms)}</b>` : `<b>${fmtDur(ms)}</b>`}${estH ? `<span class="muted"> / ${fmtH(estH, 2)}</span>` : ''}</span>
                </div>
                ${estH ? `<div class="progress thin ${pct > 100 ? 'bad' : pct >= 80 ? 'warn' : ''}"><span style="width:${Math.min(100, pct).toFixed(1)}%;--c:${phaseColor(p.key)}"></span></div>` : ''}
              </div>
            </div>`;
          }).join('')}</div>`
        : `<p class="muted pad">Noch keine Zeit erfasst und keine Kalkulation hinterlegt.</p>`}
    </section>

    <section class="block">
      <div class="block-head"><h2>Einträge</h2><button class="link" data-action="add">+ Nachtragen</button></div>
      ${entries.length
        ? [...days.entries()].map(([k, list]) => `
          <div class="day">
            <div class="day-head"><span>${fmtDay(list[0].start)}</span><span class="muted">${fmtDur(sumMs(list))}</span></div>
            <div class="card entry-list">
              ${list.map((e) => `
                <button class="entry ${!e.end ? 'is-running' : ''}" data-action="edit" data-id="${e.id}">
                  <span class="phase-ic" style="--c:${phaseColor(e.phase)}">${phaseIcon(e.phase, 16)}</span>
                  <span class="entry-main">
                    <strong>${escapeHtml(ctx.phaseLabel(e.phase))}${e.revisionRound ? ` · Runde ${e.revisionRound}` : ''}${e.manual ? ' <span class="tag">nachgetragen</span>' : ''}</strong>
                    <span class="muted">${fmtTime(e.start)} – ${e.end ? fmtTime(e.end) + (dayKey(e.end) !== k ? ' (+1)' : '') : 'läuft'}${e.note ? ` · ${escapeHtml(e.note)}` : ''}</span>
                  </span>
                  <span class="entry-dur">${!e.end ? `<span data-tick="${e.start}" data-fmt="dur">${fmtDur(entryMs(e))}</span>` : fmtDur(entryMs(e))}</span>
                </button>`).join('')}
            </div>
          </div>`).join('')
        : `<div class="card empty"><p class="muted">Noch keine Einträge. Starte den Timer oder trag Zeit nach.</p></div>`}
    </section>

    ${project.notes || project.startDate || project.deliveryDate ? `
    <section class="block">
      <div class="block-head"><h2>Details</h2></div>
      <div class="card pad">
        ${project.startDate || project.deliveryDate ? `<p class="muted">${icon('calendar', 16)} ${fmtDate(project.startDate) || '–'} → ${fmtDate(project.deliveryDate) || 'offen'}</p>` : ''}
        ${project.notes ? `<p class="notes">${escapeHtml(project.notes)}</p>` : ''}
        <p class="muted small">${project.includedRevisions ?? 0} Korrekturschleifen inklusive</p>
      </div>
    </section>` : ''}
  `;

  delegate(el, {
    pick: () => ctx.startTimer(id),
    quick: (b) => ctx.startTimer(id, b.dataset.phase),
    stop: () => ctx.stopTimer(),
    swap: () => ctx.switchPhase(),
    add: async () => (await openEntrySheet(ctx, project)) && ctx.refresh(),
    edit: async (b) => {
      const entry = entries.find((e) => e.id === b.dataset.id);
      if (entry && (await openEntrySheet(ctx, project, entry))) ctx.refresh();
    },
    status: async (b) => {
      if (b.dataset.status === project.status) return;
      await store.put('projects', { ...project, status: b.dataset.status });
      toast(`Status: ${STATUSES.find((s) => s.key === b.dataset.status).label}`);
      ctx.refresh();
    },
  });
}
