// Landing route group layout.
//
// Route groups in Next.js App Router are folders wrapped in parentheses.
// They don't appear in the URL path: src/app/(landing)/page.tsx → "/".
// Their purpose: apply a different layout to a subset of routes without
// changing URL structure.
//
// Why this exists:
// The original root layout had body className="max-w-[480px] mx-auto" because
// VoxSite's app is mobile-first. A marketing landing page needs full width.
// Rather than conditionally remove the constraint at the root (fragile),
// we keep the root layout neutral and apply width per route group:
//   - (landing)/layout.tsx → full width
//   - app/layout.tsx        → 480px max-width

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return <div className="w-full">{children}</div>;
}
