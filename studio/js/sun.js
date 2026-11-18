// Sonnenstand & Lichtphasen – lokal berechnet (basierend auf dem SunCalc-Algorithmus, NOAA/Meeus-Näherung).
// Kein Netzwerk nötig.

const PI = Math.PI, rad = PI / 180, dayMs = 864e5, J1970 = 2440588, J2000 = 2451545;
const e = rad * 23.4397;

const toJulian = (d) => d.valueOf() / dayMs - 0.5 + J1970;
const fromJulian = (j) => new Date((j + 0.5 - J1970) * dayMs);
const toDays = (d) => toJulian(d) - J2000;

const rightAscension = (l, b) => Math.atan2(Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e), Math.cos(l));
const declination = (l, b) => Math.asin(Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l));
const azimuthOf = (H, phi, dec) => Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi));
const altitudeOf = (H, phi, dec) => Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
const siderealTime = (d, lw) => rad * (280.16 + 360.9856235 * d) - lw;
const solarMeanAnomaly = (d) => rad * (357.5291 + 0.98560028 * d);
const eclipticLongitude = (M) => {
  const C = rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
  return M + C + rad * 102.9372 + PI;
};
const sunCoords = (d) => {
  const L = eclipticLongitude(solarMeanAnomaly(d));
  return { dec: declination(L, 0), ra: rightAscension(L, 0) };
};

/** Sonnenposition: altitude & azimuth in Grad (Azimut 0 = Norden, im Uhrzeigersinn). */
export function sunPosition(date, lat, lng) {
  const lw = rad * -lng, phi = rad * lat, d = toDays(date);
  const c = sunCoords(d);
  const H = siderealTime(d, lw) - c.ra;
  return {
    altitude: altitudeOf(H, phi, c.dec) / rad,
    azimuth: ((azimuthOf(H, phi, c.dec) / rad) + 180 + 360) % 360,
  };
}

const J0 = 0.0009;
const julianCycle = (d, lw) => Math.round(d - J0 - lw / (2 * PI));
const approxTransit = (Ht, lw, n) => J0 + (Ht + lw) / (2 * PI) + n;
const solarTransitJ = (ds, M, L) => J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
const hourAngle = (h, phi, d) => Math.acos((Math.sin(h) - Math.sin(phi) * Math.sin(d)) / (Math.cos(phi) * Math.cos(d)));

function timeForAngle(angleDeg, date, lat, lng) {
  const lw = rad * -lng, phi = rad * lat;
  const d = toDays(date), n = julianCycle(d, lw), ds = approxTransit(0, lw, n);
  const M = solarMeanAnomaly(ds), L = eclipticLongitude(M), dec = declination(L, 0);
  const Jnoon = solarTransitJ(ds, M, L);
  const w = hourAngle(angleDeg * rad, phi, dec);
  if (Number.isNaN(w)) return { rise: null, set: null, noon: fromJulian(Jnoon) };
  const a = approxTransit(w, lw, n);
  const Jset = solarTransitJ(a, M, L);
  const Jrise = Jnoon - (Jset - Jnoon);
  return { rise: fromJulian(Jrise), set: fromJulian(Jset), noon: fromJulian(Jnoon) };
}

/**
 * Lichtphasen für einen Tag. Definitionen (Fotografen-üblich):
 *  Blaue Stunde: Sonne zwischen -6° und -4°
 *  Golden Hour:  Sonne zwischen -4° und +6°
 */
export function lightPhases(date, lat, lng) {
  const base = new Date(date); base.setHours(12, 0, 0, 0);
  const sun = timeForAngle(-0.833, base, lat, lng);
  const civil = timeForAngle(-6, base, lat, lng);
  const blueEnd = timeForAngle(-4, base, lat, lng);
  const golden = timeForAngle(6, base, lat, lng);
  const noonPos = sunPosition(sun.noon, lat, lng);
  return {
    noon: sun.noon,
    sunrise: sun.rise, sunset: sun.set,
    dawn: civil.rise, dusk: civil.set,
    blueMorningStart: civil.rise, blueMorningEnd: blueEnd.rise,
    goldenMorningStart: blueEnd.rise, goldenMorningEnd: golden.rise,
    goldenEveningStart: golden.set, goldenEveningEnd: blueEnd.set,
    blueEveningStart: blueEnd.set, blueEveningEnd: civil.set,
    maxAltitude: noonPos.altitude,
    dayLength: sun.rise && sun.set ? (sun.set - sun.rise) : null,
  };
}

/** Aktuelle Lichtphase anhand der Sonnenhöhe. */
export function phaseFor(altitude) {
  if (altitude < -18) return { key: 'night', label: 'Nacht' };
  if (altitude < -6) return { key: 'twilight', label: 'Dämmerung' };
  if (altitude < -4) return { key: 'blue', label: 'Blaue Stunde' };
  if (altitude < 6) return { key: 'golden', label: 'Golden Hour' };
  if (altitude < 20) return { key: 'soft', label: 'Weiches Licht' };
  return { key: 'day', label: 'Hartes Tageslicht' };
}

/** Himmelsfarben (3 Stops) je nach Sonnenhöhe – für den Live-Glow. */
export function skyPalette(altitude) {
  const stops = [
    { a: -20, c: ['#05060f', '#0b1030', '#1a1f5a'] },
    { a: -8, c: ['#070a22', '#1a2a8a', '#3b4fd8'] },
    { a: -5, c: ['#0a1240', '#2348d8', '#6694ff'] },
    { a: -2, c: ['#2a1a5a', '#a2489b', '#ff7a6b'] },
    { a: 3, c: ['#3b1d5e', '#f0645a', '#ffb347'] },
    { a: 8, c: ['#1e3a8a', '#f59e0b', '#ffd27a'] },
    { a: 20, c: ['#0b3a8a', '#2f80ff', '#8fd3ff'] },
    { a: 60, c: ['#0a4fd0', '#3aa0ff', '#c8ecff'] },
  ];
  if (altitude <= stops[0].a) return stops[0].c;
  if (altitude >= stops[stops.length - 1].a) return stops[stops.length - 1].c;
  for (let i = 0; i < stops.length - 1; i++) {
    const s0 = stops[i], s1 = stops[i + 1];
    if (altitude >= s0.a && altitude <= s1.a) {
      const t = (altitude - s0.a) / (s1.a - s0.a);
      return s0.c.map((c, k) => mix(c, s1.c[k], t));
    }
  }
  return stops[0].c;
}

function mix(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const r = Math.round(((pa >> 16) & 255) * (1 - t) + ((pb >> 16) & 255) * t);
  const g = Math.round(((pa >> 8) & 255) * (1 - t) + ((pb >> 8) & 255) * t);
  const bl = Math.round((pa & 255) * (1 - t) + (pb & 255) * t);
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1);
}

export function compassLabel(az) {
  const dirs = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(az / 45) % 8];
}
