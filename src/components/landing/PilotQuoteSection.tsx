// Pilot quote section — feature-flagged.
//
// Per architecture v1.4: this component renders nothing until SHOW_PILOT_QUOTES
// is flipped to true. The flip requires explicit text/email approval from
// Peter (Coyle Civil & Structural) saved to file. Until then, no quote.
//
// To enable: change the constant below and update QUOTES with the
// approved quote text + a stronger version if Peter has provided one.

const SHOW_PILOT_QUOTES = false;

const QUOTES = [
  {
    text: "I've used the app for one inspection and backdated another. It works really well and is easily managed on site. It's something I would definitely consider using going forward.",
    name: "Peter",
    role: "Coyle Civil & Structural",
    location: "Ireland",
  },
];

export default function PilotQuoteSection() {
  if (!SHOW_PILOT_QUOTES) return null;

  return (
    <section className="px-6 lg:px-8 py-20 lg:py-28 border-t border-[var(--border)]">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-12">
          From the field
        </h2>

        <div className="space-y-8">
          {QUOTES.map((q, i) => (
            <figure
              key={i}
              className="p-8 lg:p-10 bg-[var(--card)] border border-[var(--border)] rounded-2xl"
            >
              <blockquote className="text-lg lg:text-xl text-[var(--text-primary)] leading-relaxed">
                &ldquo;{q.text}&rdquo;
              </blockquote>
              <figcaption className="mt-6 text-sm text-[var(--text-secondary)]">
                <span className="font-semibold text-[var(--text-primary)]">
                  {q.name}
                </span>
                {", "}
                {q.role} · {q.location}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
