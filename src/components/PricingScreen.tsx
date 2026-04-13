"use client";

import { useState } from "react";
import { Check, Star, ChevronLeft } from "lucide-react";
import { useStore } from "@/lib/store";
import clsx from "clsx";

interface Tier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
}

const tiers: Tier[] = [
  {
    name: "Free",
    price: "€0",
    period: "forever",
    description: "Try VoxSite with a single project",
    features: [
      "1 project",
      "Up to 50 snags",
      "Watermarked PDF reports",
      "Voice dictation",
      "Photo capture",
    ],
    cta: "Current Plan",
  },
  {
    name: "Starter",
    price: "€24",
    period: "/mo",
    description: "For independent inspectors",
    features: [
      "5 projects",
      "1 user",
      "Unlimited snags",
      "Branded PDF reports",
      "Voice dictation",
      "Photo capture",
    ],
    cta: "Upgrade",
  },
  {
    name: "Team",
    price: "€49",
    period: "/mo",
    description: "For small teams on site",
    features: [
      "15 projects",
      "3 users",
      "Unlimited snags",
      "Branded PDF reports",
      "Voice dictation",
      "Close with photo",
      "Weather & visit tracking",
    ],
    highlighted: true,
    cta: "Upgrade",
  },
  {
    name: "Pro",
    price: "€99",
    period: "/mo",
    description: "For growing companies",
    features: [
      "Unlimited projects",
      "10 users",
      "All Team features",
      "CSV & Excel export",
      "Report customisation",
      "Priority email support",
    ],
    cta: "Upgrade",
  },
  {
    name: "Business",
    price: "€179",
    period: "/mo",
    description: "For established firms",
    features: [
      "Unlimited projects",
      "25 users",
      "All Pro features",
      "Custom branding",
      "Company logo on reports",
      "Priority support",
      "Dedicated account manager",
    ],
    cta: "Upgrade",
  },
  {
    name: "Enterprise",
    price: "€299+",
    period: "/mo",
    description: "For large organisations",
    features: [
      "Unlimited everything",
      "Unlimited users",
      "All Business features",
      "API access",
      "Dedicated onboarding",
      "SLA guarantee",
      "Custom integrations",
    ],
    cta: "Contact Us",
  },
];

export default function PricingScreen() {
  const { setScreen } = useStore();
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

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
        <h2 className="text-base font-semibold flex-1 text-center">Plans & Pricing</h2>
        <div className="w-9" />
      </div>

      <div className="px-5 py-6 pb-12">
        {/* Title */}
        <div className="text-center mb-6 animate-slide-up">
          <h1 className="text-2xl font-bold mb-2">Choose your plan</h1>
          <p className="text-sm text-[var(--text3)]">
            Start free, upgrade when you need more
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex justify-center mb-6 animate-slide-up delay-50">
          <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-full p-1 flex">
            <button
              onClick={() => setBilling("monthly")}
              className={clsx(
                "px-4 py-1.5 rounded-full text-xs font-semibold transition-all",
                billing === "monthly"
                  ? "bg-brand text-white"
                  : "text-[var(--text3)]"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("annual")}
              className={clsx(
                "px-4 py-1.5 rounded-full text-xs font-semibold transition-all",
                billing === "annual"
                  ? "bg-brand text-white"
                  : "text-[var(--text3)]"
              )}
            >
              Annual
              <span className="ml-1 text-[10px] text-green-400">-20%</span>
            </button>
          </div>
        </div>

        {/* Tier cards */}
        <div className="space-y-3">
          {tiers.map((tier, i) => {
            // Calculate annual price
            const monthlyNum = parseFloat(tier.price.replace(/[^0-9.]/g, ""));
            const displayPrice =
              billing === "annual" && monthlyNum > 0
                ? `€${Math.round(monthlyNum * 0.8)}`
                : tier.price;
            const displayPeriod =
              billing === "annual" && monthlyNum > 0
                ? "/mo billed annually"
                : tier.period;

            return (
              <div
                key={tier.name}
                className={clsx(
                  "rounded-xl p-4 border transition-all animate-slide-up",
                  tier.highlighted
                    ? "bg-brand/10 border-brand"
                    : "bg-[var(--bg2)] border-[var(--border)]"
                )}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[15px] font-bold">{tier.name}</h3>
                      {tier.highlighted && (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-brand bg-brand/20 px-2 py-0.5 rounded-full">
                          <Star className="w-3 h-3" /> POPULAR
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--text3)] mt-0.5">
                      {tier.description}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xl font-bold">{displayPrice}</span>
                    <span className="text-[11px] text-[var(--text3)] ml-0.5">
                      {displayPeriod}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-3">
                  {tier.features.map((f) => (
                    <div key={f} className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-green-400 flex-shrink-0" />
                      <span className="text-[11px] text-[var(--text2)]">{f}</span>
                    </div>
                  ))}
                </div>

                <button
                  className={clsx(
                    "w-full py-2.5 rounded-lg text-xs font-semibold transition-all",
                    tier.highlighted
                      ? "bg-brand text-white hover:bg-brand-light"
                      : tier.cta === "Current Plan"
                      ? "bg-[var(--surface)] text-[var(--text3)] border border-[var(--border)] cursor-default"
                      : "bg-[var(--surface)] text-white border border-[var(--border)] hover:border-brand"
                  )}
                  disabled={tier.cta === "Current Plan"}
                >
                  {tier.cta}
                </button>
              </div>
            );
          })}
        </div>

        <p className="text-center text-[11px] text-[var(--text3)] mt-6">
          All prices exclude VAT. Cancel anytime.
        </p>
      </div>
    </div>
  );
}
