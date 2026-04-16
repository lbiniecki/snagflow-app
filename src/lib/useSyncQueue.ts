/**
 * useSyncQueue — manages offline snag queue.
 * Auto-syncs pending snags when connection returns.
 *
 * Fix notes (sync-failure bug):
 *   - The reconnect auto-sync is NO LONGER gated on `pendingCount > 0`.
 *     That check was racing with a stale React state when the user queued
 *     snags while offline — pendingCount only refreshed on a 10s interval,
 *     so a quick offline→online round-trip could miss the sync entirely.
 *     `syncAll` cheap-exits on an empty queue, so calling it unconditionally
 *     on reconnect is safe.
 *   - Listens for `voxsite:queue-changed` from offlineStore so capturing a
 *     snag offline is reflected in the UI immediately, and an online-queue
 *     write (rare) triggers sync without waiting for the interval.
 *   - `manualSync` resets the 3-strike cap before running so user-triggered
 *     "Sync now" retries permanently-failed items.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useOnlineStatus } from "./useOnlineStatus";
import {
  getPendingSnags,
  updatePendingStatus,
  removePendingSnag,
  countPending,
  resetAllFailedRetries,
  QUEUE_CHANGED_EVENT,
  type PendingSnag,
} from "./offlineStore";
import { snags as snagsApi } from "./api";
import { useStore } from "./store";

export function useSyncQueue() {
  const isOnline = useOnlineStatus();
  const { showToast } = useStore();
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const syncingRef = useRef(false);

  // Refresh pending count
  const refreshCount = useCallback(async () => {
    try {
      const count = await countPending();
      setPendingCount(count);
    } catch {
      // IndexedDB might not be available (private mode, etc.)
    }
  }, []);

  // Sync one pending snag
  const syncSnag = async (pending: PendingSnag): Promise<boolean> => {
    try {
      await updatePendingStatus(pending.id, "uploading");

      // Convert blobs back to Files so FastAPI's UploadFile.filename check
      // passes (an empty-string filename would be treated as "no file").
      const photoFiles = pending.photos.map(
        (blob, i) => new File([blob], `photo_${i + 1}.jpg`, { type: blob.type || "image/jpeg" })
      );

      await snagsApi.create({
        project_id: pending.project_id,
        visit_id: pending.visit_id,
        note: pending.note,
        location: pending.location,
        priority: pending.priority,
        photo: photoFiles[0],
        photo2: photoFiles[1],
        photo3: photoFiles[2],
        photo4: photoFiles[3],
      });

      await removePendingSnag(pending.id);
      return true;
    } catch (err: any) {
      await updatePendingStatus(pending.id, "failed", err?.message || "Unknown error");
      return false;
    }
  };

  // Sync all pending snags
  const syncAll = useCallback(async () => {
    if (syncingRef.current || !navigator.onLine) return;
    syncingRef.current = true;
    setSyncing(true);

    try {
      const pending = await getPendingSnags();
      if (pending.length === 0) return;

      let synced = 0;
      let failed = 0;
      let skipped = 0;

      for (const snag of pending) {
        if (!navigator.onLine) break; // Stop if we go offline again
        if ((snag.retries || 0) >= 3) {
          skipped++;
          continue; // Don't auto-retry dead-lettered items — manualSync handles that
        }

        const ok = await syncSnag(snag);
        if (ok) synced++;
        else failed++;
      }

      if (synced > 0) {
        showToast(`Synced ${synced} snag${synced > 1 ? "s" : ""}`);
      }
      // Only toast failures for items we actually tried this run
      if (failed > 0) {
        showToast(`${failed} snag${failed > 1 ? "s" : ""} failed to sync — will retry`);
      }
      // If everything left is in the skipped pile, surface that so the user
      // knows why "pending" isn't going down.
      if (synced === 0 && failed === 0 && skipped > 0) {
        showToast(`${skipped} snag${skipped > 1 ? "s" : ""} stuck — tap Sync now to retry`);
      }
    } finally {
      syncingRef.current = false;
      setSyncing(false);
      await refreshCount();
    }
  }, [showToast, refreshCount]);

  /**
   * User-triggered sync from the "Sync now" button. Resets the retry counter
   * on any items that were dead-lettered (retries >= 3), then runs syncAll.
   * This is the only way to get stuck items to try again after 3 failures.
   */
  const manualSync = useCallback(async () => {
    try {
      await resetAllFailedRetries();
    } catch {
      // If reset fails (unlikely), still try syncAll
    }
    await syncAll();
  }, [syncAll]);

  // Auto-sync when we transition to online. NOT gated on pendingCount —
  // that was stale. syncAll bails cheaply when the queue is empty.
  useEffect(() => {
    if (isOnline) {
      // Small delay to let the connection stabilize (important on mobile
      // where `online` fires before DNS/routing is truly ready).
      const timer = setTimeout(() => {
        refreshCount();
        syncAll();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isOnline, syncAll, refreshCount]);

  // React to queue changes fired by offlineStore writes. Keeps pendingCount
  // fresh without waiting for the 10s interval, and pokes syncAll on online
  // inserts (e.g. if a normal create fell back to offline save because of a
  // transient upload error, we try again right away).
  useEffect(() => {
    const handler = () => {
      refreshCount();
      if (navigator.onLine) {
        // Fire-and-forget; syncingRef guards against concurrent runs.
        syncAll();
      }
    };
    window.addEventListener(QUEUE_CHANGED_EVENT, handler);
    return () => window.removeEventListener(QUEUE_CHANGED_EVENT, handler);
  }, [refreshCount, syncAll]);

  // Refresh count on mount and as a safety-net poll
  useEffect(() => {
    refreshCount();
    const interval = setInterval(refreshCount, 10000);
    return () => clearInterval(interval);
  }, [refreshCount]);

  return {
    isOnline,
    pendingCount,
    syncing,
    syncAll,
    manualSync,
    refreshCount,
  };
}
