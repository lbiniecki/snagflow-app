"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, X } from "lucide-react";
import clsx from "clsx";

/**
 * ConfirmDialog — polite, app-styled replacement for window.confirm().
 *
 * Usage (via the provider at app root):
 *   const confirm = useConfirm();
 *   const ok = await confirm({
 *     title: "Delete this snag?",
 *     message: "This will permanently remove the snag and its photos. This can't be undone.",
 *     confirmLabel: "Delete",
 *     tone: "destructive",
 *   });
 *   if (!ok) return;
 *   // proceed
 *
 * Design notes:
 *   - Mobile-first bottom sheet, matching the visual language of the other
 *     modals in the app (rounded top, grab-handle, dark bg2).
 *   - The `tone: "destructive"` prop colours the confirm button red and
 *     surfaces a warning icon; `tone: "default"` is a neutral orange.
 *   - Clicking the scrim or the X button resolves with `false`.
 *   - Only one confirm can be open at a time; a second call while one is
 *     open is rejected with `false` immediately so handlers fail-safe.
 */

export type ConfirmTone = "default" | "destructive";

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;   // default: "Confirm" (or "Delete" for destructive tone)
  cancelLabel?: string;    // default: "Cancel"
  tone?: ConfirmTone;      // default: "default"
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

interface QueueItem {
  opts: ConfirmOptions;
  resolve: (v: boolean) => void;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<QueueItem | null>(null);
  // Track whether we're in the middle of resolving so rapid clicks don't
  // double-resolve the same promise.
  const resolvingRef = useRef(false);

  const resolve = useCallback((value: boolean) => {
    if (resolvingRef.current) return;
    resolvingRef.current = true;
    setCurrent((item) => {
      if (item) item.resolve(value);
      return null;
    });
    // Next tick, allow another confirm to open
    setTimeout(() => { resolvingRef.current = false; }, 0);
  }, []);

  const confirm: ConfirmFn = useCallback((opts) => {
    return new Promise<boolean>((res) => {
      // If one is already open, fail-safe to false — better than stacking
      // modals the user didn't ask for.
      if (current) { res(false); return; }
      setCurrent({ opts, resolve: res });
    });
  }, [current]);

  const tone = current?.opts.tone ?? "default";
  const isDestructive = tone === "destructive";
  const confirmLabel = current?.opts.confirmLabel ?? (isDestructive ? "Delete" : "Confirm");
  const cancelLabel = current?.opts.cancelLabel ?? "Cancel";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {current && (
        <div
          className="fixed inset-0 bg-black/70 z-[80] flex items-end sm:items-center justify-center animate-fade-in"
          onClick={() => resolve(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          <div
            className="w-full max-w-[420px] bg-[var(--bg2)] rounded-t-2xl sm:rounded-2xl p-5 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-[var(--border)] rounded-full mx-auto mb-4 sm:hidden" />

            <div className="flex items-start gap-3 mb-3">
              <div
                className={clsx(
                  "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center",
                  isDestructive ? "bg-red-400/15 text-red-400" : "bg-brand/15 text-brand"
                )}
                aria-hidden="true"
              >
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 id="confirm-title" className="text-base font-bold flex-1 pt-1 leading-tight">
                {current.opts.title}
              </h3>
              <button
                onClick={() => resolve(false)}
                className="p-1.5 -mr-1 -mt-1 rounded-full hover:bg-[var(--bg3)] text-[var(--text3)]"
                aria-label="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {current.opts.message && (
              <p className="text-[13px] text-[var(--text2)] leading-relaxed mb-5 pl-12">
                {current.opts.message}
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => resolve(false)}
                className="flex-1 h-11 bg-[var(--surface)] hover:bg-[var(--bg3)] text-white font-semibold rounded-lg transition-colors"
              >
                {cancelLabel}
              </button>
              <button
                onClick={() => resolve(true)}
                autoFocus
                className={clsx(
                  "flex-1 h-11 text-white font-semibold rounded-lg transition-colors",
                  isDestructive
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-brand hover:bg-brand-light"
                )}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

/**
 * Hook to open a confirm dialog. Returns a function that resolves to
 * true (confirmed) or false (cancelled/dismissed).
 *
 * Must be used inside <ConfirmProvider>. Throws if the provider is missing,
 * so you find out at mount time rather than when a user tries to delete
 * something.
 */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used inside <ConfirmProvider>");
  }
  return ctx;
}
