// Minimal promise-based IndexedDB wrapper.
// createStore(name) returns an isolated store so tests can use their own database.

import { DEFAULT_SETTINGS, DEFAULT_PHASES } from './config.js';

const VERSION = 1;
const STORES = ['clients', 'projects', 'entries', 'kv'];

const req = (r) =>
  new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });

function openDB(name) {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(name, VERSION);
    r.onupgradeneeded = () => {
      const db = r.result;
      if (!db.objectStoreNames.contains('clients')) db.createObjectStore('clients', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('projects')) {
        db.createObjectStore('projects', { keyPath: 'id' }).createIndex('clientId', 'clientId');
      }
      if (!db.objectStoreNames.contains('entries')) {
        db.createObjectStore('entries', { keyPath: 'id' }).createIndex('projectId', 'projectId');
      }
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv', { keyPath: 'key' });
    };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.onblocked = () => reject(new Error('IndexedDB blockiert – bitte andere Tabs der App schließen.'));
  });
}

export const uid = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export function createStore(name = 'fv-tracker') {
  let dbPromise;
  const db = () => (dbPromise ||= openDB(name));
  const listeners = new Set();
  const channel = 'BroadcastChannel' in globalThis ? new BroadcastChannel(`${name}-sync`) : null;

  const notify = (storeName, remote = false) => {
    listeners.forEach((fn) => fn({ store: storeName, remote }));
    if (!remote) channel?.postMessage({ store: storeName });
  };
  if (channel) channel.onmessage = (e) => notify(e.data?.store, true);

  async function run(storeName, mode, fn) {
    const d = await db();
    return new Promise((resolve, reject) => {
      const t = d.transaction(storeName, mode);
      let result;
      Promise.resolve(fn(t.objectStore(storeName))).then((r) => (result = r), reject);
      t.oncomplete = () => resolve(result);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error || new Error('Transaction aborted'));
    });
  }

  const api = {
    name,
    all: (s) => run(s, 'readonly', (os) => req(os.getAll())),
    get: (s, id) => run(s, 'readonly', (os) => req(os.get(id))),
    byIndex: (s, index, value) => run(s, 'readonly', (os) => req(os.index(index).getAll(value))),
    async put(s, obj) {
      await run(s, 'readwrite', (os) => req(os.put(obj)));
      notify(s);
      return obj;
    },
    /** Writes several objects in ONE transaction (atomic: e.g. stop old timer + start new). */
    async putMany(s, objs) {
      await run(s, 'readwrite', (os) => Promise.all(objs.map((o) => req(os.put(o)))));
      notify(s);
      return objs;
    },
    async del(s, id) {
      await run(s, 'readwrite', (os) => req(os.delete(id)));
      notify(s);
    },
    async delMany(s, ids) {
      await run(s, 'readwrite', (os) => Promise.all(ids.map((id) => req(os.delete(id)))));
      notify(s);
    },
    async clear(s) {
      await run(s, 'readwrite', (os) => req(os.clear()));
      notify(s);
    },

    async getSettings() {
      const row = await api.get('kv', 'settings');
      const s = { ...DEFAULT_SETTINGS, ...(row?.value || {}) };
      if (!Array.isArray(s.phases) || !s.phases.length) s.phases = DEFAULT_PHASES;
      return s;
    },
    async saveSettings(patch) {
      const next = { ...(await api.getSettings()), ...patch };
      await api.put('kv', { key: 'settings', value: next });
      return next;
    },
    async getKV(key) {
      return (await api.get('kv', key))?.value;
    },
    setKV: (key, value) => api.put('kv', { key, value }),

    onChange(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    /** Closes and deletes the whole database (tests only). */
    async destroy() {
      if (dbPromise) (await dbPromise).close();
      channel?.close();
      await req(indexedDB.deleteDatabase(name));
    },
  };
  return api;
}

export { STORES };
