import type { Viewport } from "next";

// Viewport overrides for the app shell only:
// - userScalable=false stops accidental pinch-zoom on form fields during
//   site visits (was on the original root layout). We keep this OUT of the
//   landing page viewport so marketing content remains zoomable for accessibility.
export const viewport: Viewport = {
  themeColor: "#F97316",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// 480px max-width wrapper — preserves the existing mobile-first app behaviour
// that lived on the root <body> before the route group split. Centered on
// desktop, full bleed on phones.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <div className="max-w-[480px] mx-auto">{children}</div>;
}
