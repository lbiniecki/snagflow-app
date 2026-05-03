"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/api";

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
  // Guard against a flash of marketing content for already-logged-in users.
  // We start as "checking" so the page renders nothing until we know the
  // auth state. If a token exists, we redirect to /app immediately. If not,
  // we render the landing page.
  //
  // Note: we deliberately do NOT verify the token with the backend here.
  // A stale token gets handled inside /app/page.tsx (which clears it and
  // bounces back to /). Doing the network call twice would slow the
  // first paint of an authenticated user's session for no benefit.
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (token) {
      router.replace("/app");
      return;
    }
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
