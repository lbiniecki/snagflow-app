"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";

// Hero section — Session B: with cycling animation.
//
// The hero visual cycles between two phone-frame mockups:
//   1. Snag list mid-visit (the work happening)
//   2. Inspection report PDF (the result)
//
// This visually demonstrates the headline: "Walk the site. Your report
// writes itself." The reader sees the transformation without reading.
//
// Animation timing:
//   0.0–2.5s:  snag list visible
//   2.5–3.0s:  cross-fade transition (0.5s)
//   3.0–5.5s:  report visible
//   5.5–6.0s:  cross-fade back
//   ↻ repeats
//
// Pauses on hover so visitors can study a specific frame.
//
// Implementation note: we use plain CSS opacity transitions rather than
// Framer Motion for the hero. Reasons:
//   - Smaller bundle (no extra dependency just for a 2-frame crossfade)
//   - GPU-accelerated by default
//   - Works without "use client" overhead from motion components
// Framer Motion is reserved for the more complex scroll-triggered
// animations elsewhere on the page.
//
// Accessibility:
//   - prefers-reduced-motion: animation pauses, shows just the snag list.
//   - aria-hidden on the secondary frame since it's decorative for the
//     primary message; both are described by the page heading.

const CYCLE_MS = 6000;
const HOLD_MS = 2500; // time each frame is fully visible before cross-fade

export default function Hero() {
  const [showReport, setShowReport] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    // Respect reduced-motion preference. If user has it on, never cycle.
    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || paused) return;

    // Two-step cycle: at HOLD_MS we cross-fade to "report"; at CYCLE_MS
    // we reset to "snag list". Using a single setInterval works because
    // CYCLE_MS = 2 * HOLD_MS + 2 * fade-time (matching the CSS duration).
    const id = setInterval(() => {
      setShowReport((s) => !s);
    }, HOLD_MS + 500); // hold duration + half the cross-fade window
    return () => clearInterval(id);
  }, [paused]);

  return (
    <section className="relative px-6 lg:px-8 pt-16 lg:pt-24 pb-20 lg:pb-32">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left column: copy */}
          <div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--text-primary)] leading-[1.05]">
              Walk the site.
              <br />
              Your report writes itself.
            </h1>

            <p className="mt-6 text-lg lg:text-xl text-[var(--text-secondary)] leading-relaxed">
              Snag in real time. Leave site with the report ready to send.
            </p>

            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Fits your existing site workflow.
            </p>

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

            <p className="mt-6 text-sm text-[var(--text-muted)]">
              Free forever · EU-hosted · GDPR-compliant
            </p>
          </div>

          {/* Right column: animated phone-frame stack.
              Two phones overlap; the front one cross-fades between the two
              source images.
              On lg+ both phones are visible side-by-side with the active
              one slightly forward. On smaller screens we show just one
              phone-frame and let the cross-fade do the storytelling. */}
          <div
            className="relative flex justify-center items-center min-h-[500px] lg:min-h-[600px]"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {/* Background phone — the "after" state, slightly tilted right.
                Hidden on mobile for visual simplicity; on desktop it gives
                depth and previews the report even before the cross-fade. */}
            <div
              className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 w-[260px] aspect-[9/19] rounded-[2rem] overflow-hidden border border-[var(--border)] bg-[var(--card)] shadow-2xl shadow-black/20 rotate-3 opacity-60"
              aria-hidden="true"
            >
              <Image
                src="/landing/mockup_report.png"
                alt=""
                fill
                sizes="260px"
                className="object-cover"
              />
            </div>

            {/* Foreground phone — cross-fades between snag list and report.
                Both images are stacked; opacity flips between them every
                HOLD_MS. transition-opacity gives the smooth fade. */}
            <div className="relative w-[280px] lg:w-[300px] aspect-[9/19] rounded-[2rem] overflow-hidden border border-[var(--border)] bg-[var(--card)] shadow-2xl shadow-black/30 z-10">
              {/* Snag list — base layer */}
              <Image
                src="/landing/mockup_snags.png"
                alt="VoxSite app showing a site visit with four snag items, photos, descriptions, and statuses"
                fill
                priority
                sizes="(max-width: 768px) 70vw, 300px"
                className={`object-cover transition-opacity duration-500 ${
                  showReport ? "opacity-0" : "opacity-100"
                }`}
              />
              {/* Report — overlay layer */}
              <Image
                src="/landing/mockup_report.png"
                alt=""
                fill
                sizes="(max-width: 768px) 70vw, 300px"
                className={`object-cover absolute inset-0 transition-opacity duration-500 ${
                  showReport ? "opacity-100" : "opacity-0"
                }`}
                aria-hidden="true"
              />
            </div>

            {/* Subtle caption that updates with the active frame.
                Reinforces "site visit" → "report" narrative for users
                who don't notice the cross-fade. */}
            <p className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs text-[var(--text-muted)] whitespace-nowrap">
              {showReport ? "↑ Report ready to send" : "↑ Snag in progress"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
