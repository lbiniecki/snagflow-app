/**
 * offlineStore — IndexedDB wrapper for offline snag storage.
 * Stores pending snags + photo blobs locally until synced.
 *
 * Writes (save / remove / reset) dispatch a `voxsite:queue-changed` event on
 * the window so the sync hook (useSyncQueue) can react immediately rather
 * than waiting for its polling interval. Without this, `pendingCount` in the
 * hook's React state stayed stale after offline captures, which made the
 * reconnect auto-sync skip its work.
 *
 * We intentionally do NOT emit the event from `updatePendingStatus` — status
 * changes during an in-flight sync must not retrigger sync (would loop).
 */

const DB_NAME = "voxsite_offline";
const DB_VERSION = 1;
const STORE_SNAGS = "pending_snags";

export const QUEUE_CHANGED_EVENT = "voxsite:queue-changed";

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

function notifyQueueChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(QUEUE_CHANGED_EVENT));
  }
}

/** Save a snag locally for later sync. Notifies listeners. */
export async function savePendingSnag(snag: PendingSnag): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_SNAGS, "readwrite");
    tx.objectStore(STORE_SNAGS).put(snag);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  notifyQueueChanged();
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

/**
 * Update a pending snag's status. Does NOT fire queue-changed — status
 * flips happen during the sync run itself, and re-notifying would re-enter
 * sync in a loop.
 */
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

/**
 * Reset a single snag's retry counter back to 0 and clear any stored error.
 * Used when the user explicitly requests a retry via "Sync now", so items
 * that had hit the 3-strike cap get another chance.
 */
export async function resetSnagRetries(id: string): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_SNAGS, "readwrite");
    const store = tx.objectStore(STORE_SNAGS);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const snag = getReq.result;
      if (snag) {
        snag.retries = 0;
        snag.status = "pending";
        delete snag.error;
        store.put(snag);
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  notifyQueueChanged();
}

/** Reset retries on every failed / stalled item. Returns count reset. */
export async function resetAllFailedRetries(): Promise<number> {
  const all = await getPendingSnags();
  const stalled = all.filter(
    (s) => (s.retries || 0) >= 3 || s.status === "failed"
  );
  for (const s of stalled) {
    await resetSnagRetries(s.id);
  }
  return stalled.length;
}

/** Remove a synced snag from local storage. Notifies listeners. */
export async function removePendingSnag(id: string): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_SNAGS, "readwrite");
    tx.objectStore(STORE_SNAGS).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  notifyQueueChanged();
}

/** Clear all pending snags. Notifies listeners. */
export async function clearAllPending(): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_SNAGS, "readwrite");
    tx.objectStore(STORE_SNAGS).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  notifyQueueChanged();
}

/** Count pending snags */
export async function countPending(): Promise<number> {
  const all = await getPendingSnags();
  return all.length;
}
