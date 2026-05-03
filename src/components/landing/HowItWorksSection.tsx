// 3-step "how it works" section.
// Copy is real. Visuals are placeholders for Session B.
const STEPS = [
  {
    n: "1",
    title: "Speak",
    body: "Voice transcribes in real time as you walk the site.",
  },
  {
    n: "2",
    title: "Snap",
    body: "Photos attach to each defect, auto-named per project.",
  },
  {
    n: "3",
    title: "Send",
    body: "Branded PDF report, ready when you are.",
  },
];

export default function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="px-6 lg:px-8 py-20 lg:py-28 border-t border-[var(--border)] bg-[var(--card)]"
    >
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
          How it works
        </h2>
        <p className="text-lg text-[var(--text-secondary)] mb-12 lg:mb-16 max-w-2xl">
          Three steps. The same three you already do — just in real time.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {STEPS.map((step) => (
            <div key={step.n} className="flex flex-col">
              {/* Phone-frame screenshot placeholder.
                  Session B: replace with real screenshot of the matching app
                  state (transcription / photo / PDF). */}
              <div className="aspect-[9/16] max-w-[260px] mx-auto w-full rounded-2xl border border-[var(--border)] bg-[var(--bg)] flex items-center justify-center mb-6">
                <p className="text-xs text-[var(--text-muted)]">
                  [TODO: {step.title} screenshot]
                </p>
              </div>

              <div className="text-center md:text-left">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand/10 text-brand text-sm font-bold mb-3">
                  {step.n}
                </div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                  {step.title}
                </h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  {step.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
