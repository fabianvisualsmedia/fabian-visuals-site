// Hourly forecast from Open-Meteo (no key), cached in IndexedDB.
// Returns the cached copy when offline, flagged as stale.

import { fetchJSON, readCache, writeCache } from './net.js';
import { addDaysISO, daysUntil, durationMin, parseDateTime } from '../ui.js';

export const FORECAST_DAYS = 16;

const HOURLY = ['temperature_2m', 'precipitation_probability', 'wind_speed_10m', 'cloud_cover', 'weather_code'];

const round = (n) => Math.round(n * 100) / 100;

export function weatherKey(shoot) {
  return `wx:${round(shoot.location.lat)},${round(shoot.location.lon)}:${shoot.date}`;
}

/** Parse Open-Meteo hourly arrays into objects. */
export function parseHourly(json) {
  const h = json.hourly || {};
  return (h.time || []).map((time, i) => ({
    time, // local "YYYY-MM-DDTHH:00" (timezone=Europe/Berlin)
    temp: h.temperature_2m?.[i],
    rainProb: h.precipitation_probability?.[i] ?? 0,
    wind: h.wind_speed_10m?.[i],
    cloud: h.cloud_cover?.[i],
    code: h.weather_code?.[i],
  }));
}

/**
 * Load weather for a shoot. Result:
 * { status: 'ok'|'stale'|'too-far'|'past'|'no-location'|'offline', hours, fetchedAt }
 */
export async function loadWeather(shoot, { allowNetwork = true } = {}) {
  const { lat, lon } = shoot.location || {};
  if (lat == null || lon == null) return { status: 'no-location', hours: [] };
  const days = daysUntil(shoot.date);
  const key = weatherKey(shoot);
  const cached = await readCache(key);

  if (days >= FORECAST_DAYS) return { status: 'too-far', hours: [], availableFrom: addDaysISO(shoot.date, -(FORECAST_DAYS - 1)) };
  if (days < -1) return cached ? { status: 'stale', hours: cached.data, fetchedAt: cached.fetchedAt } : { status: 'past', hours: [] };
  if (!allowNetwork) return cached ? { status: 'stale', hours: cached.data, fetchedAt: cached.fetchedAt } : { status: 'offline', hours: [] };

  // shoots past midnight need the next day as well
  const end = addDaysISO(shoot.date, 1);
  const url = `https://api.open-meteo.com/v1/forecast?${new URLSearchParams({
    latitude: String(lat), longitude: String(lon), hourly: HOURLY.join(','),
    timezone: 'Europe/Berlin', wind_speed_unit: 'kmh', start_date: shoot.date, end_date: end,
  })}`;
  try {
    const hours = parseHourly(await fetchJSON(url));
    const row = await writeCache(key, hours);
    return { status: 'ok', hours, fetchedAt: row.fetchedAt };
  } catch (err) {
    return cached ? { status: 'stale', hours: cached.data, fetchedAt: cached.fetchedAt } : { status: 'offline', hours: [], error: String(err.message || err) };
  }
}

/** Hours that fall within call → wrap (inclusive of the starting hour). */
export function hoursForShoot(hours, shoot) {
  const start = parseDateTime(shoot.date, shoot.callTime);
  const end = new Date(start.getTime() + durationMin(shoot.callTime, shoot.wrapTime) * 60000);
  const startHour = new Date(start); startHour.setMinutes(0, 0, 0);
  return hours.filter((h) => {
    const [d, t] = h.time.split('T');
    const at = parseDateTime(d, t.slice(0, 5));
    return at >= startHour && at < end;
  });
}

/** Aggregate for the packlist rules. */
export function summarize(hours) {
  if (!hours.length) return null;
  const max = (k) => Math.max(...hours.map((h) => h[k] ?? 0));
  const min = (k) => Math.min(...hours.map((h) => h[k] ?? 0));
  const avg = (k) => hours.reduce((n, h) => n + (h[k] ?? 0), 0) / hours.length;
  const cloudAvg = avg('cloud');
  return {
    rainProb: max('rainProb'),
    windMax: Math.round(max('wind')),
    tempMin: Math.round(min('temp')),
    tempMax: Math.round(max('temp')),
    cloudAvg: Math.round(cloudAvg),
    sunny: cloudAvg < 40 && hours.some((h) => h.code <= 2),
  };
}

// WMO weather codes → icon + German label
export function describeCode(code) {
  if (code == null) return { icon: 'cloud', label: '–' };
  if (code === 0) return { icon: 'sun', label: 'Klar' };
  if (code <= 2) return { icon: 'sun', label: 'Heiter' };
  if (code === 3) return { icon: 'cloud', label: 'Bewölkt' };
  if (code <= 48) return { icon: 'cloud', label: 'Nebel' };
  if (code <= 67 || (code >= 80 && code <= 82)) return { icon: 'rain', label: 'Regen' };
  if (code <= 77 || code === 85 || code === 86) return { icon: 'snow', label: 'Schnee' };
  return { icon: 'storm', label: 'Gewitter' };
}
