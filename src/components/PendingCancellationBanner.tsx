"use client";

import { useEffect, useState, useCallback } from "react";
import { AlertCircle, RotateCw } from "lucide-react";
import { billing, type PlanUsage } from "@/lib/api";
import { useStore } from "@/lib/store";

/**
 * Banner shown when the company subscription is scheduled to cancel at
 * period end (Stripe's `cancel_at_period_end: true`).
 *
 * Design choices:
 *   - Owner sees a "Reactivate" button. Member sees a read-only message.
 *     The split is driven by `is_owner` from /billing/plan, which is the
 *     single source of truth (matches the backend, which 403s a member
 *     who hits /reactivate directly).
 *   - Renders in normal flow (not fixed-positioned) so it doesn't fight
 *     OfflineBanner for the top of the screen.
 *   - Silent on any fetch error: this banner is informational, never
 *     critical. A failed /plan call shouldn't disrupt the app.
 *   - Dates are formatted with `toLocaleDateString` using the user's
 *     locale. We use `dateStyle: "long"` for readability ("8 June 2026"
 *     rather than "8/6/26").
 */
export default function PendingCancellationBanner() {
  const [planData, setPlanData] = useState<PlanUsage | null>(null);
  const [reactivating, setReactivating] = useState(false);
  const showToast = useStore((s) => s.showToast);
  const auth = useStore((s) => s.auth);

  const refresh = useCallback(async () => {
    try {
      const data = await billing.getMyPlan();
      setPlanData(data);
    } catch {
      // Swallow: banner is informational. Keep last-known state if any.
    }
  }, []);

  // Fetch on mount whenever the user is authenticated. Re-fetch when the
  // auth identity changes (login, account switch). Note: `auth` is the
  // store value; the dependency on its identity is intentional.
  useEffect(() => {
    if (!auth?.id) {
      setPlanData(null);
      return;
    }
    refresh();
  }, [auth?.id, refresh]);

  const handleReactivate = async () => {
    if (reactivating) return;
    setReactivating(true);
    try {
      const result = await billing.reactivate();
      if (result.already_active) {
        showToast("Subscription is already active.");
      } else {
        showToast("Subscription reactivated.");
      }
      // Re-fetch to clear the banner. Don't trust local state alone —
      // the source of truth is the backend's read of Stripe.
      await refresh();
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Could not reactivate. Please try again.";
      showToast(message);
    } finally {
      setReactivating(false);
    }
  };

  if (!planData) return null;
  if (!planData.subscription?.cancel_at_period_end) return null;

  const periodEnd = planData.subscription.current_period_end;
  const dateLabel = periodEnd
    ? new Date(periodEnd * 1000).toLocaleDateString(undefined, {
        dateStyle: "long",
      })
    : null;

  const planName = planData.plan?.name ?? "Your plan";

  return (
    <div className="w-full bg-warning/15 border-b border-warning/40 px-4 py-3">
      <div className="max-w-[480px] mx-auto flex items-start gap-3">
        <AlertCircle className="w-5 h-5 flex-shrink-0 text-warning mt-0.5" />
        <div className="flex-1 text-sm">
          <div className="font-semibold text-[var(--text-primary)]">
            Subscription ending
          </div>
          <div className="text-[var(--text-secondary)] mt-0.5">
            Your {planName} plan ends
            {dateLabel ? ` on ${dateLabel}` : " soon"}.
            {!planData.is_owner && " Contact your account owner to reactivate."}
          </div>
          {planData.is_owner && (
            <button
              onClick={handleReactivate}
              disabled={reactivating}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand text-white text-xs font-bold uppercase rounded disabled:opacity-60"
            >
              {reactivating ? (
                <>
                  <RotateCw className="w-3 h-3 animate-spin" />
                  Reactivating…
                </>
              ) : (
                "Reactivate subscription"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
