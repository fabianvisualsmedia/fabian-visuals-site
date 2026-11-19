// Look parameters -> per-pixel color transformation.
// Pipeline per color:
//   input (Rec.709 or V-Log) -> Oklab -> tone curve on L -> saturation (Oklch)
//   -> split toning on a/b -> linear sRGB -> hue/lightness-preserving gamut compression -> sRGB

import {
  srgbToLinear, linearToSrgb, linearSrgbToOklab, oklabToLinearSrgb,
  vlogToLinear, VGAMUT_TO_REC709, clamp, smoothstep,
} from './color.js';

// Statistics of a "typical ungraded" frame. The extracted look is expressed
// relative to these values, so a reference that matches NEUTRAL yields (almost)
// no change.
export const NEUTRAL = Object.freeze({
  blackPoint: 0.12,  // Oklab L, 1st percentile
  whitePoint: 0.93,  // Oklab L, 99th percentile
  midpoint: 0.58,    // Oklab L, median
  contrast: 0.34,    // Oklab L, interquartile range
  chroma: 0.075,     // median of relative chroma C / L (pixels with L > 0.15)
});

export const DEFAULT_CONTROLS = Object.freeze({
  intensity: 1,                    // 0 .. 1.5
  contrast: 0,                     // -50 .. +50
  saturation: 0,                   // -50 .. +50
  shadowTint: { a: 0, b: 0 },      // Oklab offset added to the detected tint
  highlightTint: { a: 0, b: 0 },
  protectSkin: true,
  input: 'rec709',                 // 'rec709' | 'vlog'
});

export function neutralLook() {
  return {
    blackPoint: NEUTRAL.blackPoint,
    whitePoint: NEUTRAL.whitePoint,
    midpoint: NEUTRAL.midpoint,
    contrast: NEUTRAL.contrast,
    shadowsTint: { a: 0, b: 0 },
    midsTint: { a: 0, b: 0 },
    highlightsTint: { a: 0, b: 0 },
    saturation: 1,
  };
}

// Soft, overlapping zone weights for shadows / mids / highlights.
// ws + wm + wh = 1 for every L, so the split toning never has hard edges.
export function zoneWeights(L, out = [0, 0, 0]) {
  const ws = 1 - smoothstep(0.2, 0.5, L);
  const wh = smoothstep(0.5, 0.8, L);
  out[0] = ws;
  out[1] = 1 - ws - wh;
  out[2] = wh;
  return out;
}

const TINT_GAIN = { shadows: 1.0, mids: 0.5, highlights: 1.0 };
const MAX_TINT = 0.08;      // max Oklab a/b offset per zone
const SKIN_HUE = [30, 70];  // Oklch hue (degrees) that counts as skin

function scaleTint(t, gain, intensity, user = { a: 0, b: 0 }) {
  let a = (t.a * gain + user.a) * intensity;
  let b = (t.b * gain + user.b) * intensity;
  const m = Math.hypot(a, b);
  if (m > MAX_TINT) { a *= MAX_TINT / m; b *= MAX_TINT / m; }
  return { a, b };
}

// Resolve look + user controls into the concrete numbers used per pixel.
// Every delta is scaled by `intensity`, so intensity 0 is an exact identity.
export function resolveParams(look, controls = DEFAULT_CONTROLS) {
  const c = { ...DEFAULT_CONTROLS, ...controls };
  const t = clamp(c.intensity, 0, 1.5);

  // 1. Black lift / white cap (output range of the tone curve)
  const lift = t * clamp(look.blackPoint - NEUTRAL.blackPoint, 0, 0.2);
  const cap = t * clamp(NEUTRAL.whitePoint - look.whitePoint, 0, 0.25);
  const out0 = lift;
  const out1 = 1 - cap;
  const range = out1 - out0;

  // 2. Midpoint: gamma on the normalized curve so the neutral median lands
  //    where the reference median is (after accounting for lift/cap).
  const g = clamp((look.midpoint - out0) / Math.max(range, 1e-3), 0.25, 0.8);
  const gammaFull = clamp(Math.log(g) / Math.log(NEUTRAL.midpoint), 0.5, 2);
  const gamma = Math.pow(gammaFull, t);

  // 3. Contrast: compare reference IQR to what lift/cap alone would produce.
  const expectedIqr = NEUTRAL.contrast * Math.max(range, 0.2);
  const kAuto = clamp(look.contrast / expectedIqr - 1, -0.6, 0.6);
  const k = clamp(t * (kAuto + c.contrast / 100), -0.8, 0.8);

  // 4. Saturation factor
  const sat = clamp((1 + (look.saturation - 1) * t) * (1 + (c.saturation / 100) * t), 0, 2.5);

  return {
    intensity: t,
    out0, out1, gamma, k, sat,
    shadows: scaleTint(look.shadowsTint, TINT_GAIN.shadows, t, c.shadowTint),
    mids: scaleTint(look.midsTint, TINT_GAIN.mids, t),
    highlights: scaleTint(look.highlightsTint, TINT_GAIN.highlights, t, c.highlightTint),
    protectSkin: !!c.protectSkin,
    input: c.input === 'vlog' ? 'vlog' : 'rec709',
  };
}

// Tone curve on Oklab L. Built from three monotonic pieces:
//   x^gamma  ->  S-curve blend (smoothstep, |k| <= 0.8)  ->  linear remap to [out0, out1]
// Each piece is strictly increasing, so the composition is too.
export function buildToneCurve(p) {
  const { gamma, k, out0, out1 } = p;
  return function tone(L) {
    let x = clamp(L, 0, 1);
    if (gamma !== 1) x = Math.pow(x, gamma);
    if (k > 0) {
      const s = x * x * (3 - 2 * x);                 // smoothstep: more contrast
      x = x + (s - x) * k;
    } else if (k < 0) {
      const s = 0.5 - Math.sin(Math.asin(1 - 2 * x) / 3); // inverse smoothstep: less contrast
      x = x + (s - x) * -k;
    }
    return out0 + (out1 - out0) * x;
  };
}

// Skin weight: 1 inside SKIN_HUE, soft 15° feather, only for moderately saturated colors.
function skinWeight(hDeg, C) {
  const [h0, h1] = SKIN_HUE;
  const inHue = smoothstep(h0 - 15, h0, hDeg) * (1 - smoothstep(h1, h1 + 15, hDeg));
  return inHue * smoothstep(0.01, 0.03, C) * (1 - smoothstep(0.15, 0.22, C));
}

// Extended Reinhard: maps scene-linear to display-linear, reaches 1.0 at x = W.
const VLOG_EXPOSURE = 1.2;
const VLOG_WHITE = 10;
function tonemap(x) {
  x = Math.max(0, x * VLOG_EXPOSURE);
  return (x * (1 + x / (VLOG_WHITE * VLOG_WHITE))) / (1 + x);
}

function inGamut(r, g, b) {
  const e = 1e-7;
  return r >= -e && g >= -e && b >= -e && r <= 1 + e && g <= 1 + e && b <= 1 + e;
}

// Build a fast transform function (r, g, b in 0..1 gamma-encoded) -> out[3].
export function buildTransform(look, controls) {
  const p = resolveParams(look, controls);
  const tone = buildToneCurve(p);
  const lab = [0, 0, 0];
  const lin = [0, 0, 0];
  const w = [0, 0, 0];
  const M = VGAMUT_TO_REC709;
  const identityTone = p.gamma === 1 && p.k === 0 && p.out0 === 0 && p.out1 === 1;

  return function transform(r, g, b, out = [0, 0, 0]) {
    // 1. Input -> display-linear Rec.709
    let lr, lg, lb;
    if (p.input === 'vlog') {
      const vr = vlogToLinear(r), vg = vlogToLinear(g), vb = vlogToLinear(b);
      lr = tonemap(M[0][0] * vr + M[0][1] * vg + M[0][2] * vb);
      lg = tonemap(M[1][0] * vr + M[1][1] * vg + M[1][2] * vb);
      lb = tonemap(M[2][0] * vr + M[2][1] * vg + M[2][2] * vb);
    } else {
      lr = srgbToLinear(r); lg = srgbToLinear(g); lb = srgbToLinear(b);
    }

    // 2. -> Oklab
    linearSrgbToOklab(lr, lg, lb, lab);
    const L0 = lab[0];
    let a = lab[1], bb = lab[2];

    // 3. Tone curve
    const L = identityTone ? L0 : tone(L0);

    // 4. Saturation in Oklch (scaling a/b scales C and keeps the hue)
    const C0 = Math.hypot(a, bb);
    let skin = 0;
    if (p.protectSkin && C0 > 1e-6) {
      let h = Math.atan2(bb, a) * (180 / Math.PI);
      if (h < 0) h += 360;
      skin = skinWeight(h, C0);
    }
    if (p.sat !== 1) {
      const f = 1 + (p.sat - 1) * (1 - 0.7 * skin);
      a *= f; bb *= f;
    }

    // 5. Split toning (weights from the original lightness, softened on skin
    //    and faded out towards pure black so black stays reachable)
    zoneWeights(L0, w);
    const tintScale = (1 - 0.5 * skin) * smoothstep(0, 0.12, L);
    a += tintScale * (w[0] * p.shadows.a + w[1] * p.mids.a + w[2] * p.highlights.a);
    bb += tintScale * (w[0] * p.shadows.b + w[1] * p.mids.b + w[2] * p.highlights.b);

    // 6. Back to linear sRGB, compress chroma into gamut (keeps L and hue)
    oklabToLinearSrgb(L, a, bb, lin);
    if (!inGamut(lin[0], lin[1], lin[2])) {
      let lo = 0, hi = 1;
      for (let i = 0; i < 14; i++) {
        const mid = (lo + hi) / 2;
        oklabToLinearSrgb(L, a * mid, bb * mid, lin);
        if (inGamut(lin[0], lin[1], lin[2])) lo = mid; else hi = mid;
      }
      oklabToLinearSrgb(L, a * lo, bb * lo, lin);
    }

    out[0] = clamp(linearToSrgb(clamp(lin[0], 0, 1)), 0, 1);
    out[1] = clamp(linearToSrgb(clamp(lin[1], 0, 1)), 0, 1);
    out[2] = clamp(linearToSrgb(clamp(lin[2], 0, 1)), 0, 1);
    return out;
  };
}

// Pure single-color API from the briefing: applyLook([r, g, b], look, controls) -> [r, g, b]
export function applyLook(rgb, look, controls) {
  return buildTransform(look, controls)(rgb[0], rgb[1], rgb[2], [0, 0, 0]);
}
