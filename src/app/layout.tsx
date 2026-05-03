import type { Metadata, Viewport } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "VoxSite — Site Inspections, Simplified",
  description: "Voice-first construction snagging. Speak your defects on site, walk away with the report ready to send.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VoxSite",
  },
};

export const viewport: Viewport = {
  themeColor: "#F97316",
  width: "device-width",
  initialScale: 1,
};

// Root layout intentionally has NO width constraint on <body>.
// Width is owned by route group layouts:
//   - (landing)/layout.tsx → full-width marketing
//   - app/layout.tsx       → 480px mobile shell (existing app)
// This split is the whole point of the route group structure.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-[var(--bg)] text-[var(--text-primary)] min-h-screen relative">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
