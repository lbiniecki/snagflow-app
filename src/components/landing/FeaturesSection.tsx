import { Mic, WifiOff, Image as ImageIcon, FileText, Users } from "lucide-react";
import Image from "next/image";

// Features grid. 5 items per architecture v1.4.
//
// Accuracy notes (do not weaken):
// - "Keeps working when signal drops mid-visit" — does NOT claim full offline.
//   Login + new project still need a connection. See FAQ.
// - No "trained on engineering vocabulary" — we use stock Whisper, no custom training.
// - No "multi-user teams shared projects" — projects are user-scoped by design.
// - "Branded PDF reports" available on all paid plans (free has watermark).
//
// Session B addition:
// - Top of section now includes a small visual showing the projects and
//   visits screens side-by-side. This gives the section visual weight to
//   match the heavier hero and how-it-works sections above it.
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
    icon: ImageIcon,
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start mb-16">
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
              What VoxSite actually does
            </h2>
            <p className="text-lg text-[var(--text-secondary)]">
              Five things, only the ones we deliver today. Each project
              keeps its own history of site visits, snags, and reports —
              accessible from any device.
            </p>
          </div>

          {/* Side-by-side mini phone-frames showing projects list and a
              project's site-visit list. Small, supporting, not the main
              focus of this section. */}
          <div className="flex justify-center gap-3 lg:gap-4">
            <div className="relative w-[140px] lg:w-[160px] aspect-[9/19] rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--card)] shadow-xl shadow-black/20 -rotate-3">
              <Image
                src="/landing/mockup_projects.png"
                alt="Projects list screen showing four active construction projects with item counts"
                fill
                sizes="160px"
                className="object-cover"
              />
            </div>
            <div className="relative w-[140px] lg:w-[160px] aspect-[9/19] rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--card)] shadow-xl shadow-black/20 rotate-3 mt-6">
              <Image
                src="/landing/mockup_visits.png"
                alt="Project detail showing site visits with open and closed snag counts"
                fill
                sizes="160px"
                className="object-cover"
              />
            </div>
          </div>
        </div>

        {/* 3-column features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
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
