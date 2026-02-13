// mediaDB.js — IndexedDB wrapper for persistent media (images/videos)
// Stores raw Blob files so they survive page reloads and app restarts.

const DB_NAME = 'TeamBalanceMedia';
const DB_VERSION = 1;
const STORE_NAME = 'mediaFiles';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

// Save a file Blob under a given id
export async function saveMediaFile(id, blob, name, type) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put({ id, blob, name, type });
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
  });
}

// Retrieve a single media entry by id → { id, blob, name, type }
export async function getMediaFile(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(id);
    req.onsuccess = (e) => resolve(e.target.result || null);
    req.onerror = (e) => reject(e.target.error);
  });
}

// Delete a single media entry by id
export async function deleteMediaFile(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
  });
}

// Delete multiple media entries by array of ids (used when deleting a match)
export async function deleteMediaFiles(ids) {
  if (!ids || ids.length === 0) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    ids.forEach(id => store.delete(id));
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
  });
}

// Given a stored media entry, create a temporary object URL for display
// Call URL.revokeObjectURL(url) when done to free memory
export function createBlobUrl(mediaEntry) {
  if (!mediaEntry || !mediaEntry.blob) return null;
  return URL.createObjectURL(mediaEntry.blob);
}
