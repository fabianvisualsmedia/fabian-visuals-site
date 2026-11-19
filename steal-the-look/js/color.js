// Color space math: sRGB, linear sRGB, Oklab / Oklch, Panasonic V-Log.
// All functions work on plain numbers (0..1 for display values) so they can be
// used both on the main thread and inside a Web Worker.

// ---------------------------------------------------------------------------
// sRGB transfer function (IEC 61966-2-1)
// ---------------------------------------------------------------------------

// encoded -> linear: c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055)^2.4
export function srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

// linear -> encoded: c <= 0.0031308 ? 12.92 c : 1.055 c^(1/2.4) - 0.055
export function linearToSrgb(c) {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

// ---------------------------------------------------------------------------
// 3x3 matrix helpers
// ---------------------------------------------------------------------------

export function mat3Inverse(m) {
  const [a, b, c] = m[0];
  const [d, e, f] = m[1];
  const [g, h, i] = m[2];
  const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g;
  const det = a * A + b * B + c * C;
  return [
    [A / det, -(b * i - c * h) / det, (b * f - c * e) / det],
    [B / det, (a * i - c * g) / det, -(a * f - c * d) / det],
    [C / det, -(a * h - b * g) / det, (a * e - b * d) / det],
  ];
}

export function mat3Mul(m, n) {
  const out = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++)
      out[r][c] = m[r][0] * n[0][c] + m[r][1] * n[1][c] + m[r][2] * n[2][c];
  return out;
}

// ---------------------------------------------------------------------------
// Oklab (Björn Ottosson, 2020)
//   lms  = M1 · linearRGB
//   lms' = cbrt(lms)
//   Lab  = M2 · lms'
// The inverse matrices are computed from the forward ones in float64, which
// keeps the roundtrip error around 1e-12 (the published inverse constants are
// rounded and would only reach ~1e-7).
// ---------------------------------------------------------------------------

const M1 = [
  [0.4122214708, 0.5363325363, 0.0514459929],
  [0.2119034982, 0.6806995451, 0.1073969566],
  [0.0883024619, 0.2817188376, 0.6299787005],
];
const M2 = [
  [0.2104542553, 0.7936177850, -0.0040720468],
  [1.9779984951, -2.4285922050, 0.4505937099],
  [0.0259040371, 0.7827717662, -0.8086757660],
];
const M1_INV = mat3Inverse(M1);
const M2_INV = mat3Inverse(M2);

export function linearSrgbToOklab(r, g, b, out = [0, 0, 0]) {
  const l = Math.cbrt(M1[0][0] * r + M1[0][1] * g + M1[0][2] * b);
  const m = Math.cbrt(M1[1][0] * r + M1[1][1] * g + M1[1][2] * b);
  const s = Math.cbrt(M1[2][0] * r + M1[2][1] * g + M1[2][2] * b);
  out[0] = M2[0][0] * l + M2[0][1] * m + M2[0][2] * s;
  out[1] = M2[1][0] * l + M2[1][1] * m + M2[1][2] * s;
  out[2] = M2[2][0] * l + M2[2][1] * m + M2[2][2] * s;
  return out;
}

export function oklabToLinearSrgb(L, a, b, out = [0, 0, 0]) {
  let l = M2_INV[0][0] * L + M2_INV[0][1] * a + M2_INV[0][2] * b;
  let m = M2_INV[1][0] * L + M2_INV[1][1] * a + M2_INV[1][2] * b;
  let s = M2_INV[2][0] * L + M2_INV[2][1] * a + M2_INV[2][2] * b;
  l = l * l * l; m = m * m * m; s = s * s * s;
  out[0] = M1_INV[0][0] * l + M1_INV[0][1] * m + M1_INV[0][2] * s;
  out[1] = M1_INV[1][0] * l + M1_INV[1][1] * m + M1_INV[1][2] * s;
  out[2] = M1_INV[2][0] * l + M1_INV[2][1] * m + M1_INV[2][2] * s;
  return out;
}

// Convenience: gamma-encoded sRGB <-> Oklab
export function srgbToOklab(r, g, b, out = [0, 0, 0]) {
  return linearSrgbToOklab(srgbToLinear(r), srgbToLinear(g), srgbToLinear(b), out);
}

export function oklabToSrgb(L, a, b, out = [0, 0, 0]) {
  oklabToLinearSrgb(L, a, b, out);
  out[0] = linearToSrgb(out[0]);
  out[1] = linearToSrgb(out[1]);
  out[2] = linearToSrgb(out[2]);
  return out;
}

// ---------------------------------------------------------------------------
// Oklch: polar form of Oklab. C = sqrt(a² + b²), h = atan2(b, a) in degrees [0, 360)
// ---------------------------------------------------------------------------

export function oklabToOklch(L, a, b, out = [0, 0, 0]) {
  out[0] = L;
  out[1] = Math.sqrt(a * a + b * b);
  let h = Math.atan2(b, a) * (180 / Math.PI);
  out[2] = h < 0 ? h + 360 : h;
  return out;
}

export function oklchToOklab(L, C, hDeg, out = [0, 0, 0]) {
  const h = hDeg * (Math.PI / 180);
  out[0] = L;
  out[1] = C * Math.cos(h);
  out[2] = C * Math.sin(h);
  return out;
}

// ---------------------------------------------------------------------------
// Panasonic V-Log (V-Log/V-Gamut Reference Manual, Rev. 1.0)
//   encode: x < 0.01  -> 5.6 x + 0.125
//           else      -> c · log10(x + b) + d
//   decode: y < 0.181 -> (y - 0.125) / 5.6
//           else      -> 10^((y - d) / c) - b
// Reference points: 0 % black -> 128/1023, 18 % grey -> 433/1023, 90 % white -> 602/1023
// ---------------------------------------------------------------------------

const VLOG_CUT1 = 0.01;
const VLOG_CUT2 = 0.181;
const VLOG_B = 0.00873;
const VLOG_C = 0.241514;
const VLOG_D = 0.598206;

export function vlogToLinear(v) {
  return v < VLOG_CUT2 ? (v - 0.125) / 5.6 : Math.pow(10, (v - VLOG_D) / VLOG_C) - VLOG_B;
}

export function linearToVlog(x) {
  return x < VLOG_CUT1 ? 5.6 * x + 0.125 : VLOG_C * Math.log10(x + VLOG_B) + VLOG_D;
}

// ---------------------------------------------------------------------------
// Gamut matrices from chromaticity primaries (standard RGB -> XYZ derivation)
// ---------------------------------------------------------------------------

function rgbToXyzMatrix(p, white) {
  const xyz = ([x, y]) => [x / y, 1, (1 - x - y) / y];
  const R = xyz(p.r), G = xyz(p.g), B = xyz(p.b), W = xyz(white);
  const P = [[R[0], G[0], B[0]], [R[1], G[1], B[1]], [R[2], G[2], B[2]]];
  const Pi = mat3Inverse(P);
  const S = [0, 1, 2].map((i) => Pi[i][0] * W[0] + Pi[i][1] * W[1] + Pi[i][2] * W[2]);
  return P.map((row) => row.map((v, j) => v * S[j]));
}

const D65 = [0.3127, 0.3290];
const REC709_PRIMARIES = { r: [0.64, 0.33], g: [0.30, 0.60], b: [0.15, 0.06] };
const VGAMUT_PRIMARIES = { r: [0.730, 0.280], g: [0.165, 0.840], b: [0.100, -0.030] };

// linear V-Gamut -> linear Rec.709 / sRGB primaries
export const VGAMUT_TO_REC709 = mat3Mul(
  mat3Inverse(rgbToXyzMatrix(REC709_PRIMARIES, D65)),
  rgbToXyzMatrix(VGAMUT_PRIMARIES, D65),
);

// ---------------------------------------------------------------------------
// Small math helpers shared across modules
// ---------------------------------------------------------------------------

export const clamp = (x, lo, hi) => (x < lo ? lo : x > hi ? hi : x);
export const lerp = (a, b, t) => a + (b - a) * t;

export function smoothstep(e0, e1, x) {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
}
