"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, isReturningUser, setReturningUser } from "@/lib/api";

import LandingNav from "@/components/landing/LandingNav";
import Hero from "@/components/landing/Hero";
import ProblemSection from "@/components/landing/ProblemSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import PricingSection from "@/components/landing/PricingSection";
import PilotQuoteSection from "@/components/landing/PilotQuoteSection";
import FAQSection from "@/components/landing/FAQSection";
import FinalCTA from "@/components/landing/FinalCTA";
import LandingFooter from "@/components/landing/LandingFooter";

export default function LandingPage() {
  const router = useRouter();
  // Guard against a flash of marketing content for returning users.
  // We start as "checking" so the page renders nothing until we know what
  // to do with this visitor. The check is synchronous (just localStorage
  // reads), so this resolves on the first effect tick.
  //
  // Three branches:
  // 1. Token in localStorage → user is logged in (or has stale session).
  //    Redirect to /app, which validates the token and either continues
  //    or bounces back to /. Either way, never shows marketing.
  // 2. No token but returning-user flag set → user has signed in here
  //    before, sometime on this device. Skip marketing, take them to
  //    the login form directly.
  // 3. No token and no flag → genuinely new visitor. Show marketing.
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const token = getToken();

    if (token) {
      // Backfill: anyone with a token has logged in successfully at
      // some point. Mark them as returning so future logouts→visits
      // skip marketing too.
      setReturningUser();
      router.replace("/app");
      return;
    }

    if (isReturningUser()) {
      // Known returning user without an active session — straight to login.
      router.replace("/app?mode=login");
      return;
    }

    // True first-time visitor — show the marketing page.
    setAuthChecked(true);
  }, [router]);

  if (!authChecked) {
    // Render nothing during the auth check. This is a few ms; a spinner
    // would flash. The body bg colour shows through naturally.
    return null;
  }

  return (
    <main className="min-h-screen">
      <LandingNav />
      <Hero />
      <ProblemSection />
      <HowItWorksSection />
      <FeaturesSection />
      <PricingSection />
      <PilotQuoteSection />
      <FAQSection />
      <FinalCTA />
      <LandingFooter />
    </main>
  );
}
