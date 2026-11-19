// Overview: next shoot hero, week strip, upcoming, open backups, archive.

import { all, getSettings } from '../db.js';
import {
  esc, icon, aurora, SHOOT_TYPES, paletteStyle, todayISO, addDaysISO, parseDate,
  fmtDateShort, fmtWeekdayShort, fmtMonthShort, relativeDay, countdown, greeting,
} from '../ui.js';

const sortKey = (s) => `${s.date}T${s.callTime}`;

/** Split shoots into overview buckets. Exported for tests. */
export function bucketShoots(shoots, today = todayISO()) {
  const backupOpen = [], upcoming = [], archive = [];
  for (const s of shoots) {
    const needsBackup = !s.backup?.done && (s.date < today || s.phase === 'wrapped');
    if (needsBackup) backupOpen.push(s);
    else if (s.date >= today) upcoming.push(s);
    else archive.push(s);
  }
  upcoming.sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
  backupOpen.sort((a, b) => sortKey(b).localeCompare(sortKey(a)));
  archive.sort((a, b) => sortKey(b).localeCompare(sortKey(a)));
  return { upcoming, backupOpen, archive };
}

function hero(s) {
  const t = SHOOT_TYPES[s.type] || SHOOT_TYPES.custom;
  const c = countdown(s);
  return `
  <a class="glow-card hero" href="#/shoot/${esc(s.id)}" style="${paletteStyle(s.type)}">
    ${aurora()}<div class="horizon"></div>
    <div class="hero-top">
      <span class="chip glass">${icon(t.icon, 16)} ${esc(t.label)}</span>
      <span class="icon-btn glass">${icon('arrowUpRight', 20)}</span>
    </div>
    <div class="hero-count"><span class="big">${esc(c.big)}</span><span class="unit">${esc(c.unit)}</span></div>
    <h2>${esc(s.title)}</h2>
    <p class="sub">${esc([s.client, s.location?.label].filter(Boolean).join(' · ') || relativeDay(s.date))}</p>
    <div class="hero-meta">
      <div><small>Datum</small><b>${esc(fmtDateShort(s.date))}</b></div>
      <div><small>Call</small><b>${esc(s.callTime)}</b></div>
      <div><small>Wrap</small><b>${esc(s.wrapTime)}</b></div>
    </div>
  </a>`;
}

function week(shoots) {
  const today = todayISO();
  const byDate = new Map();
  shoots.forEach((s) => { if (!byDate.has(s.date)) byDate.set(s.date, s); });
  let html = '';
  for (let i = 0; i < 7; i++) {
    const iso = addDaysISO(today, i);
    const s = byDate.get(iso);
    const cls = `day${i === 0 ? ' today orb' : ''}`;
    const inner = `<small>${esc(fmtWeekdayShort(iso))}</small><b>${parseDate(iso).getDate()}</b>${s ? '<span class="dot"></span>' : ''}`;
    html += s
      ? `<a class="${cls}" href="#/shoot/${esc(s.id)}" aria-label="${esc(s.title)}">${inner}</a>`
      : `<div class="${cls}">${inner}</div>`;
  }
  return `<div class="week">${html}</div>`;
}

function row(s, { badge } = {}) {
  return `
  <a class="card row-card" href="#/shoot/${esc(s.id)}">
    <div class="date-tile" style="${paletteStyle(s.type)}">${aurora()}
      <small>${esc(fmtWeekdayShort(s.date))}</small><b>${parseDate(s.date).getDate()}</b><small>${esc(fmtMonthShort(s.date))}</small>
    </div>
    <div class="row-body">
      <b>${esc(s.title)}</b>
      <span>${esc([s.client || SHOOT_TYPES[s.type]?.label, `Call ${s.callTime}`].filter(Boolean).join(' · '))}</span>
    </div>
    <div class="row-end">${badge || `<span class="chip sm">${esc(relativeDay(s.date))}</span>`}${icon('chevron', 18)}</div>
  </a>`;
}

function emptyState() {
  return `
  <div class="glow-card empty" style="${paletteStyle('custom')}">
    ${aurora()}<div class="horizon"></div>
    <h2>Noch kein Dreh geplant</h2>
    <p>Leg deinen nächsten Termin an – Packliste, Akkus & Timing baut der Autopilot.</p>
    <a class="btn light" href="#/shoot/new">${icon('plus', 20, 2)} Ersten Dreh anlegen</a>
  </div>`;
}

export async function render(page) {
  const [shoots, settings] = await Promise.all([all('shoots'), getSettings()]);
  const { upcoming, backupOpen, archive } = bucketShoots(shoots);
  const [next, ...later] = upcoming;

  page.innerHTML = `
    <header>
      <p class="greeting">${esc(greeting(settings.name))}</p>
      <h1 class="display">Deine Drehs<span class="soft">${upcoming.length ? ` · ${upcoming.length}` : ''}</span></h1>
    </header>

    ${week(upcoming)}

    <section style="margin-top:22px">${next ? hero(next) : emptyState()}</section>

    ${backupOpen.length ? `
      <div class="section-head"><h3>${icon('alert', 18)} Backup offen</h3><span>${backupOpen.length}</span></div>
      <div class="stack">${backupOpen.map((s) => row(s, { badge: '<span class="chip sm danger">Backup offen</span>' })).join('')}</div>` : ''}

    ${later.length ? `
      <div class="section-head"><h3>Demnächst</h3><span>${later.length}</span></div>
      <div class="stack">${later.map((s) => row(s)).join('')}</div>` : ''}

    ${archive.length ? `
      <div class="section-head"><h3>Archiv</h3><span>${archive.length}</span></div>
      <div class="stack archive">${archive.map((s) => row(s, { badge: `<span class="chip sm">${icon('check', 14)} gesichert</span>` })).join('')}</div>` : ''}
  `;
}
