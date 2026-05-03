// Problem section.
//
// Pure prose, no images, lots of whitespace. Copy locked in architecture v1.4.
// Tone: observational, not pain-pitching. The subtle word "often" is load-bearing
// (it's an observation, not a universal claim). Don't remove it.
export default function ProblemSection() {
  return (
    <section className="px-6 lg:px-8 py-20 lg:py-28 border-t border-[var(--border)]">
      <div className="max-w-3xl mx-auto">
        <p className="text-lg lg:text-xl text-[var(--text-primary)] leading-relaxed">
          Site visits have a real workflow. You walk the building. You note
          defects. You take photos. Then back at the desk, you turn that into
          a report — often taking as long as the visit itself.
        </p>
        <p className="mt-6 text-lg lg:text-xl text-[var(--text-primary)] leading-relaxed">
          VoxSite collapses the second part into the first. You speak your
          snags as you walk; the transcription, the photos, and the report
          come together in real time. By the time you close the boot of your
          car, the report is ready.
        </p>
      </div>
    </section>
  );
}
