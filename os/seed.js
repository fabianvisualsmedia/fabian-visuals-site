/* Startdaten für den ersten Start. Danach liegen alle Daten nur lokal im Browser (localStorage).
   Bewusst ohne E-Mail-Adressen und Privatpersonen, weil diese Datei öffentlich im Repo liegt. */
window.FV_SEED = function () {
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const day = (offset) => { const d = new Date(); d.setDate(d.getDate() + offset); return iso(d); };
  let n = 0;
  const id = () => 's' + (++n).toString(36) + Math.random().toString(36).slice(2, 7);

  const clients = [
    ['📷', 'Fabian.Visuals', 'Intern'],
    ['🎬', '1Studio GmbH', 'Studio / Agentur'],
    ['📷', 'Creativ Club Cologne', 'Community'],
    ['🏢', 'Zeller Management und Consulting GmbH', 'Consulting'],
    ['✋', 'Zaves GmbH', 'Brand'],
    ['🔁', 'FAMA.Studios', 'Studio'],
    ['⚙️', 'Botec', 'Industrie'],
    ['💄', 'Sephora', 'Beauty Brand'],
    ['🛍️', 'PreLoveDeals', 'E-Commerce'],
    ['🎧', 'MAKS (DJ)', 'Musik / DJ'],
    ['🎧', 'LUX (DJ)', 'Musik / DJ'],
    ['💸', 'Kolepka & Becker / Allianz', 'Versicherung'],
    ['🚗', 'Stellplatztechnik', 'Industrie'],
    ['💧', 'Wolfgang Schlösser UG', 'Heizung / Öltank'],
    ['🦊', 'Heizungsfuchs24', 'Heizung'],
  ].map(([icon, name, type]) => ({ id: id(), icon, name, type, email: '', phone: '', instagram: '', website: '', notes: '' }));
  const c = (name) => (clients.find((x) => x.name === name) || {}).id || '';

  const tasks = (list, doneCount = 0) => list.map((text, i) => ({ id: id(), text, done: i < doneCount }));

  const projects = [
    { title: 'Case Study: VW Taigo R-Line – „Nature meets Performance“', status: 'planning', priority: 'high', start: '', end: '2026-04-30', clientId: '',
      tasks: tasks(['Moodboard & Referenzen', 'Location-Scouting', 'Shotlist finalisieren', 'Fahrzeug-Slot anfragen']) },
    { title: '1Studio „The Performance“', status: 'planning', priority: 'medium', start: '', end: '', clientId: c('1Studio GmbH'),
      tasks: tasks(['Konzept pitchen', 'Script schreiben']) },
    { title: 'PreloveDeals Full Pack', status: 'progress', priority: 'high', start: '2025-06-01', end: '2025-06-30', clientId: c('PreLoveDeals'),
      tasks: tasks(['Briefing', 'Shotlist', 'Produkt-Shoot', 'Reels schneiden', 'Color Grading', 'Abnahme Kunde'], 5) },
    { title: 'Videos erstellen HF24', status: 'progress', priority: 'high', start: '2025-06-25', end: '2025-08-31', clientId: c('Heizungsfuchs24'),
      tasks: tasks(['Themenliste', 'Dreh Block 1', 'Dreh Block 2', 'Schnitt & Captions'], 2) },
    { title: 'Maaß-Raum-Coaching Webseite erstellen', status: 'done', priority: 'high', start: '', end: '2026-02-01', clientId: '',
      tasks: tasks(['Texte', 'Fotos', 'Livegang'], 3) },
  ].map((p) => ({ id: id(), notes: '', ...p }));
  const p = (prefix) => (projects.find((x) => x.title.startsWith(prefix)) || {}).id || '';

  const rows = (pairs) => pairs.map(([audio, visual]) => ({ id: id(), audio, visual }));
  const scripts = [
    { title: '1 Studio „The Performance“', projectId: p('1Studio'), status: 'draft', rows: rows([
      ['(Stille. Nur Atmen.)', 'Extreme Close-up: Hände kreiden sich ein, Staub im Gegenlicht.'],
      ['VO: „Performance ist keine Frage des Talents.“', 'Slow-Mo: Sprung an die Stange, harter Schnitt auf Schwarz.'],
      ['VO: „Sie ist eine Entscheidung. Jeden Tag.“', 'Montage: Training, Schweiß, Uhr an der Wand – schneller werdende Schnitte.'],
      ['Beat-Drop', 'Logo-Reveal 1Studio auf Schwarz, Lichtschweif.'],
    ]) },
    { title: '1Studio Interview Concept', projectId: p('1Studio'), status: 'idea', rows: rows([['', '']]) },
    { title: 'Musikvideo Efosa v2', projectId: '', status: 'draft', rows: rows([['', '']]) },
    { title: 'Bremen Doku', projectId: '', status: 'idea', rows: rows([['', '']]) },
    { title: 'PreLoveDeals Campaign', projectId: p('PreloveDeals'), status: 'final', rows: rows([['', '']]) },
    { title: 'Summer Musikvideo', projectId: '', status: 'idea', rows: rows([['', '']]) },
    { title: 'Tanzvideo', projectId: '', status: 'idea', rows: rows([['', '']]) },
    { title: 'Konzept Videoproduktion', projectId: '', status: 'draft', rows: rows([['', '']]) },
    { title: 'Case Study Skript VW', projectId: p('Case Study'), status: 'draft', rows: rows([['', '']]) },
  ].map((s) => ({ id: id(), ...s }));

  const events = [
    { title: 'Location-Scouting VW Taigo', type: 'shoot', date: day(0), start: '10:00', end: '12:30', projectId: p('Case Study') },
    { title: 'Call 1Studio – Briefing', type: 'call', date: day(0), start: '14:30', end: '15:00', projectId: p('1Studio') },
    { title: 'Reel posten: BTS', type: 'content', date: day(0), start: '18:00', end: '18:30', projectId: '' },
    { title: 'Meeting Zeller Management', type: 'meeting', date: day(1), start: '09:30', end: '10:30', projectId: '' },
    { title: 'Schnitt-Block HF24', type: 'shoot', date: day(2), start: '13:00', end: '17:00', projectId: p('Videos erstellen') },
    { title: 'Carousel: Gear-Breakdown', type: 'content', date: day(3), start: '12:00', end: '12:30', projectId: '' },
    { title: 'Shoot Produktfotos', type: 'shoot', date: day(4), start: '09:00', end: '13:00', projectId: '' },
  ].map((e) => ({ id: id(), notes: '', ...e }));

  const notes = [
    { title: 'Hook-Ideen', body: '„Das hier hat 0 € gekostet.“\nPOV: Kunde sagt „mach einfach was Cooles“\n3 Fehler, die jedes Musikvideo billig aussehen lassen' },
    { title: 'Gear-Checkliste Shoot', body: '☐ Akkus geladen (Body + Gimbal)\n☐ SD-Karten formatiert\n☐ ND-Filter\n☐ Funkstrecke + Ersatz-Batterien\n☐ Gaffa, Clamps, Sandsäcke' },
  ].map((x) => ({ id: id(), updated: Date.now(), ...x }));

  return { v: 1, settings: { name: 'Fabian' }, clients, projects, scripts, events, notes };
};
