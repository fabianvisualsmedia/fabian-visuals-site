// Minimal promise wrapper around IndexedDB.
// Stores: shoots, gear, templates (keyPath "id"), settings (keyPath "key").

import { DEFAULT_GEAR } from './data/default-gear.js';
import { DEFAULT_TEMPLATES } from './data/default-templates.js';

const VERSION = 2;
let dbName = 'shootday';
let dbPromise = null;

/** Switch database (used by tests so they never touch real data). */
export function useDatabase(name) {
  dbName = name;
  dbPromise = null;
}

function open() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(dbName, VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        for (const name of ['shoots', 'gear', 'templates']) {
          if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
        // v2: cache for API responses (weather, geocoding) – keyPath "key"
        if (!db.objectStoreNames.contains('cache')) db.createObjectStore('cache', { keyPath: 'key' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

async function run(store, mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const req = fn(tx.objectStore(store));
    tx.oncomplete = () => resolve(req && 'result' in req ? req.result : undefined);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export const all = (store) => run(store, 'readonly', (s) => s.getAll());
export const get = (store, id) => run(store, 'readonly', (s) => s.get(id));
export const put = (store, value) => run(store, 'readwrite', (s) => s.put(value)).then(() => value);
export const del = (store, id) => run(store, 'readwrite', (s) => s.delete(id));
export const clear = (store) => run(store, 'readwrite', (s) => s.clear());

export async function putMany(store, values) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const s = tx.objectStore(store);
    values.forEach((v) => s.put(v));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function newId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// ---------- Settings ----------

export const DEFAULT_SETTINGS = {
  name: 'Fabian',
  theme: 'system',          // "system" | "dark" | "light"
  startAddress: '',
  bufferPct: 20,            // travel buffer in % of drive time
  bufferMinMin: 15,         // …but at least this many minutes
  setupMin: 30,             // setup time on location before call
  eveningReminder: '19:00', // reminder the evening before
  backupOffsetH: 2,         // backup reminder N hours after wrap
  photoGBPerHour: 20,       // estimate: GB of photos per hour of actual shooting (edit in settings)
};

export async function getSettings() {
  const rows = await all('settings');
  const out = { ...DEFAULT_SETTINGS };
  for (const r of rows) if (r.key in DEFAULT_SETTINGS) out[r.key] = r.value;
  return out;
}

export const setSetting = (key, value) => put('settings', { key, value });

// ---------- Shoots ----------

export function createShoot(data = {}) {
  return {
    id: newId(),
    title: '',
    client: '',
    type: 'commercial',
    date: '',
    callTime: '09:00',
    wrapTime: '18:00',
    location: { label: '', address: '', lat: null, lon: null },
    indoorOutdoor: 'outdoor',
    mode: 'hybrid',
    notes: '',
    checklist: [],
    excluded: [],             // keys of auto items the user removed
    recordShare: null,        // null = template default
    travel: { driveMin: null, startAddress: '' },
    phase: 'planned',
    backup: { done: false, doneAt: null, copies: 0 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...data,
  };
}

export function saveShoot(shoot) {
  return put('shoots', { ...shoot, updatedAt: new Date().toISOString() });
}

// ---------- First run ----------

export async function seedIfNeeded() {
  const flag = await get('settings', 'seededV1');
  if (flag) { await migrateData(); return false; }
  await putMany('gear', DEFAULT_GEAR.map((g) => ({ ...g })));
  await putMany('templates', DEFAULT_TEMPLATES.map((t) => ({ ...t })));
  await put('settings', { key: 'seededV1', value: new Date().toISOString() });
  await put('settings', { key: 'migratedV2', value: true });
  return true;
}

// Data fixes for inventories seeded by an older version.
async function migrateData() {
  if (await get('settings', 'migratedV2')) return;
  const ssd = await get('gear', 'ssd');
  // The backup SSD must not count as camera media in the storage calculator.
  if (ssd && !ssd.tags?.includes('backup')) await put('gear', { ...ssd, tags: [...(ssd.tags || []), 'backup'] });
  await put('settings', { key: 'migratedV2', value: true });
}

export async function resetAll() {
  for (const s of ['shoots', 'gear', 'templates', 'settings', 'cache']) await clear(s);
  await seedIfNeeded();
}
