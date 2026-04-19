"use client";

import { useSyncQueue } from "@/lib/useSyncQueue";
import { WifiOff, RefreshCw, CloudUpload } from "lucide-react";
import clsx from "clsx";

export default function OfflineBanner() {
  // Note: `manualSync` resets the 3-strike retry cap before syncing, so the
  // button works even for items that auto-sync has given up on. `syncAll`
  // (used by the auto-sync effect) respects the cap.
  const { isOnline, pendingCount, syncing, manualSync } = useSyncQueue();

  // Nothing to show when online and no pending items
  if (isOnline && pendingCount === 0) return null;

  return (
    <div
      className={clsx(
        "fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-[60] px-4 py-2 flex items-center gap-2 text-xs font-semibold transition-all",
        !isOnline
          ? "bg-warning/90 text-white"
          : syncing
          ? "bg-brand/90 text-white"
          : "bg-warning/90 text-white"
      )}
    >
      {!isOnline ? (
        <>
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">
            Offline — items saved locally
            {pendingCount > 0 && ` (${pendingCount} pending)`}
          </span>
        </>
      ) : syncing ? (
        <>
          <RefreshCw className="w-4 h-4 flex-shrink-0 animate-spin" />
          <span className="flex-1">Syncing {pendingCount} item{pendingCount !== 1 ? "s" : ""}…</span>
        </>
      ) : (
        <>
          <CloudUpload className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{pendingCount} item{pendingCount !== 1 ? "s" : ""} waiting to sync</span>
          <button
            onClick={manualSync}
            className="px-2 py-1 bg-black/20 rounded text-xs font-bold uppercase"
          >
            Sync now
          </button>
        </>
      )}
    </div>
  );
}
