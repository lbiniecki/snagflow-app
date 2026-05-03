"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

// Top-of-page nav for the marketing site.
//
// Behaviour:
// - Sticky to top of viewport
// - Transparent over the hero (lets the hero feel unbounded)
// - Opaque + bordered after the user scrolls past 24px (a tiny but visible
//   threshold; instant transition feels jumpy)
// - Mobile: hamburger icon, primary CTA stays visible
//
// CTAs intentionally route into the existing /app shell via ?mode=:
// - "Log in"   → /app?mode=login
// - "Try free" → /app?mode=signup
// The app shell reads `mode` and shows LoginScreen in the right state.
// This avoids duplicating signup/login UI in the marketing site.
export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll(); // capture initial state on hash-link arrival mid-page
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-colors duration-200 ${
        scrolled
          ? "bg-[var(--bg)]/95 backdrop-blur-sm border-b border-[var(--border)]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo / wordmark */}
        <Link href="/" className="flex items-center gap-2">
          {/* Replace with <Image src="/logo.svg" /> once a logo file exists.
              Until then, a clean wordmark renders fine. */}
          <span className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
            VoxSite
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          <a
            href="#pricing"
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Pricing
          </a>
          <a
            href="#faq"
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            FAQ
          </a>
          <Link
            href="/app?mode=login"
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/app?mode=signup"
            className="px-4 py-2 bg-brand hover:bg-brand-dark text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Try free →
          </Link>
        </nav>

        {/* Mobile: keep CTA visible, collapse other links into a menu */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/app?mode=signup"
            className="px-3 py-1.5 bg-brand hover:bg-brand-dark text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Try free →
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-[var(--text-primary)]"
            aria-label="Open menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {mobileOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--bg)]">
          <nav className="px-6 py-4 flex flex-col gap-4">
            <a
              href="#pricing"
              onClick={() => setMobileOpen(false)}
              className="text-sm text-[var(--text-primary)]"
            >
              Pricing
            </a>
            <a
              href="#faq"
              onClick={() => setMobileOpen(false)}
              className="text-sm text-[var(--text-primary)]"
            >
              FAQ
            </a>
            <Link
              href="/app?mode=login"
              className="text-sm text-[var(--text-primary)]"
            >
              Log in
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
