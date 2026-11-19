// Reference image -> compact look parameters (see CLAUDE.md 4.2 / 4.3).

import { srgbToOklab, clamp } from './color.js';
import { NEUTRAL, zoneWeights } from './look.js';

export const MAX_ANALYSIS_SIZE = 512;

// ---------------------------------------------------------------------------
// Loading (browser only)
// ---------------------------------------------------------------------------

export async function loadImage(source) {
  if (source instanceof Blob) {
    if ('createImageBitmap' in window) return createImageBitmap(source);
    source = URL.createObjectURL(source);
  }
  const img = new Image();
  img.decoding = 'async';
  img.src = source;
  await img.decode();
  return img;
}

// Draw an image scaled to max `maxSize` px on the long edge, return RGBA pixels.
export function imageToPixels(img, maxSize = MAX_ANALYSIS_SIZE) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const s = Math.min(1, maxSize / Math.max(iw, ih));
  const width = Math.max(1, Math.round(iw * s));
  const height = Math.max(1, Math.round(ih * s));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);
  return { data: ctx.getImageData(0, 0, width, height).data, width, height };
}

// ---------------------------------------------------------------------------
// Letterbox detection
// A bar row/column is near-black (mean < 8/255) and flat (std < 3/255).
// Scan inwards from each edge, at most 30 % per side.
// ---------------------------------------------------------------------------

const BAR_MEAN = 8 / 255;
const BAR_STD = 3 / 255;
const BAR_MAX = 0.3;

function lineIsBar(data, width, start, step, count) {
  let sum = 0, sum2 = 0;
  for (let i = 0, idx = start; i < count; i++, idx += step) {
    const v = (data[idx] + data[idx + 1] + data[idx + 2]) / (3 * 255);
    sum += v;
    sum2 += v * v;
  }
  const mean = sum / count;
  const std = Math.sqrt(Math.max(0, sum2 / count - mean * mean));
  return mean < BAR_MEAN && std < BAR_STD;
}

export function detectLetterbox(data, width, height) {
  const rowBar = (y) => lineIsBar(data, width, y * width * 4, 4, width);
  const colBar = (x) => lineIsBar(data, width, x * 4, width * 4, height);
  const maxH = Math.floor(height * BAR_MAX);
  const maxW = Math.floor(width * BAR_MAX);
  let top = 0, bottom = 0, left = 0, right = 0;
  while (top < maxH && rowBar(top)) top++;
  while (bottom < maxH && rowBar(height - 1 - bottom)) bottom++;
  while (left < maxW && colBar(left)) left++;
  while (right < maxW && colBar(width - 1 - right)) right++;
  // Real letterbox / pillarbox bars are symmetric. A dark area on one side only
  // is scene content (night sky, dark floor) and must stay in the statistics.
  const sym = (p, q, size) => (Math.abs(p - q) <= Math.max(2, size * 0.02) ? [p, q] : [0, 0]);
  [top, bottom] = sym(top, bottom, height);
  [left, right] = sym(left, right, width);
  return { top, bottom, left, right };
}

// ---------------------------------------------------------------------------
// Histogram helpers (fast, allocation-light percentiles / weighted medians)
// ---------------------------------------------------------------------------

class Histogram {
  constructor(min, max, bins) {
    this.min = min; this.max = max; this.bins = bins;
    this.h = new Float64Array(bins);
    this.total = 0;
  }
  add(v, w = 1) {
    if (w <= 0) return;
    const i = clamp(Math.floor(((v - this.min) / (this.max - this.min)) * this.bins), 0, this.bins - 1);
    this.h[i] += w;
    this.total += w;
  }
  // Percentile with linear interpolation inside the bin.
  quantile(q) {
    if (this.total <= 0) return NaN;
    const target = q * this.total;
    let acc = 0;
    const bw = (this.max - this.min) / this.bins;
    for (let i = 0; i < this.bins; i++) {
      const c = this.h[i];
      if (acc + c >= target && c > 0) return this.min + bw * (i + (target - acc) / c);
      acc += c;
    }
    return this.max;
  }
}

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------

const CLIP_LO = 2 / 255;
const CLIP_HI = 253 / 255;

// Analyze RGBA pixels and return { look, stats }.
export function analyzePixels(data, width, height, { ignoreLetterbox = true } = {}) {
  const crop = ignoreLetterbox
    ? detectLetterbox(data, width, height)
    : { top: 0, bottom: 0, left: 0, right: 0 };

  const histL = new Histogram(0, 1, 2048);
  // Relative chroma C / L: dark pixels have little chroma by nature, so plain C
  // would call every night shot "desaturated".
  const histC = new Histogram(0, 1, 2048);
  const tint = ['s', 'm', 'h'].map(() => ({
    a: new Histogram(-0.4, 0.4, 2048),
    b: new Histogram(-0.4, 0.4, 2048),
  }));

  const lab = [0, 0, 0];
  const w = [0, 0, 0];
  let used = 0, clipped = 0;

  for (let y = crop.top; y < height - crop.bottom; y++) {
    for (let x = crop.left; x < width - crop.right; x++) {
      const i = (y * width + x) * 4;
      const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
      if ((r <= CLIP_LO && g <= CLIP_LO && b <= CLIP_LO) || (r >= CLIP_HI && g >= CLIP_HI && b >= CLIP_HI)) {
        clipped++;
        continue;
      }
      srgbToOklab(r, g, b, lab);
      const L = lab[0];
      histL.add(L);
      if (L > 0.15) histC.add(Math.hypot(lab[1], lab[2]) / L);
      zoneWeights(L, w);
      for (let z = 0; z < 3; z++) {
        tint[z].a.add(lab[1], w[z]);
        tint[z].b.add(lab[2], w[z]);
      }
      used++;
    }
  }

  if (used < 16) {
    throw new Error('Zu wenige auswertbare Pixel im Bild (fast alles schwarz oder weiß).');
  }

  const zoneTint = (z) => {
    // Need a meaningful share of pixels in the zone; otherwise no tint.
    if (tint[z].a.total < used * 0.02) return { a: 0, b: 0 };
    return { a: tint[z].a.quantile(0.5), b: tint[z].b.quantile(0.5) };
  };

  const look = {
    blackPoint: histL.quantile(0.01),
    whitePoint: histL.quantile(0.99),
    midpoint: histL.quantile(0.5),
    contrast: histL.quantile(0.75) - histL.quantile(0.25),
    shadowsTint: zoneTint(0),
    midsTint: zoneTint(1),
    highlightsTint: zoneTint(2),
    saturation: histC.total > 0 ? clamp(histC.quantile(0.5) / NEUTRAL.chroma, 0.4, 1.6) : 1,
  };

  return {
    look,
    stats: { width, height, crop, used, clipped, total: width * height },
  };
}
