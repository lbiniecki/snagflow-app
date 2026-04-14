"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { ChevronLeft, Check, Zap } from "lucide-react";
import clsx from "clsx";
import BottomNav from "./BottomNav";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const PLANS = [
  {
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    priceIdMonthly: null,
    priceIdAnnual: null,
    users: "1 user",
    projects: "2 projects",
    snags: "20 snags/month",
    features: ["4 photos/snag", "Voice dictation", "PDF reports", "Offline mode"],
  },
  {
    name: "Starter",
    monthlyPrice: 24,
    annualPrice: 240,
    priceIdMonthly: "price_1TM9TGIzCuyhGXgYAI34UPiO",
    priceIdAnnual: "price_1TM9aIIzCuyhGXgY9TeUq3ch",
    users: "3 users",
    projects: "5 projects",
    snags: "100 snags/month",
    features: ["Everything in Free", "4 photos/snag", "Voice dictation", "PDF reports"],
  },
  {
    name: "Team",
    monthlyPrice: 49,
    annualPrice: 490,
    priceIdMonthly: "price_1TM9U3IzCuyhGXgYIFVd7fs1",
    priceIdAnnual: "price_1TM9akIzCuyhGXgYmbDAHROz",
    users: "10 users",
    projects: "15 projects",
    snags: "500 snags/month",
    popular: true,
    features: ["Everything in Starter", "Company logo on PDF", "Viewer roles"],
  },
  {
    name: "Pro",
    monthlyPrice: 99,
    annualPrice: 990,
    priceIdMonthly: "price_1TM9USIzCuyhGXgY8gYqlcMP",
    priceIdAnnual: "price_1TM9bJIzCuyhGXgYEpO1hAUF",
    users: "25 users",
    projects: "Unlimited",
    snags: "Unlimited",
    features: ["Everything in Team", "Priority support"],
  },
  {
    name: "Business",
    monthlyPrice: 179,
    annualPrice: 1790,
    priceIdMonthly: "price_1TM9UlIzCuyhGXgYCVxWXZsC",
    priceIdAnnual: "price_1TM9bmIzCuyhGXgYv9aUGOGR",
    users: "50 users",
    projects: "Unlimited",
    snags: "Unlimited",
    features: ["Everything in Pro", "Dedicated support"],
  },
];

export default function PricingScreen() {
  const { setScreen, showToast } = useStore();
  const [annual, setAnnual] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

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
        <button onClick={() => setScreen("projects")} className="p-2 rounded-full hover:bg-[var(--bg3)] text-[var(--text2)]">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-base font-semibold flex-1 text-center">Pricing</h2>
        <div className="w-9" />
      </div>

      <div className="px-5 py-6 pb-28">
        {/* Toggle */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className={clsx("text-xs font-semibold", !annual ? "text-white" : "text-[var(--text3)]")}>Monthly</span>
          <button
            onClick={() => setAnnual(!annual)}
            className={clsx(
              "w-12 h-6 rounded-full relative transition-colors",
              annual ? "bg-brand" : "bg-[var(--bg3)]"
            )}
          >
            <div className={clsx(
              "w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform",
              annual ? "translate-x-6" : "translate-x-0.5"
            )} />
          </button>
          <span className={clsx("text-xs font-semibold", annual ? "text-white" : "text-[var(--text3)]")}>
            Annual <span className="text-green-400 text-[10px]">Save 17%</span>
          </span>
        </div>

        {/* Plans */}
        <div className="space-y-4">
          {PLANS.map((plan) => {
            const priceId = annual ? plan.priceIdAnnual : plan.priceIdMonthly;
            const price = annual ? plan.annualPrice : plan.monthlyPrice;
            const isLoading = loading === priceId;

            return (
              <div
                key={plan.name}
                className={clsx(
                  "border rounded-2xl p-4 transition-all",
                  plan.popular
                    ? "border-brand bg-brand/5"
                    : "border-[var(--border)] bg-[var(--bg2)]"
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold">{plan.name}</h3>
                      {plan.popular && (
                        <span className="text-[9px] font-bold uppercase bg-brand text-white px-2 py-0.5 rounded-full">Popular</span>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--text3)]">
                      {plan.users} • {plan.projects} • {plan.snags}
                    </p>
                  </div>
                  <div className="text-right">
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

                {/* Features */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
                  {plan.features.map((f) => (
                    <span key={f} className="text-[10px] text-[var(--text2)] flex items-center gap-1">
                      <Check className="w-3 h-3 text-green-400" /> {f}
                    </span>
                  ))}
                </div>

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

        {/* Enterprise */}
        <div className="mt-6 text-center border border-[var(--border)] rounded-2xl p-5 bg-[var(--bg2)]">
          <Zap className="w-6 h-6 text-brand mx-auto mb-2" />
          <h3 className="text-sm font-bold mb-1">Need more than 50 users?</h3>
          <p className="text-[11px] text-[var(--text3)] mb-3">Contact us for a custom enterprise plan.</p>
          <a
            href="mailto:lukasz.biniecki@hanleypepper.ie?subject=VoxSite Enterprise"
            className="inline-block px-5 py-2 bg-brand/10 text-brand text-xs font-semibold rounded-lg"
          >
            Contact Us
          </a>
        </div>

        {/* Manage subscription */}
        <div className="mt-4 text-center">
          <button onClick={handlePortal} className="text-xs text-[var(--text3)] underline">
            Manage existing subscription
          </button>
        </div>
      </div>

      <BottomNav active="projects" />
    </div>
  );
}
