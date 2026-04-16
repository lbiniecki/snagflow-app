"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { ChevronLeft, Check, X, Zap } from "lucide-react";
import clsx from "clsx";
import BottomNav from "./BottomNav";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// ─── Plan matrix ────────────────────────────────────────────────
// Mirrors app/services/plan_limits.py on the backend. Keep in sync.

type LimitRow = { label: string; values: (string | number)[] };
type FeatureRow = { label: string; values: boolean[]; highlight?: boolean };

const PLANS = [
  {
    slug: "free",
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    priceIdMonthly: null as string | null,
    priceIdAnnual: null as string | null,
  },
  {
    slug: "starter",
    name: "Starter",
    monthlyPrice: 24,
    annualPrice: 240,
    priceIdMonthly: "price_1TM9TGIzCuyhGXgYAI34UPiO",
    priceIdAnnual: "price_1TM9aIIzCuyhGXgY9TeUq3ch",
  },
  {
    slug: "team",
    name: "Team",
    monthlyPrice: 49,
    annualPrice: 490,
    priceIdMonthly: "price_1TM9U3IzCuyhGXgYIFVd7fs1",
    priceIdAnnual: "price_1TM9akIzCuyhGXgYmbDAHROz",
    popular: true,
  },
  {
    slug: "pro",
    name: "Pro",
    monthlyPrice: 99,
    annualPrice: 990,
    priceIdMonthly: "price_1TM9USIzCuyhGXgY8gYqlcMP",
    priceIdAnnual: "price_1TM9bJIzCuyhGXgYEpO1hAUF",
  },
  {
    slug: "business",
    name: "Business",
    monthlyPrice: 179,
    annualPrice: 1790,
    priceIdMonthly: "price_1TM9UlIzCuyhGXgYCVxWXZsC",
    priceIdAnnual: "price_1TM9bmIzCuyhGXgYv9aUGOGR",
  },
];

// Order of plans: free, starter, team, pro, business
const LIMIT_ROWS: LimitRow[] = [
  { label: "Users",        values: [1, 3, 10, 25, 50] },
  { label: "Projects",     values: [2, 5, 15, "Unlimited", "Unlimited"] },
  { label: "Snags / month", values: [20, 100, 500, "Unlimited", "Unlimited"] },
  { label: "Photos / snag", values: [4, 4, 4, 4, 4] },
];

const FEATURE_ROWS: FeatureRow[] = [
  { label: "PDF reports",         values: [true,  true,  true,  true,  true] },
  { label: "Voice dictation",     values: [true,  true,  true,  true,  true] },
  { label: "Offline mode",        values: [true,  true,  true,  true,  true] },
  { label: "Company logo on PDF", values: [false, true,  true,  true,  true],  highlight: true },
  { label: "Send report by email",values: [false, false, true,  true,  true],  highlight: true },
];

// Special row: watermark is a NEGATIVE signal — it's only on Free and indicates
// the free plan's PDFs carry a "VOXSITE · FREE PLAN" diagonal mark.
const WATERMARK_ROW: FeatureRow = {
  label: "PDF watermark",
  values: [true, false, false, false, false],
  highlight: true,
};

// Per-plan summary shown inside each card (headline limits)
function summaryFor(slug: string): string {
  switch (slug) {
    case "free":     return "1 user · 2 projects · 20 snags/mo";
    case "starter":  return "3 users · 5 projects · 100 snags/mo";
    case "team":     return "10 users · 15 projects · 500 snags/mo";
    case "pro":      return "25 users · Unlimited";
    case "business": return "50 users · Unlimited";
    default:         return "";
  }
}

// Per-plan highlight features shown inside each card
function highlightsFor(slug: string): string[] {
  switch (slug) {
    case "free":
      return ["PDF reports", "Voice dictation", "Offline mode"];
    case "starter":
      return ["Everything in Free", "Company logo on PDF", "No watermark"];
    case "team":
      return ["Everything in Starter", "Send reports by email", "10 team seats"];
    case "pro":
      return ["Everything in Team", "Unlimited projects", "Unlimited snags"];
    case "business":
      return ["Everything in Pro", "50 team seats", "Priority support"];
    default:
      return [];
  }
}

export default function PricingScreen() {
  const { setScreen, showToast } = useStore();
  const [annual, setAnnual] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);

  const handleCheckout = async (priceId: string | null) => {
    if (!priceId) return;
    setLoading(priceId);

    try {
      const token = localStorage.getItem("voxsite_token");
      const res = await fetch(`${API}/billing/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ price_id: priceId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Checkout failed");
      }

      const data = await res.json();
      window.location.href = data.checkout_url;
    } catch (err: any) {
      showToast(err.message);
    } finally {
      setLoading(null);
    }
  };

  const handlePortal = async () => {
    try {
      const token = localStorage.getItem("voxsite_token");
      const res = await fetch(`${API}/billing/portal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Portal failed");
      }

      const data = await res.json();
      window.location.href = data.portal_url;
    } catch (err: any) {
      showToast(err.message);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[var(--bg)] border-b border-[var(--border)] px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => setScreen("projects")}
          className="p-2 rounded-full hover:bg-[var(--bg3)] text-[var(--text2)]"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-base font-semibold flex-1 text-center">Pricing</h2>
        <div className="w-9" />
      </div>

      <div className="px-5 py-6 pb-28">
        {/* Monthly / Annual toggle */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <span
            className={clsx(
              "text-xs font-semibold",
              !annual ? "text-white" : "text-[var(--text3)]"
            )}
          >
            Monthly
          </span>
          <button
            onClick={() => setAnnual(!annual)}
            className={clsx(
              "w-12 h-6 rounded-full relative transition-colors",
              annual ? "bg-brand" : "bg-[var(--bg3)]"
            )}
            aria-label="Toggle annual billing"
          >
            <div
              className={clsx(
                "w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform",
                annual ? "translate-x-6" : "translate-x-0.5"
              )}
            />
          </button>
          <span
            className={clsx(
              "text-xs font-semibold",
              annual ? "text-white" : "text-[var(--text3)]"
            )}
          >
            Annual <span className="text-green-400 text-[10px]">Save 17%</span>
          </span>
        </div>

        {/* Plan cards */}
        <div className="space-y-4">
          {PLANS.map((plan) => {
            const priceId = annual ? plan.priceIdAnnual : plan.priceIdMonthly;
            const price = annual ? plan.annualPrice : plan.monthlyPrice;
            const isLoading = loading === priceId;
            const highlights = highlightsFor(plan.slug);

            return (
              <div
                key={plan.slug}
                className={clsx(
                  "border rounded-2xl p-4 transition-all",
                  plan.popular
                    ? "border-brand bg-brand/5"
                    : "border-[var(--border)] bg-[var(--bg2)]"
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold">{plan.name}</h3>
                      {plan.popular && (
                        <span className="text-[9px] font-bold uppercase bg-brand text-white px-2 py-0.5 rounded-full">
                          Popular
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--text3)] truncate">
                      {summaryFor(plan.slug)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {price === 0 ? (
                      <span className="text-lg font-bold">Free</span>
                    ) : annual ? (
                      <>
                        <span className="text-lg font-bold">€{price}</span>
                        <span className="text-[11px] text-[var(--text3)]">/year</span>
                      </>
                    ) : (
                      <>
                        <span className="text-lg font-bold">€{price}</span>
                        <span className="text-[11px] text-[var(--text3)]">/mo</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Highlights */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
                  {highlights.map((f) => (
                    <span
                      key={f}
                      className="text-[10px] text-[var(--text2)] flex items-center gap-1"
                    >
                      <Check className="w-3 h-3 text-green-400" /> {f}
                    </span>
                  ))}
                </div>

                {/* Free-plan watermark disclosure */}
                {plan.slug === "free" && (
                  <p className="text-[10px] text-[var(--text3)] italic mb-3">
                    Reports include a "VOXSITE · FREE PLAN" watermark.
                  </p>
                )}

                {/* CTA */}
                {priceId ? (
                  <button
                    onClick={() => handleCheckout(priceId)}
                    disabled={isLoading}
                    className={clsx(
                      "w-full py-2.5 rounded-lg text-xs font-semibold transition-all",
                      plan.popular
                        ? "bg-brand text-white hover:bg-brand-light"
                        : "bg-[var(--surface)] text-white hover:bg-[var(--bg3)]",
                      isLoading && "opacity-50"
                    )}
                  >
                    {isLoading ? "Loading..." : `Upgrade to ${plan.name}`}
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-lg text-xs font-semibold bg-[var(--surface)] text-[var(--text3)]"
                  >
                    Current Plan
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Compare all plans */}
        <div className="mt-6">
          <button
            onClick={() => setCompareOpen(!compareOpen)}
            className="w-full text-center text-xs text-[var(--text2)] font-semibold py-3 border border-[var(--border)] rounded-lg hover:bg-[var(--bg3)]"
          >
            {compareOpen ? "Hide comparison" : "Compare all plans →"}
          </button>

          {compareOpen && (
            <div className="mt-4 overflow-x-auto -mx-5 px-5">
              <table className="w-full text-[11px] border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="text-left font-semibold text-[var(--text3)] pb-2 pr-2 sticky left-0 bg-[var(--bg)]">
                      &nbsp;
                    </th>
                    {PLANS.map((p) => (
                      <th
                        key={p.slug}
                        className={clsx(
                          "font-semibold pb-2 px-2 text-center whitespace-nowrap",
                          p.popular ? "text-brand" : "text-[var(--text2)]"
                        )}
                      >
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {LIMIT_ROWS.map((row) => (
                    <tr key={row.label}>
                      <td className="text-left py-2 pr-2 text-[var(--text2)] sticky left-0 bg-[var(--bg)] border-t border-[var(--border)]">
                        {row.label}
                      </td>
                      {row.values.map((v, i) => (
                        <td
                          key={i}
                          className="text-center py-2 px-2 border-t border-[var(--border)] whitespace-nowrap"
                        >
                          {v}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {FEATURE_ROWS.map((row) => (
                    <tr key={row.label}>
                      <td
                        className={clsx(
                          "text-left py-2 pr-2 sticky left-0 bg-[var(--bg)] border-t border-[var(--border)]",
                          row.highlight
                            ? "text-white font-semibold"
                            : "text-[var(--text2)]"
                        )}
                      >
                        {row.label}
                      </td>
                      {row.values.map((v, i) => (
                        <td
                          key={i}
                          className="text-center py-2 px-2 border-t border-[var(--border)]"
                        >
                          {v ? (
                            <Check className="w-3.5 h-3.5 text-green-400 inline" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-[var(--text3)] inline" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {/* Watermark row — inverse logic (present on Free = downside) */}
                  <tr>
                    <td className="text-left py-2 pr-2 text-white font-semibold sticky left-0 bg-[var(--bg)] border-t border-[var(--border)]">
                      {WATERMARK_ROW.label}
                    </td>
                    {WATERMARK_ROW.values.map((v, i) => (
                      <td
                        key={i}
                        className="text-center py-2 px-2 border-t border-[var(--border)]"
                      >
                        {v ? (
                          <Check className="w-3.5 h-3.5 text-amber-400 inline" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-[var(--text3)] inline" />
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Enterprise */}
        <div className="mt-6 text-center border border-[var(--border)] rounded-2xl p-5 bg-[var(--bg2)]">
          <Zap className="w-6 h-6 text-brand mx-auto mb-2" />
          <h3 className="text-sm font-bold mb-1">Need more than 50 users?</h3>
          <p className="text-[11px] text-[var(--text3)] mb-3">
            Enterprise plan starts at €299+/mo — unlimited everything, dedicated support.
          </p>
          <a
            href="mailto:lukasz.biniecki@hanleypepper.ie?subject=VoxSite Enterprise"
            className="inline-block px-5 py-2 bg-brand/10 text-brand text-xs font-semibold rounded-lg"
          >
            Contact Us
          </a>
        </div>

        {/* Manage subscription */}
        <div className="mt-4 text-center">
          <button
            onClick={handlePortal}
            className="text-xs text-[var(--text3)] underline"
          >
            Manage existing subscription
          </button>
        </div>
      </div>

      <BottomNav active="projects" />
    </div>
  );
}
