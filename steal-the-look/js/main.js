// Phase 1 UI: upload reference -> auto look -> download 33³ .cube

import { oklabToSrgb, clamp } from './color.js';
import { loadImage, imageToPixels, analyzePixels } from './analyze.js';
import { resolveParams, buildToneCurve, NEUTRAL, DEFAULT_CONTROLS } from './look.js';
import { generateLut, LUT_SIZE_STANDARD } from './lut.js';
import { lutToCube, cubeFileName, downloadText, suggestName } from './export.js';

const $ = (id) => document.getElementById(id);

const state = {
  look: null,
  controls: { ...DEFAULT_CONTROLS },
  refUrl: null,
};

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

const drop = $('drop');
const fileInput = $('file');

fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) handleFile(fileInput.files[0]);
});

['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => {
  e.preventDefault();
  drop.classList.add('is-over');
}));
['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, (e) => {
  e.preventDefault();
  drop.classList.remove('is-over');
}));
drop.addEventListener('drop', (e) => {
  const f = [...(e.dataTransfer?.files || [])].find((x) => x.type.startsWith('image/'));
  if (f) handleFile(f);
});

// Paste a screenshot straight from the clipboard
window.addEventListener('paste', (e) => {
  const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith('image/'));
  if (item) handleFile(item.getAsFile());
});

async function handleFile(file) {
  showError(null);
  try {
    const img = await loadImage(file);
    const px = imageToPixels(img);
    const { look, stats } = analyzePixels(px.data, px.width, px.height);
    state.look = look;

    if (state.refUrl) URL.revokeObjectURL(state.refUrl);
    state.refUrl = URL.createObjectURL(file);
    $('refImg').src = state.refUrl;
    $('dropEmpty').hidden = true;
    $('dropPreview').hidden = false;

    const c = stats.crop;
    const bars = c.top + c.bottom + c.left + c.right > 0 ? ' · Letterbox ignoriert' : '';
    $('refMeta').textContent = `${img.width} × ${img.height}px${bars}`;

    $('lookName').disabled = false;
    $('lookName').value = suggestName(look);
    $('download').disabled = false;
    $('lookBadge').textContent = 'auto';

    renderAnalysis();
    updateFileHint();
  } catch (err) {
    console.error(err);
    showError(err.message || 'Das Bild konnte nicht gelesen werden.');
  }
}

// ---------------------------------------------------------------------------
// Analysis display
// ---------------------------------------------------------------------------

function tintToCss({ a, b }, L = 0.62) {
  // Exaggerate for visibility; the actual tint is subtle.
  const rgb = oklabToSrgb(L, clamp(a * 3.2, -0.25, 0.25), clamp(b * 3.2, -0.25, 0.25));
  return `rgb(${rgb.map((v) => Math.round(clamp(v, 0, 1) * 255)).join(' ')})`;
}

function fmtTint({ a, b }) {
  const f = (v) => (v >= 0 ? '+' : '−') + Math.abs(v * 100).toFixed(1);
  return `${f(a)} ${f(b)}`;
}

function renderCurve(look) {
  const svg = $('curve');
  const W = 200, H = 120, pad = 10;
  const tone = buildToneCurve(resolveParams(look, state.controls));
  const x = (v) => pad + v * (W - 2 * pad);
  const y = (v) => H - pad - v * (H - 2 * pad);

  let grid = '';
  for (let i = 0; i <= 4; i++) {
    const gx = x(i / 4), gy = y(i / 4);
    grid += `<line x1="${gx}" y1="${pad}" x2="${gx}" y2="${H - pad}" />`;
    grid += `<line x1="${pad}" y1="${gy}" x2="${W - pad}" y2="${gy}" />`;
  }
  let d = '';
  for (let i = 0; i <= 100; i++) {
    const v = i / 100;
    d += `${i ? 'L' : 'M'}${x(v).toFixed(2)},${y(tone(v)).toFixed(2)}`;
  }
  const mid = tone(NEUTRAL.midpoint);
  svg.innerHTML = `
    <defs>
      <linearGradient id="cfill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#6694ff" stop-opacity=".35"/>
        <stop offset="1" stop-color="#6694ff" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <g stroke="rgba(102,148,255,.22)" stroke-width=".5" vector-effect="non-scaling-stroke">${grid}</g>
    <line x1="${x(0)}" y1="${y(0)}" x2="${x(1)}" y2="${y(1)}" stroke="rgba(255,255,255,.18)" stroke-dasharray="2 3" vector-effect="non-scaling-stroke"/>
    <path d="${d}L${x(1)},${y(0)}L${x(0)},${y(0)}Z" fill="url(#cfill)"/>
    <path d="${d}" fill="none" stroke="#fff" stroke-width="1.6" vector-effect="non-scaling-stroke"/>
    <circle cx="${x(NEUTRAL.midpoint)}" cy="${y(mid)}" r="3" fill="#fff"/>
    <circle cx="${x(NEUTRAL.midpoint)}" cy="${y(mid)}" r="7" fill="none" stroke="rgba(255,255,255,.35)"/>
  `;
}

function renderAnalysis() {
  const look = state.look;
  if (!look) return;
  renderCurve(look);

  const zones = [['tintS', look.shadowsTint, 0.45], ['tintM', look.midsTint, 0.62], ['tintH', look.highlightsTint, 0.8]];
  for (const [id, t, L] of zones) {
    const el = $(id);
    el.style.setProperty('--tint', tintToCss(t, L));
    el.querySelector('.tint-val').textContent = fmtTint(t);
  }

  const p = resolveParams(look, state.controls);
  $('statBlack').textContent = p.out0 > 0.005 ? `+${(p.out0 * 100).toFixed(0)} %` : 'satt';
  $('statContrast').textContent = `${p.k >= 0 ? '+' : '−'}${Math.abs(p.k * 100).toFixed(0)}`;
  $('statSat').textContent = `${Math.round(p.sat * 100)} %`;

  // Let the ambient aurora pick up the look's colors
  document.querySelector('.aurora').style.background = `
    radial-gradient(40% 60% at 22% 70%, ${tintToCss(look.shadowsTint, 0.5)}, transparent 70%),
    radial-gradient(30% 50% at 50% 85%, ${tintToCss(look.midsTint, 0.6)}, transparent 70%),
    radial-gradient(30% 50% at 76% 78%, ${tintToCss(look.highlightsTint, 0.75)}, transparent 70%)`;
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

$('lookName').addEventListener('input', updateFileHint);

function updateFileHint() {
  const name = $('lookName').value.trim() || suggestName(state.look);
  $('fileHint').textContent = cubeFileName(name, LUT_SIZE_STANDARD, state.controls.input);
}

$('download').addEventListener('click', () => {
  if (!state.look) return;
  const name = $('lookName').value.trim() || suggestName(state.look);
  const N = LUT_SIZE_STANDARD;
  const lut = generateLut(N, state.look, state.controls);
  downloadText(lutToCube(lut, N, name), cubeFileName(name, N, state.controls.input));
});

function showError(msg) {
  const el = $('error');
  el.hidden = !msg;
  el.textContent = msg || '';
}
