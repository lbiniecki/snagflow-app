/**
 * VoxSiteLogo — the VoxSite brand glyph, matching the PWA app icon.
 *
 * Designed to sit on the brand-orange gradient tile used in LoginScreen.
 * Renders a WHITE clipboard body, an ORANGE clip across the top (same tone
 * as the parent tile, so it reads as a notch), and an ORANGE checkmark
 * inside the body.
 *
 * Matches public/icon-192.png and public/icon-512.png exactly.
 *
 * API matches lucide-react icons: pass `className` to control size
 * (w-N h-N) and colour (text-COLOUR → `currentColor`). Drop-in for
 * <ClipboardCheck />.
 *
 *   <VoxSiteLogo className="w-14 h-14 text-white" />
 *
 * Implementation notes:
 * - viewBox is 0 0 24 24 (Lucide convention — works with w-4, w-6, w-14, etc.)
 * - Clipboard body fill = `currentColor` (white via `text-white`)
 * - Clip and checkmark fill/stroke = brand orange (#F97316), hardcoded
 *   because the icon is always used inside the brand gradient tile
 */
export default function VoxSiteLogo({
  className = "",
}: {
  className?: string;
}) {
  const BRAND = "#F97316"; // VoxSite orange

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      {/* Clipboard body — solid rounded rect in currentColor (white) */}
      <rect
        x="5"
        y="4.6"
        width="14"
        height="16.2"
        rx="1.6"
        ry="1.6"
        fill="currentColor"
      />

      {/* Clip on top — brand orange, overlapping the body edge so it reads
          as a notch punched into the clipboard */}
      <rect
        x="8.5"
        y="3.3"
        width="7"
        height="3.3"
        rx="0.9"
        ry="0.9"
        fill={BRAND}
      />

      {/* Checkmark inside the body — brand orange stroke */}
      <path
        d="M 9 12.3 L 11.2 14.5 L 15.4 10.2"
        fill="none"
        stroke={BRAND}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
