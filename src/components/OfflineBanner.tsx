"use client";

import { useSyncQueue } from "@/lib/useSyncQueue";
import { WifiOff, RefreshCw, CloudUpload } from "lucide-react";
import clsx from "clsx";

export default function OfflineBanner() {
  const { isOnline, pendingCount, syncing, syncAll } = useSyncQueue();

  // Nothing to show when online and no pending items
  if (isOnline && pendingCount === 0) return null;

  return (
    <div
      className={clsx(
        "fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-[60] px-4 py-2 flex items-center gap-2 text-xs font-semibold transition-all",
        !isOnline
          ? "bg-red-500/90 text-white"
          : syncing
          ? "bg-brand/90 text-white"
          : "bg-yellow-500/90 text-black"
      )}
    >
      {!isOnline ? (
        <>
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">
            Offline — snags saved locally
            {pendingCount > 0 && ` (${pendingCount} pending)`}
          </span>
        </>
      ) : syncing ? (
        <>
          <RefreshCw className="w-4 h-4 flex-shrink-0 animate-spin" />
          <span className="flex-1">Syncing {pendingCount} snag{pendingCount !== 1 ? "s" : ""}…</span>
        </>
      ) : (
        <>
          <CloudUpload className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{pendingCount} snag{pendingCount !== 1 ? "s" : ""} waiting to sync</span>
          <button
            onClick={syncAll}
            className="px-2 py-1 bg-black/20 rounded text-[10px] font-bold uppercase"
          >
            Sync now
          </button>
        </>
      )}
    </div>
  );
}
