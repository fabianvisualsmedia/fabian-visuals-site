// Wetter & Orte über Open-Meteo (kostenlos, ohne API-Key).
import { phaseFor, sunPosition } from './sun.js';

const CACHE_KEY = 'fvs.weather';

export async function fetchWeather(lat, lng) {
  const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  let cached = null;
  try { cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch {}
  if (cached && cached.key === key && Date.now() - cached.at < 30 * 60e3) return cached.data;

  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.search = new URLSearchParams({
    latitude: lat, longitude: lng,
    hourly: 'temperature_2m,cloud_cover,cloud_cover_low,cloud_cover_high,precipitation_probability,wind_speed_10m,weather_code,visibility',
    current: 'temperature_2m,weather_code,cloud_cover,wind_speed_10m',
    timezone: 'auto', timeformat: 'unixtime', forecast_days: 7, wind_speed_unit: 'kmh',
  }).toString();
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Wetter nicht erreichbar');
    const data = await res.json();
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ key, at: Date.now(), data })); } catch {}
    return data;
  } catch (err) {
    if (cached && cached.key === key) return cached.data; // offline: letzter Stand
    throw err;
  }
}

/** Stündliche Daten als Objekte. */
export function hourlyList(data) {
  if (!data?.hourly) return [];
  const h = data.hourly;
  return h.time.map((t, i) => ({
    time: new Date(t * 1000),
    temp: h.temperature_2m[i],
    clouds: h.cloud_cover[i],
    cloudsLow: h.cloud_cover_low[i],
    cloudsHigh: h.cloud_cover_high[i],
    rain: h.precipitation_probability[i] ?? 0,
    wind: h.wind_speed_10m[i],
    code: h.weather_code[i],
    visibility: h.visibility?.[i],
  }));
}

export function weatherAt(list, date) {
  if (!list.length) return null;
  let best = list[0], diff = Infinity;
  for (const w of list) {
    const d = Math.abs(w.time - date);
    if (d < diff) { diff = d; best = w; }
  }
  return diff < 2 * 3600e3 ? best : null;
}

/** Shoot-Score 0–100: Lichtqualität × Wetter. */
export function shootScore(date, lat, lng, w) {
  const alt = sunPosition(date, lat, lng).altitude;
  const p = phaseFor(alt).key;
  let light = { night: 10, twilight: 35, blue: 80, golden: 100, soft: 75, day: 50 }[p];
  if (!w) return Math.round(light);
  let weather = 100;
  weather -= Math.min(60, w.rain * 0.7);
  weather -= Math.max(0, (w.cloudsLow - 40)) * 0.6; // tiefe Wolken schlucken Licht
  if (p === 'golden' || p === 'blue') {
    // hohe Wolken = Sunset-Drama
    if (w.cloudsHigh > 15 && w.cloudsHigh < 70) weather += 8;
  }
  weather -= Math.max(0, w.wind - 30) * 0.8; // Drohne/Ton
  weather = Math.max(5, Math.min(100, weather));
  return Math.round(light * 0.55 + weather * 0.45);
}

export function scoreLabel(s) {
  if (s >= 85) return 'Traumlicht';
  if (s >= 70) return 'Sehr gut';
  if (s >= 55) return 'Solide';
  if (s >= 40) return 'Machbar';
  return 'Schwierig';
}

const CODES = {
  0: ['Klar', 'sun'], 1: ['Überwiegend klar', 'sun'], 2: ['Teils bewölkt', 'cloud-sun'], 3: ['Bedeckt', 'cloud'],
  45: ['Nebel', 'fog'], 48: ['Raureif-Nebel', 'fog'],
  51: ['Niesel', 'drizzle'], 53: ['Niesel', 'drizzle'], 55: ['Starker Niesel', 'drizzle'],
  61: ['Leichter Regen', 'rain'], 63: ['Regen', 'rain'], 65: ['Starker Regen', 'rain'],
  66: ['Eisregen', 'rain'], 67: ['Eisregen', 'rain'],
  71: ['Leichter Schnee', 'snow'], 73: ['Schnee', 'snow'], 75: ['Starker Schnee', 'snow'], 77: ['Schneegriesel', 'snow'],
  80: ['Schauer', 'rain'], 81: ['Schauer', 'rain'], 82: ['Starke Schauer', 'rain'],
  85: ['Schneeschauer', 'snow'], 86: ['Schneeschauer', 'snow'],
  95: ['Gewitter', 'storm'], 96: ['Gewitter', 'storm'], 99: ['Gewitter', 'storm'],
};
export const weatherText = (code) => (CODES[code] || ['—', 'cloud'])[0];
export const weatherIcon = (code) => (CODES[code] || ['—', 'cloud'])[1];

export async function searchPlaces(q) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=de&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Ortssuche fehlgeschlagen');
  const data = await res.json();
  return (data.results || []).map((r) => ({
    name: r.name,
    region: [r.admin1, r.country_code].filter(Boolean).join(', '),
    lat: r.latitude, lng: r.longitude,
  }));
}

export async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=de`);
    const d = await res.json();
    return d.city || d.locality || d.principalSubdivision || 'Mein Standort';
  } catch { return 'Mein Standort'; }
}

export function currentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Kein GPS verfügbar'));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => reject(new Error('Standortzugriff verweigert')),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 10 * 60e3 },
    );
  });
}
