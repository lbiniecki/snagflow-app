"use client";
import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

// Pricing section.
//
// Architecture v1.4:
// - All 6 tiers visible (Free, Solo, Starter, Team, Pro, Business)
// - Team visually elevated with "Recommended" badge
// - Annual toggle showing 17% savings
// - VAT disclosure visible, not buried
// - Enterprise as separate tile
//
// Prices match Stripe configuration verified in this session.
// VAT disclosure required: per Polish OSS, prices are exclusive of VAT.

type Tier = {
  slug: string;
  name: string;
  monthly: number; // EUR
  annual: number; // EUR (sums to ~10 months for ~17% off)
  tagline: string;
  features: string[];
  highlighted?: boolean;
};

const TIERS: Tier[] = [
  {
    slug: "free",
    name: "Free",
    monthly: 0,
    annual: 0,
    tagline: "Try VoxSite, forever",
    features: [
      "1 project",
      "Up to 20 snags",
      "Watermarked PDF reports",
      "Single user",
    ],
  },
  {
    slug: "solo",
    name: "Solo",
    monthly: 12,
    annual: 120,
    tagline: "One engineer, one project at a time",
    features: [
      "1 active project",
      "Unlimited snags",
      "Branded PDF reports",
      "Single user",
    ],
  },
  {
    slug: "starter",
    name: "Starter",
    monthly: 29,
    annual: 290,
    tagline: "Small projects, simple needs",
    features: [
      "3 active projects",
      "Unlimited snags",
      "Branded PDF reports",
      "Up to 3 users",
    ],
  },
  {
    slug: "team",
    name: "Team",
    monthly: 59,
    annual: 590,
    tagline: "Best for small teams of 2–10 engineers",
    features: [
      "10 active projects",
      "Unlimited snags",
      "Branded PDF reports",
      "Up to 10 users",
      "Priority email support",
    ],
    highlighted: true,
  },
  {
    slug: "pro",
    name: "Pro",
    monthly: 119,
    annual: 1190,
    tagline: "Multi-project teams",
    features: [
      "25 active projects",
      "Unlimited snags",
      "Branded PDF reports",
      "Up to 25 users",
      "Priority email support",
    ],
  },
  {
    slug: "business",
    name: "Business",
    monthly: 199,
    annual: 1990,
    tagline: "Larger consultancies",
    features: [
      "Unlimited projects",
      "Unlimited snags",
      "Branded PDF reports",
      "Unlimited users",
      "Priority email support",
    ],
  },
];

export default function PricingSection() {
  const [annual, setAnnual] = useState<boolean>(false);

  return (
    <section
      id="pricing"
      className="px-6 lg:px-8 py-20 lg:py-28 border-t border-[var(--border)] bg-[var(--card)]"
    >
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
          Simple, predictable pricing
        </h2>
        <p className="text-lg text-[var(--text-secondary)] mb-8 max-w-2xl">
          Pick the tier that fits today. Move up or down anytime — your data
          stays yours.
        </p>

        {/* Monthly / Annual toggle */}
        <div className="inline-flex items-center gap-1 p-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg mb-12">
          <button
            onClick={() => setAnnual(false)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
              !annual
                ? "bg-brand text-white"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
              annual
                ? "bg-brand text-white"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Annual
            <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-brand/20 text-brand rounded">
              17% OFF
            </span>
          </button>
        </div>

        {/* 6-tier grid. On lg+: 6-column. On md: 3-column. On mobile: stacked.
            Team always renders prominently due to highlighted style. */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TIERS.map((tier) => (
            <PricingCard key={tier.slug} tier={tier} annual={annual} />
          ))}
        </div>

        {/* Enterprise tile, separate */}
        <div className="mt-6 p-6 lg:p-8 bg-[var(--bg)] border border-[var(--border)] rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              Enterprise
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Custom needs, custom contract. Talk to us about volume,
              SSO, on-premise hosting, dedicated support.
            </p>
          </div>
          <a
            href="mailto:sales@voxsite.app?subject=VoxSite%20Enterprise%20enquiry"
            className="inline-flex items-center justify-center px-5 py-2.5 border border-[var(--border)] hover:border-brand hover:text-brand text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
          >
            Contact us →
          </a>
        </div>

        {/* VAT disclosure — must be visible per Polish OSS compliance.
            Not buried in fine print. */}
        <div className="mt-8 text-sm text-[var(--text-muted)] space-y-1">
          <p>
            Prices exclude VAT. EU customers see VAT applied at checkout
            based on their country. EU businesses with valid VAT number
            reverse-charge.
          </p>
          <p>Free plan is free forever. No card required.</p>
        </div>
      </div>
    </section>
  );
}

function PricingCard(props: { tier: Tier; annual: boolean }) {
  const { tier, annual } = props;
  const price = annual ? tier.annual : tier.monthly;
  const cadence = annual ? "/year" : "/month";

  return (
    <div
      className={`relative flex flex-col p-6 lg:p-7 rounded-2xl border transition-shadow ${
        tier.highlighted
          ? "bg-[var(--bg)] border-brand shadow-lg lg:scale-[1.02]"
          : "bg-[var(--bg)] border-[var(--border)]"
      }`}
    >
      {tier.highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-brand text-white text-xs font-bold rounded-full">
          RECOMMENDED
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          {tier.name}
        </h3>
        <p className="text-xs text-[var(--text-muted)] mt-1">{tier.tagline}</p>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-[var(--text-primary)] tabular-nums">
            €{price}
          </span>
          {price > 0 && (
            <span className="text-sm text-[var(--text-muted)]">{cadence}</span>
          )}
        </div>
        {price > 0 && (
          <p className="text-xs text-[var(--text-muted)] mt-1">excl. VAT</p>
        )}
      </div>

      <ul className="flex-1 space-y-2 mb-6">
        {tier.features.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-2 text-sm text-[var(--text-secondary)]"
          >
            <Check className="w-4 h-4 text-brand mt-0.5 flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        href="/app?mode=signup"
        className={`inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
          tier.highlighted
            ? "bg-brand hover:bg-brand-dark text-white"
            : "border border-[var(--border)] hover:border-brand hover:text-brand text-[var(--text-primary)]"
        }`}
      >
        {tier.slug === "free" ? "Start free →" : "Try free, then upgrade →"}
      </Link>
    </div>
  );
}
