// Local, offline sun position + times.
// Position: Jean Meeus "Astronomical Algorithms" low-precision solar coordinates
// (same basis as the NOAA solar calculator, incl. nutation/aberration correction).
// Times: solved numerically – find when the sun's altitude crosses a threshold
// (bisection), so the declination change during the day is taken into account.

const rad = Math.PI / 180;
const deg = 180 / Math.PI;
const norm360 = (x) => ((x % 360) + 360) % 360;
const norm180 = (x) => { const n = norm360(x); return n > 180 ? n - 360 : n; };
const julian = (date) => date.getTime() / 86400000 + 2440587.5;

function solarCoords(jd) {
  const T = (jd - 2451545) / 36525;
  const L0 = norm360(280.46646 + T * (36000.76983 + T * 0.0003032));    // mean longitude
  const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);               // mean anomaly
  const C = Math.sin(M * rad) * (1.914602 - T * (0.004817 + 0.000014 * T))
    + Math.sin(2 * M * rad) * (0.019993 - 0.000101 * T)
    + Math.sin(3 * M * rad) * 0.000289;                                   // equation of center
  const omega = 125.04 - 1934.136 * T;
  const lambda = L0 + C - 0.00569 - 0.00478 * Math.sin(omega * rad);    // apparent longitude
  const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
  const eps = eps0 + 0.00256 * Math.cos(omega * rad);                    // corrected obliquity
  const ra = Math.atan2(Math.cos(eps * rad) * Math.sin(lambda * rad), Math.cos(lambda * rad)) * deg;
  const dec = Math.asin(Math.sin(eps * rad) * Math.sin(lambda * rad)) * deg;
  return { ra, dec };
}

// Greenwich mean sidereal time in degrees.
function gmst(jd) {
  const T = (jd - 2451545) / 36525;
  return norm360(280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * T * T - (T * T * T) / 38710000);
}

function hourAngleAt(date, lon) {
  const jd = julian(date);
  const { ra, dec } = solarCoords(jd);
  return { H: norm180(gmst(jd) + lon - ra), dec };
}

/** Sun position at a moment. Degrees; azimuth is compass (0 = north, 90 = east). */
export function sunPosition(date, lat, lon) {
  const { H, dec } = hourAngleAt(date, lon);
  const phi = lat * rad, d = dec * rad, h = H * rad;
  const altitude = Math.asin(Math.sin(phi) * Math.sin(d) + Math.cos(phi) * Math.cos(d) * Math.cos(h)) * deg;
  const azimuth = norm360(Math.atan2(Math.sin(h), Math.cos(h) * Math.sin(phi) - Math.tan(d) * Math.cos(phi)) * deg + 180);
  return { altitude, azimuth };
}

/** Solar noon (transit) closest to `around`. */
function transit(around, lon) {
  let t = around.getTime();
  for (let i = 0; i < 4; i++) {
    const { H } = hourAngleAt(new Date(t), lon);
    t -= (H / 360.9856) * 86400000; // sidereal rate: 360.9856° per day
  }
  return new Date(t);
}

/** Time in [a, b] where altitude crosses `target` (f(a) and f(b) must differ in sign). */
function crossing(a, b, target, lat, lon) {
  const f = (t) => sunPosition(new Date(t), lat, lon).altitude - target;
  let lo = a.getTime(), hi = b.getTime();
  let flo = f(lo);
  if (Math.sign(flo) === Math.sign(f(hi))) return null; // never crosses (polar day/night)
  for (let i = 0; i < 40; i++) { // 12 h / 2^40 → far below a second
    const mid = (lo + hi) / 2, fm = f(mid);
    if (Math.sign(fm) === Math.sign(flo)) { lo = mid; flo = fm; } else hi = mid;
  }
  return new Date((lo + hi) / 2);
}

// Altitudes we need times for. −0.833° = upper limb + refraction at sunrise/sunset.
const ANGLES = { sunrise: -0.833, golden: 6, blueTop: -4, civil: -6 };

/**
 * Sun times for the calendar day containing `date` (pass local noon of the shoot date).
 * Returns Dates; null where the sun never reaches that altitude.
 */
export function sunTimes(date, lat, lon) {
  // first guess: 12:00 UTC shifted by longitude, then refine to the true transit
  const guess = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12) - (lon / 15) * 3600000);
  const solarNoon = transit(guess, lon);
  const before = new Date(solarNoon.getTime() - 12 * 3600000);
  const after = new Date(solarNoon.getTime() + 12 * 3600000);
  const pair = (h) => [crossing(before, solarNoon, h, lat, lon), crossing(solarNoon, after, h, lat, lon)];

  const [sunrise, sunset] = pair(ANGLES.sunrise);
  const [goldenMorningEnd, goldenEveningStart] = pair(ANGLES.golden);
  const [blueMorningEnd, blueEveningStart] = pair(ANGLES.blueTop);
  const [dawn, dusk] = pair(ANGLES.civil);

  return {
    dawn, sunrise, sunset, dusk, solarNoon,
    noonAltitude: sunPosition(solarNoon, lat, lon).altitude,
    blueMorning: dawn && blueMorningEnd ? [dawn, blueMorningEnd] : null,
    goldenMorning: blueMorningEnd && goldenMorningEnd ? [blueMorningEnd, goldenMorningEnd] : null,
    goldenEvening: goldenEveningStart && blueEveningStart ? [goldenEveningStart, blueEveningStart] : null,
    blueEvening: blueEveningStart && dusk ? [blueEveningStart, dusk] : null,
  };
}

/** Compass direction as German abbreviation. */
export function compass(azimuth) {
  return ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'][Math.round(azimuth / 45) % 8];
}
