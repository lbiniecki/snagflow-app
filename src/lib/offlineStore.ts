/**
 * offlineStore — IndexedDB wrapper for offline snag storage.
 * Stores pending snags + photo blobs locally until synced.
 */

const DB_NAME = "voxsite_offline";
const DB_VERSION = 1;
const STORE_SNAGS = "pending_snags";

export interface PendingSnag {
  id: string;              // local UUID
  project_id: string;
  visit_id?: string;
  note: string;
  location?: string;
  priority: string;
  photos: Blob[];          // up to 4 photo blobs
  created_at: string;      // ISO string
  status: "pending" | "uploading" | "failed";
  retries: number;
  error?: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_SNAGS)) {
        db.createObjectStore(STORE_SNAGS, { keyPath: "id" });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Save a snag locally for later sync */
export async function savePendingSnag(snag: PendingSnag): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SNAGS, "readwrite");
    tx.objectStore(STORE_SNAGS).put(snag);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Get all pending snags */
export async function getPendingSnags(): Promise<PendingSnag[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SNAGS, "readonly");
    const req = tx.objectStore(STORE_SNAGS).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

/** Get pending snags for a specific visit */
export async function getPendingForVisit(visitId: string): Promise<PendingSnag[]> {
  const all = await getPendingSnags();
  return all.filter((s) => s.visit_id === visitId);
}

/** Update a pending snag's status */
export async function updatePendingStatus(
  id: string,
  status: PendingSnag["status"],
  error?: string
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SNAGS, "readwrite");
    const store = tx.objectStore(STORE_SNAGS);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const snag = getReq.result;
      if (snag) {
        snag.status = status;
        snag.retries = (snag.retries || 0) + (status === "failed" ? 1 : 0);
        if (error) snag.error = error;
        store.put(snag);
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Remove a synced snag from local storage */
export async function removePendingSnag(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SNAGS, "readwrite");
    tx.objectStore(STORE_SNAGS).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Clear all pending snags */
export async function clearAllPending(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SNAGS, "readwrite");
    tx.objectStore(STORE_SNAGS).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Count pending snags */
export async function countPending(): Promise<number> {
  const all = await getPendingSnags();
  return all.length;
}
