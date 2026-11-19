// Address → coordinates. Open-Meteo geocoding first (place names), Nominatim as
// fallback for full street addresses. Results are cached per query.
// Nominatim policy: max 1 request/s; the browser sends the page as Referer.

import { fetchJSON, readCache, writeCache } from './net.js';

let lastNominatim = 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function openMeteo(name) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?${new URLSearchParams({ name, count: '1', language: 'de', format: 'json' })}`;
  const json = await fetchJSON(url);
  const r = json.results?.[0];
  return r ? { lat: r.latitude, lon: r.longitude, name: [r.name, r.admin1].filter(Boolean).join(', '), source: 'open-meteo' } : null;
}

async function nominatim(q) {
  const wait = lastNominatim + 1100 - Date.now();
  if (wait > 0) await sleep(wait);
  lastNominatim = Date.now();
  const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({ q, format: 'jsonv2', limit: '1', 'accept-language': 'de' })}`;
  const json = await fetchJSON(url);
  const r = json[0];
  return r ? { lat: Number(r.lat), lon: Number(r.lon), name: r.display_name, source: 'nominatim' } : null;
}

/** Candidate place name from an address: "Musterstr. 1, 53111 Bonn" → "Bonn". */
export function cityFromAddress(address) {
  const last = address.split(',').map((s) => s.trim()).filter(Boolean).pop() || '';
  return last.replace(/^\d{4,5}\s*/, '').trim();
}

export async function geocode(query) {
  const q = query.trim();
  if (!q) return null;
  const key = `geo:${q.toLowerCase()}`;
  const cached = await readCache(key);
  if (cached) return cached.data;

  const looksLikeAddress = /\d/.test(q) || q.includes(',');
  let hit = null;
  // street addresses: Nominatim is the only free service that resolves them
  if (looksLikeAddress) hit = await nominatim(q).catch(() => null);
  if (!hit) hit = await openMeteo(q).catch(() => null);
  if (!hit && !looksLikeAddress) hit = await nominatim(q).catch(() => null);
  if (!hit && looksLikeAddress) {
    const city = cityFromAddress(q);
    if (city && city !== q) hit = await openMeteo(city).catch(() => null);
  }
  if (hit) await writeCache(key, hit);
  return hit;
}
