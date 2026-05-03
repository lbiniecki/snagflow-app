import Link from "next/link";

// Final CTA section.
// Echoes the hero headline (visual rhyme; brings the reader full circle).
// Single primary action; secondary text-link to enterprise.
export default function FinalCTA() {
  return (
    <section className="px-6 lg:px-8 py-24 lg:py-32 border-t border-[var(--border)] bg-[var(--card)]">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl lg:text-5xl font-bold tracking-tight text-[var(--text-primary)] leading-[1.1]">
          Walk the site.
          <br />
          Your report writes itself.
        </h2>

        <div className="mt-10">
          <Link
            href="/app?mode=signup"
            className="inline-flex items-center justify-center px-8 py-4 bg-brand hover:bg-brand-dark text-white font-semibold rounded-lg transition-colors text-base"
          >
            Try VoxSite free, no card →
          </Link>
        </div>

        <p className="mt-6 text-sm text-[var(--text-muted)]">
          Or{" "}
          <a
            href="mailto:sales@voxsite.app?subject=VoxSite%20Enterprise%20enquiry"
            className="text-brand hover:underline"
          >
            contact us
          </a>{" "}
          for enterprise needs.
        </p>
      </div>
    </section>
  );
}
