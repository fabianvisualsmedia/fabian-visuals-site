// KI-Engine: Transkript → Briefing + Shotlist + Hooks.
// Mit eigenem Claude-API-Key (lokal gespeichert) läuft es über Claude. Ohne Key greift ein Offline-Generator.
import { uid } from './store.js';

const SDK_URL = 'https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@1.4.0/+esm';
const MODEL = 'claude-opus-5-5';

export const PROJECT_TYPES = ['Commercial', 'Social Reel', 'Imagefilm', 'Event', 'Hochzeit', 'Musikvideo', 'Produkt', 'Portrait', 'Immobilie', 'Dokumentation'];
export const SHOT_TYPES = ['Wide', 'Medium', 'Close', 'Detail', 'Drone', 'POV', 'Interview', 'Timelapse'];

const str = { type: 'string' };
const strArr = { type: 'array', items: str };
const BRIEF_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'client', 'type', 'summary', 'goal', 'audience', 'date', 'location', 'palette', 'moodKeywords', 'deliverables', 'shotlist', 'hooks', 'questions', 'gear'],
  properties: {
    title: str,
    client: str,
    type: { type: 'string', enum: PROJECT_TYPES },
    summary: str,
    goal: str,
    audience: str,
    date: { type: 'string', description: 'YYYY-MM-DD oder leer' },
    location: str,
    palette: { type: 'string', enum: ['warm', 'primary', 'cool'] },
    moodKeywords: strArr,
    deliverables: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['format', 'length', 'platform'],
        properties: { format: str, length: str, platform: str },
      },
    },
    shotlist: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['visual', 'audio', 'shotType', 'duration'],
        properties: { visual: str, audio: str, shotType: { type: 'string', enum: SHOT_TYPES }, duration: str },
      },
    },
    hooks: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['level', 'label', 'text'],
        properties: { level: { type: 'integer' }, label: str, text: str },
      },
    },
    questions: strArr,
    gear: strArr,
  },
};

const SYSTEM = `Du bist Creative Director und Produktionsplaner für Fabian Visuals, einen Foto- und Videografen aus Bonn (Commercials, Social Content, Events, Hochzeiten, Brands).
Du bekommst ein gesprochenes, oft unstrukturiertes Transkript (z. B. Notizen nach einem Kundencall) und machst daraus ein produktionsreifes Briefing.

Regeln:
- Sprache: Deutsch, locker-professionell, Sprache der Kreativbranche. Kurz und bildhaft.
- Erfinde keine Fakten über Kunde, Datum oder Ort. Unbekanntes bleibt ein leerer String; offene Punkte kommen in "questions".
- "date": nur wenn genannt, als YYYY-MM-DD (relativ zum heutigen Datum aufgelöst).
- "shotlist": 6–12 konkrete Shots in sinnvoller Schnittreihenfolge. "visual" beschreibt das Bild so, dass man es sofort sieht (Kamerabewegung, Licht, Perspektive). "audio" ist VO, O-Ton, Musik oder Sound-Design zu genau diesem Shot.
- "hooks": genau 5 Hooks für die ersten 2 Sekunden, level 1 (safe) bis 5 (völlig verrückt/kreativ), mit kurzem Label.
- "palette": warm (rot/lila/cyan), primary (lila/blau/cyan) oder cool (blau/cyan/grün) – passend zur Stimmung.
- "gear": realistische Ausrüstung für die Produktion (kurz).
- "deliverables": Formate wie 9:16, 16:9, 1:1 mit Länge und Plattform.`;

let sdkPromise = null;
async function client(apiKey) {
  sdkPromise ||= import(SDK_URL);
  const mod = await sdkPromise;
  const Anthropic = mod.default || mod.Anthropic;
  // Der Key gehört dir und liegt nur auf deinem Gerät – deshalb ist der Browser-Aufruf hier okay.
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

async function callJSON({ apiKey, system, user, schema, maxTokens = 16000 }) {
  const anthropic = await client(apiKey);
  const response = await anthropic.beta.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'medium', format: { type: 'json_schema', schema } },
    system,
    messages: [{ role: 'user', content: user }],
  });
  if (response.stop_reason === 'refusal') throw new Error('Claude hat die Anfrage abgelehnt. Formuliere sie etwas anders.');
  if (response.stop_reason === 'max_tokens') throw new Error('Antwort wurde abgeschnitten. Versuch es mit einem kürzeren Transkript.');
  const text = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  return JSON.parse(text);
}

function friendlyError(err) {
  const s = err?.status;
  if (s === 401) return 'API-Key ungültig. Prüfe ihn in den Einstellungen.';
  if (s === 429) return 'Zu viele Anfragen. Kurz warten und nochmal.';
  if (s >= 500) return 'Claude ist gerade überlastet. Ich nutze den Offline-Generator.';
  if (err instanceof TypeError) return 'Keine Verbindung. Ich nutze den Offline-Generator.';
  return err?.message || 'Unbekannter Fehler';
}

/** Transkript → Brief-Daten. Liefert { data, source, warning? } */
export async function generateBrief(transcript, apiKey) {
  const today = new Date().toISOString().slice(0, 10);
  if (apiKey) {
    try {
      const data = await callJSON({
        apiKey, system: SYSTEM, schema: BRIEF_SCHEMA,
        user: `Heute ist ${today} (${new Date().toLocaleDateString('de-DE', { weekday: 'long' })}).\n\nTranskript:\n"""\n${transcript}\n"""`,
      });
      return { data: normalize(data), source: 'claude' };
    } catch (err) {
      const msg = friendlyError(err);
      if (err?.status === 401 || err?.status === 429) throw new Error(msg);
      return { data: offlineBrief(transcript), source: 'offline', warning: msg };
    }
  }
  await new Promise((r) => setTimeout(r, 1400)); // kurz „denken“ lassen – fühlt sich besser an
  return { data: offlineBrief(transcript), source: 'offline' };
}

const HOOK_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['hooks'],
  properties: { hooks: BRIEF_SCHEMA.properties.hooks },
};

export async function generateHooks(brief, apiKey) {
  if (apiKey) {
    try {
      const data = await callJSON({
        apiKey, system: SYSTEM, schema: HOOK_SCHEMA, maxTokens: 8000,
        user: `Gib mir 5 NEUE Hooks (level 1 safe bis 5 verrückt), anders als diese: ${brief.hooks.map((h) => h.text).join(' | ')}\n\nProjekt: ${brief.title} (${brief.type}) für ${brief.client || 'Kunde'}.\n${brief.summary}\nZiel: ${brief.goal}\nZielgruppe: ${brief.audience}`,
      });
      return data.hooks.map(cleanHook);
    } catch (err) {
      if (err?.status === 401) throw new Error(friendlyError(err));
    }
  }
  await new Promise((r) => setTimeout(r, 700));
  return hookTemplates(brief.type, brief.client || brief.title, true);
}

function cleanHook(h, i) {
  return { level: Math.max(1, Math.min(5, h.level || i + 1)), label: h.label || '', text: h.text || '' };
}

function normalize(d) {
  return {
    ...d,
    shotlist: (d.shotlist || []).map((s) => ({ id: uid(), done: false, ...s })),
    hooks: (d.hooks || []).map(cleanHook).sort((a, b) => a.level - b.level),
  };
}

/* ───────────────────────── Offline-Generator ───────────────────────── */

const TYPE_RULES = [
  ['Hochzeit', /hochzeit|braut|trauung|wedding|standesamt/i],
  ['Musikvideo', /musikvideo|song|artist|rapper|band|single|track/i],
  ['Event', /event|konferenz|messe|festival|party|gala|konzert|firmenfeier/i],
  ['Immobilie', /immobilie|wohnung|haus|makler|exposé|expose/i],
  ['Produkt', /produkt|packshot|e-?commerce|shop|flasche|kosmetik/i],
  ['Portrait', /portrait|porträt|headshot|bewerbungsfoto|personal brand/i],
  ['Imagefilm', /imagefilm|unternehmensfilm|recruiting|arbeitgeber|team ?film/i],
  ['Social Reel', /reel|tiktok|instagram|short|story|social/i],
  ['Dokumentation', /doku|dokumentation|reportage|behind the scenes/i],
];

const SHOTS = {
  default: [
    ['Establishing: Location in Weitwinkel, langsamer Push-In', 'Atmo + Musik startet leise', 'Wide', '3s'],
    ['Detail: Hände bei der Arbeit / Produkt in Aktion, Shallow DOF', 'Sound-Design: Foley der Aktion', 'Detail', '2s'],
    ['Portrait der Hauptperson, Gegenlicht, Blick in die Kamera', 'VO: Kernbotschaft in einem Satz', 'Close', '3s'],
    ['Gimbal-Follow durch den Raum, Bewegung von links nach rechts', 'Musik baut auf', 'Medium', '4s'],
    ['Interview-Setup, 2-Kamera (Total + Close)', 'O-Ton: Warum wir das machen', 'Interview', '8s'],
    ['Slow-Mo-Moment (120fps) – der emotionale Höhepunkt', 'Beat-Drop / Musik-Peak', 'Close', '2s'],
    ['Drohne oder High-Angle, Location im Kontext', 'Musik trägt', 'Drone', '3s'],
    ['Logo-/Endcard-Shot mit Call-to-Action', 'VO: CTA', 'Medium', '2s'],
  ],
  'Hochzeit': [
    ['Getting Ready: Kleid am Fenster, weiches Seitenlicht', 'Atmo, leise Klaviermusik', 'Detail', '3s'],
    ['Ringe & Details auf Leinen, Macro', 'Musik', 'Detail', '2s'],
    ['First Look: Bräutigam dreht sich um, Close auf Reaktion', 'O-Ton / Lachen', 'Close', '4s'],
    ['Einzug in die Trauung, Gimbal von vorne', 'Musik + Atmo', 'Medium', '4s'],
    ['Ja-Wort, 2-Kamera (Total + Close)', 'O-Ton: Eheversprechen', 'Close', '6s'],
    ['Paarshooting zur Golden Hour, Gegenlicht & Flares', 'VO-Ausschnitt aus Rede', 'Wide', '5s'],
    ['Party: Wurf des Brautstraußes, Slow-Mo', 'Musik-Peak', 'Medium', '2s'],
    ['Wunderkerzen-Auszug, Low-Light', 'Jubel, Musik endet', 'Wide', '3s'],
  ],
  'Event': [
    ['Timelapse: Aufbau / Einlass', 'Musik, rhythmisch', 'Timelapse', '3s'],
    ['Branding-Details: Bühne, Logo, Badges', 'Sound-Design: Whoosh', 'Detail', '2s'],
    ['Speaker auf der Bühne, lange Brennweite', 'O-Ton: stärkster Satz', 'Medium', '4s'],
    ['Publikum reagiert, Applaus, Lachen', 'Applaus', 'Wide', '2s'],
    ['Networking: Handshakes, Gespräche, Gimbal', 'Musik', 'Medium', '3s'],
    ['Kurz-Interview mit Gast (Testimonial)', 'O-Ton', 'Interview', '6s'],
    ['Highlight-Moment in Slow-Mo', 'Musik-Peak', 'Close', '2s'],
    ['Abschluss: Location von außen, Abendlicht', 'Musik endet, Logo', 'Drone', '3s'],
  ],
  'Musikvideo': [
    ['Performance-Total: Artist im Lichtkegel, Haze', 'Intro', 'Wide', '4s'],
    ['Lip-Sync-Close, Handheld, leichte Bewegung', 'Strophe 1', 'Close', '6s'],
    ['Story-B-Roll: Artist läuft nachts durch die Stadt, Neonlicht', 'Strophe 1', 'Medium', '5s'],
    ['Speed-Ramp-Übergang auf den Beat', 'Pre-Hook', 'Medium', '1s'],
    ['Hook: 360°-Kamerafahrt um den Artist', 'Hook', 'Medium', '6s'],
    ['Details: Hände, Schmuck, Mikro, Macro', 'Strophe 2', 'Detail', '2s'],
    ['Drohne / Top-Down über der Szene', 'Bridge', 'Drone', '4s'],
    ['Finale: Lichtwechsel, Artist schaut in die Linse', 'Outro', 'Close', '3s'],
  ],
  'Social Reel': [
    ['Hook-Shot: schnelle Bewegung in die Kamera, Pattern-Interrupt', 'Hook-VO / Text-on-Screen', 'Close', '1.5s'],
    ['POV: Blick durch die Augen des Kunden', 'Trending Sound', 'POV', '2s'],
    ['Detail-Montage, 3 Shots à 0,5s auf den Beat', 'Beat', 'Detail', '1.5s'],
    ['Person im Fokus, Gegenlicht, natürliche Reaktion', 'VO: Mehrwert in einem Satz', 'Medium', '3s'],
    ['Transition: Match-Cut / Whip-Pan', 'Whoosh', 'Medium', '1s'],
    ['Payoff-Shot: Ergebnis / Produkt in Szene', 'Musik-Peak', 'Close', '2s'],
    ['Loop-Ende: zurück zum ersten Bild', 'CTA-Text', 'Medium', '1.5s'],
  ],
};

function hookTemplates(type, name, shuffle = false) {
  const n = name || 'euch';
  const sets = {
    'Hochzeit': [
      'Ein Tag. Tausend Momente. Das ist eurer.',
      'Er wusste nicht, dass sie hinter ihm steht.',
      'POV: Du siehst deine Hochzeit zum ersten Mal wieder.',
      'Dieses Video hat ihre Oma zum Weinen gebracht. Zweimal.',
      'Wir haben die Hochzeit rückwärts gefilmt. Fang beim Ende an.',
    ],
    'Event': [
      `Das war ${n} – in 30 Sekunden.`,
      'Du warst nicht da? Dann pass jetzt auf.',
      'POV: Du stehst 2 Minuten vor Showbeginn hinter der Bühne.',
      '500 Leute, 1 Raum, 0 Langeweile.',
      'Dieses Event existiert nur noch in diesem Video.',
    ],
    'Musikvideo': [
      'Neuer Song. Ab jetzt überall.',
      'Wir hatten 1 Nacht und 0 Budget für Fehler.',
      'POV: Du hörst den Song zum ersten Mal – laut.',
      'Dreh den Ton auf. Nicht fragen.',
      'Diese Szene ist echt. Das Auto auch. Leider.',
    ],
  };
  const generic = [
    `Das ist ${n}. Und das solltest du kennen.`,
    `Was wäre, wenn ${n} alles anders macht?`,
    `POV: Dein erster Tag bei ${n}.`,
    'Stopp. Genau dieser Moment.',
    'Wir haben die Kamera einfach mal dem Kunden gegeben.',
  ];
  let list = sets[type] || generic;
  if (shuffle) list = [...generic, ...list].sort(() => Math.random() - 0.5).slice(0, 5);
  const labels = ['Safe', 'Neugier', 'POV', 'Mutig', 'Verrückt'];
  return list.map((text, i) => ({ level: i + 1, label: labels[i], text }));
}

const WEEKDAYS = ['sonntag', 'montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag'];
const MONTHS = ['januar', 'februar', 'märz', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'dezember'];

function findDate(t) {
  const low = t.toLowerCase();
  const now = new Date(); now.setHours(12, 0, 0, 0);
  const iso = (d) => d.toISOString().slice(0, 10);
  let m = low.match(/(\d{1,2})\.\s?(\d{1,2})\.(\s?(\d{2,4}))?/);
  if (m) {
    let y = m[4] ? +m[4] : now.getFullYear(); if (y < 100) y += 2000;
    const d = new Date(y, +m[2] - 1, +m[1], 12);
    if (!m[4] && d < now) d.setFullYear(y + 1);
    return iso(d);
  }
  m = low.match(new RegExp(`(\\d{1,2})\\.?\\s(${MONTHS.join('|')})`));
  if (m) {
    const d = new Date(now.getFullYear(), MONTHS.indexOf(m[2]), +m[1], 12);
    if (d < now) d.setFullYear(d.getFullYear() + 1);
    return iso(d);
  }
  if (/übermorgen/.test(low)) return iso(new Date(+now + 2 * 864e5));
  if (/morgen/.test(low)) return iso(new Date(+now + 864e5));
  if (/heute/.test(low)) return iso(now);
  for (let i = 0; i < 7; i++) {
    if (new RegExp(`(nächsten|kommenden|am)\\s${WEEKDAYS[i]}`).test(low)) {
      const d = new Date(now); let diff = (i - d.getDay() + 7) % 7 || 7;
      d.setDate(d.getDate() + diff); return iso(d);
    }
  }
  return '';
}

function findAfter(t, words) {
  const re = new RegExp(`\\b(?:${words})\\s+((?:[A-ZÄÖÜ][\\wäöüß&\\-]*\\s?){1,3}(?:(?:und|&)\\s[A-ZÄÖÜ][\\wäöüß\\-]*)?)`);
  const m = t.match(re);
  return m ? m[1].trim().replace(/[.,]$/, '') : '';
}

export function offlineBrief(transcript) {
  const t = transcript.trim();
  const type = (TYPE_RULES.find(([, re]) => re.test(t)) || ['Commercial'])[0];
  const client = findAfter(t, 'für|Kunde|Kundin|von|mit');
  const location = findAfter(t, 'in|im|am|auf der|auf dem|bei');
  const date = findDate(t);
  const warm = /warm|gold|sonnenuntergang|gemütlich|herbst|hochzeit|liebe|cozy/i.test(t);
  const cool = /kühl|clean|tech|modern|minimal|nacht|winter|corporate/i.test(t);
  const palette = warm ? 'warm' : cool ? 'cool' : 'primary';
  const vertical = /reel|tiktok|story|short|instagram|hochkant/i.test(t);
  const longform = /film|minuten|youtube|website|16:9|querformat/i.test(t);
  const deliverables = [];
  if (longform || !vertical) deliverables.push({ format: '16:9', length: (t.match(/(\d+)\s?minuten/i)?.[1] || '1–2') + ' min', platform: 'Website / YouTube' });
  deliverables.push({ format: '9:16', length: '15–30 s', platform: vertical ? 'Instagram / TikTok' : 'Social Cutdown' });
  const shots = (SHOTS[type] || (vertical ? SHOTS['Social Reel'] : SHOTS.default))
    .map(([visual, audio, shotType, duration]) => ({ id: uid(), visual, audio, shotType, duration, done: false }));
  const sentences = t.split(/(?<=[.!?])\s+/).filter(Boolean);
  const summary = sentences.slice(0, 2).join(' ') || t.slice(0, 220);
  const questions = [];
  if (!date) questions.push('Drehtermin klären');
  if (!location) questions.push('Location festlegen und besichtigen');
  if (!/budget|€|euro/i.test(t)) questions.push('Budget-Rahmen abstimmen');
  questions.push('Musik: Lizenz-Track oder Trending Sound?');
  const gear = ['Hauptkamera + Backup-Body', '24-70 mm f/2.8', '85 mm f/1.4', 'Gimbal', 'Funkstrecke (Ton)', 'Akkus & Karten x2'];
  if (/drohne|luft|von oben/i.test(t) || type === 'Immobilie') gear.push('Drohne');
  if (type === 'Event' || type === 'Hochzeit') gear.push('LED-Licht (on-camera)');

  return {
    title: client ? `${type} – ${client}` : `${type}-Projekt`,
    client,
    type,
    summary,
    goal: /verkauf|umsatz|buchung|reservier/i.test(t) ? 'Conversions & Buchungen steigern' : /recruit|bewerb|mitarbeiter/i.test(t) ? 'Neue Talente gewinnen' : 'Sichtbarkeit & Markenwirkung stärken',
    audience: '',
    date,
    location,
    palette,
    moodKeywords: [warm ? 'Warm' : cool ? 'Clean' : 'Cinematic', vertical ? 'Dynamisch' : 'Ruhig', type === 'Hochzeit' ? 'Emotional' : 'Authentisch'],
    deliverables,
    shotlist: shots,
    hooks: hookTemplates(type, client),
    questions,
    gear,
  };
}
