// Lokaler Speicher – alles bleibt auf dem Gerät.
const KEY = 'fvs.data.v1';

const defaults = () => ({
  settings: {
    name: 'Fabian',
    apiKey: '',
    location: { name: 'Bonn', lat: 50.7374, lng: 7.0982 },
  },
  briefs: [],
});

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!raw) return seed(defaults());
    const d = defaults();
    return { ...d, ...raw, settings: { ...d.settings, ...raw.settings } };
  } catch { return seed(defaults()); }
}

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  listeners.forEach((fn) => fn(state));
}

export const store = {
  get: () => state,
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  setSettings(patch) { state.settings = { ...state.settings, ...patch }; persist(); },
  brief: (id) => state.briefs.find((b) => b.id === id),
  saveBrief(brief) {
    brief.updatedAt = Date.now();
    const i = state.briefs.findIndex((b) => b.id === brief.id);
    if (i >= 0) state.briefs[i] = brief; else state.briefs.unshift(brief);
    persist();
    return brief;
  },
  deleteBrief(id) { state.briefs = state.briefs.filter((b) => b.id !== id); persist(); },
  exportJSON: () => JSON.stringify(state, null, 2),
  importJSON(text) {
    const data = JSON.parse(text);
    if (!data || !Array.isArray(data.briefs)) throw new Error('Ungültige Datei');
    state = { ...defaults(), ...data, settings: { ...defaults().settings, ...data.settings } };
    persist();
  },
  reset() { state = defaults(); persist(); },
};

export function uid() { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4); }

export function newBrief(partial = {}) {
  return {
    id: uid(),
    title: 'Neues Projekt',
    client: '',
    type: 'Commercial',
    status: 'idee',
    date: '',
    location: '',
    locationGeo: null,
    summary: '',
    goal: '',
    audience: '',
    deliverables: [],
    palette: 'primary',
    moodKeywords: [],
    shotlist: [],
    hooks: [],
    questions: [],
    gear: [],
    transcript: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...partial,
  };
}

function seed(s) {
  const in3 = new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10);
  s.briefs = [
    newBrief({
      title: 'Rooftop Reel – Café Lumen',
      client: 'Café Lumen',
      type: 'Social Reel',
      status: 'geplant',
      date: in3,
      location: 'Bonn',
      locationGeo: { lat: 50.7374, lng: 7.0982 },
      summary: 'Kurzes, warmes Reel zur neuen Rooftop-Terrasse. Fokus auf Atmosphäre im Abendlicht, Signature-Drinks und Menschen.',
      goal: 'Reservierungen für die Terrassen-Saison pushen',
      audience: '20–35, urban, Bonn & Köln',
      deliverables: [{ format: '9:16', length: '20 s', platform: 'Instagram Reel' }, { format: '9:16', length: '8 s', platform: 'Story-Teaser' }],
      palette: 'warm',
      moodKeywords: ['Golden Hour', 'Warm', 'Lebendig', 'Handheld'],
      shotlist: [
        { id: uid(), visual: 'Low-Angle: Tür zur Terrasse öffnet sich, Gegenlicht flutet rein', audio: 'Sound-Design: Türklinke, Stadtgeräusche faden ein', shotType: 'Wide', duration: '2s', done: false },
        { id: uid(), visual: 'Macro: Eiswürfel fällt in Signature-Drink, Slow-Mo 120fps', audio: 'Beat-Drop auf den Splash', shotType: 'Detail', duration: '1.5s', done: false },
        { id: uid(), visual: 'Gimbal-Walk durch die Tische, Menschen lachen, Sonne im Rücken', audio: 'VO: „Bonn hat einen neuen Lieblingsplatz.“', shotType: 'Medium', duration: '4s', done: false },
        { id: uid(), visual: 'Drohne steigt über die Terrasse, Rhein & Skyline im Abendlicht', audio: 'Musik baut auf', shotType: 'Drone', duration: '3s', done: false },
        { id: uid(), visual: 'Close-up: Anstoßen, Lens Flare zwischen den Gläsern', audio: 'Klirren + VO: „Ab Freitag. Reserviere jetzt.“', shotType: 'Close', duration: '2s', done: false },
      ],
      hooks: [
        { level: 1, label: 'Safe', text: 'Das ist Bonns schönste Terrasse. Und sie ist neu.' },
        { level: 2, label: 'Neugier', text: 'Wir haben 3 Monate gebraucht, um diesen Ausblick zu bauen.' },
        { level: 3, label: 'POV', text: 'POV: Dein Feierabend fängt 30 Meter über der Stadt an.' },
        { level: 4, label: 'Kontrast', text: 'Montag: Büro. Freitag: das hier.' },
        { level: 5, label: 'Verrückt', text: 'Der Sonnenuntergang heute ist ausverkauft. Fast.' },
      ],
      questions: ['Model-Releases für Gäste vorbereiten?', 'Drohnen-Genehmigung Innenstadt prüfen'],
      gear: ['FX3', '24-70 GM', '90mm Macro', 'Gimbal', 'Mini 4 Pro'],
    }),
  ];
  return s;
}
