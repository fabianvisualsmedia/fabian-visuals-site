// .cube writer, file naming, download, automatic look names.

import { oklabToOklch } from './color.js';

// Strip characters that break the quoted TITLE line or some parsers.
// Kept to printable ASCII on purpose: not every grading app reads UTF-8 titles.
function sanitizeTitle(name) {
  return String(name)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/"/g, "'")
    .trim()
    .slice(0, 60) || 'Untitled';
}

export function lutToCube(lut, N, name) {
  const lines = [
    `TITLE "Lumic Look - ${sanitizeTitle(name)}"`,
    '# Created with Lumic Cloud Steal-the-Look',
    `LUT_3D_SIZE ${N}`,
    'DOMAIN_MIN 0.0 0.0 0.0',
    'DOMAIN_MAX 1.0 1.0 1.0',
  ];
  const count = N * N * N;
  for (let i = 0; i < count; i++) {
    const o = i * 3;
    lines.push(`${lut[o].toFixed(6)} ${lut[o + 1].toFixed(6)} ${lut[o + 2].toFixed(6)}`);
  }
  return lines.join('\n') + '\n';
}

export function slugify(name) {
  return sanitizeTitle(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'look';
}

// lumic_<lookname>_<size>_<rec709|vlog>.cube
export function cubeFileName(name, N, input = 'rec709') {
  return `lumic_${slugify(name)}_${N}_${input === 'vlog' ? 'vlog' : 'rec709'}.cube`;
}

export function downloadText(text, filename, mime = 'text/plain') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---------------------------------------------------------------------------
// Automatic names: "<Color> <Mood> <NN>" – generic words only, never film,
// series or brand names (CLAUDE.md §9).
// ---------------------------------------------------------------------------

const HUE_WORDS = [
  [0, 'Rose'], [20, 'Ember'], [45, 'Amber'], [80, 'Honey'], [115, 'Moss'],
  [160, 'Jade'], [185, 'Teal'], [220, 'Ice'], [250, 'Cobalt'], [285, 'Indigo'],
  [310, 'Violet'], [340, 'Rose'],
];

function hueWord(a, b) {
  const [, C, h] = oklabToOklch(0, a, b);
  if (C < 0.008) return 'Ash';
  let word = HUE_WORDS[0][1];
  for (const [deg, w] of HUE_WORDS) if (h >= deg) word = w;
  return word;
}

function moodWord(look) {
  if (look.blackPoint > 0.22) return 'Haze';
  if (look.midpoint < 0.42) return 'Night';
  if (look.midpoint < 0.52) return 'Dusk';
  if (look.midpoint < 0.64) return 'Hour';
  return 'Bloom';
}

export function suggestName(look) {
  // Dominant color: shadows and highlights carry the grade, mids carry content.
  const a = look.shadowsTint.a + look.highlightsTint.a + 0.5 * look.midsTint.a;
  const b = look.shadowsTint.b + look.highlightsTint.b + 0.5 * look.midsTint.b;
  const seed = Math.abs(Math.round((a * 7919 + b * 6271 + look.midpoint * 104729) * 1000));
  const nn = String((seed % 99) + 1).padStart(2, '0');
  return `${hueWord(a, b)} ${moodWord(look)} ${nn}`;
}
