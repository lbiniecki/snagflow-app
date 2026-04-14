/**
 * useSyncQueue — manages offline snag queue.
 * Auto-syncs pending snags when connection returns.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useOnlineStatus } from "./useOnlineStatus";
import {
  getPendingSnags,
  updatePendingStatus,
  removePendingSnag,
  countPending,
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
      // IndexedDB might not be available
    }
  }, []);

  // Sync one pending snag
  const syncSnag = async (pending: PendingSnag): Promise<boolean> => {
    try {
      await updatePendingStatus(pending.id, "uploading");

      // Convert blobs to Files
      const photoFiles = pending.photos.map(
        (blob, i) => new File([blob], `photo_${i + 1}.jpg`, { type: "image/jpeg" })
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
      await updatePendingStatus(pending.id, "failed", err.message);
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

      for (const snag of pending) {
        if (!navigator.onLine) break; // Stop if we go offline again
        if (snag.retries >= 3) {
          failed++;
          continue; // Skip permanently failed items
        }

        const ok = await syncSnag(snag);
        if (ok) synced++;
        else failed++;
      }

      if (synced > 0) {
        showToast(`Synced ${synced} snag${synced > 1 ? "s" : ""}`);
      }
      if (failed > 0) {
        showToast(`${failed} snag${failed > 1 ? "s" : ""} failed to sync`);
      }
    } finally {
      syncingRef.current = false;
      setSyncing(false);
      await refreshCount();
    }
  }, [showToast, refreshCount]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      // Small delay to let connection stabilize
      const timer = setTimeout(() => syncAll(), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, pendingCount, syncAll]);

  // Refresh count on mount and periodically
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
    refreshCount,
  };
}
