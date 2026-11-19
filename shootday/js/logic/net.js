// Network + cache helpers shared by weather and geocoding.
// fetch is swappable so tests can run without network.

import { get, put } from '../db.js';

let fetchImpl = (...args) => fetch(...args);
export function setFetch(fn) { fetchImpl = fn; }

export async function fetchJSON(url, { timeoutMs = 8000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

export const readCache = (key) => get('cache', key);
export const writeCache = (key, data) => put('cache', { key, data, fetchedAt: new Date().toISOString() });
