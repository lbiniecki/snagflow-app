"use client";
import Link from "next/link";

// Hero section.
//
// Copy is locked from the architecture doc v1.4. Visual is intentionally
// scaffolded — Session B replaces the placeholder block with a real
// screenshot/video of the snag flow.
export default function Hero() {
  return (
    <section className="relative px-6 lg:px-8 pt-16 lg:pt-24 pb-20 lg:pb-32">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl">
          {/* Headline + subhead — locked in architecture v1.4 */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--text-primary)] leading-[1.05]">
            Walk the site.
            <br />
            Your report writes itself.
          </h1>

          <p className="mt-6 text-lg lg:text-xl text-[var(--text-secondary)] leading-relaxed">
            Snag in real time. Leave site with the report ready to send.
          </p>

          {/* Workflow-fit reassurance, muted and small per architecture spec */}
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Fits your existing site workflow.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:items-center">
            <Link
              href="/app?mode=signup"
              className="inline-flex items-center justify-center px-6 py-3 bg-brand hover:bg-brand-dark text-white font-semibold rounded-lg transition-colors"
            >
              Try free, no card →
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center px-6 py-3 border border-[var(--border)] hover:border-[var(--text-secondary)] text-[var(--text-primary)] font-semibold rounded-lg transition-colors"
            >
              See how it works ↓
            </a>
          </div>

          {/* Trust signals — architecture v1.4. Three concrete factual claims. */}
          <p className="mt-6 text-sm text-[var(--text-muted)]">
            Free forever · EU-hosted · GDPR-compliant
          </p>
        </div>

        {/* Hero visual — scaffold.
            Session B: replace with one of:
              (best)    a 10-15s silent video loop of voice-to-snag
              (good)    annotated screenshot of transcription appearing live
              (minimum) clean phone-frame mockup of the snag detail screen
            Keeping the placeholder large so the page rhythm is right
            even before the real visual lands. */}
        <div className="mt-16 lg:mt-20">
          <div className="aspect-video w-full max-w-4xl mx-auto rounded-2xl border border-[var(--border)] bg-[var(--card)] flex items-center justify-center">
            <p className="text-sm text-[var(--text-muted)]">
              [TODO Session B: Hero visual — phone-frame screenshot or short video]
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
