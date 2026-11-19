/* Fabian.Visuals OS — persönliches Projekt-OS (PWA, Vanilla JS, Daten lokal) */
(() => {
  'use strict';

  /* ---------- helpers ---------- */
  const KEY = 'fvos.v1';
  const $ = (s, r = document) => r.querySelector(s);
  const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const todayIso = () => iso(new Date());
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const weekStart = (d) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); return addDays(x, -((x.getDay() + 6) % 7)); };
  const fmtDate = (s) => (s ? parse(s).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }) : '');
  const fmtShort = (s) => (s ? parse(s).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' }) : '');
  const toMin = (t) => { if (!t) return null; const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const DOW = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  /* ---------- icons ---------- */
  const P = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    kanban: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 7.5v7M12 7.5v4M16 7.5v9"/>',
    calendar: '<rect x="3" y="4.5" width="18" height="16.5" rx="3.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.5 3.3-5.5 6.5-5.5s5.9 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c2 .7 3.2 2.5 3.5 5.2"/>',
    grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    left: '<path d="M14 6l-6 6 6 6"/>',
    right: '<path d="M10 6l6 6-6 6"/>',
    chev: '<path d="M9 5l7 7-7 7"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    film: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7 3v18M17 3v18M3 8h4M3 12h4M3 16h4M17 8h4M17 12h4M17 16h4"/>',
    note: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    arrow: '<path d="M7 17 17 7M8 7h9v9"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.7 1.8 1.8.7-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7z"/>',
    down: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    up: '<path d="M12 16V5M7 10l5-5 5 5M5 20h14"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>',
    receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4 4-6 8-6s7.2 2 8 6"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>',
  };
  const ic = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[n] || ''}</svg>`;

  /* ---------- meta ---------- */
  const STATUS = {
    planning: { label: 'Planning', c: 'var(--lav)' },
    progress: { label: 'In Progress', c: 'var(--amber)' },
    done: { label: 'Done', c: 'var(--green)' },
  };
  const PRIO = { high: { label: 'High', c: '#ff7a66' }, medium: { label: 'Medium', c: 'var(--amber)' }, low: { label: 'Low', c: 'var(--blue)' } };
  const ETYPE = {
    shoot: { label: 'Shoot', c: 'var(--orange)', g: 'linear-gradient(135deg,#ffb923,#fd290d)' },
    meeting: { label: 'Meeting', c: 'var(--blue)', g: 'linear-gradient(135deg,#307af4,#2236cc)' },
    call: { label: 'Call', c: 'var(--green)', g: 'linear-gradient(135deg,#7ef0a8,#1f9a57)' },
    content: { label: 'Content', c: 'var(--pink)', g: 'linear-gradient(135deg,#f89abf,#a59af8)' },
    deadline: { label: 'Deadline', c: 'var(--red)', g: 'linear-gradient(135deg,#fd290d,#7a0d02)' },
  };
  const SSTATUS = { idea: { label: 'Idee', c: 'var(--lav)' }, draft: { label: 'Draft', c: 'var(--amber)' }, final: { label: 'Final', c: 'var(--green)' } };
  const EMOJIS = ['📷', '🎬', '🎙️', '🎧', '🎵', '🏢', '💄', '👗', '🛍️', '🚗', '💧', '💸', '⚙️', '🦊', '✋', '🔁', '💃', '⚡️', '🌍', '🏠'];

  /* ---------- storage ---------- */
  function migrate(d) {
    for (const k of ['clients', 'projects', 'scripts', 'events', 'notes']) d[k] = Array.isArray(d[k]) ? d[k] : [];
    d.settings = d.settings || { name: 'Fabian' };
    d.v = 1;
    return d;
  }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return migrate(JSON.parse(raw));
    } catch (e) { /* fall through to seed */ }
    return migrate(window.FV_SEED());
  }
  let db = load();
  let saveT;
  function write() {
    clearTimeout(saveT);
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { toast('Speichern fehlgeschlagen'); }
  }
  const save = (now) => { if (now) write(); else { clearTimeout(saveT); saveT = setTimeout(write, 300); } };
  write();
  addEventListener('pagehide', write);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') write(); });

  const get = (col, id) => db[col].find((x) => x.id === id);
  const clientName = (id) => (get('clients', id) || {}).name || '';
  const projectTitle = (id) => (get('projects', id) || {}).title || '';
  const progress = (p) => {
    if (!p.tasks.length) return p.status === 'done' ? 100 : 0;
    return Math.round((p.tasks.filter((t) => t.done).length / p.tasks.length) * 100);
  };
  const byDateTime = (a, b) => (a.date + (a.start || '')).localeCompare(b.date + (b.start || ''));

  /* ---------- router ---------- */
  const route = () => { const [p = 'home', a = ''] = (location.hash.replace(/^#\/?/, '') || 'home').split('/'); return { p, a: decodeURIComponent(a) }; };
  const go = (path) => { location.hash = '#/' + path; };
  const SECTION = { home: 'home', projects: 'projects', project: 'projects', calendar: 'calendar', crm: 'crm', client: 'crm', more: 'more', scripts: 'more', script: 'more', notes: 'more', note: 'more' };

  let lastHash = '';
  function render() {
    const { p, a } = route();
    const view = $('#view');
    const views = { home: vHome, projects: vProjects, project: vProject, calendar: vCalendar, crm: vCrm, client: vClient, scripts: vScripts, script: vScript, notes: vNotes, note: vNote, more: vMore };
    const fn = views[p] || vHome;
    const changed = location.hash !== lastHash;
    const y = scrollY;
    const html = fn(a);
    if (html === null) { go(SECTION[p] === 'more' ? p.replace(/(script|note)$/, '$1s') : (SECTION[p] || 'home')); return; }
    view.innerHTML = html;
    view.style.animation = changed ? '' : 'none';
    if (changed) { void view.offsetWidth; scrollTo(0, 0); } else scrollTo(0, y);
    lastHash = location.hash;
    document.querySelectorAll('#dock [data-tab]').forEach((b) => b.classList.toggle('on', b.dataset.tab === SECTION[p]));
    view.querySelectorAll('textarea').forEach(grow);
  }
  addEventListener('hashchange', render);

  function grow(t) { if (t.classList.contains('nogrow')) return; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }

  /* ---------- shared bits ---------- */
  const topbar = (title, sub, right = '', backTo = '') => `
    <div class="topbar">
      <button class="circ" data-act="back" data-to="${esc(backTo)}" aria-label="Zurück">${ic('back')}</button>
      <div class="ttl"><b>${esc(title)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</div>
      ${right || '<span style="width:44px"></span>'}
    </div>`;
  const pageHead = (title, sub, right = '') => `
    <div class="topbar" style="margin-bottom:6px"><div style="flex:1"></div>${right}</div>
    <div class="page-h"><h1>${esc(title)}</h1>${sub ? `<p>${esc(sub)}</p>` : ''}</div>`;
  const bind = (col, id, f) => `data-bind="${col}|${id}|${f}"`;
  const seg = (col, id, f, opts, cur) => `<div class="seg">${Object.entries(opts).map(([k, o]) =>
    `<button class="${k === cur ? 'on' : ''}" data-act="set" ${bind(col, id, f)} data-val="${k}">${esc(o.label)}</button>`).join('')}</div>`;
  const options = (list, cur, labelKey, empty = '—') => `<option value="">${empty}</option>` +
    list.map((x) => `<option value="${x.id}" ${x.id === cur ? 'selected' : ''}>${esc(x[labelKey])}</option>`).join('');

  function projectCard(pr) {
    const pg = progress(pr);
    const open = pr.tasks.filter((t) => !t.done).length;
    return `<a class="pcard" href="#/project/${pr.id}" style="--bar:${PRIO[pr.priority]?.c || 'var(--blue)'}">
      <h4>${esc(pr.title)}</h4>
      <div class="meta">${pr.clientId ? `<span>${ic('user')}${esc(clientName(pr.clientId))}</span>` : ''}
        ${pr.end ? `<span>${ic('clock')}${fmtShort(pr.end)}</span>` : ''}
        <span>${ic('check')}${open} offen</span></div>
      <div class="bar ${pr.status === 'done' ? 'done' : ''}"><i style="width:${pg}%"></i></div>
    </a>`;
  }
  function eventRow(e, showDate) {
    const t = ETYPE[e.type] || ETYPE.meeting;
    const rel = e.date === todayIso() ? 'Heute' : e.date === iso(addDays(new Date(), 1)) ? 'Morgen' : fmtShort(e.date);
    return `<button class="ev" data-act="edit-event" data-id="${e.id}" style="--c:${t.c}">
      <span class="stripe"></span>
      <span class="when">${showDate ? `<b>${rel}</b>` : ''}${e.start ? `${showDate ? '' : '<b>'}${e.start}${showDate ? '' : '</b>'}` : 'ganztags'}</span>
      <span class="what"><b>${esc(e.title || 'Ohne Titel')}</b><small>${t.label}${e.projectId ? ' · ' + esc(projectTitle(e.projectId)) : ''}${e.end && !showDate ? ' · bis ' + e.end : ''}</small></span>
    </button>`;
  }

  /* ---------- HOME ---------- */
  function weekChart(ws, selected) {
    const days = [...Array(7)].map((_, i) => iso(addDays(ws, i)));
    const load = days.map((d) => db.events.filter((e) => e.date === d).reduce((s, e) => {
      const a = toMin(e.start), b = toMin(e.end); return s + (a != null && b != null && b > a ? (b - a) / 60 : 1);
    }, 0) + db.projects.filter((p) => p.end === d && p.status !== 'done').length);
    const max = Math.max(4, ...load);
    const W = 320, H = 110, padY = 14;
    const pts = load.map((v, i) => [19 + i * ((W - 38) / 6), H - padY - (v / max) * (H - padY * 2)]);
    let dPath = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      dPath += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    const si = Math.max(0, days.indexOf(selected));
    const [sx, sy] = pts[si];
    const hrs = load[si];
    return { days, load, svg: `
      <svg class="chart" viewBox="0 0 ${W} ${H}">
        <defs><linearGradient id="lg" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".5" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity=".3"/></linearGradient>
        <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".14"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
        <line x1="0" x2="${W}" y1="${H - padY}" y2="${H - padY}" stroke="rgba(255,255,255,.14)" stroke-dasharray="2 4"/>
        <path d="${dPath} L${pts[6][0]},${H - padY} L${pts[0][0]},${H - padY}Z" fill="url(#fg)"/>
        <path d="${dPath}" fill="none" stroke="url(#lg)" stroke-width="1.6"/>
        <line x1="${sx}" x2="${sx}" y1="${sy}" y2="${H - padY}" stroke="#fff" stroke-width="1.2"/>
        <circle cx="${sx}" cy="${sy}" r="9" fill="rgba(255,255,255,.22)"/><circle cx="${sx}" cy="${sy}" r="4" fill="#fff"/>
      </svg>`, hrs };
  }

  function vHome() {
    const h = new Date().getHours();
    const greet = h < 5 ? 'Gute Nacht' : h < 11 ? 'Guten Morgen' : h < 17 ? 'Hallo' : h < 22 ? 'Guten Abend' : 'Gute Nacht';
    const ws = weekStart(new Date());
    const td = todayIso();
    const { days, load, svg } = weekChart(ws, td);
    const active = db.projects.filter((p) => p.status !== 'done');
    const openTasks = db.projects.reduce((s, p) => s + p.tasks.filter((t) => !t.done).length, 0);
    const upcoming = db.events.filter((e) => e.date >= td).sort(byDateTime).slice(0, 4);
    const weekHrs = load.reduce((a, b) => a + b, 0);
    const name = db.settings.name || 'Fabian';
    const sorted = [...active].sort((a, b) => (a.end || '9999').localeCompare(b.end || '9999'));

    return `
      <div class="hello">
        <div class="avatar">${esc(name[0] || 'F')}</div>
        <div class="txt"><small>${greet} 👋</small><b>${esc(name)}</b></div>
        <a class="circ" href="#/more" aria-label="Einstellungen">${ic('settings')}</a>
      </div>
      <button class="searchpill" data-act="search">${ic('search')} Suchen… <span class="spark">${ic('spark')}</span></button>

      <section class="hero">
        <div class="head"><div><h3>Deine Woche</h3><div class="sub">${weekHrs ? `${Math.round(weekHrs * 10) / 10} h geplant` : 'Noch nichts geplant'}</div></div>
          <a class="arrow" href="#/calendar" aria-label="Kalender">${ic('arrow')}</a></div>
        ${svg}
        <div class="days">${days.map((d, i) => `<button class="${d === td ? 'on' : ''}" data-go="calendar/${d}">${DOW[i][0]}${load[i] && d !== td ? '<span class="dot"></span>' : ''}</button>`).join('')}</div>
        <div class="range">${fmtShort(days[0])} – ${fmtShort(days[6])}</div>
      </section>

      <div class="stats">
        <a class="stat warm" href="#/projects"><span class="lbl">Aktive Projekte</span><span class="num">${active.length}<span class="chip">${db.projects.filter((p) => p.status === 'progress').length} läuft</span></span></a>
        <a class="stat electric" href="#/projects"><span class="lbl">Offene Tasks</span><span class="num">${openTasks}</span></a>
        <a class="stat dream" href="#/crm"><span class="lbl">Kunden</span><span class="num">${db.clients.length}</span></a>
        <button class="stat add" data-act="new" aria-label="Neu anlegen">${ic('plus')}</button>
      </div>

      <div class="block">
        <div class="sec-h"><h2>Projekte</h2><a href="#/projects">Alle</a></div>
        ${sorted.length ? `<div class="hscroll">${sorted.map(projectCard).join('')}</div>` : '<div class="empty">Keine aktiven Projekte</div>'}
      </div>

      <div class="block">
        <div class="sec-h"><h2>Als Nächstes</h2><a href="#/calendar">Kalender</a></div>
        ${upcoming.length ? upcoming.map((e) => eventRow(e, true)).join('') : '<div class="empty">Keine Termine</div>'}
      </div>

      <div class="block">
        <div class="sec-h"><h2>Fabian.Visuals OS</h2></div>
        <div class="list">
          ${[
            ['kanban', 'Projects & Tasks', `${db.projects.length} Projekte`, '#/projects', 'linear-gradient(135deg,#ffb923,#f66515)'],
            ['calendar', 'Meetings & Content', `${db.events.length} Termine`, '#/calendar', 'linear-gradient(135deg,#307af4,#2236cc)'],
            ['users', 'CRM', `${db.clients.length} Kunden`, '#/crm', 'linear-gradient(135deg,#f89abf,#a59af8)'],
            ['film', 'Script Video Dashboard', `${db.scripts.length} Scripts`, '#/scripts', 'linear-gradient(135deg,#a59af8,#2236cc)'],
            ['note', 'Notes', `${db.notes.length} Notizen`, '#/notes', 'linear-gradient(135deg,#fff,#a59af8)'],
          ].map(([i, t, s, href, g]) => `<a class="row" href="${href}"><span class="ico" style="background:${g};border:0;color:${i === 'note' ? '#15122e' : '#fff'}">${ic(i)}</span><span class="body"><b>${t}</b><small>${s}</small></span><span class="end">${ic('chev')}</span></a>`).join('')}
        </div>
      </div>`;
  }

  /* ---------- PROJECTS ---------- */
  function vProjects() {
    const cols = Object.entries(STATUS).map(([k, s]) => {
      const items = db.projects.filter((p) => p.status === k);
      return `<section class="col" style="--c:${s.c}">
        <div class="col-h"><span class="tag">${s.label}</span><span class="n">${items.length}</span>
          <button data-act="new-project" data-status="${k}" aria-label="Projekt hinzufügen">${ic('plus')}</button></div>
        ${items.map((p) => {
          const pg = progress(p);
          return `<a class="kcard" href="#/project/${p.id}">
            <h4>${ic('target')}<span>${esc(p.title || 'Ohne Titel')}</span></h4>
            ${p.start || p.end ? `<div class="ln">${ic('calendar')}${p.start ? fmtDate(p.start) + ' → ' : ''}${fmtDate(p.end)}</div>` : ''}
            ${p.clientId ? `<div class="ln">${ic('user')}${esc(clientName(p.clientId))}</div>` : ''}
            ${p.tasks.length ? `<div class="pg">${pg} %<div class="bar ${pg === 100 ? 'done' : ''}"><i style="width:${pg}%"></i></div></div>` : ''}
            <span class="prio" style="--c:${PRIO[p.priority]?.c}">${PRIO[p.priority]?.label || ''}</span>
          </a>`;
        }).join('') || '<div class="empty" style="border-color:rgba(255,255,255,.08)">Leer</div>'}
      </section>`;
    }).join('');
    return pageHead('Projects & Tasks', 'Fabian.Visuals OS', `<button class="circ solid" data-act="new-project" data-status="planning" aria-label="Neues Projekt">${ic('plus')}</button>`) +
      `<div class="board">${cols}</div>`;
  }

  function vProject(id) {
    const p = get('projects', id);
    if (!p) return null;
    const pg = progress(p);
    const scripts = db.scripts.filter((s) => s.projectId === id);
    const events = db.events.filter((e) => e.projectId === id).sort(byDateTime);
    return topbar('Projekt', clientName(p.clientId) || 'Projects & Tasks', `<button class="circ" data-act="del" data-col="projects" data-id="${id}" aria-label="Löschen">${ic('trash')}</button>`, 'projects') + `
      <section class="dhero ${p.status}">
        <textarea class="t" rows="1" placeholder="Projekttitel" ${bind('projects', id, 'title')}>${esc(p.title)}</textarea>
        <div class="row2">
          <div><div class="lbl">Fortschritt</div><div class="big">${pg}<small> %</small></div></div>
          <div style="text-align:right"><span class="lbl">${p.tasks.filter((t) => t.done).length}/${p.tasks.length} Tasks</span><br><span class="lbl">${p.end ? 'Deadline ' + fmtShort(p.end) : ''}</span></div>
        </div>
      </section>

      <div class="seg-l">Status</div>${seg('projects', id, 'status', STATUS, p.status)}
      <div class="seg-l">Priorität</div>${seg('projects', id, 'priority', PRIO, p.priority)}

      <div class="field">
        <div class="fl"><label>Kunde</label><select data-rerender ${bind('projects', id, 'clientId')}>${options([...db.clients].sort((a, b) => a.name.localeCompare(b.name)), p.clientId, 'name')}</select></div>
        <div class="fl"><label>Start</label><input type="date" data-rerender value="${esc(p.start)}" ${bind('projects', id, 'start')}></div>
        <div class="fl"><label>Deadline</label><input type="date" data-rerender value="${esc(p.end)}" ${bind('projects', id, 'end')}></div>
      </div>

      <div class="sec-h" style="margin-top:22px"><h2>Tasks</h2></div>
      <div class="field">
        ${p.tasks.map((t) => `<div class="task ${t.done ? 'done' : ''}">
            <button class="chk" data-act="task-toggle" data-pid="${id}" data-tid="${t.id}" aria-label="Erledigt">${ic('check')}</button>
            <input value="${esc(t.text)}" data-task="${id}|${t.id}" placeholder="Aufgabe">
            <button class="x" data-act="task-del" data-pid="${id}" data-tid="${t.id}" aria-label="Entfernen">${ic('x')}</button></div>`).join('')}
        <div class="task new"><span class="chk"></span><input data-task-new="${id}" placeholder="Neue Aufgabe… (Enter)" enterkeyhint="done"></div>
      </div>

      <div class="sec-h" style="margin-top:22px"><h2>Scripts</h2><button data-act="new-script" data-pid="${id}">+ Script</button></div>
      ${scripts.length ? `<div class="list" style="margin-bottom:12px">${scripts.map(scriptRow).join('')}</div>` : '<div class="hint">Noch kein Script verknüpft.</div>'}

      <div class="sec-h" style="margin-top:22px"><h2>Termine</h2><button data-act="new-event" data-pid="${id}">+ Termin</button></div>
      ${events.length ? events.map((e) => eventRow(e, true)).join('') : '<div class="hint">Noch keine Termine.</div>'}

      <div class="sec-h" style="margin-top:22px"><h2>Notizen</h2></div>
      <textarea class="notes" placeholder="Briefing, Ideen, Links…" ${bind('projects', id, 'notes')}>${esc(p.notes)}</textarea>`;
  }

  /* ---------- CALENDAR ---------- */
  function vCalendar(a) {
    const sel = /^\d{4}-\d{2}-\d{2}$/.test(a) ? a : todayIso();
    const ws = weekStart(parse(sel));
    const td = todayIso();
    const days = [...Array(7)].map((_, i) => iso(addDays(ws, i)));
    const dayEv = db.events.filter((e) => e.date === sel).sort(byDateTime);
    const timed = dayEv.filter((e) => e.start);
    const allday = dayEv.filter((e) => !e.start);
    const deadlines = db.projects.filter((p) => p.end === sel);
    const H0 = 6, H1 = 24, PX = 60;
    const startH = Math.min(H0, ...timed.map((e) => Math.floor(toMin(e.start) / 60)));
    const monthLabel = parse(sel).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });

    let nowLine = '';
    if (sel === td) {
      const n = new Date(); const m = n.getHours() * 60 + n.getMinutes();
      if (m >= startH * 60) nowLine = `<div class="nowline" style="top:${((m - startH * 60) / 60) * PX}px"><span>${pad(n.getHours())}:${pad(n.getMinutes())}</span></div>`;
    }
    // simple overlap layout: assign columns
    const laid = [];
    timed.forEach((e) => {
      const s = toMin(e.start), en = Math.max(toMin(e.end) ?? s + 60, s + 30);
      const overlaps = laid.filter((l) => l.s < en && s < l.en);
      const used = new Set(overlaps.map((l) => l.col));
      let col = 0; while (used.has(col)) col++;
      laid.push({ e, s, en, col });
    });
    laid.forEach((l) => { l.cols = Math.max(...laid.filter((o) => o.s < l.en && l.s < o.en).map((o) => o.col)) + 1; });

    return pageHead('Kalender', monthLabel, `<button class="circ solid" data-act="new-event" data-date="${sel}" aria-label="Neuer Termin">${ic('plus')}</button>`) + `
      <div class="weekbar">
        <button class="nav" data-go="calendar/${iso(addDays(ws, -7))}" aria-label="Vorige Woche">${ic('left')}</button>
        <div class="wk">${days.map((d, i) => `<button class="wd ${d === sel ? 'on' : ''} ${d === td ? 'today' : ''}" data-go="calendar/${d}">
          <small>${DOW[i]}</small><b>${parse(d).getDate()}</b>${db.events.some((e) => e.date === d) && d !== sel ? '<i></i>' : ''}</button>`).join('')}</div>
        <button class="nav" data-go="calendar/${iso(addDays(ws, 7))}" aria-label="Nächste Woche">${ic('right')}</button>
      </div>
      ${sel !== td ? `<div class="chipline"><button class="tag plain" style="--c:var(--blue)" data-go="calendar/${td}">Heute</button></div>` : ''}
      ${deadlines.length || allday.length ? `<div class="allday">
        ${deadlines.map((p) => `<a class="tag" style="--c:var(--red)" href="#/project/${p.id}">Deadline: ${esc(p.title)}</a>`).join('')}
        ${allday.map((e) => `<button class="tag" style="--c:${ETYPE[e.type]?.c}" data-act="edit-event" data-id="${e.id}">${esc(e.title)}</button>`).join('')}
      </div>` : ''}
      <div class="timeline">
        ${[...Array(H1 - startH)].map((_, i) => `<div class="hr" data-act="new-event" data-date="${sel}" data-hour="${startH + i}"><span>${pad(startH + i)}:00</span></div>`).join('')}
        ${laid.map(({ e, s, en, col, cols }) => {
          const t = ETYPE[e.type] || ETYPE.meeting;
          const top = ((s - startH * 60) / 60) * PX, h = Math.max(((en - s) / 60) * PX - 4, 30);
          const w = 100 / cols;
          return `<button class="tev" data-act="edit-event" data-id="${e.id}" style="--c:${t.c};top:${top}px;height:${h}px;left:calc(${col * w}% + 6px);right:auto;width:calc(${w}% - 8px)">
            <b>${esc(e.title || 'Ohne Titel')}</b>${h > 40 ? `<small>${e.start}${e.end ? ' – ' + e.end : ''} · ${t.label}</small>` : ''}</button>`;
        }).join('')}
        ${nowLine}
      </div>`;
  }

  /* ---------- CRM ---------- */
  let crmQuery = '';
  function vCrm() {
    const q = crmQuery.toLowerCase();
    const list = [...db.clients].filter((c) => !q || [c.name, c.type, c.email].join(' ').toLowerCase().includes(q)).sort((a, b) => a.name.localeCompare(b.name));
    return pageHead('Clients', `CRM · ${db.clients.length} Kontakte`, `<button class="circ solid" data-act="new-client" aria-label="Neuer Kunde">${ic('plus')}</button>`) + `
      <div class="searchbox">${ic('search')}<input id="crmq" placeholder="Kunden suchen" value="${esc(crmQuery)}" autocomplete="off"></div>
      <div class="list" id="crmlist">${list.map(clientRow).join('') || '<div class="empty" style="border:0">Keine Treffer</div>'}</div>`;
  }
  function clientRow(c) {
    const n = db.projects.filter((p) => p.clientId === c.id).length;
    return `<a class="row" href="#/client/${c.id}"><span class="ico">${esc(c.icon || '👤')}</span>
      <span class="body"><b>${esc(c.name || 'Ohne Namen')}</b><small>${esc([c.type, c.email].filter(Boolean).join(' · ') || '—')}</small></span>
      <span class="end">${n ? n + ' ' + ic('kanban') : ''}${ic('chev')}</span></a>`;
  }
  function vClient(id) {
    const c = get('clients', id);
    if (!c) return null;
    const projects = db.projects.filter((p) => p.clientId === id);
    const tel = (c.phone || '').replace(/[^\d+]/g, '');
    const ig = (c.instagram || '').replace(/^@/, '');
    const web = c.website && !/^https?:\/\//.test(c.website) ? 'https://' + c.website : c.website;
    return topbar('Kunde', 'CRM', `<button class="circ" data-act="del" data-col="clients" data-id="${id}" aria-label="Löschen">${ic('trash')}</button>`, 'crm') + `
      <section class="dhero electric">
        <button class="emoji-big" data-act="emoji" data-id="${id}" aria-label="Icon ändern">${esc(c.icon || '👤')}</button>
        <textarea class="t" rows="1" placeholder="Name / Firma" ${bind('clients', id, 'name')}>${esc(c.name)}</textarea>
        <input style="width:100%;font-size:15px;opacity:.85;margin-top:6px" placeholder="Branche / Typ" value="${esc(c.type)}" ${bind('clients', id, 'type')}>
      </section>
      <div class="emojis field" id="emojis" hidden>${EMOJIS.map((e) => `<button data-act="set-emoji" data-id="${id}" data-val="${e}">${e}</button>`).join('')}</div>
      ${c.email || tel ? `<div class="btns2">
        ${c.email ? `<a class="btn white" href="mailto:${esc(c.email)}">${ic('mail')} Mail</a>` : ''}
        ${tel ? `<a class="btn" href="tel:${esc(tel)}">${ic('phone')} Anrufen</a>` : ''}
      </div>` : ''}
      <div class="field">
        <div class="fl"><label>E-Mail</label><input type="email" inputmode="email" placeholder="name@firma.de" value="${esc(c.email)}" ${bind('clients', id, 'email')}></div>
        <div class="fl"><label>Telefon</label><input type="tel" placeholder="+49…" value="${esc(c.phone)}" ${bind('clients', id, 'phone')}></div>
        <div class="fl"><label>Instagram</label><input placeholder="@handle" value="${esc(c.instagram)}" ${bind('clients', id, 'instagram')}>${ig ? `<a class="act" href="https://instagram.com/${esc(ig)}" target="_blank" rel="noopener">${ic('arrow')}</a>` : ''}</div>
        <div class="fl"><label>Website</label><input inputmode="url" placeholder="firma.de" value="${esc(c.website)}" ${bind('clients', id, 'website')}>${web ? `<a class="act" href="${esc(web)}" target="_blank" rel="noopener">${ic('arrow')}</a>` : ''}</div>
      </div>
      <div class="sec-h" style="margin-top:22px"><h2>Projekte</h2><button data-act="new-project" data-status="planning" data-client="${id}">+ Projekt</button></div>
      ${projects.length ? `<div class="hscroll" style="margin-bottom:12px">${projects.map(projectCard).join('')}</div>` : '<div class="hint">Noch keine Projekte mit diesem Kunden.</div>'}
      <div class="sec-h" style="margin-top:22px"><h2>Notizen</h2></div>
      <textarea class="notes" placeholder="Ansprechpartner, Preise, Besonderheiten…" ${bind('clients', id, 'notes')}>${esc(c.notes)}</textarea>`;
  }

  /* ---------- SCRIPTS ---------- */
  function scriptRow(s) {
    const st = SSTATUS[s.status] || SSTATUS.idea;
    return `<a class="row" href="#/script/${s.id}"><span class="ico">${ic('film')}</span>
      <span class="body"><b>${esc(s.title || 'Ohne Titel')}</b><small>${esc(projectTitle(s.projectId) || 'Kein Projekt')}</small></span>
      <span class="end"><span class="prio" style="--c:${st.c}">${st.label}</span></span></a>`;
  }
  function vScripts() {
    return pageHead('Script Video Dashboard', 'Audio & Visuals nebeneinander', `<button class="circ solid" data-act="new-script" aria-label="Neues Script">${ic('plus')}</button>`) +
      (db.scripts.length ? `<div class="list">${db.scripts.map(scriptRow).join('')}</div>` : '<div class="empty">Noch keine Scripts</div>');
  }
  function vScript(id) {
    const s = get('scripts', id);
    if (!s) return null;
    return topbar('Script', projectTitle(s.projectId) || 'Script Video Dashboard', `<button class="circ" data-act="del" data-col="scripts" data-id="${id}" aria-label="Löschen">${ic('trash')}</button>`, 'scripts') + `
      <section class="dhero electric">
        <textarea class="t" rows="1" placeholder="Script-Titel" ${bind('scripts', id, 'title')}>${esc(s.title)}</textarea>
        <div class="row2"><div><div class="lbl">Szenen</div><div class="big">${s.rows.length}</div></div>
          <div class="lbl" style="text-align:right">~${Math.max(1, Math.round(s.rows.reduce((n, r) => n + (r.audio.split(/\s+/).filter(Boolean).length), 0) / 2.5))} Sek. VO</div></div>
      </section>
      ${seg('scripts', id, 'status', SSTATUS, s.status)}
      <div class="field"><div class="fl"><label>Projekt</label><select data-rerender ${bind('scripts', id, 'projectId')}>${options(db.projects, s.projectId, 'title')}</select></div></div>
      <div class="sh" style="margin-top:20px"><span>🎙 Audio / Voiceover</span><span>🎬 Visuals / B-Roll</span></div>
      ${s.rows.map((r, i) => `<div class="srow">
        <span class="num">${pad(i + 1)}</span>
        <textarea rows="2" placeholder="Was hört man?" data-row="${id}|${r.id}|audio">${esc(r.audio)}</textarea>
        <textarea class="v" rows="2" placeholder="Was sieht man?" data-row="${id}|${r.id}|visual">${esc(r.visual)}</textarea>
        <button class="x" data-act="row-del" data-sid="${id}" data-rid="${r.id}" aria-label="Szene löschen">${ic('x')}</button>
      </div>`).join('')}
      <button class="btn" data-act="row-add" data-sid="${id}" style="margin-top:4px">${ic('plus')} Szene hinzufügen</button>`;
  }

  /* ---------- NOTES ---------- */
  function vNotes() {
    const list = [...db.notes].sort((a, b) => b.updated - a.updated);
    return pageHead('Notes', `${list.length} Notizen`, `<button class="circ solid" data-act="new-note" aria-label="Neue Notiz">${ic('plus')}</button>`) +
      (list.length ? `<div class="ngrid">${list.map((n) => `<a class="ncard" href="#/note/${n.id}"><b>${esc(n.title || 'Ohne Titel')}</b><p>${esc(n.body)}</p>
        <small>${new Date(n.updated).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}</small></a>`).join('')}</div>` : '<div class="empty">Noch keine Notizen</div>');
  }
  function vNote(id) {
    const n = get('notes', id);
    if (!n) return null;
    return topbar('Notiz', 'Notes', `<button class="circ" data-act="del" data-col="notes" data-id="${id}" aria-label="Löschen">${ic('trash')}</button>`, 'notes') + `
      <textarea class="t" rows="1" style="width:100%;font-size:30px;font-weight:700;resize:none;margin:8px 4px 12px;line-height:1.15" placeholder="Titel" ${bind('notes', id, 'title')}>${esc(n.title)}</textarea>
      <textarea class="notes" style="background:none;border:0;padding:4px;min-height:60vh;font-size:16px" placeholder="Schreib los…" ${bind('notes', id, 'body')}>${esc(n.body)}</textarea>`;
  }

  /* ---------- MORE ---------- */
  function vMore() {
    const kb = Math.round((JSON.stringify(db).length / 1024) * 10) / 10;
    return pageHead('Mehr', 'Tools & Einstellungen') + `
      <div class="tiles">
        <a class="tile electric" href="#/scripts">${ic('film')}<div><b>Scripts</b><br><small>${db.scripts.length} Videos</small></div></a>
        <a class="tile dream" href="#/notes">${ic('note')}<div><b>Notes</b><br><small>${db.notes.length} Notizen</small></div></a>
        <a class="tile warm" href="#/calendar">${ic('calendar')}<div><b>Content Planner</b><br><small>Termine vom Typ „Content“</small></div></a>
        <a class="tile glass" href="https://www.notion.so" target="_blank" rel="noopener">${ic('receipt')}<div><b>Rechnungen</b><br><small>bleiben in Notion ↗</small></div></a>
      </div>
      <div class="sec-h"><h2>Profil</h2></div>
      <div class="field"><div class="fl"><label>Name</label><input value="${esc(db.settings.name)}" data-setting="name"></div></div>

      <div class="sec-h" style="margin-top:22px"><h2>Daten</h2></div>
      <p class="hint">Alles liegt nur auf diesem Gerät (${kb} KB). Mach regelmäßig ein Backup – z. B. in iCloud Drive.</p>
      <div class="btns2">
        <button class="btn white" data-act="export">${ic('down')} Backup</button>
        <button class="btn" data-act="import">${ic('up')} Import</button>
      </div>
      <button class="btn danger" data-act="reset">${ic('refresh')} Auf Startdaten zurücksetzen</button>
      <input type="file" id="importfile" accept="application/json,.json" hidden>
      <p class="hint" style="margin-top:20px">Fabian.Visuals OS · v1</p>`;
  }

  /* ---------- sheets ---------- */
  function openSheet(html) {
    closeSheet();
    const root = $('#sheet-root');
    root.innerHTML = `<div class="backdrop" data-act="close-sheet"></div><div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div>`;
    root.querySelectorAll('textarea').forEach(grow);
    return root.querySelector('.sheet');
  }
  function closeSheet() { $('#sheet-root').innerHTML = ''; }

  function sheetNew() {
    const items = [
      ['new-project', 'kanban', 'Projekt', ETYPE.shoot.g],
      ['new-event', 'calendar', 'Termin', ETYPE.meeting.g],
      ['new-client', 'users', 'Kunde', ETYPE.content.g],
      ['new-script', 'film', 'Script', 'linear-gradient(135deg,#a59af8,#2236cc)'],
      ['new-note', 'note', 'Notiz', 'linear-gradient(135deg,#fff,#a59af8)'],
      ['new-content', 'spark', 'Content', 'linear-gradient(135deg,#f89abf,#fd290d)'],
    ];
    openSheet(`<h3>Neu anlegen</h3><div class="newgrid">${items.map(([a, i, l, g]) =>
      `<button data-act="${a}" data-status="planning"><span class="ico" style="background:${g};${i === 'note' ? 'color:#15122e' : ''}">${ic(i)}</span>${l}</button>`).join('')}</div>`);
  }

  function sheetEvent(ev, isNew) {
    const e = ev;
    const sheet = openSheet(`
      <h3>${isNew ? 'Neuer Termin' : 'Termin'}</h3>
      <input class="bigin" id="ev-title" placeholder="Titel" value="${esc(e.title)}">
      <div class="seg" id="ev-type">${Object.entries(ETYPE).map(([k, t]) => `<button data-type="${k}" class="${k === e.type ? 'on' : ''}">${t.label}</button>`).join('')}</div>
      <div class="field">
        <div class="fl"><label>Datum</label><input type="date" id="ev-date" value="${esc(e.date)}"></div>
        <div class="fl"><label>Von</label><input type="time" id="ev-start" value="${esc(e.start)}"></div>
        <div class="fl"><label>Bis</label><input type="time" id="ev-end" value="${esc(e.end)}"></div>
        <div class="fl"><label>Projekt</label><select id="ev-project">${options(db.projects, e.projectId, 'title')}</select></div>
      </div>
      <textarea class="notes" id="ev-notes" style="min-height:80px;margin-bottom:14px" placeholder="Notizen, Location, Equipment…">${esc(e.notes)}</textarea>
      <button class="btn white" data-act="ev-save">${ic('check')} Speichern</button>
      ${isNew ? '' : '<button class="btn danger" data-act="ev-del">Löschen</button>'}`);
    sheet.dataset.eid = e.id;
    sheet.dataset.isnew = isNew ? '1' : '';
    sheet._ev = e;
    if (isNew) setTimeout(() => $('#ev-title')?.focus(), 350);
  }

  function sheetSearch() {
    openSheet(`<div class="searchbox">${ic('search')}<input id="gq" placeholder="Alles durchsuchen" autocomplete="off" enterkeyhint="search"></div><div id="gres"><p class="hint">Projekte, Tasks, Kunden, Scripts, Termine & Notizen.</p></div>`);
    setTimeout(() => $('#gq')?.focus(), 300);
  }
  function runSearch(q) {
    q = q.trim().toLowerCase();
    const out = $('#gres');
    if (!out) return;
    if (!q) { out.innerHTML = '<p class="hint">Projekte, Tasks, Kunden, Scripts, Termine & Notizen.</p>'; return; }
    const has = (...v) => v.join(' ').toLowerCase().includes(q);
    const groups = [
      ['Projekte', db.projects.filter((p) => has(p.title, p.notes, ...p.tasks.map((t) => t.text))).map((p) => [`#/project/${p.id}`, 'kanban', p.title, STATUS[p.status].label])],
      ['Kunden', db.clients.filter((c) => has(c.name, c.type, c.email, c.notes)).map((c) => [`#/client/${c.id}`, null, c.name, c.type, c.icon])],
      ['Scripts', db.scripts.filter((s) => has(s.title, ...s.rows.map((r) => r.audio + ' ' + r.visual))).map((s) => [`#/script/${s.id}`, 'film', s.title, projectTitle(s.projectId)])],
      ['Termine', db.events.filter((e) => has(e.title, e.notes)).map((e) => [`#/calendar/${e.date}`, 'calendar', e.title, fmtDate(e.date) + (e.start ? ' · ' + e.start : '')])],
      ['Notizen', db.notes.filter((n) => has(n.title, n.body)).map((n) => [`#/note/${n.id}`, 'note', n.title, n.body.slice(0, 60)])],
    ].filter(([, l]) => l.length);
    out.innerHTML = groups.length ? groups.map(([g, l]) => `<div class="grp">${g}</div><div class="list">${l.slice(0, 8).map(([href, i, t, s, emo]) =>
      `<a class="row" href="${href}" data-act="close-sheet-nav"><span class="ico">${emo ? esc(emo) : ic(i)}</span><span class="body"><b>${esc(t || 'Ohne Titel')}</b><small>${esc(s || '')}</small></span></a>`).join('')}</div>`).join('')
      : '<div class="empty">Nichts gefunden</div>';
  }

  /* ---------- create ---------- */
  function createProject(status = 'planning', clientId = '') {
    const p = { id: uid(), title: '', status, priority: 'medium', start: '', end: '', clientId, tasks: [], notes: '' };
    db.projects.unshift(p); save(true); closeSheet(); go('project/' + p.id);
    setTimeout(() => $('.dhero .t')?.focus(), 350);
  }
  function createScript(projectId = '') {
    const s = { id: uid(), title: '', projectId, status: 'idea', rows: [{ id: uid(), audio: '', visual: '' }] };
    db.scripts.unshift(s); save(true); closeSheet(); go('script/' + s.id);
    setTimeout(() => $('.dhero .t')?.focus(), 350);
  }
  function createClient() {
    const c = { id: uid(), icon: '👤', name: '', type: '', email: '', phone: '', instagram: '', website: '', notes: '' };
    db.clients.push(c); save(true); closeSheet(); go('client/' + c.id);
    setTimeout(() => $('.dhero .t')?.focus(), 350);
  }
  function createNote() {
    const n = { id: uid(), title: '', body: '', updated: Date.now() };
    db.notes.unshift(n); save(true); closeSheet(); go('note/' + n.id);
    setTimeout(() => $('#view textarea')?.focus(), 350);
  }
  function newEvent({ date, hour, projectId = '', type = 'meeting' } = {}) {
    const h = hour != null ? Number(hour) : Math.min(new Date().getHours() + 1, 22);
    sheetEvent({ id: uid(), title: '', type, date: date || route().p === 'calendar' && route().a || todayIso(), start: `${pad(h)}:00`, end: `${pad(Math.min(h + 1, 23))}:00`, projectId, notes: '' }, true);
  }

  /* ---------- events ---------- */
  document.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-act],[data-go]');
    if (!el) return;
    if (el.dataset.go) { go(el.dataset.go); return; }
    const d = el.dataset;
    switch (d.act) {
      case 'back': if (history.length > 1 && lastNav) history.back(); else go(d.to || 'home'); break;
      case 'new': sheetNew(); break;
      case 'search': sheetSearch(); break;
      case 'close-sheet': closeSheet(); break;
      case 'close-sheet-nav': closeSheet(); break;
      case 'new-project': createProject(d.status || 'planning', d.client || ''); break;
      case 'new-script': createScript(d.pid || ''); break;
      case 'new-client': createClient(); break;
      case 'new-note': createNote(); break;
      case 'new-content': newEvent({ type: 'content' }); break;
      case 'new-event': if (ev.target.closest('.tev')) break; newEvent({ date: d.date, hour: d.hour, projectId: d.pid }); break;
      case 'edit-event': { const e = get('events', d.id); if (e) sheetEvent({ ...e }, false); break; }
      case 'set': {
        const [col, id, f] = d.bind.split('|'); const it = get(col, id);
        if (it) { it[f] = d.val; save(true); render(); }
        break;
      }
      case 'task-toggle': {
        const t = get('projects', d.pid)?.tasks.find((x) => x.id === d.tid);
        if (t) { t.done = !t.done; save(true); render(); }
        break;
      }
      case 'task-del': {
        const p = get('projects', d.pid);
        if (p) { p.tasks = p.tasks.filter((x) => x.id !== d.tid); save(true); render(); }
        break;
      }
      case 'row-add': {
        const s = get('scripts', d.sid);
        if (s) { s.rows.push({ id: uid(), audio: '', visual: '' }); save(true); render(); const t = document.querySelectorAll('.srow textarea'); t[t.length - 2]?.focus(); }
        break;
      }
      case 'row-del': {
        const s = get('scripts', d.sid);
        if (s) { s.rows = s.rows.filter((r) => r.id !== d.rid); save(true); render(); }
        break;
      }
      case 'emoji': { const e = $('#emojis'); if (e) e.hidden = !e.hidden; break; }
      case 'set-emoji': { const c = get('clients', d.id); if (c) { c.icon = d.val; save(true); render(); } break; }
      case 'del': {
        const it = get(d.col, d.id);
        const label = it?.title || it?.name || 'Eintrag';
        if (!confirm(`„${label}“ wirklich löschen?`)) break;
        db[d.col] = db[d.col].filter((x) => x.id !== d.id);
        if (d.col === 'projects') { db.scripts.forEach((s) => { if (s.projectId === d.id) s.projectId = ''; }); db.events.forEach((e) => { if (e.projectId === d.id) e.projectId = ''; }); }
        if (d.col === 'clients') db.projects.forEach((p) => { if (p.clientId === d.id) p.clientId = ''; });
        save(true); toast('Gelöscht');
        go({ projects: 'projects', clients: 'crm', scripts: 'scripts', notes: 'notes' }[d.col]);
        break;
      }
      case 'ev-save': {
        const sh = el.closest('.sheet'); const e = sh._ev;
        e.title = $('#ev-title').value.trim() || 'Ohne Titel';
        e.type = $('#ev-type .on')?.dataset.type || 'meeting';
        e.date = $('#ev-date').value || todayIso();
        e.start = $('#ev-start').value; e.end = $('#ev-end').value;
        e.projectId = $('#ev-project').value; e.notes = $('#ev-notes').value;
        const i = db.events.findIndex((x) => x.id === e.id);
        if (i >= 0) db.events[i] = e; else db.events.push(e);
        save(true); closeSheet(); render(); toast('Gespeichert');
        break;
      }
      case 'ev-del': {
        const id = el.closest('.sheet').dataset.eid;
        db.events = db.events.filter((x) => x.id !== id); save(true); closeSheet(); render(); toast('Gelöscht');
        break;
      }
      case 'export': {
        const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = `fv-os-backup-${todayIso()}.json`;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        break;
      }
      case 'import': $('#importfile')?.click(); break;
      case 'reset':
        if (confirm('Alle Daten auf diesem Gerät löschen und Startdaten laden?')) { db = migrate(window.FV_SEED()); save(true); render(); toast('Zurückgesetzt'); }
        break;
    }
  });
  // event type segmented control inside sheet
  document.addEventListener('click', (ev) => {
    const b = ev.target.closest('#ev-type button');
    if (!b) return;
    b.parentElement.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
  });

  let lastNav = false;
  addEventListener('hashchange', () => { lastNav = true; });

  document.addEventListener('input', (ev) => {
    const t = ev.target;
    if (t.tagName === 'TEXTAREA') grow(t);
    if (t.dataset.bind && !t.dataset.rerender) {
      const [col, id, f] = t.dataset.bind.split('|'); const it = get(col, id);
      if (it) { it[f] = t.value; if (col === 'notes') it.updated = Date.now(); save(); }
    } else if (t.dataset.task) {
      const [pid, tid] = t.dataset.task.split('|');
      const task = get('projects', pid)?.tasks.find((x) => x.id === tid);
      if (task) { task.text = t.value; save(); }
    } else if (t.dataset.row) {
      const [sid, rid, f] = t.dataset.row.split('|');
      const r = get('scripts', sid)?.rows.find((x) => x.id === rid);
      if (r) { r[f] = t.value; save(); }
    } else if (t.dataset.setting) {
      db.settings[t.dataset.setting] = t.value; save();
    } else if (t.id === 'crmq') {
      crmQuery = t.value;
      const q = crmQuery.toLowerCase();
      $('#crmlist').innerHTML = [...db.clients].filter((c) => !q || [c.name, c.type, c.email].join(' ').toLowerCase().includes(q))
        .sort((a, b) => a.name.localeCompare(b.name)).map(clientRow).join('') || '<div class="empty" style="border:0">Keine Treffer</div>';
    } else if (t.id === 'gq') runSearch(t.value);
  });
  document.addEventListener('change', (ev) => {
    const t = ev.target;
    if (t.dataset.bind && t.dataset.rerender) {
      const [col, id, f] = t.dataset.bind.split('|'); const it = get(col, id);
      if (it) { it[f] = t.value; save(true); render(); }
    } else if (t.id === 'importfile' && t.files[0]) {
      t.files[0].text().then((txt) => {
        const d = JSON.parse(txt);
        if (!d || !Array.isArray(d.projects)) throw new Error('format');
        if (!confirm('Backup importieren? Die aktuellen Daten auf diesem Gerät werden ersetzt.')) return;
        db = migrate(d); save(true); render(); toast('Import erfolgreich');
      }).catch(() => toast('Datei ist kein gültiges Backup'));
    }
  });
  document.addEventListener('keydown', (ev) => {
    const t = ev.target;
    if (ev.key === 'Enter' && t.dataset.taskNew) {
      ev.preventDefault();
      const text = t.value.trim(); if (!text) return;
      const p = get('projects', t.dataset.taskNew);
      if (p) { p.tasks.push({ id: uid(), text, done: false }); save(true); render(); $(`[data-task-new="${p.id}"]`)?.focus(); }
    } else if (ev.key === 'Enter' && t.dataset.task) {
      ev.preventDefault(); $(`[data-task-new]`)?.focus();
    } else if (ev.key === 'Escape') closeSheet();
  });
  // titles are single-line textareas: Enter blurs instead of adding a line break
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' && ev.target.matches('.dhero .t')) { ev.preventDefault(); ev.target.blur(); }
  });
  // re-render detail hero numbers after editing title on blur (keeps cards in sync)
  addEventListener('hashchange', closeSheet);

  /* ---------- toast ---------- */
  let toastT;
  function toast(msg) {
    document.querySelector('.toast')?.remove();
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
    document.body.appendChild(t); clearTimeout(toastT); toastT = setTimeout(() => t.remove(), 1800);
  }

  /* ---------- boot ---------- */
  render();
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('/os/sw.js', { scope: '/os/' }).catch(() => {});
  }
})();
