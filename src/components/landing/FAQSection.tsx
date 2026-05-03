// FAQ section.
//
// Architecture v1.4: 8 questions. Answers verified against actual product
// behavior (no overclaiming about offline, voice training, multi-user, etc.).
//
// Implementation note: using native <details>/<summary> for accordion
// behaviour rather than shadcn/ui Accordion. Reasons:
// - No extra dependency to add right now
// - Native a11y is good (keyboard, ARIA built-in)
// - Style hooks via group-open: utility classes
// - One less Session A library install
// Can swap to shadcn/ui later in Session C polish if desired.

const FAQS = [
  {
    q: "Is my data secure?",
    a: "EU-hosted on Supabase Ireland and Railway Amsterdam. GDPR-compliant. Full details in our Privacy Policy.",
  },
  {
    q: "What if signal drops on site?",
    a: "If you're already on an active site visit and signal drops, you can keep capturing snags — photos, voice notes, descriptions — and they sync automatically when you're back online. (Logging in and starting a new project both require a connection.)",
  },
  {
    q: "What about voice accuracy?",
    a: "Handles engineering vocabulary reliably — rebar, DPC, soffit, the lot.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes, self-service through Settings. You keep paid features until end of current billing period.",
  },
  {
    q: "Do I need a contract?",
    a: "No. Month-to-month or annual, your choice.",
  },
  {
    q: "What if I want my data out?",
    a: "We provide data export in machine-readable format. Self-service export coming soon.",
  },
  {
    q: "Who built this?",
    a: "VoxSite was built by a structural engineer working in EU construction. When you contact us, you're speaking directly with the engineer who built it.",
  },
  {
    q: "What about VAT?",
    a: "Prices exclude VAT. EU consumers see their country's VAT at checkout. EU businesses with valid VAT numbers reverse-charge. Non-EU customers pay base price.",
  },
];

export default function FAQSection() {
  return (
    <section
      id="faq"
      className="px-6 lg:px-8 py-20 lg:py-28 border-t border-[var(--border)]"
    >
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-12">
          Questions
        </h2>

        <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
          {FAQS.map((item) => (
            <details key={item.q} className="group py-5">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <span className="text-base lg:text-lg font-medium text-[var(--text-primary)] pr-4">
                  {item.q}
                </span>
                <svg
                  className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0 transition-transform group-open:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </summary>
              <p className="mt-4 text-[var(--text-secondary)] leading-relaxed">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
