import PhoneFrame from "./PhoneFrame";

// 3-step "how it works" section.
//
// Session B: real mockups installed.
// Step 1 "Speak"  → edit item screen (capture + voice description)
// Step 2 "Snap"   → snag list with photos visible
// Step 3 "Send"   → inspection report PDF
//
// We deliberately reuse the snag list and report images from the hero
// here. They illustrate different parts of the workflow at different
// zoom levels — same screens, different narrative beat.

const STEPS = [
  {
    n: "1",
    title: "Speak",
    body: "Voice transcribes in real time as you walk the site.",
    img: "/landing/mockup_edit_item.png",
    alt: "Snag detail screen showing photos, transcribed description, location, and priority",
  },
  {
    n: "2",
    title: "Snap",
    body: "Photos attach to each defect, auto-named per project.",
    img: "/landing/mockup_snags.png",
    alt: "Site visit screen showing a list of snags with photo thumbnails, descriptions, and status badges",
  },
  {
    n: "3",
    title: "Send",
    body: "Branded PDF report, ready when you are.",
    img: "/landing/mockup_report.png",
    alt: "Inspection report PDF showing summary stats and a table of open items",
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
              <div className="max-w-[260px] mx-auto w-full mb-6">
                <PhoneFrame src={step.img} alt={step.alt} />
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
