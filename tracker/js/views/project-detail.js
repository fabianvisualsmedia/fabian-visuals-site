// Project detail: timer controls, key figures with traffic light, live warnings,
// plan-vs-actual chart, revisions, costs and chronological entries.

import { STATUSES, COST_CATEGORIES, phaseColor, labelOf } from '../config.js';
import { uid } from '../db.js';
import {
  escapeHtml, fmtDur, fmtHours, fmtH, fmtTime, fmtDay, dayKey, fmtEUR, fmtRate, fmtDate, parseEUR, centsToInput,
} from '../format.js';
import { icon, phaseIcon } from '../icons.js';
import { delegate, toast, openSheet, confirmDialog } from '../ui.js';
import { entryMs, recentPhases } from '../logic/timer.js';
import { sumMs, projectMetrics, projectWarnings, signedPct } from '../logic/calc.js';
import { planVsActual } from '../charts/svg-charts.js';
import { typeLabel, statusChip, progressBlock } from './shared.js';
import { openEntrySheet } from './entry-sheet.js';

export const LIGHT_TEXT = { ok: 'Ziel erreicht', warn: 'Unter Ziel', bad: 'Unter Schmerzgrenze' };

export async function renderProjectDetail(el, ctx, id) {
  const { store, settings } = ctx;
  const project = await store.get('projects', id);
  if (!project) throw new Error('Projekt nicht gefunden – evtl. gelöscht.');
  project.costs ||= [];
  const client = project.clientId ? await store.get('clients', project.clientId) : null;
  const entries = (await store.byIndex('entries', 'projectId', id)).sort((a, b) => Date.parse(b.start) - Date.parse(a.start));
  const r = ctx.running;
  const runningHere = r && r.projectId === id;

  const m = projectMetrics(project, entries, settings);
  const warnings = projectWarnings(project, m, settings, ctx.phaseLabel);
  const hourly = project.feeType === 'hourly';

  // Condense granular warnings: one line for overruns, one for "close to limit", rest as is.
  const over = warnings.filter((w) => w.level === 'bad' && w.phase && m.phases[w.phase]);
  const near = warnings.filter((w) => w.level === 'warn' && w.phase && w.phase !== 'revisions' && m.phases[w.phase]);
  const groupedWarnings = [
    ...warnings.filter((w) => w.level === 'bad' && !w.phase).map((w) => ({ level: 'bad', html: escapeHtml(w.text) })),
    ...(over.length ? [{ level: 'bad', html: `Über Kalkulation: ${over.map((w) => `<b>${escapeHtml(ctx.phaseLabel(w.phase))}</b> ${signedPct(m.phases[w.phase].deviation, 0)}`).join(', ')}${!hourly && m.projectedHourlyRate != null ? ` · so weiter <b>${fmtRate(m.projectedHourlyRate)}</b>` : ''}` }] : []),
    ...(near.length ? [{ level: 'warn', html: `Fast am Limit: ${near.map((w) => `<b>${escapeHtml(ctx.phaseLabel(w.phase))}</b> ${Math.round(m.phases[w.phase].ratio * 100)}&nbsp;%`).join(', ')}` }] : []),
    ...warnings.filter((w) => w.level === 'info').map((w) => ({ level: 'info', html: escapeHtml(w.text) })),
  ];

  const feeLine = hourly
    ? `${fmtRate(project.hourlyRate || 0)}${project.fee ? ` · Angebot ${fmtEUR(project.fee)}` : ''}`
    : project.feeType === 'daily'
      ? `${fmtEUR(project.dailyRate || 0)} × ${String(project.days).replace('.', ',')} ${Number(project.days) === 1 ? 'Tag' : 'Tage'} = ${fmtEUR(m.offered)}`
      : m.offered ? `${fmtEUR(m.offered)} pauschal` : 'Kein Honorar hinterlegt';

  // Chart rows in settings order; unknown phases (removed from settings) appended.
  const order = settings.phases.map((p) => p.key);
  const chartRows = Object.keys(m.phases)
    .sort((a, b) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99))
    .map((k) => ({ key: k, label: ctx.phaseLabel(k), color: phaseColor(k), est: m.phases[k].est, real: m.phases[k].real, live: runningHere && r.phase === k }));

  const days = new Map();
  for (const e of entries) {
    const k = dayKey(e.start);
    if (!days.has(k)) days.set(k, []);
    days.get(k).push(e);
  }
  const quick = recentPhases(entries, 4);
  for (const k of ['shoot', 'edit', 'communication']) if (quick.length < 4 && !quick.includes(k)) quick.push(k);

  const rateLabel = hourly ? 'Effektiver Stundensatz' : m.headlineIsProjection ? 'Stundensatz · Prognose' : 'Echter Stundensatz';
  const rateHint = hourly
    ? 'Abrechenbar minus Kosten, geteilt durch reale Stunden.'
    : m.headlineIsProjection
      ? 'Wenn es so weitergeht: Überzogenes bleibt, offene Phasen laufen nach Plan.'
      : '(Honorar − Kosten) ÷ reale Stunden.';

  const rev = m.revisions;
  const showRev = rev.rounds > 0 || (project.includedRevisions || 0) > 0;
  const pipCount = Math.max(rev.maxRound, rev.included);

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
            ? `<span class="kpi-value" data-tick="${r.start}" data-base="${Math.round(m.realMs - entryMs(r))}" data-fmt="h">${fmtHours(m.realMs, 2)}</span>`
            : `<span class="kpi-value">${fmtHours(m.realMs, 2)}</span>`}
        </div>
        <div class="kpi">
          <span class="kpi-label">Kalkuliert</span>
          <span class="kpi-value">${m.estimatedHours ? fmtH(m.estimatedHours, 2) : '–'}</span>
        </div>
        <div class="kpi">
          <span class="kpi-label">Abweichung</span>
          <span class="kpi-value ${m.deviation > 0 ? 'tone-bad' : ''}">${signedPct(m.deviation)}</span>
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

    <div class="chip-row scroll quick-row" aria-label="Schnellstart">
      ${quick.map((k) => {
        const on = runningHere && r.phase === k;
        return `<button class="chip phase ${on ? 'on' : ''}" data-action="${on ? 'stop' : 'quick'}" data-phase="${k}">${on ? icon('stop', 14) : phaseIcon(k, 16)}<span>${escapeHtml(ctx.phaseLabel(k))}</span></button>`;
      }).join('')}
    </div>

    ${groupedWarnings.length ? `<section class="warnings" aria-label="Hinweise">
      ${groupedWarnings.map((w) => `<div class="warning w-${w.level}">${icon(w.level === 'info' ? 'clock' : 'alert', 16)}<span>${w.html}</span></div>`).join('')}
    </section>` : ''}

    <section class="block">
      <div class="block-head"><h2>Zahlen</h2><span class="count">intern – nie im Kundenreport</span></div>
      <div class="card money light-${m.light || 'none'}">
        <div class="rate">
          <span class="kpi-label">${rateLabel}</span>
          <div class="rate-line">
            <span class="rate-value">${m.headlineRate != null ? fmtRate(m.headlineRate) : '–'}</span>
            ${m.light ? `<span class="light-pill l-${m.light}"><i></i>${LIGHT_TEXT[m.light]}</span>` : ''}
          </div>
          <p class="hint">${rateHint} Ziel ${fmtRate(settings.targetHourlyRate)}, Schmerzgrenze ${fmtRate(settings.minHourlyRate)}.</p>
        </div>
        <div class="money-grid">
          ${hourly ? `
            <div><span class="kpi-label">Abrechenbar</span><b>${fmtEUR(m.billable)}</b><small class="muted">${fmtH(m.billableHours, 2)} × ${fmtRate(project.hourlyRate || 0)}${settings.roundingMinutes ? ` · ${settings.roundingMinutes}-min-Takt` : ''}</small></div>
            <div><span class="kpi-label">vs. Angebot</span><b>${m.offered ? (m.billable - m.offered >= 0 ? '+' : '−') + fmtEUR(Math.abs(m.billable - m.offered)) : '–'}</b><small class="muted">${m.offered ? `Angebot ${fmtEUR(m.offered)}` : 'kein Angebot hinterlegt'}</small></div>`
          : `
            <div><span class="kpi-label">Honorar</span><b>${fmtEUR(m.revenue)}</b></div>
            <div><span class="kpi-label">Geplanter Satz</span><b>${m.plannedHourlyRate != null ? fmtRate(m.plannedHourlyRate) : '–'}</b></div>`}
          <div><span class="kpi-label">Kosten</span><b>${fmtEUR(m.totalCosts)}</b></div>
          <div><span class="kpi-label">Gewinn</span><b>${fmtEUR(m.profit)}</b></div>
        </div>
        ${m.lostRevenue > 0 ? `<div class="lost">${icon('alert', 16)}<span>Durch Mehraufwand verschenkt: <b>ca. ${fmtEUR(Math.round(m.lostRevenue / 100) * 100)}</b></span></div>` : ''}
      </div>
    </section>

    <section class="block">
      <div class="block-head"><h2>Soll / Ist pro Phase</h2>${m.estimatedHours ? `<span class="count">Soll ${fmtH(m.estimatedHours, 1)}</span>` : ''}</div>
      ${chartRows.length
        ? `<div class="card chart-card">${planVsActual(chartRows, { icon: (k) => `<span class="pva-ic" style="--c:${phaseColor(k)}">${phaseIcon(k, 14)}</span>` })}</div>`
        : `<p class="muted pad">Noch keine Zeit erfasst und keine Kalkulation hinterlegt.</p>`}
    </section>

    ${showRev ? `<section class="block">
      <div class="block-head"><h2>Korrekturschleifen</h2><span class="count">${rev.included} inklusive</span></div>
      <div class="card pad-card rev ${rev.over ? 'is-over' : ''}">
        <div class="rev-top">
          <div class="pips" aria-label="${rev.maxRound} Runden genutzt, ${rev.included} inklusive">
            ${Array.from({ length: Math.max(1, pipCount) }, (_, i) => {
              const n = i + 1;
              const cls = n > rev.included ? 'over' : n <= rev.maxRound ? 'used' : 'free';
              return `<span class="pip ${cls}">${n}</span>`;
            }).join('')}
          </div>
          <span class="rev-count"><b>${rev.maxRound}</b> / ${rev.included}</span>
        </div>
        <p class="rev-text">${
          rev.over
            ? `Runde ${rev.maxRound} von ${rev.included} inklusive. Zusatzaufwand bisher <b>${fmtH(rev.extraHours, 1)}</b> ≈ <b>${fmtEUR(rev.extraValue)}</b> Nachtrag möglich <span class="muted">(à ${fmtRate(rev.extraRate)})</span>.`
            : rev.maxRound
              ? `${rev.included - rev.maxRound === 0 ? 'Alle inkludierten Runden genutzt – die nächste ist Nachtrag.' : `Noch ${rev.included - rev.maxRound} ${rev.included - rev.maxRound === 1 ? 'Runde' : 'Runden'} im Angebot enthalten.`}`
              : 'Noch keine Korrekturrunde getrackt.'
        }</p>
      </div>
    </section>` : ''}

    <section class="block">
      <div class="block-head"><h2>Kosten</h2><button class="link" data-action="add-cost">+ Kosten</button></div>
      ${project.costs.length
        ? `<div class="card entry-list">${project.costs.map((c) => `
            <button class="entry" data-action="edit-cost" data-id="${c.id}">
              <span class="phase-ic">${icon('admin', 16)}</span>
              <span class="entry-main"><strong>${escapeHtml(c.label)}</strong><span class="muted">${escapeHtml(labelOf(COST_CATEGORIES, c.category))}</span></span>
              <span class="entry-dur">${fmtEUR(c.amount)}</span>
            </button>`).join('')}
            <div class="cost-sum"><span class="muted">Summe</span><b>${fmtEUR(m.totalCosts)}</b></div>
          </div>`
        : `<p class="muted pad">Keine Fremdkosten. Assistenz, Miete, Musiklizenz, Fahrtkosten – alles, was dein Honorar schmälert.</p>`}
    </section>

    <section class="block">
      <div class="block-head"><h2>Status</h2></div>
      <div class="chip-row scroll">
        ${STATUSES.map((s) => `<button class="chip ${s.key === project.status ? 'on' : ''}" data-action="status" data-status="${s.key}">${escapeHtml(s.label)}</button>`).join('')}
      </div>
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
      <div class="card pad-card">
        ${project.startDate || project.deliveryDate ? `<p class="muted icon-line">${icon('calendar', 16)} ${fmtDate(project.startDate) || '–'} → ${fmtDate(project.deliveryDate) || 'offen'}</p>` : ''}
        ${project.notes ? `<p class="notes">${escapeHtml(project.notes)}</p>` : ''}
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
    'add-cost': async () => (await costSheet(ctx, project, null)) && ctx.refresh(),
    'edit-cost': async (b) => (await costSheet(ctx, project, project.costs.find((c) => c.id === b.dataset.id))) && ctx.refresh(),
    status: async (b) => {
      if (b.dataset.status === project.status) return;
      await store.put('projects', { ...project, status: b.dataset.status });
      toast(`Status: ${STATUSES.find((s) => s.key === b.dataset.status).label}`);
      ctx.refresh();
    },
  });
}

function costSheet(ctx, project, cost) {
  const c = cost || { id: uid(), label: '', amount: 0, category: 'other' };
  return openSheet({
    title: cost ? 'Kosten bearbeiten' : 'Kosten hinzufügen',
    subtitle: project.title,
    body: `
      <form class="form" novalidate>
        <div class="field"><span>Kategorie</span>
          <div class="chip-row wrap">${COST_CATEGORIES.map((k) => `<label class="chip radio"><input type="radio" name="category" value="${k.key}" ${k.key === c.category ? 'checked' : ''}><span>${escapeHtml(k.label)}</span></label>`).join('')}</div>
        </div>
        <label class="field"><span>Bezeichnung</span><input name="label" value="${escapeHtml(c.label)}" placeholder="z. B. 2nd Shooter Tom" autocomplete="off"></label>
        <label class="field"><span>Betrag (Endbetrag)</span><div class="input-unit"><input name="amount" inputmode="decimal" value="${centsToInput(c.amount)}" placeholder="0" autofocus><em>€</em></div></label>
        <p class="field-error" data-err hidden></p>
        <div class="btn-row">
          ${cost ? `<button type="button" class="btn danger-ghost" data-delete aria-label="Kosten löschen">${icon('trash', 18)}</button>` : ''}
          <button type="submit" class="btn primary block">${cost ? 'Speichern' : 'Hinzufügen'}</button>
        </div>
      </form>`,
    onMount(el, close) {
      const form = el.querySelector('form');
      const F = form.elements;
      const err = el.querySelector('[data-err]');
      el.querySelector('[data-delete]')?.addEventListener('click', async () => {
        if (!(await confirmDialog(`„${c.label}“ wird entfernt.`, { title: 'Kosten löschen?', confirmLabel: 'Löschen', danger: true }))) return;
        await ctx.store.put('projects', { ...project, costs: project.costs.filter((x) => x.id !== c.id) });
        toast('Kosten entfernt');
        close(true);
      });
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const amount = parseEUR(F.amount.value);
        if (Number.isNaN(amount) || amount <= 0) {
          err.hidden = false;
          err.textContent = 'Betrag fehlt oder ist nicht lesbar.';
          F.amount.focus();
          return;
        }
        const category = form.querySelector('[name="category"]:checked').value;
        const next = { ...c, amount, category, label: F.label.value.trim() || labelOf(COST_CATEGORIES, category) };
        const costs = cost ? project.costs.map((x) => (x.id === c.id ? next : x)) : [...project.costs, next];
        await ctx.store.put('projects', { ...project, costs });
        toast(cost ? 'Gespeichert' : 'Kosten hinzugefügt');
        close(true);
      });
    },
  });
}
