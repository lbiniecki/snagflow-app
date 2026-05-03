"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

// Hero — Session B v4.
//
// Interactive single-phone showcase. The user taps the phone to advance
// through the 5 workflow screens. Each tap cross-fades to the next.
//
// Sequence (matches the natural use flow):
//   0. Projects        — "what I'm working on"
//   1. Site visits     — "the visits in this project"
//   2. Snag list       — "what I captured this visit"
//   3. Edit item       — "the detail of one snag"
//   4. Report          — "the finished output"
//
// v4 sizing strategy:
//   - All 5 mockups use object-contain (no cropping)
//   - Phone frame uses aspect-[9/19] — slightly taller than the mockups
//   - Frame background is hardcoded to #F5F0E8 (the cream tone used in
//     the mockup images themselves), so the letterboxing top/bottom of
//     each image blends invisibly into the frame
//
// Light/dark mode caveat:
//   Mockups were captured against a cream background, so we hardcode
//   that color on the frame. This means in DARK MODE the phone frame
//   appears as a cream rectangle on a dark page — visible but not ugly.
//   Re-export with transparent backgrounds in a future session would
//   solve this; for now, light mode looks great and dark mode is OK.
const FRAME_BG = "#F5F0E8";

const SCREENS = [
  {
    src: "/landing/mockup_projects.png",
    alt: "Projects list — four active construction projects with item counts",
    label: "Your projects",
  },
  {
    src: "/landing/mockup_visits.png",
    alt: "Site visits within a project, showing open and closed snag counts",
    label: "Site visits",
  },
  {
    src: "/landing/mockup_snags.png",
    alt: "Snags captured during a site visit, with photos and statuses",
    label: "Snags captured",
  },
  {
    src: "/landing/mockup_edit_item.png",
    alt: "Detail of a single snag with photos, transcribed description, location, and priority",
    label: "Detail captured",
  },
  {
    src: "/landing/mockup_report.png",
    alt: "Generated inspection report PDF showing photos with defect markers and rectification fields",
    label: "Report ready",
  },
];

export default function Hero() {
  const [index, setIndex] = useState(0);
  // Tracks whether the user has tapped at least once. Used to swap the
  // "Tap to explore" hint for a step counter once they engage.
  const [tapped, setTapped] = useState(false);

  const advance = () => {
    setTapped(true);
    setIndex((i) => (i + 1) % SCREENS.length);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      advance();
    }
  };

  return (
    <section className="relative px-6 lg:px-8 pt-16 lg:pt-24 pb-20 lg:pb-32">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: copy */}
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
                href="#pricing"
                className="inline-flex items-center justify-center px-6 py-3 border border-[var(--border)] hover:border-[var(--text-secondary)] text-[var(--text-primary)] font-semibold rounded-lg transition-colors"
              >
                See pricing ↓
              </a>
            </div>

            <p className="mt-6 text-sm text-[var(--text-muted)]">
              Free forever · EU-hosted · GDPR-compliant
            </p>
          </div>

          {/* Right: interactive phone.
              All images render with object-contain. Frame bg matches the
              cream tone of the mockup screenshots, so the letterboxing
              top/bottom blends into the frame and reads as one
              continuous surface. */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative">
              <button
                type="button"
                onClick={advance}
                onKeyDown={onKeyDown}
                aria-label={`Workflow demo — currently showing: ${SCREENS[index].label}. Tap or press Enter to advance to the next screen.`}
                className="relative w-[260px] sm:w-[280px] lg:w-[300px] aspect-[9/19] rounded-[2rem] overflow-hidden border border-[var(--border)] shadow-2xl shadow-black/30 cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
                style={{ backgroundColor: FRAME_BG }}
              >
                {SCREENS.map((screen, i) => (
                  <Image
                    key={screen.src}
                    src={screen.src}
                    alt={i === index ? screen.alt : ""}
                    fill
                    priority={i === 0}
                    sizes="(max-width: 768px) 70vw, 300px"
                    className={`absolute inset-0 object-contain transition-opacity duration-500 ${
                      i === index ? "opacity-100" : "opacity-0"
                    }`}
                    aria-hidden={i !== index}
                  />
                ))}
              </button>

              {/* Step indicator dots — visual progress through the demo.
                  Clickable so user can jump backwards or to any step. */}
              <div className="flex justify-center gap-2 mt-4">
                {SCREENS.map((screen, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setTapped(true);
                      setIndex(i);
                    }}
                    aria-label={`Go to step ${i + 1}: ${screen.label}`}
                    className={`h-1.5 rounded-full transition-all ${
                      i === index
                        ? "bg-brand w-6"
                        : "bg-[var(--border)] w-1.5 hover:bg-[var(--text-muted)]"
                    }`}
                  />
                ))}
              </div>

              {/* Caption — current screen label + tap hint.
                  Hint disappears after first tap so it doesn't feel pleading. */}
              <div className="mt-4 text-center min-h-[2.5rem]">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {SCREENS[index].label}
                </p>
                {!tapped ? (
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Tap to explore →
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {index + 1} / {SCREENS.length}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
