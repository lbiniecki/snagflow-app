// Problem section — tightened in Session B v4.
//
// Single-line copy mirroring the headline rhythm. Each clause is one
// step in the workflow; final clause echoes the headline's promise.
//
// Original was two prose paragraphs explaining the workflow at length —
// fine for a longform article, too heavy for a landing page where the
// hero already showed the same workflow visually.
//
// If we ever feel this section is redundant alongside the hero (it
// arguably is — same content, different format), removing it is a
// one-import change in src/app/(landing)/page.tsx.
export default function ProblemSection() {
  return (
    <section className="px-6 lg:px-8 py-16 lg:py-20 border-t border-[var(--border)]">
      <div className="max-w-3xl mx-auto">
        <p className="text-xl lg:text-2xl text-[var(--text-primary)] leading-relaxed">
          Walk the site. Note defects. Take photos. Speak your snags as you
          go. Back at the desk, the report writes itself.
        </p>
      </div>
    </section>
  );
}
