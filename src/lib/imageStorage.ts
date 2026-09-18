const DB_NAME = 'fabiana_images';
const DB_VERSION = 1;
const STORE_NAME = 'images';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } catch {
      reject(new Error("IndexedDB não disponível"));
    }
  });
}

export function generateImageId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
}

function isInternalId(id: string): boolean {
  return typeof id === 'string' && !id.startsWith('data:') && !id.startsWith('blob:') && !id.startsWith('http');
}

export async function saveImageToIDB(id: string, dataUrl: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(dataUrl, id);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function getImageFromIDB(id: string): Promise<string | null> {
  if (!id || !isInternalId(id)) return id || null;
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(id);
      request.onsuccess = () => { db.close(); resolve(request.result || null); };
      request.onerror = () => { db.close(); resolve(null); };
    });
  } catch {
    return null;
  }
}

export async function deleteImageFromIDB(id: string): Promise<void> {
  if (!id || !isInternalId(id)) return;
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); resolve(); };
    });
  } catch {
    // ignore
  }
}

export async function getMultipleImagesFromIDB(ids: (string | null)[]): Promise<(string | null)[]> {
  if (ids.length === 0) return [];
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const results: (string | null)[] = new Array(ids.length).fill(null);
      let pending = 0;

      ids.forEach((id, index) => {
        if (!id || !isInternalId(id)) {
          results[index] = id;
          return;
        }
        pending++;
        const request = store.get(id);
        request.onsuccess = () => {
          results[index] = request.result || null;
          pending--;
          if (pending === 0) { db.close(); resolve(results); }
        };
        request.onerror = () => {
          results[index] = null;
          pending--;
          if (pending === 0) { db.close(); resolve(results); }
        };
      });

      if (pending === 0) {
        db.close();
        resolve(results);
      }
    });
  } catch {
    return ids;
  }
}
