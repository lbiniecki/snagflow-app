import Link from "next/link";

// Landing footer.
//
// Three-column layout on desktop, stacks on mobile.
// Polish JDG disclosure required: trader name, address, NIP, EU VAT.
export default function LandingFooter() {
  return (
    <footer className="px-6 lg:px-8 pt-16 pb-8 border-t border-[var(--border)] bg-[var(--bg)]">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16 mb-12">
          {/* Column 1 — Product */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 uppercase tracking-wider">
              Product
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="#pricing"
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Pricing
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  FAQ
                </a>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2 — Contact */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 uppercase tracking-wider">
              Contact
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="mailto:sales@voxsite.app"
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  sales@voxsite.app
                </a>
              </li>
              {/* TODO: add LinkedIn link once Company Page is live */}
            </ul>
          </div>

          {/* Column 3 — Legal/business */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 uppercase tracking-wider">
              Legal
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              VoxSite is a product of
              <br />
              Łukasz Biniecki Lbicon Projektowanie Konstrukcji
              <br />
              ul. Unruga 65a, 30-394 Kraków, Poland
              <br />
              NIP 7822124418 · EU VAT PL7822124418
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-[var(--border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-xs text-[var(--text-muted)]">© 2026 VoxSite</p>
          <p className="text-xs text-[var(--text-muted)]">
            Made in Kraków for engineers everywhere.
          </p>
        </div>
      </div>
    </footer>
  );
}
