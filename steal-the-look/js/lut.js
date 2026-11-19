// 3D LUT generation.
// Layout matches the .cube standard: R varies fastest, then G, then B.
//   index(r, g, b) = r + g·N + b·N²   (three floats per entry)

import { buildTransform } from './look.js';

export const LUT_SIZE_PREVIEW = 17;
export const LUT_SIZE_STANDARD = 33;
export const LUT_SIZE_HD = 65;

export function generateLutFromTransform(N, transform) {
  const lut = new Float32Array(N * N * N * 3);
  const out = [0, 0, 0];
  const inv = 1 / (N - 1);
  let o = 0;
  for (let b = 0; b < N; b++) {
    for (let g = 0; g < N; g++) {
      for (let r = 0; r < N; r++) {
        transform(r * inv, g * inv, b * inv, out);
        lut[o++] = out[0];
        lut[o++] = out[1];
        lut[o++] = out[2];
      }
    }
  }
  return lut;
}

export function generateLut(N, look, controls) {
  return generateLutFromTransform(N, buildTransform(look, controls));
}

// Identity LUT (useful for tests and as a neutral preview texture)
export function identityLut(N) {
  return generateLutFromTransform(N, (r, g, b, out) => {
    out[0] = r; out[1] = g; out[2] = b;
    return out;
  });
}

// CPU sampling with trilinear interpolation (fallback preview + tests)
export function sampleLut(lut, N, r, g, b, out = [0, 0, 0]) {
  const s = N - 1;
  const fr = Math.min(Math.max(r, 0), 1) * s;
  const fg = Math.min(Math.max(g, 0), 1) * s;
  const fb = Math.min(Math.max(b, 0), 1) * s;
  const r0 = Math.min(Math.floor(fr), s - 1), g0 = Math.min(Math.floor(fg), s - 1), b0 = Math.min(Math.floor(fb), s - 1);
  const dr = fr - r0, dg = fg - g0, db = fb - b0;
  const idx = (ri, gi, bi) => (ri + gi * N + bi * N * N) * 3;
  for (let c = 0; c < 3; c++) {
    const c000 = lut[idx(r0, g0, b0) + c], c100 = lut[idx(r0 + 1, g0, b0) + c];
    const c010 = lut[idx(r0, g0 + 1, b0) + c], c110 = lut[idx(r0 + 1, g0 + 1, b0) + c];
    const c001 = lut[idx(r0, g0, b0 + 1) + c], c101 = lut[idx(r0 + 1, g0, b0 + 1) + c];
    const c011 = lut[idx(r0, g0 + 1, b0 + 1) + c], c111 = lut[idx(r0 + 1, g0 + 1, b0 + 1) + c];
    const c00 = c000 + (c100 - c000) * dr, c10 = c010 + (c110 - c010) * dr;
    const c01 = c001 + (c101 - c001) * dr, c11 = c011 + (c111 - c011) * dr;
    const c0 = c00 + (c10 - c00) * dg, c1 = c01 + (c11 - c01) * dg;
    out[c] = c0 + (c1 - c0) * db;
  }
  return out;
}
