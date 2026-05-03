import { Mic, WifiOff, Image, FileText, Users } from "lucide-react";

// Features grid. 5 items per architecture v1.3/v1.4.
//
// Accuracy notes (do not weaken):
// - "Keeps working when signal drops mid-visit" — does NOT claim full offline.
//   Login + new project still need a connection. See FAQ.
// - No "trained on engineering vocabulary" — we use stock Whisper, no custom training.
// - No "multi-user teams shared projects" — projects are user-scoped by design.
// - "Branded PDF reports" available on all paid plans (free has watermark).
const FEATURES = [
  {
    icon: Mic,
    title: "Voice transcription that handles real engineering terms",
    body: "Picks up \"rebar,\" \"DPC,\" \"soffit,\" whatever you say. No autocorrect mangling.",
  },
  {
    icon: WifiOff,
    title: "Keeps working when signal drops mid-visit",
    body: "Capture snags as you walk. Everything syncs when you're back online.",
  },
  {
    icon: Image,
    title: "Photos that stay organised",
    body: "Auto-named per project: MIL_2026_04_18_03_02.jpg. No more lost gallery.",
  },
  {
    icon: FileText,
    title: "Branded PDF reports",
    body: "Your logo, your colours, your sign-off. Available on all paid plans.",
  },
  {
    icon: Users,
    title: "Flat per-tier pricing",
    body: "Tier price covers your whole team's seats. Predictable cost as the team grows — no per-seat billing surprises.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="px-6 lg:px-8 py-20 lg:py-28 border-t border-[var(--border)]">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
          What VoxSite actually does
        </h2>
        <p className="text-lg text-[var(--text-secondary)] mb-12 lg:mb-16 max-w-2xl">
          Five things, only the ones we deliver today.
        </p>

        {/* 3+2 layout on desktop (last two centered visually below first three).
            Stacked on mobile. */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 lg:p-7"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-brand/10 text-brand mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2 leading-snug">
                  {f.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {f.body}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
