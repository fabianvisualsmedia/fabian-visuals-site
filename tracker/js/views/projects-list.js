// Overview (home) and full project list.

import { STATUSES } from '../config.js';
import { escapeHtml, fmtClock, fmtEUR, fmtDur, fmtRate, greeting } from '../format.js';
import { icon, phaseIcon } from '../icons.js';
import { delegate } from '../ui.js';
import { entryMs } from '../logic/timer.js';
import { sumMs, projectFee, projectMetrics } from '../logic/calc.js';
import { loadAll, projectCard, waveSvg, emptyState, statusChip, typeLabel } from './shared.js';

function wireCardActions(el, ctx) {
  delegate(el, {
    quick: (b) => ctx.startTimer(b.dataset.id, b.dataset.phase),
    pick: (b) => ctx.startTimer(b.dataset.id),
    start: (b) => ctx.startTimer(b.dataset.id),
    stop: () => ctx.stopTimer(),
    swap: () => ctx.switchPhase(),
  });
}

/* ---------------- Overview ---------------- */

export async function renderOverview(el, ctx) {
  const { projects, clientById, entriesByProject, entries } = await loadAll(ctx.store);
  const r = ctx.running;
  const phases = ctx.settings.phases;

  const active = projects
    .filter((p) => p.status === 'active' || (r && r.projectId === p.id && p.status !== 'archived'))
    .sort((a, b) => (r?.projectId === b.id) - (r?.projectId === a.id) || lastActivity(b) - lastActivity(a));
  const toBill = projects.filter((p) => p.status === 'delivered');
  const offers = projects.filter((p) => p.status === 'offer' && r?.projectId !== p.id);

  function lastActivity(p) {
    const es = entriesByProject.get(p.id) || [];
    return es.reduce((m, e) => Math.max(m, Date.parse(e.start)), 0);
  }

  // Projects whose (projected) hourly rate is below the pain threshold.
  const alarms = active
    .map((p) => ({ p, m: projectMetrics(p, entriesByProject.get(p.id) || [], ctx.settings) }))
    .filter(({ m }) => m.light === 'bad');

  const runningProject = r ? projects.find((p) => p.id === r.projectId) : null;
  const lastProject = !r
    ? [...entries].sort((a, b) => Date.parse(b.start) - Date.parse(a.start))
        .map((e) => projects.find((p) => p.id === e.projectId))
        .find((p) => p && ['active', 'offer'].includes(p.status))
    : null;

  const hero = r
    ? `<section class="hero glow-card is-running" aria-label="Laufender Timer">
        <div class="hero-top">
          <span class="live-pill"><span class="rec-dot"></span>Läuft</span>
          <span class="hero-phase">${phaseIcon(r.phase, 16)}${escapeHtml(ctx.phaseLabel(r.phase))}${r.revisionRound ? ` · Runde ${r.revisionRound}` : ''}</span>
        </div>
        <a class="hero-project" href="#/project/${r.projectId}">${escapeHtml(runningProject?.title || 'Projekt')}</a>
        <p class="hero-client">${escapeHtml(clientById.get(runningProject?.clientId)?.name || '')}</p>
        <div class="hero-clock" data-tick="${r.start}">${fmtClock(entryMs(r))}</div>
        ${waveSvg(true)}
        <div class="hero-actions">
          <button class="btn glass" data-action="swap">${icon('swap', 18)}Phase wechseln</button>
          <button class="stop-btn lg" data-action="stop" aria-label="Timer stoppen">${icon('stop', 22)}</button>
        </div>
      </section>`
    : `<section class="hero is-idle" aria-label="Timer">
        <div class="hero-top"><span class="eyebrow">Kein Timer aktiv</span></div>
        <div class="hero-clock dim">0:00:00</div>
        ${waveSvg(false)}
        <p class="hero-hint">${active.length ? 'Bereit für den nächsten Take. Tipp unten auf eine Phase.' : 'Leg dein erstes Projekt an – dann läuft die Uhr mit einem Tipp.'}</p>
        <div class="hero-actions">
          ${lastProject
            ? `<button class="btn primary glow-btn" data-action="start" data-id="${lastProject.id}">${icon('play', 16)}Weiter: ${escapeHtml(lastProject.title)}</button>`
            : `<a class="btn primary glow-btn" href="#/project/new">${icon('plus', 16)}Projekt anlegen</a>`}
        </div>
      </section>`;

  el.innerHTML = `
    <header class="page-head">
      <div>
        <p class="eyebrow">${greeting()}, Fabian</p>
        <h1>Übersicht</h1>
      </div>
      <a class="icon-btn" href="#/settings" aria-label="Einstellungen">${icon('gear', 20)}</a>
    </header>

    ${hero}

    ${alarms.map(({ p, m }) => `<a class="alarm" href="#/project/${p.id}">
      ${icon('alert', 18)}
      <span><b>${escapeHtml(p.title)}</b> rutscht unter deine Schmerzgrenze: ${m.headlineIsProjection ? 'Prognose' : 'aktuell'} ${fmtRate(m.headlineRate)} statt mind. ${fmtRate(ctx.settings.minHourlyRate)}</span>
      ${icon('chevron', 16)}
    </a>`).join('')}

    <section class="block">
      <div class="block-head"><h2>Aktive Projekte</h2><a class="link" href="#/projects">Alle</a></div>
      ${active.length
        ? `<div class="card-grid">${active
            .map((p) => projectCard(p, { client: clientById.get(p.clientId), entries: entriesByProject.get(p.id) || [], running: r, phases, settings: ctx.settings }))
            .join('')}</div>`
        : emptyState('Keine aktiven Projekte', 'Projekte mit Status „Aktiv“ landen hier – mit Schnellstart pro Phase.', `<a class="btn ghost" href="#/project/new">${icon('plus', 16)}Neues Projekt</a>`)}
    </section>

    ${toBill.length ? `<section class="block">
      <div class="block-head"><h2>Zur Abrechnung bereit</h2><span class="count">${toBill.length}</span></div>
      <div class="list">${toBill.map((p) => rowLink(p, clientById.get(p.clientId), entriesByProject.get(p.id) || [])).join('')}</div>
    </section>` : ''}

    ${offers.length ? `<section class="block">
      <div class="block-head"><h2>Angebote</h2><span class="count">${offers.length}</span></div>
      <div class="list">${offers.map((p) => rowLink(p, clientById.get(p.clientId), entriesByProject.get(p.id) || [])).join('')}</div>
    </section>` : ''}
  `;
  wireCardActions(el, ctx);
}

function rowLink(p, client, entries) {
  return `<a class="row" href="#/project/${p.id}">
    <div class="row-main">
      <strong>${escapeHtml(p.title)}</strong>
      <span class="muted">${escapeHtml(client?.name || 'Ohne Kunde')} · ${escapeHtml(typeLabel(p.type))}</span>
    </div>
    <div class="row-side">
      <span>${fmtDur(sumMs(entries))}</span>
      <span class="muted">${projectFee(p) ? fmtEUR(projectFee(p)) : ''}</span>
    </div>
    ${icon('chevron', 18)}
  </a>`;
}

/* ---------------- All projects ---------------- */

let listFilter = 'open';
let listQuery = '';

export async function renderProjects(el, ctx) {
  const { projects, clientById, entriesByProject } = await loadAll(ctx.store);
  const r = ctx.running;
  const order = Object.fromEntries(STATUSES.map((s, i) => [s.key, i]));
  const filters = [{ key: 'open', label: 'Offen' }, ...STATUSES, { key: 'all', label: 'Alle' }];

  const draw = () => {
    const q = listQuery.trim().toLowerCase();
    const shown = projects
      .filter((p) =>
        listFilter === 'all' ? true : listFilter === 'open' ? !['paid', 'archived'].includes(p.status) : p.status === listFilter,
      )
      .filter((p) => !q || `${p.title} ${clientById.get(p.clientId)?.name || ''}`.toLowerCase().includes(q))
      .sort((a, b) => (r?.projectId === b.id) - (r?.projectId === a.id) || order[a.status] - order[b.status] || (b.startDate || '').localeCompare(a.startDate || ''));
    el.querySelector('[data-results]').innerHTML = shown.length
      ? `<div class="card-grid">${shown
          .map((p) =>
            projectCard(p, {
              client: clientById.get(p.clientId),
              entries: entriesByProject.get(p.id) || [],
              running: r,
              phases: ctx.settings.phases,
              settings: ctx.settings,
              quick: ['active', 'offer'].includes(p.status) || r?.projectId === p.id,
            }),
          )
          .join('')}</div>`
      : emptyState(projects.length ? 'Nichts gefunden' : 'Noch keine Projekte', projects.length ? 'Anderer Filter oder Suchbegriff?' : 'Leg los – Kunde, Honorar und Kalkulation in einem Rutsch.', projects.length ? '' : `<a class="btn primary" href="#/project/new">${icon('plus', 16)}Projekt anlegen</a>`);
    el.querySelectorAll('[data-filter]').forEach((b) => b.classList.toggle('on', b.dataset.filter === listFilter));
  };

  el.innerHTML = `
    <header class="page-head">
      <div><p class="eyebrow">${projects.length} Projekte</p><h1>Projekte</h1></div>
      <a class="icon-btn accent" href="#/project/new" aria-label="Neues Projekt">${icon('plus', 20)}</a>
    </header>
    <label class="search">${icon('search', 18)}<input type="search" placeholder="Projekt oder Kunde suchen" value="${escapeHtml(listQuery)}" aria-label="Suchen"></label>
    <div class="chip-row scroll" role="tablist">
      ${filters.map((f) => `<button class="chip" data-filter="${f.key}">${escapeHtml(f.label)}</button>`).join('')}
    </div>
    <div data-results></div>`;

  el.querySelector('input[type="search"]').addEventListener('input', (e) => {
    listQuery = e.target.value;
    draw();
  });
  el.querySelectorAll('[data-filter]').forEach((b) =>
    b.addEventListener('click', () => {
      listFilter = b.dataset.filter;
      draw();
    }),
  );
  wireCardActions(el, ctx);
  draw();
}

export { statusChip };
