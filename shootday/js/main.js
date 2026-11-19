// App start + hash router.

import { seedIfNeeded, getSettings } from './db.js';
import { icon } from './ui.js';
import { applyTheme } from './theme.js';
import * as list from './views/shoots-list.js';
import * as edit from './views/shoot-edit.js';
import * as day from './views/shoot-day.js';
import * as gear from './views/gear.js';
import * as settings from './views/settings.js';

const ROUTES = [
  { re: /^\/?$/, view: list, nav: 'list' },
  { re: /^\/shoot\/new$/, view: edit, nav: 'new', params: () => ({}) },
  { re: /^\/shoot\/([^/]+)\/edit$/, view: edit, nav: null, params: (m) => ({ id: m[1] }) },
  { re: /^\/shoot\/([^/]+)$/, view: day, nav: 'list', params: (m) => ({ id: m[1] }) },
  { re: /^\/gear$/, view: gear, nav: 'gear' },
  { re: /^\/settings$/, view: settings, nav: 'settings' },
];

// ---------- Router ----------

const app = document.getElementById('app');
let renderToken = 0;

async function route() {
  const path = (location.hash || '#/').slice(1);
  const match = ROUTES.map((r) => ({ r, m: path.match(r.re) })).find((x) => x.m);
  if (!match) { location.replace('#/'); return; }

  const token = ++renderToken;
  const page = document.createElement('div');
  page.className = 'page';
  document.body.classList.toggle('no-dock', match.r.view === edit);

  document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === match.r.nav));

  try {
    await match.r.view.render(page, match.r.params ? match.r.params(match.m) : {});
  } catch (err) {
    console.error(err);
    page.innerHTML = `<div class="card notes">Da ist was schiefgelaufen: ${String(err.message || err)}</div>`;
  }
  if (token !== renderToken) return; // a newer navigation won
  app.replaceChildren(page);
  window.scrollTo(0, 0);
}

// ---------- Boot ----------

function paintDock() {
  const icons = { list: 'list', gear: 'gear', settings: 'settings', new: 'plus' };
  document.querySelectorAll('[data-nav]').forEach((a) => {
    a.innerHTML = icon(icons[a.dataset.nav], a.dataset.nav === 'new' ? 26 : 22, a.dataset.nav === 'new' ? 2 : 1.7);
  });
}

async function boot() {
  paintDock();
  await seedIfNeeded();
  const s = await getSettings();
  applyTheme(s.theme);
  window.addEventListener('hashchange', route);
  await route();
}

boot();
