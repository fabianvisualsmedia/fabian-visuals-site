// App bootstrap: hash router, global timer bar, dock navigation, ticking clocks,
// forgotten-timer guard and the shared timer flows used by all views.

import { createStore } from './db.js';
import { labelOf } from './config.js';
import { icon } from './icons.js';
import { escapeHtml, fmtClock, fmtDur, fmtHours, fmtDay, fmtTime, toLocalInput } from './format.js';
import { openSheet, toast } from './ui.js';
import { pickPhase, revisionDefaults } from './phase-picker.js';
import {
  getRunning, startTimer, stopTimer, isForgotten, entryMs, durationMs, recentPhases, maxRevisionRound,
} from './logic/timer.js';

import { renderOverview, renderProjects } from './views/projects-list.js';
import { renderProjectEdit } from './views/project-edit.js';
import { renderProjectDetail } from './views/project-detail.js';
import { renderClients } from './views/clients.js';
import { renderInsights } from './views/insights.js';
import { renderSettings } from './views/settings.js';

const store = createStore('fv-tracker');
const $view = document.getElementById('view');
const $bar = document.getElementById('timerbar');
const $dock = document.getElementById('dock');

const ROUTES = [
  { re: /^#?\/?$/, view: renderOverview, nav: 'home', hero: true },
  { re: /^#\/projects$/, view: renderProjects, nav: 'projects' },
  { re: /^#\/project\/new$/, view: (el, c) => renderProjectEdit(el, c, null), nav: 'projects', form: true },
  { re: /^#\/project\/([\w-]+)\/edit$/, view: renderProjectEdit, nav: 'projects', form: true },
  { re: /^#\/project\/([\w-]+)$/, view: renderProjectDetail, nav: 'projects' },
  { re: /^#\/clients$/, view: renderClients, nav: 'clients' },
  { re: /^#\/insights$/, view: renderInsights, nav: 'insights' },
  { re: /^#\/settings$/, view: renderSettings, nav: 'settings' },
];

const ctx = {
  store,
  settings: null,
  running: null,
  phaseLabel: (key) => labelOf(ctx.settings.phases, key),
  navigate: (hash) => (location.hash = hash),
  refresh: () => render(),
  startTimer: startFlow,
  switchPhase: switchFlow,
  stopTimer: stopFlow,
};

/* ---------------- Router ---------------- */

let lastHash = null;
let rendering = Promise.resolve();

function render() {
  rendering = rendering.then(doRender, doRender);
  return rendering;
}

async function doRender() {
  const hash = location.hash || '#/';
  const route = ROUTES.find((r) => r.re.test(hash)) || ROUTES[0];
  const params = hash.match(route.re)?.slice(1) || [];
  ctx.settings = await store.getSettings();
  ctx.running = await getRunning(store);
  document.documentElement.dataset.accent = ctx.settings.accent;
  document.body.dataset.route = route.nav;
  document.body.classList.toggle('is-form', !!route.form);
  const routeChanged = hash !== lastHash;
  const scrollY = window.scrollY;
  // Fresh host per render so delegated listeners never stack up across views.
  const host = document.createElement('div');
  host.className = 'view-host';
  try {
    await route.view(host, ctx, ...params);
    $view.replaceChildren(host);
  } catch (err) {
    console.error(err);
    $view.innerHTML = `<div class="card empty"><h2>Da ist was schiefgelaufen</h2><p class="muted">${escapeHtml(err.message)}</p><a class="btn ghost" href="#/">Zur Übersicht</a></div>`;
  }
  renderDock(route.nav, !!route.form);
  await renderTimerBar(!!route.hero);
  if (routeChanged) window.scrollTo(0, 0);
  else window.scrollTo(0, scrollY);
  lastHash = hash;
  tick();
}

/* ---------------- Dock ---------------- */

function renderDock(active, hidden) {
  $dock.hidden = hidden;
  const item = (key, href, ic, label) =>
    `<a href="${href}" class="dock-item ${active === key ? 'active' : ''}" aria-label="${label}" ${active === key ? 'aria-current="page"' : ''}>${icon(ic, 22)}<span>${label}</span></a>`;
  $dock.innerHTML = `
    ${item('home', '#/', 'home', 'Übersicht')}
    ${item('projects', '#/projects', 'folder', 'Projekte')}
    <a href="#/project/new" class="dock-plus" aria-label="Neues Projekt">${icon('plus', 24)}</a>
    ${item('clients', '#/clients', 'users', 'Kunden')}
    ${item('insights', '#/insights', 'chart', 'Insights')}`;
}

/* ---------------- Global timer bar ---------------- */

async function renderTimerBar(heroVisible) {
  const r = ctx.running;
  const show = !!r && !heroVisible;
  $bar.hidden = !show;
  document.body.classList.toggle('has-timerbar', show);
  if (!show) {
    $bar.innerHTML = '';
    return;
  }
  const project = await store.get('projects', r.projectId);
  const phase = ctx.phaseLabel(r.phase) + (r.revisionRound ? ` · R${r.revisionRound}` : '');
  $bar.innerHTML = `
    <div class="tb">
      <span class="rec-dot" aria-hidden="true"></span>
      <a class="tb-info" href="#/project/${r.projectId}">
        <span class="tb-project">${escapeHtml(project?.title || 'Projekt')}</span>
        <span class="tb-phase">${escapeHtml(phase)}</span>
      </a>
      <span class="tb-clock" data-tick="${r.start}">${fmtClock(entryMs(r))}</span>
      <button class="icon-btn sm" data-tb="swap" aria-label="Phase wechseln">${icon('swap', 18)}</button>
      <button class="stop-btn" data-tb="stop" aria-label="Timer stoppen">${icon('stop', 18)}</button>
    </div>`;
}

$bar.addEventListener('click', (e) => {
  const b = e.target.closest('[data-tb]');
  if (!b) return;
  if (b.dataset.tb === 'stop') stopFlow();
  if (b.dataset.tb === 'swap') switchFlow();
});

/* ---------------- Ticking clocks ---------------- */
// Any element with data-tick="<startISO>" shows base + (now − start). data-fmt: clock | dur.

function tick() {
  const now = Date.now();
  document.querySelectorAll('[data-tick]').forEach((el) => {
    const ms = Number(el.dataset.base || 0) + durationMs(el.dataset.tick, null, now);
    el.textContent = el.dataset.fmt === 'dur' ? fmtDur(ms) : el.dataset.fmt === 'h' ? fmtHours(ms, 2) : fmtClock(ms);
  });
}
setInterval(tick, 1000);

// Figures (rates, warnings, chart) are recomputed once a minute while a timer runs,
// unless the user is in a form or sheet.
setInterval(() => {
  if (!ctx.running || document.hidden) return;
  if (document.querySelector('.sheet-backdrop') || document.body.classList.contains('is-form')) return;
  if (document.activeElement?.matches('input, textarea, select')) return;
  render();
}, 60_000);

/* ---------------- Timer flows ---------------- */

async function startFlow(projectId, phase = null) {
  const project = await store.get('projects', projectId);
  if (!project) return;
  const entries = await store.byIndex('entries', 'projectId', projectId);
  let revisionRound = null;
  if (!phase) {
    const res = await pickPhase({
      phases: ctx.settings.phases,
      current: recentPhases(entries, 1)[0] || 'prep',
      subtitle: project.title,
      revision: revisionDefaults(entries, project.includedRevisions),
    });
    if (!res) return;
    ({ phase, revisionRound } = res);
  } else if (phase === 'revisions') {
    revisionRound = Math.max(1, maxRevisionRound(entries));
  }
  await startTimer(store, { projectId, phase, revisionRound });
  if (project.status === 'offer') {
    toast(`${ctx.phaseLabel(phase)} läuft – Projekt ist noch „Angebot“`);
  } else toast(`${ctx.phaseLabel(phase)} läuft`);
  await render();
}

async function switchFlow() {
  const r = await getRunning(store);
  if (!r) return;
  const project = await store.get('projects', r.projectId);
  const entries = await store.byIndex('entries', 'projectId', r.projectId);
  const res = await pickPhase({
    phases: ctx.settings.phases,
    current: r.phase,
    title: 'Phase wechseln',
    subtitle: project?.title || '',
    cta: 'Wechseln',
    revision: revisionDefaults(entries, project?.includedRevisions),
  });
  if (!res) return;
  if (res.phase === r.phase && (res.revisionRound ?? null) === (r.revisionRound ?? null)) return;
  await startTimer(store, { projectId: r.projectId, phase: res.phase, revisionRound: res.revisionRound });
  toast(`Gewechselt zu ${ctx.phaseLabel(res.phase)}`);
  await render();
}

async function stopFlow() {
  const r = await getRunning(store);
  if (!r) return;
  const ms = entryMs(r);
  const res = await stopTimer(store);
  toast(res?.discarded.length ? 'Unter 10 s – verworfen' : `Gestoppt · ${fmtDur(ms)}`);
  await render();
}

/* ---------------- Forgotten-timer guard ---------------- */

let guardOpen = false;
async function checkForgotten() {
  if (guardOpen) return;
  const settings = await store.getSettings();
  const r = await getRunning(store);
  if (!r || !isForgotten(r, settings.timerWarnHours)) return;
  const ack = await store.getKV('guardAck');
  if (ack?.id === r.id && Date.now() - ack.at < settings.timerWarnHours * 3600_000) return;

  guardOpen = true;
  const project = await store.get('projects', r.projectId);
  const startMs = Date.parse(r.start);
  const hours = Math.floor(entryMs(r) / 3600_000);
  const def = Math.min(Date.now(), startMs + 4 * 3600_000);
  const chips = [1, 2, 4, 8].filter((h) => startMs + h * 3600_000 < Date.now());
  const result = await openSheet({
    title: `Timer läuft seit ${hours} h`,
    subtitle: `${project?.title || 'Projekt'} · ${labelOf(settings.phases, r.phase)} · gestartet ${fmtDay(r.start)}, ${fmtTime(r.start)}`,
    closable: false,
    body: `
      <p class="lead">Wann hast du aufgehört?</p>
      <div class="chip-row wrap guard-chips">${chips.map((h) => `<button type="button" class="chip" data-h="${h}">+${h} h nach Start</button>`).join('')}</div>
      <label class="field"><span>Ende</span>
        <input type="datetime-local" name="end" value="${toLocalInput(new Date(def).toISOString())}" min="${toLocalInput(r.start)}" max="${toLocalInput(new Date().toISOString())}">
      </label>
      <p class="field-error" data-err hidden></p>
      <div class="btn-row">
        <button type="button" class="btn ghost" data-keep>Läuft wirklich noch</button>
        <button type="button" class="btn primary" data-save>Hier stoppen</button>
      </div>`,
    onMount(el, close) {
      const input = el.querySelector('[name="end"]');
      el.querySelectorAll('[data-h]').forEach((b) =>
        b.addEventListener('click', () => {
          input.value = toLocalInput(new Date(startMs + Number(b.dataset.h) * 3600_000).toISOString());
        }),
      );
      el.querySelector('[data-keep]').addEventListener('click', () => close({ keep: true }));
      el.querySelector('[data-save]').addEventListener('click', () => {
        const end = new Date(input.value);
        const err = el.querySelector('[data-err]');
        if (Number.isNaN(end.getTime()) || end <= new Date(r.start) || end > new Date()) {
          err.hidden = false;
          err.textContent = 'Das Ende muss zwischen Start und jetzt liegen.';
          return;
        }
        close({ end: end.toISOString() });
      });
    },
  });
  guardOpen = false;
  if (result?.keep) await store.setKV('guardAck', { id: r.id, at: Date.now() });
  if (result?.end) {
    await stopTimer(store, new Date(), result.end);
    toast(`Gestoppt um ${fmtTime(result.end)}`);
  }
  await render();
}

/* ---------------- Boot ---------------- */

store.onChange(({ store: s, remote }) => {
  if (!remote) return;
  // Another tab changed data: refresh unless the user is mid-edit.
  const editing = document.querySelector('.sheet-backdrop') || document.body.classList.contains('is-form');
  if (!editing) render();
  else if (s === 'entries') getRunning(store).then((r) => ((ctx.running = r), renderTimerBar(document.body.dataset.route === 'home')));
});

window.addEventListener('hashchange', render);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    tick();
    checkForgotten();
  }
});

render().then(checkForgotten);

// Expose for debugging / automated acceptance checks.
window.__fv = { store, ctx };
