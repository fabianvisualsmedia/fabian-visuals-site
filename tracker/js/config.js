// Static configuration: default phases, project types, statuses, settings defaults.

export const DEFAULT_PHASES = [
  { key: 'prep', label: 'Vorbereitung' },
  { key: 'travel', label: 'Anfahrt' },
  { key: 'shoot', label: 'Dreh' },
  { key: 'backup', label: 'Datensicherung' },
  { key: 'edit', label: 'Schnitt' },
  { key: 'color', label: 'Color Grading' },
  { key: 'sound', label: 'Sound' },
  { key: 'revisions', label: 'Revisionen' },
  { key: 'communication', label: 'Kommunikation' },
  { key: 'admin', label: 'Admin' },
];

// Colours per phase, taken from the moodboard spectrum (used for dots/charts).
export const PHASE_COLORS = {
  prep: '#A59AF8',
  travel: '#307AF4',
  shoot: '#FFB923',
  backup: '#8E8E98',
  edit: '#F66515',
  color: '#F89ABF',
  sound: '#6A8BFF',
  revisions: '#FD290D',
  communication: '#4ADE80',
  admin: '#C9C9D1',
};
export const phaseColor = (key) => PHASE_COLORS[key] || '#E6E6EA';

export const PROJECT_TYPES = [
  { key: 'wedding', label: 'Hochzeit' },
  { key: 'commercial', label: 'Commercial' },
  { key: 'musicvideo', label: 'Musikvideo' },
  { key: 'social', label: 'Social Content' },
  { key: 'portrait', label: 'Porträt' },
  { key: 'event', label: 'Event' },
  { key: 'retainer', label: 'Retainer' },
  { key: 'custom', label: 'Individuell' },
];

export const STATUSES = [
  { key: 'offer', label: 'Angebot' },
  { key: 'active', label: 'Aktiv' },
  { key: 'delivered', label: 'Geliefert' },
  { key: 'paid', label: 'Bezahlt' },
  { key: 'archived', label: 'Archiviert' },
];

export const FEE_TYPES = [
  { key: 'fixed', label: 'Pauschal' },
  { key: 'hourly', label: 'Stundensatz' },
  { key: 'daily', label: 'Tagessatz' },
];

export const ACCENTS = [
  { key: 'amber', label: 'Bernstein', swatch: ['#FFB923', '#F66515'] },
  { key: 'blue', label: 'Electric Blue', swatch: ['#6694FF', '#144CCD'] },
  { key: 'lavender', label: 'Lavender', swatch: ['#D9B8FF', '#7C5CFF'] },
];

export const DEFAULT_SETTINGS = {
  targetHourlyRate: 7000, // cents
  minHourlyRate: 4500, // cents
  phases: DEFAULT_PHASES,
  smallBusiness: true,
  roundingMinutes: 15,
  timerWarnHours: 10,
  accent: 'amber',
};

export const labelOf = (list, key) => list.find((x) => x.key === key)?.label ?? key;

export const COST_CATEGORIES = [
  { key: 'assistant', label: 'Assistenz' },
  { key: 'rental', label: 'Miete / Equipment' },
  { key: 'music', label: 'Musiklizenz' },
  { key: 'travel', label: 'Fahrtkosten' },
  { key: 'other', label: 'Sonstiges' },
];
