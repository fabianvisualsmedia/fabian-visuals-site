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
    archive: '<rect x="3" y="4" width="18" height="5" rx="1.5"/><path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9M10 13h4"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
    play: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l6-3.5z"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
    file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/>',
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
    shuffle: '<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>',
  };
  const ic = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[n] || ''}</svg>`;

  /* ---------- meta ---------- */
  const STATUS = {
    planning: { label: 'Planung', c: 'var(--st-plan)' },
    progress: { label: 'In Bearbeitung', short: 'Bearbeitung', c: 'var(--st-prog)' },
    done: { label: 'Fertig', c: 'var(--st-done)' },
    archive: { label: 'Archiv', c: 'var(--st-arch)' },
  };
  const BOARD = ['planning', 'progress', 'done'];
  const isActive = (p) => p.status !== 'done' && p.status !== 'archive';
  const PRIO = { high: { label: 'High', c: 'var(--prio-high)' }, medium: { label: 'Medium', c: 'var(--amber)' }, low: { label: 'Low', c: 'var(--blue)' } };
  const ETYPE = {
    shoot: { label: 'Shoot', c: 'var(--orange)', g: 'linear-gradient(135deg,#ffb923,#fd290d)' },
    meeting: { label: 'Meeting', c: 'var(--blue)', g: 'linear-gradient(135deg,#307af4,#2236cc)' },
    call: { label: 'Call', c: 'var(--green)', g: 'linear-gradient(135deg,#7ef0a8,#1f9a57)' },
    content: { label: 'Content', c: 'var(--pink)', g: 'linear-gradient(135deg,#f89abf,#a59af8)' },
    deadline: { label: 'Deadline', c: 'var(--red)', g: 'linear-gradient(135deg,#fd290d,#7a0d02)' },
  };
  const SSTATUS = { idea: { label: 'Idee', c: 'var(--st-plan)' }, draft: { label: 'Draft', c: 'var(--st-prog)' }, final: { label: 'Final', c: 'var(--st-done)' } };
  const EMOJIS = ['📷', '🎬', '🎙️', '🎧', '🎵', '🏢', '💄', '👗', '🛍️', '🚗', '💧', '💸', '⚙️', '🦊', '✋', '🔁', '💃', '⚡️', '🌍', '🏠'];

  /* ---------- storage ---------- */
  function migrate(d) {
    for (const k of ['clients', 'projects', 'scripts', 'events', 'notes', 'docs', 'ideas']) d[k] = Array.isArray(d[k]) ? d[k] : [];
    d.scripts.forEach((x) => { if (x.notes == null) x.notes = ''; });
    d.settings = d.settings || { name: 'Fabian' };
    d.settings.theme = d.settings.theme || 'system';
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
  const SECTION = { home: 'home', projects: 'projects', project: 'projects', calendar: 'calendar', crm: 'crm', client: 'crm', more: 'more', scripts: 'more', script: 'more', notes: 'more', note: 'more', ideas: 'more', docs: 'more', doc: 'more' };

  let lastHash = '';
  function render() {
    const { p, a } = route();
    const view = $('#view');
    const views = { home: vHome, projects: vProjects, project: vProject, calendar: vCalendar, crm: vCrm, client: vClient, scripts: vScripts, script: vScript, notes: vNotes, note: vNote, more: vMore, ideas: vIdeas, docs: vDocs, doc: vDoc };
    const fn = views[p] || vHome;
    const changed = location.hash !== lastHash;
    const y = scrollY;
    const html = fn(a);
    if (html === null) { go(SECTION[p] === 'more' ? p.replace(/(script|note|doc)$/, '$1s') : (SECTION[p] || 'home')); return; }
    view.classList.remove('enter');
    view.innerHTML = html;
    if (changed) {
      void view.offsetWidth;
      view.classList.add('enter');
      [...view.children].forEach((c, i) => c.style.setProperty('--i', Math.min(i, 12)));
      view.querySelectorAll('.hscroll, .board, .list, .ngrid, .tiles, .stats, .col, .alist, .dgrid, .masonry').forEach((g) =>
        [...g.children].forEach((c, j) => { c.classList.add('stg'); c.style.setProperty('--j', Math.min(j, 12)); }));
      countUp(view);
      scrollTo(0, 0);
    } else scrollTo(0, y);
    lastHash = location.hash;
    document.querySelectorAll('#dock [data-tab]').forEach((b) => b.classList.toggle('on', b.dataset.tab === SECTION[p]));
    moveInd();
    view.querySelectorAll('textarea').forEach(grow);
    hydrate(view);
    if (pendingPop) { view.querySelector(pendingPop)?.classList.add(pendingPop.startsWith('.seg') ? 'just' : 'pop'); pendingPop = ''; }
    afterRender.splice(0).forEach((f) => f());
  }
  let pendingPop = '';
  const afterRender = [];
  function moveInd() {
    const on = $('#dock .pill button.on'), ind = $('#dock .pill .ind');
    if (!ind) return;
    ind.style.opacity = on ? 1 : 0;
    if (on) ind.style.transform = `translateX(${on.offsetLeft - 6}px)`;
  }
  addEventListener('resize', moveInd);
  function countUp(root) {
    root.querySelectorAll('[data-count]').forEach((el) => {
      const to = Number(el.dataset.count); if (!to) return;
      const t0 = performance.now(), dur = 900;
      const step = (t) => { const k = Math.min(1, (t - t0) / dur); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
      el.textContent = '0'; setTimeout(() => requestAnimationFrame(step), 250);
    });
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
    `<button class="${k === cur ? 'on' : ''}" data-act="set" ${bind(col, id, f)} data-val="${k}">${esc(o.short || o.label)}</button>`).join('')}</div>`;
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

  function avatarBtn() {
    const img = db.settings.avatar;
    return `<button class="avatar" data-act="avatar-pick" aria-label="Profilbild ändern"><span class="in">${img ? `<img src="${img}" alt="">` : 'FV'}</span>${img ? '' : `<span class="cam">${ic('camera')}</span>`}</button>`;
  }
  function pickAvatar(file) {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      const S = 320, c = document.createElement('canvas'); c.width = c.height = S;
      const k = Math.max(S / im.width, S / im.height), w = im.width * k, h = im.height * k;
      c.getContext('2d').drawImage(im, (S - w) / 2, (S - h) / 2, w, h);
      db.settings.avatar = c.toDataURL('image/jpeg', 0.85);
      URL.revokeObjectURL(url); save(true); render(); toast('Profilbild gespeichert');
    };
    im.onerror = () => toast('Bild konnte nicht geladen werden');
    im.src = url;
  }

  /* ---------- theme ---------- */
  const mq = matchMedia('(prefers-color-scheme: light)');
  function applyTheme() {
    const t = db.settings.theme || 'system';
    if (t === 'system') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;
    const light = t === 'light' || (t === 'system' && mq.matches);
    const m = $('meta[name="theme-color"]'); if (m) m.content = light ? '#f1f1f5' : '#060608';
  }
  mq.addEventListener?.('change', applyTheme);
  applyTheme();

  /* ---------- HOME ---------- */
  function weekChart(ws, selected) {
    const days = [...Array(7)].map((_, i) => iso(addDays(ws, i)));
    const load = days.map((d) => db.events.filter((e) => e.date === d).reduce((s, e) => {
      const a = toMin(e.start), b = toMin(e.end); return s + (a != null && b != null && b > a ? (b - a) / 60 : 1);
    }, 0) + db.projects.filter((p) => p.end === d && isActive(p)).length);
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
        <path class="fill" d="${dPath} L${pts[6][0]},${H - padY} L${pts[0][0]},${H - padY}Z" fill="url(#fg)"/>
        <path class="ln" pathLength="1" stroke-dasharray="1" d="${dPath}" fill="none" stroke="url(#lg)" stroke-width="1.6"/>
        <line class="vl" x1="${sx}" x2="${sx}" y1="${sy}" y2="${H - padY}" stroke="#fff" stroke-width="1.2"/>
        <g class="pt"><circle cx="${sx}" cy="${sy}" r="9" fill="rgba(255,255,255,.22)"/><circle cx="${sx}" cy="${sy}" r="4" fill="#fff"/></g>
      </svg>`, hrs };
  }

  function vHome() {
    const h = new Date().getHours();
    const greet = h < 5 ? 'Gute Nacht' : h < 11 ? 'Guten Morgen' : h < 17 ? 'Hallo' : h < 22 ? 'Guten Abend' : 'Gute Nacht';
    const ws = weekStart(new Date());
    const td = todayIso();
    const { days, load, svg } = weekChart(ws, td);
    const active = db.projects.filter(isActive);
    const openTasks = db.projects.filter((p) => p.status !== 'archive').reduce((s, p) => s + p.tasks.filter((t) => !t.done).length, 0);
    const upcoming = db.events.filter((e) => e.date >= td).sort(byDateTime).slice(0, 4);
    const weekHrs = load.reduce((a, b) => a + b, 0);
    const name = db.settings.name || 'Fabian';
    const sorted = [...active].sort((a, b) => (a.end || '9999').localeCompare(b.end || '9999'));

    return `
      <div class="hello">
        ${avatarBtn()}
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
        <a class="stat warm" href="#/projects"><span class="lbl">Aktive Projekte</span><span class="num"><span data-count="${active.length}">${active.length}</span><span class="chip">${db.projects.filter((p) => p.status === 'progress').length} läuft</span></span></a>
        <a class="stat electric" href="#/projects"><span class="lbl">Offene Tasks</span><span class="num" data-count="${openTasks}">${openTasks}</span></a>
        <a class="stat dream" href="#/crm"><span class="lbl">Kunden</span><span class="num" data-count="${db.clients.length}">${db.clients.length}</span></a>
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
            ['kanban', 'Projects & Tasks', `${active.length} aktiv · ${db.projects.filter((p) => p.status === 'archive').length} im Archiv`, '#/projects', 'linear-gradient(135deg,#ffb923,#f66515)'],
            ['calendar', 'Meetings & Content', `${db.events.length} Termine`, '#/calendar', 'linear-gradient(135deg,#307af4,#2236cc)'],
            ['users', 'CRM', `${db.clients.length} Kunden`, '#/crm', 'linear-gradient(135deg,#f89abf,#a59af8)'],
            ['film', 'Script Video Dashboard', `${db.scripts.length} Scripts`, '#/scripts', 'linear-gradient(135deg,#a59af8,#2236cc)'],
            ['note', 'Notes', `${db.notes.length} Notizen`, '#/notes', 'linear-gradient(135deg,#fff,#a59af8)'],
            ['bulb', 'Brainstorming', `${db.ideas.length} Ideen`, '#/ideas', 'linear-gradient(135deg,#ffb923,#f89abf)'],
            ['folder', 'Docs & Uploads', `${db.docs.length} Dokumente`, '#/docs', 'linear-gradient(135deg,#307af4,#a59af8)'],
          ].map(([i, t, s, href, g]) => `<a class="row" href="${href}"><span class="ico" style="background:${g};border:0;color:${i === 'note' ? '#15122e' : '#fff'}">${ic(i)}</span><span class="body"><b>${t}</b><small>${s}</small></span><span class="end">${ic('chev')}</span></a>`).join('')}
        </div>
      </div>`;
  }

  /* ---------- PROJECTS ---------- */
  let lastProjTab = 'board';
  function vProjects(a) {
    const tab = a === 'archiv' ? 'archiv' : 'board';
    const arch = db.projects.filter((p) => p.status === 'archive');
    const prev = lastProjTab; lastProjTab = tab;
    afterRender.push(() => requestAnimationFrame(() => $('.tabs')?.classList.toggle('r', tab === 'archiv')));
    const tabs = `<div class="tabs ${prev === 'archiv' ? 'r' : ''}"><span class="ind"></span>
      <a href="#/projects" class="${tab === 'board' ? 'on' : ''}">Board</a>
      <a href="#/projects/archiv" class="${tab === 'archiv' ? 'on' : ''}">Archiv · ${arch.length}</a></div>`;
    const head = pageHead('Projects & Tasks', 'Fabian.Visuals OS', `<button class="circ solid" data-act="new-project" data-status="planning" aria-label="Neues Projekt">${ic('plus')}</button>`) + tabs;
    if (tab === 'archiv') {
      return head + (arch.length ? `<div class="alist">${arch.map((p) => `<div class="arow">
          <a href="#/project/${p.id}"><b>${esc(p.title || 'Ohne Titel')}</b><small>${esc([clientName(p.clientId), p.end ? fmtDate(p.end) : ''].filter(Boolean).join(' · ') || 'Archiviert')}</small></a>
          <button data-act="unarchive" data-id="${p.id}">${ic('undo')} Zurückholen</button></div>`).join('')}</div>`
        : '<div class="empty">Noch nichts im Archiv. Fertige Projekte kannst du mit dem Archiv-Button in der Spalte „Fertig“ ablegen.</div>');
    }
    const cols = BOARD.map((k) => {
      const s = STATUS[k];
      const items = db.projects.filter((p) => p.status === k);
      return `<section class="col" style="--c:${s.c}">
        <div class="col-h"><span class="tag">${s.label}</span><span class="n">${items.length}</span>
          <button data-act="new-project" data-status="${k}" aria-label="Projekt hinzufügen">${ic('plus')}</button></div>
        ${items.map((p) => {
          const pg = progress(p);
          return `<div class="kcard ${k === 'done' ? 'has-qa' : ''}" data-go="project/${p.id}" role="link" tabindex="0">
            ${k === 'done' ? `<button class="qa" data-act="archive" data-id="${p.id}" aria-label="Archivieren">${ic('archive')}</button>` : ''}
            <h4>${ic('target')}<span>${esc(p.title || 'Ohne Titel')}</span></h4>
            ${p.start || p.end ? `<div class="ln">${ic('calendar')}${p.start ? fmtDate(p.start) + ' → ' : ''}${fmtDate(p.end)}</div>` : ''}
            ${p.clientId ? `<div class="ln">${ic('user')}${esc(clientName(p.clientId))}</div>` : ''}
            ${p.tasks.length ? `<div class="pg">${pg} %<div class="bar ${pg === 100 ? 'done' : ''}"><i style="width:${pg}%"></i></div></div>` : ''}
            <span class="prio" style="--c:${PRIO[p.priority]?.c}">${PRIO[p.priority]?.label || ''}</span>
          </div>`;
        }).join('') || '<div class="empty" style="border-color:var(--line)">Leer</div>'}
      </section>`;
    }).join('');
    return head + `<div class="board">${cols}</div>`;
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
        ${p.tasks.map((t) => `<div class="task ${t.done ? 'done' : ''}" data-tid="${t.id}">
            <button class="chk" data-act="task-toggle" data-pid="${id}" data-tid="${t.id}" aria-label="Erledigt">${ic('check')}</button>
            <input value="${esc(t.text)}" data-task="${id}|${t.id}" placeholder="Aufgabe">
            <button class="x" data-act="task-del" data-pid="${id}" data-tid="${t.id}" aria-label="Entfernen">${ic('x')}</button></div>`).join('')}
        <div class="task new"><span class="chk"></span><input data-task-new="${id}" placeholder="Neue Aufgabe… (Enter)" enterkeyhint="done"></div>
      </div>

      <div class="sec-h" style="margin-top:22px"><h2>Scripts</h2><button data-act="new-script" data-pid="${id}">+ Script</button></div>
      ${scripts.length ? `<div class="list" style="margin-bottom:12px">${scripts.map(scriptRow).join('')}</div>` : '<div class="hint">Noch kein Script verknüpft.</div>'}

      <div class="sec-h" style="margin-top:22px"><h2>Termine</h2><button data-act="new-event" data-pid="${id}">+ Termin</button></div>
      ${events.length ? events.map((e) => eventRow(e, true)).join('') : '<div class="hint">Noch keine Termine.</div>'}

      ${docSection('projectId', id)}
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
          return `<button class="tev" data-act="edit-event" data-id="${e.id}" style="--j:${col + Math.round(s / 60)};--c:${t.c};top:${top}px;height:${h}px;left:calc(${col * w}% + 6px);right:auto;width:calc(${w}% - 8px)">
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
      ${docSection('clientId', id)}
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
      <div class="sec-h" style="margin-top:20px"><h2>Konzept & Notizen</h2></div>
      <textarea class="notes" style="min-height:90px" placeholder="Idee, Zielgruppe, Hook, Look & Feel…" ${bind('scripts', id, 'notes')}>${esc(s.notes || '')}</textarea>
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
        <a class="tile warm" href="#/ideas">${ic('bulb')}<div><b>Brainstorming</b><br><small>${db.ideas.length} Ideen</small></div></a>
        <a class="tile electric" href="#/docs">${ic('folder')}<div><b>Docs & Uploads</b><br><small>${db.docs.length} Dokumente</small></div></a>
        <a class="tile dream" href="#/calendar">${ic('calendar')}<div><b>Content Planner</b><br><small>Termine vom Typ „Content“</small></div></a>
        <a class="tile glass" href="https://www.notion.so" target="_blank" rel="noopener">${ic('receipt')}<div><b>Rechnungen</b><br><small>bleiben in Notion ↗</small></div></a>
      </div>
      <div class="sec-h"><h2>Profil</h2></div>
      <div class="field">
        <div class="profile">${avatarBtn()}
          <div class="acts"><button class="pri" data-act="avatar-pick">Foto wählen</button>${db.settings.avatar ? '<button data-act="avatar-del">Entfernen</button>' : ''}</div></div>
        <div class="fl"><label>Name</label><input value="${esc(db.settings.name)}" data-setting="name"></div>
      </div>

      <div class="sec-h" style="margin-top:22px"><h2>Darstellung</h2></div>
      <div class="seg">${[['system', 'System'], ['light', 'Hell'], ['dark', 'Dunkel']].map(([k, l]) =>
        `<button class="${db.settings.theme === k ? 'on' : ''}" data-act="theme" data-val="${k}">${l}</button>`).join('')}</div>

      <div class="sec-h" style="margin-top:22px"><h2>Daten</h2></div>
      <p class="hint">Alles liegt nur auf diesem Gerät (${kb} KB). Mach regelmäßig ein Backup – z. B. in iCloud Drive.</p>
      <div class="btns2">
        <button class="btn white" data-act="export">${ic('down')} Backup</button>
        <button class="btn" data-act="import">${ic('up')} Import</button>
      </div>
      <button class="btn" data-act="export-full">${ic('folder')} Backup inkl. hochgeladener Dateien</button>
      <p class="hint" style="margin-top:10px">Das normale Backup enthält nur Texte und Daten. Hochgeladene Dateien sichert nur „inkl. Dateien“ (kann groß werden).</p>
      <button class="btn danger" data-act="reset">${ic('refresh')} Auf Startdaten zurücksetzen</button>
      <input type="file" id="importfile" accept="application/json,.json" hidden>
      <p class="hint" style="margin-top:20px">Fabian.Visuals OS · v3</p>`;
  }


  /* ---------- FILE STORE (IndexedDB, Dateien bleiben lokal) ---------- */
  const fileStore = (() => {
    let dbp;
    const open = () => dbp || (dbp = new Promise((res, rej) => {
      const r = indexedDB.open('fvos-files', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('files');
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    }));
    const tx = (mode, fn) => open().then((d) => new Promise((res, rej) => {
      const t = d.transaction('files', mode); const req = fn(t.objectStore('files'));
      t.oncomplete = () => res(req.result); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
    }));
    return {
      put: (id, blob) => tx('readwrite', (st) => st.put(blob, id)),
      get: (id) => tx('readonly', (st) => st.get(id)),
      del: (id) => tx('readwrite', (st) => st.delete(id)),
    };
  })();
  const blobUrls = {};
  async function fileUrl(id) {
    if (blobUrls[id]) return blobUrls[id];
    const b = await fileStore.get(id).catch(() => null);
    return b ? (blobUrls[id] = URL.createObjectURL(b)) : '';
  }
  function hydrate(root) {
    root.querySelectorAll('[data-thumb]').forEach(async (el) => {
      const u = await fileUrl(el.dataset.thumb); if (!u) return;
      if (el.tagName === 'A') el.href = u; else el.src = u;
    });
  }
  const FKIND = (m = '') => (m.startsWith('image/') ? 'image' : m.startsWith('video/') ? 'video' : m.startsWith('audio/') ? 'audio' : m === 'application/pdf' ? 'pdf' : 'file');
  const KMETA = {
    image: { label: 'Bild', g: 'linear-gradient(135deg,#f89abf,#a59af8)', i: 'image' },
    video: { label: 'Video', g: 'linear-gradient(135deg,#ffb923,#fd290d)', i: 'play' },
    audio: { label: 'Audio', g: 'linear-gradient(135deg,#7ef0a8,#1f9a57)', i: 'mic' },
    pdf: { label: 'PDF', g: 'linear-gradient(135deg,#fd290d,#7a0d02)', i: 'file' },
    file: { label: 'Datei', g: 'linear-gradient(135deg,#307af4,#2236cc)', i: 'file' },
    text: { label: 'Dokument', g: 'linear-gradient(135deg,#a59af8,#2236cc)', i: 'note' },
  };
  const fmtSize = (b = 0) => (b > 1e6 ? (b / 1e6).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(b / 1e3)) + ' KB');
  const docKind = (d) => (d.kind === 'file' ? FKIND(d.mime) : 'text');
  const sortedClients = () => [...db.clients].sort((a, b) => a.name.localeCompare(b.name));

  let uploadCtx = { projectId: '', clientId: '' };
  async function uploadFiles(files) {
    navigator.storage?.persist?.().catch(() => {});
    let done = 0, last = '';
    for (const f of files) {
      const id = uid();
      try {
        await fileStore.put(id, f);
        db.docs.unshift({ id, kind: 'file', title: f.name.replace(/\.[^.]+$/, ''), name: f.name, mime: f.type, size: f.size, tags: [], clientId: uploadCtx.clientId, projectId: uploadCtx.projectId, updated: Date.now() });
        done++; last = id;
      } catch (e) { toast('Speicher voll oder Datei zu groß: ' + f.name); }
    }
    save(true);
    if (done === 1 && !uploadCtx.projectId && !uploadCtx.clientId) go('doc/' + last);
    else render();
    if (done) toast(done === 1 ? 'Hochgeladen' : `${done} Dateien hochgeladen`);
    uploadCtx = { projectId: '', clientId: '' };
  }
  async function exportFull() {
    toast('Backup wird erstellt…');
    const files = {};
    for (const d of db.docs.filter((x) => x.kind === 'file')) {
      const b = await fileStore.get(d.id).catch(() => null);
      if (b) files[d.id] = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b); });
    }
    downloadJson({ ...db, files }, `fv-os-backup-komplett-${todayIso()}.json`);
  }
  function downloadJson(obj, name) {
    const blob = new Blob([JSON.stringify(obj)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  function importNotion(d) {
    const cols = ['clients', 'projects', 'scripts', 'events', 'notes', 'docs', 'ideas'];
    const n = cols.map((k) => (d[k] || []).length);
    const msg = `Notion-Import: ${n[0]} Kunden, ${n[1]} Projekte, ${n[2]} Scripts, ${n[3]} Termine, ${n[4]} Notizen, ${n[5]} Dokumente.\n\nDie Beispiel-Startdaten werden entfernt, alles was du selbst angelegt hast bleibt. Bereits importierte Notion-Einträge werden aktualisiert.`;
    if (!confirm(msg)) return;
    const seed = window.FV_SEED();
    for (const k of cols) {
      const seedKeys = new Set((seed[k] || []).map((x) => x.title || x.name || x.text));
      const seedIds = new Set((seed[k] || []).map((x) => x.id));
      db[k] = db[k].filter((x) => !x.fromSeed && !seedIds.has(x.id) && !(seedKeys.has(x.title || x.name || x.text) && !x.notionUrl && x.id.length < 12));
      for (const it of d[k] || []) {
        const i = db[k].findIndex((x) => x.id === it.id);
        if (i >= 0) db[k][i] = { ...db[k][i], ...it }; else db[k].push(it);
      }
    }
    db = migrate(db); save(true); go('home'); render(); toast('Notion-Daten importiert');
  }

  /* ---------- markdown (sicher: erst escapen) ---------- */
  function inline(t) {
    const L = [];
    const keep = (h) => { L.push(h); return `\u0000${L.length - 1}\u0000`; };
    let s = esc(t)
      .replace(/\[([^\]]+)\]\(((?:https?:|mailto:)[^)\s]+)\)/g, (_, a, h) => keep(`<a href="${h}" target="_blank" rel="noopener">${a}</a>`))
      .replace(/https?:\/\/[^\s<]+[^\s<.,;:!?)]/g, (u) => keep(`<a href="${u}" target="_blank" rel="noopener">${u.replace(/^https?:\/\/(www\.)?/, '').slice(0, 40)}</a>`))
      .replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, (m) => keep(`<a href="mailto:${m}">${m}</a>`));
    s = s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|[\s(])[*_](?!\s)(.+?)[*_](?=$|[\s.,;:!?)])/g, '$1<i>$2</i>').replace(/`([^`]+)`/g, '<code>$1</code>');
    return s.replace(/\u0000(\d+)\u0000/g, (_, i) => L[i]);
  }
  function md(src) {
    if (!src) return '';
    const out = [], lines = String(src).replace(/\r/g, '').split('\n');
    const isList = (l) => /^\s*([-*•]|\d+\.)\s+/.test(l);
    let i = 0;
    while (i < lines.length) {
      const l = lines[i]; let m;
      if (/^\s*$/.test(l)) { i++; continue; }
      if ((m = l.match(/^(#{1,4})\s+(.*)/))) { const h = Math.min(m[1].length + 1, 4); out.push(`<h${h}>${inline(m[2])}</h${h}>`); i++; continue; }
      if (/^\s*(---|\*\*\*)\s*$/.test(l)) { out.push('<hr>'); i++; continue; }
      if (/^\s*\|/.test(l)) {
        const rows = [];
        while (i < lines.length && /^\s*\|/.test(lines[i])) {
          if (!/^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i])) rows.push(lines[i].trim().replace(/^\||\|$/g, '').split('|').map((c) => inline(c.trim())));
          i++;
        }
        out.push(`<div class="tbl"><table>${rows.map((r, ri) => `<tr>${r.map((c) => (ri === 0 ? `<th>${c}</th>` : `<td>${c}</td>`)).join('')}</tr>`).join('')}</table></div>`);
        continue;
      }
      if (isList(l)) {
        const ordered = /^\s*\d+\./.test(l), items = [];
        while (i < lines.length && isList(lines[i])) {
          const t = lines[i].replace(/^\s*([-*•]|\d+\.)\s+/, ''), cb = t.match(/^\[( |x|X)\]\s*(.*)/);
          items.push(cb ? `<li class="cb ${cb[1] !== ' ' ? 'on' : ''}">${inline(cb[2])}</li>` : `<li>${inline(t)}</li>`);
          i++;
        }
        out.push(ordered ? `<ol>${items.join('')}</ol>` : `<ul>${items.join('')}</ul>`);
        continue;
      }
      if (/^>\s?/.test(l)) { const q = []; while (i < lines.length && /^>\s?/.test(lines[i])) { q.push(inline(lines[i].replace(/^>\s?/, ''))); i++; } out.push(`<blockquote>${q.join('<br>')}</blockquote>`); continue; }
      const p = [inline(l)]; i++;
      while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^(#{1,4}\s|\s*\||>|\s*(---|\*\*\*)\s*$)/.test(lines[i]) && !isList(lines[i])) { p.push(inline(lines[i])); i++; }
      out.push(`<p>${p.join('<br>')}</p>`);
    }
    return out.join('');
  }

  /* ---------- DOCS ---------- */
  let docFilter = 'all', docQuery = '', docEdit = false, lastDocId = '';
  function filteredDocs() {
    const q = docQuery.toLowerCase();
    return db.docs
      .filter((d) => docFilter === 'all' || (docFilter === 'files' ? d.kind === 'file' : docFilter === 'texts' ? d.kind === 'text' : (d.tags || []).includes(docFilter)))
      .filter((d) => !q || [d.title, d.name, d.body, (d.tags || []).join(' '), clientName(d.clientId), projectTitle(d.projectId)].join(' ').toLowerCase().includes(q))
      .sort((a, b) => (b.updated || 0) - (a.updated || 0));
  }
  function docCards(list) {
    return list.map((d) => {
      const k = docKind(d), m = KMETA[k];
      const date = d.updated ? new Date(d.updated).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' }) : '';
      return `<a class="dcard" href="#/doc/${d.id}"><span class="th" style="background:${m.g}">${k === 'image' ? `<img data-thumb="${d.id}" alt="">` : ic(m.i)}</span>
        <b>${esc(d.title || d.name || 'Ohne Titel')}</b><small>${[m.label, d.size ? fmtSize(d.size) : '', date].filter(Boolean).join(' · ')}</small></a>`;
    }).join('') || '<div class="empty" style="grid-column:1/-1">Keine Dokumente</div>';
  }
  function docRow(d) {
    const k = docKind(d), m = KMETA[k];
    return `<a class="row" href="#/doc/${d.id}"><span class="ico" style="background:${m.g};border:0;color:#fff">${ic(m.i)}</span>
      <span class="body"><b>${esc(d.title || d.name || 'Ohne Titel')}</b><small>${m.label}${d.size ? ' · ' + fmtSize(d.size) : ''}</small></span><span class="end">${ic('chev')}</span></a>`;
  }
  function docSection(field, id) {
    const list = db.docs.filter((d) => d[field] === id);
    const ctx = field === 'projectId' ? `data-pid="${id}"` : `data-cid="${id}"`;
    return `<div class="sec-h" style="margin-top:22px"><h2>Dokumente</h2><span><button data-act="upload" ${ctx}>+ Upload</button> · <button data-act="new-doc" ${ctx}>+ Text</button></span></div>
      ${list.length ? `<div class="list" style="margin-bottom:12px">${list.map(docRow).join('')}</div>` : '<div class="hint">Noch keine Dokumente verknüpft.</div>'}`;
  }
  function vDocs() {
    const tags = [...new Set(db.docs.flatMap((d) => d.tags || []))].sort((a, b) => a.localeCompare(b));
    const chips = [['all', 'Alle'], ['files', 'Dateien'], ['texts', 'Texte'], ...tags.map((t) => [t, '#' + t])];
    return pageHead('Docs & Uploads', `${db.docs.length} Dokumente`, `<button class="circ solid" data-act="new-doc" aria-label="Text-Dokument">${ic('plus')}</button>`) + `
      <button class="drop" data-act="upload"><span class="dico">${ic('up')}</span><span><b>Dateien hochladen</b><small>Fotos, PDFs, Verträge, Moodboards, Videos</small></span></button>
      <div class="searchbox">${ic('search')}<input id="docq" placeholder="Dokumente durchsuchen" value="${esc(docQuery)}" autocomplete="off"></div>
      <div class="chips">${chips.map(([k, l]) => `<button class="${docFilter === k ? 'on' : ''}" data-act="doc-filter" data-val="${esc(k)}">${esc(l)}</button>`).join('')}</div>
      <div class="dgrid" id="doclist">${docCards(filteredDocs())}</div>`;
  }
  function vDoc(id) {
    const d = get('docs', id);
    if (!d) return null;
    if (lastDocId !== id) { docEdit = d.kind === 'text' && !d.body; lastDocId = id; }
    const k = docKind(d), m = KMETA[k];
    let main;
    if (d.kind === 'file') {
      const prev = k === 'image' ? `<img class="pv" data-thumb="${id}" alt="">`
        : k === 'video' ? `<video class="pv" data-thumb="${id}" controls playsinline></video>`
        : k === 'audio' ? `<div class="pv ph" style="background:${m.g}">${ic('mic')}<audio data-thumb="${id}" controls></audio></div>`
        : `<div class="pv ph" style="background:${m.g}">${ic(m.i)}<span>${esc(d.name)}</span></div>`;
      main = `${prev}
        <div class="btns2" style="margin-top:12px"><a class="btn white" data-thumb="${id}" target="_blank" rel="noopener">${ic('eye')} Öffnen</a><a class="btn" data-thumb="${id}" download="${esc(d.name)}">${ic('down')} Sichern</a></div>
        <div class="field"><div class="fl"><label>Titel</label><input value="${esc(d.title)}" ${bind('docs', id, 'title')}></div>
          <div class="fl"><label>Datei</label><input value="${esc(d.name)} · ${fmtSize(d.size)}" disabled></div></div>
        <textarea class="notes" style="min-height:80px" placeholder="Notiz zur Datei…" ${bind('docs', id, 'body')}>${esc(d.body || '')}</textarea>`;
    } else {
      main = `<textarea class="doc-t" rows="1" placeholder="Titel" ${bind('docs', id, 'title')}>${esc(d.title)}</textarea>
        <div class="seg" style="margin-top:6px"><button class="${!docEdit ? 'on' : ''}" data-act="doc-mode" data-val="read">Lesen</button><button class="${docEdit ? 'on' : ''}" data-act="doc-mode" data-val="edit">Bearbeiten</button></div>
        ${docEdit ? `<textarea class="notes" style="min-height:50vh" placeholder="Text, Mail-Vorlage, Briefing… (Markdown: # Überschrift, - Liste, **fett**)" ${bind('docs', id, 'body')}>${esc(d.body)}</textarea>`
          : `<article class="md">${md(d.body) || '<p class="hint">Noch leer. Tippe auf „Bearbeiten“.</p>'}</article>`}
        ${d.body ? `<button class="btn" data-act="copy-doc" data-id="${id}" style="margin-top:12px">${ic('copy')} Text kopieren</button>` : ''}`;
    }
    return topbar(m.label, d.kind === 'file' ? 'Upload' : 'Docs & Uploads', `<button class="circ" data-act="del" data-col="docs" data-id="${id}" aria-label="Löschen">${ic('trash')}</button>`, 'docs') + main + `
      <div class="sec-h" style="margin-top:22px"><h2>Zuordnung</h2></div>
      <div class="field">
        <div class="fl"><label>Tags</label><input placeholder="Vertrag, Moodboard…" value="${esc((d.tags || []).join(', '))}" data-doctags="${id}"></div>
        <div class="fl"><label>Kunde</label><select data-rerender ${bind('docs', id, 'clientId')}>${options(sortedClients(), d.clientId, 'name')}</select></div>
        <div class="fl"><label>Projekt</label><select data-rerender ${bind('docs', id, 'projectId')}>${options(db.projects, d.projectId, 'title')}</select></div>
      </div>
      ${d.notionUrl ? `<p class="hint"><a href="${esc(d.notionUrl)}" target="_blank" rel="noopener">Original in Notion ↗</a></p>` : ''}`;
  }

  /* ---------- BRAINSTORMING ---------- */
  const ITAGS = {
    hook: { label: 'Hook', c: '#fd290d', g: 'linear-gradient(135deg,#ffb923,#fd290d)' },
    konzept: { label: 'Konzept', c: '#a59af8', g: 'linear-gradient(135deg,#a59af8,#2236cc)' },
    shot: { label: 'Shot', c: '#307af4', g: 'linear-gradient(135deg,#307af4,#2236cc)' },
    location: { label: 'Location', c: '#1f9a57', g: 'linear-gradient(135deg,#7ef0a8,#1f9a57)' },
    musik: { label: 'Musik', c: '#f89abf', g: 'linear-gradient(135deg,#f89abf,#a59af8)' },
    business: { label: 'Business', c: '#ffb923', g: 'linear-gradient(135deg,#ffb923,#f66515)' },
  };
  let ideaFilter = 'all', ideaTag = 'hook';
  function ideaCard(x) {
    const t = ITAGS[x.tag] || ITAGS.konzept;
    return `<button class="icard" data-act="idea-open" data-id="${x.id}" style="--c:${t.c};--g:${t.g}">
      <span class="it">${t.label}${x.pinned ? ic('star') : ''}</span><p>${esc(x.text)}</p>
      <small>${new Date(x.created).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}${x.projectId ? ' · ' + esc(projectTitle(x.projectId)) : ''}</small></button>`;
  }
  function vIdeas() {
    const list = db.ideas.filter((x) => ideaFilter === 'all' || x.tag === ideaFilter).sort((a, b) => (b.pinned - a.pinned) || (b.created - a.created));
    return pageHead('Brainstorming', `${db.ideas.length} Ideen · Hooks, Shots, Konzepte`, `<button class="circ solid" data-act="shuffle" aria-label="Ideen mixen">${ic('shuffle')}</button>`) + `
      <div class="capture">
        <textarea id="idea-in" rows="2" placeholder="Idee festhalten… z. B. Hook, Shot, Location"></textarea>
        <div class="capbar"><div class="chips sm">${Object.entries(ITAGS).map(([k, t]) => `<button class="${ideaTag === k ? 'on' : ''}" style="--c:${t.c}" data-act="idea-tag" data-val="${k}">${t.label}</button>`).join('')}</div>
          <button class="circ solid" data-act="idea-add" aria-label="Idee speichern">${ic('plus')}</button></div>
      </div>
      <div class="chips">${[['all', 'Alle'], ...Object.entries(ITAGS).map(([k, t]) => [k, t.label])].map(([k, l]) => `<button class="${ideaFilter === k ? 'on' : ''}" data-act="idea-filter" data-val="${k}">${l}</button>`).join('')}</div>
      ${list.length ? `<div class="masonry">${list.map(ideaCard).join('')}</div>` : '<div class="empty">Noch keine Ideen. Schreib oben einfach los.<br>Mit dem Mix-Button oben rechts kombinierst du zufällig Ideen.</div>'}`;
  }
  function sheetIdea(id) {
    const x = get('ideas', id); if (!x) return;
    openSheet(`<h3>Idee</h3>
      <textarea class="notes" style="min-height:120px;margin-bottom:12px" ${bind('ideas', id, 'text')}>${esc(x.text)}</textarea>
      <div class="chips sm" style="margin-bottom:12px">${Object.entries(ITAGS).map(([k, t]) => `<button class="${x.tag === k ? 'on' : ''}" style="--c:${t.c}" data-act="idea-set-tag" data-id="${id}" data-val="${k}">${t.label}</button>`).join('')}</div>
      <div class="field"><div class="fl"><label>Projekt</label><select data-rerender ${bind('ideas', id, 'projectId')}>${options(db.projects.filter((p) => p.status !== 'archive'), x.projectId, 'title')}</select></div></div>
      <div class="btns2"><button class="btn white" data-act="idea-to" data-val="script" data-id="${id}">${ic('film')} → Script</button><button class="btn" data-act="idea-to" data-val="project" data-id="${id}">${ic('kanban')} → Projekt</button></div>
      <div class="btns2"><button class="btn" data-act="idea-pin" data-id="${id}">${ic('star')} ${x.pinned ? 'Lösen' : 'Anpinnen'}</button><button class="btn danger" data-act="idea-del" data-id="${id}">${ic('trash')} Löschen</button></div>`);
  }
  function sheetMix() {
    const pool = [...db.ideas];
    if (pool.length < 2) { toast('Mindestens 2 Ideen zum Mixen'); return; }
    const pick = [];
    while (pick.length < Math.min(3, pool.length)) {
      const cand = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
      if (!pick.some((p) => p.tag === cand.tag) || pool.length < 2) pick.push(cand);
      if (!pool.length) break;
    }
    const text = pick.map((p) => `${ITAGS[p.tag]?.label || ''}: ${p.text}`).join('\n+ ');
    const sh = openSheet(`<h3>Ideen-Mix</h3><p class="hint" style="margin-top:-8px">Zufällige Kombi. Funkt was?</p>
      <div class="mix">${pick.map((p, j) => `<div class="mcard" style="--j:${j};--g:${(ITAGS[p.tag] || ITAGS.konzept).g}"><span>${ITAGS[p.tag]?.label || ''}</span><p>${esc(p.text)}</p></div>`).join('<div class="mplus">+</div>')}</div>
      <div class="btns2" style="margin-top:14px"><button class="btn" data-act="shuffle">${ic('shuffle')} Neu mischen</button><button class="btn white" data-act="mix-save">${ic('bulb')} Als Idee speichern</button></div>`);
    sh.dataset.mix = text;
  }

  /* ---------- sheets ---------- */
  function openSheet(html) {
    closeSheet(true);
    const root = $('#sheet-root');
    root.innerHTML = `<div class="backdrop" data-act="close-sheet"></div><div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div>`;
    root.querySelectorAll('textarea').forEach(grow);
    return root.querySelector('.sheet');
  }
  function closeSheet(instant) {
    const nodes = [...$('#sheet-root').children];
    if (!nodes.length) return;
    if (instant) { nodes.forEach((n) => n.remove()); return; }
    nodes.forEach((n) => n.classList.add('closing'));
    setTimeout(() => nodes.forEach((n) => n.remove()), 240);
  }

  function sheetNew() {
    const items = [
      ['new-project', 'kanban', 'Projekt', ETYPE.shoot.g],
      ['new-event', 'calendar', 'Termin', ETYPE.meeting.g],
      ['new-client', 'users', 'Kunde', ETYPE.content.g],
      ['new-script', 'film', 'Script', 'linear-gradient(135deg,#a59af8,#2236cc)'],
      ['new-note', 'note', 'Notiz', 'linear-gradient(135deg,#fff,#a59af8)'],
      ['new-content', 'spark', 'Content', 'linear-gradient(135deg,#f89abf,#fd290d)'],
      ['new-idea', 'bulb', 'Idee', 'linear-gradient(135deg,#ffb923,#f89abf)'],
      ['upload', 'up', 'Upload', 'linear-gradient(135deg,#307af4,#a59af8)'],
      ['new-doc', 'file', 'Dokument', 'linear-gradient(135deg,#2236cc,#07082a)'],
    ];
    openSheet(`<h3>Neu anlegen</h3><div class="newgrid">${items.map(([a, i, l, g], j) =>
      `<button style="--j:${j}" data-act="${a}" data-status="planning"><span class="ico" style="background:${g};${i === 'note' ? 'color:#15122e' : ''}">${ic(i)}</span>${l}</button>`).join('')}</div>`);
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
      ['Ideen', db.ideas.filter((x) => has(x.text)).map((x) => ['#/ideas', 'bulb', x.text.split('\n')[0].slice(0, 60), ITAGS[x.tag]?.label])],
      ['Dokumente', db.docs.filter((x) => has(x.title, x.name, x.body, (x.tags || []).join(' '))).map((x) => [`#/doc/${x.id}`, x.kind === 'file' ? 'file' : 'note', x.title || x.name, (x.tags || []).join(', ')])],
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
      case 'new-idea': closeSheet(); go('ideas'); setTimeout(() => $('#idea-in')?.focus(), 400); break;
      case 'upload': uploadCtx = { projectId: d.pid || '', clientId: d.cid || '' }; closeSheet(); $('#docfile')?.click(); break;
      case 'new-doc': {
        const x = { id: uid(), kind: 'text', title: '', body: '', tags: [], clientId: d.cid || '', projectId: d.pid || '', updated: Date.now() };
        db.docs.unshift(x); save(true); docEdit = true; lastDocId = x.id; closeSheet(); go('doc/' + x.id); setTimeout(() => $('.doc-t')?.focus(), 400);
        break;
      }
      case 'doc-filter': docFilter = d.val; render(); break;
      case 'doc-mode': docEdit = d.val === 'edit'; render(); break;
      case 'copy-doc': { const x = get('docs', d.id); navigator.clipboard?.writeText(x?.body || '').then(() => toast('Kopiert'), () => toast('Kopieren nicht möglich')); break; }
      case 'idea-tag': ideaTag = d.val; el.parentElement.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === el)); break;
      case 'idea-filter': ideaFilter = d.val; render(); break;
      case 'idea-add': {
        const inp = $('#idea-in'); const text = inp?.value.trim();
        if (!text) { inp?.focus(); break; }
        const x = { id: uid(), text, tag: ideaTag, pinned: false, projectId: '', created: Date.now() };
        db.ideas.unshift(x); save(true); if (ideaFilter !== 'all' && ideaFilter !== ideaTag) ideaFilter = 'all';
        pendingPop = `.icard[data-id="${x.id}"]`; render(); toast('Idee gespeichert');
        break;
      }
      case 'idea-open': sheetIdea(d.id); break;
      case 'idea-set-tag': { const x = get('ideas', d.id); if (x) { x.tag = d.val; save(true); el.parentElement.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === el)); render(); } break; }
      case 'idea-pin': { const x = get('ideas', d.id); if (x) { x.pinned = !x.pinned; save(true); closeSheet(); render(); toast(x.pinned ? 'Angepinnt' : 'Gelöst'); } break; }
      case 'idea-del': db.ideas = db.ideas.filter((x) => x.id !== d.id); save(true); closeSheet(); render(); toast('Gelöscht'); break;
      case 'idea-to': {
        const x = get('ideas', d.id); if (!x) break;
        const title = x.text.split('\n')[0].slice(0, 70);
        if (d.val === 'script') {
          const sc = { id: uid(), title, projectId: x.projectId || '', status: 'idea', notes: x.text, rows: [{ id: uid(), audio: '', visual: '' }] };
          db.scripts.unshift(sc); save(true); closeSheet(); go('script/' + sc.id);
        } else {
          const p = { id: uid(), title, status: 'planning', priority: 'medium', start: '', end: '', clientId: '', tasks: [], notes: x.text };
          db.projects.unshift(p); save(true); closeSheet(); go('project/' + p.id);
        }
        toast(d.val === 'script' ? 'Script angelegt' : 'Projekt angelegt');
        break;
      }
      case 'shuffle': sheetMix(); break;
      case 'mix-save': {
        const t = el.closest('.sheet')?.dataset.mix; if (!t) break;
        db.ideas.unshift({ id: uid(), text: t, tag: 'konzept', pinned: false, projectId: '', created: Date.now() });
        save(true); closeSheet(); ideaFilter = 'all'; render(); toast('Kombi gespeichert');
        break;
      }
      case 'export-full': exportFull(); break;
      case 'new-event': if (ev.target.closest('.tev')) break; newEvent({ date: d.date, hour: d.hour, projectId: d.pid }); break;
      case 'edit-event': { const e = get('events', d.id); if (e) sheetEvent({ ...e }, false); break; }
      case 'set': {
        const [col, id, f] = d.bind.split('|'); const it = get(col, id);
        if (it) { it[f] = d.val; save(true); pendingPop = `.seg [data-bind="${d.bind}"][data-val="${d.val}"]`; render(); if (f === 'status' && d.val === 'archive') toast('Ins Archiv verschoben'); }
        break;
      }
      case 'archive': case 'unarchive': {
        const p = get('projects', d.id); if (!p) break;
        el.closest('.kcard, .arow')?.classList.add('leaving');
        setTimeout(() => { p.status = d.act === 'archive' ? 'archive' : 'done'; save(true); render(); toast(d.act === 'archive' ? 'Archiviert' : 'Zurück in „Fertig“'); }, 380);
        break;
      }
      case 'theme': db.settings.theme = d.val; save(true); applyTheme(); render(); break;
      case 'avatar-pick': $('#avatarfile')?.click(); break;
      case 'avatar-del': delete db.settings.avatar; save(true); render(); toast('Profilbild entfernt'); break;
      case 'task-toggle': {
        const t = get('projects', d.pid)?.tasks.find((x) => x.id === d.tid);
        if (t) { t.done = !t.done; save(true); pendingPop = `.task[data-tid="${t.id}"]`; render(); }
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
        if (d.col === 'docs') { fileStore.del(d.id).catch(() => {}); if (blobUrls[d.id]) { URL.revokeObjectURL(blobUrls[d.id]); delete blobUrls[d.id]; } }
        save(true); toast('Gelöscht');
        go({ projects: 'projects', clients: 'crm', scripts: 'scripts', notes: 'notes', docs: 'docs' }[d.col]);
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
      if (it) { it[f] = t.value; if (col === 'notes' || col === 'docs') it.updated = Date.now(); save(); }
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
    else if (t.id === 'docq') { docQuery = t.value; const l = $('#doclist'); if (l) { l.innerHTML = docCards(filteredDocs()); hydrate(l); } }
    else if (t.dataset.doctags) { const x = get('docs', t.dataset.doctags); if (x) { x.tags = t.value.split(',').map((v) => v.trim()).filter(Boolean); save(); } }
  });
  document.addEventListener('change', (ev) => {
    const t = ev.target;
    if (t.dataset.bind && t.dataset.rerender) {
      const [col, id, f] = t.dataset.bind.split('|'); const it = get(col, id);
      if (it) { it[f] = t.value; save(true); render(); }
    } else if (t.id === 'avatarfile' && t.files[0]) {
      pickAvatar(t.files[0]); t.value = '';
    } else if (t.id === 'docfile' && t.files.length) {
      uploadFiles([...t.files]); t.value = '';
    } else if (t.id === 'importfile' && t.files[0]) {
      t.files[0].text().then(async (txt) => {
        const d = JSON.parse(txt);
        if (!d || !Array.isArray(d.projects)) throw new Error('format');
        if (d.source === 'notion') { importNotion(d); t.value = ''; return; }
        if (!confirm('Backup importieren? Die aktuellen Daten auf diesem Gerät werden ersetzt.')) return;
        const files = d.files; delete d.files;
        db = migrate(d); save(true);
        if (files) for (const [id, url] of Object.entries(files)) await fileStore.put(id, await (await fetch(url)).blob());
        render(); toast('Import erfolgreich');
      }).catch(() => toast('Datei ist kein gültiges Backup')).finally(() => { t.value = ''; });
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
    } else if (ev.key === 'Enter' && t.id === 'idea-in' && (ev.metaKey || ev.ctrlKey)) {
      ev.preventDefault(); $('[data-act="idea-add"]')?.click();
    } else if (ev.key === 'Enter' && t.matches('.kcard[data-go]')) go(t.dataset.go);
    else if (ev.key === 'Escape') closeSheet();
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
