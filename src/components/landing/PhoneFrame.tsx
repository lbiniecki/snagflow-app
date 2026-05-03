import Image from "next/image";

// Reusable phone-frame wrapper for marketing screenshots.
//
// Why this exists:
// - Centralizes the frame styling so Hero, How It Works, and any future
//   section get a consistent visual language.
// - Uses Next.js <Image> for automatic responsive serving and lazy-load.
// - The "frame" is intentionally subtle — a soft rounded shape with a thin
//   border. We avoid drawing an actual iPhone bezel (looks dated and ties
//   the brand to one device).
//
// Sizing strategy:
// - Aspect ratio is fixed at 9/19 (typical modern phone screen).
// - Width is parent-driven via Tailwind classes on the wrapper.
// - The image fills the frame; cover ensures we never see padding gaps if
//   the image's actual aspect ratio drifts slightly.

type Props = {
  src: string;
  alt: string;
  // Optional priority hint — set true for above-the-fold images so Next
  // marks them as priority and skips lazy-loading.
  priority?: boolean;
  className?: string;
};

export default function PhoneFrame({ src, alt, priority, className = "" }: Props) {
  return (
    <div
      className={`relative aspect-[9/19] rounded-[2rem] overflow-hidden border border-[var(--border)] bg-[var(--card)] shadow-2xl shadow-black/20 ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        // sizes hint helps Next pick the right responsive variant.
        // Phone-frames in this layout are at most ~280px wide on desktop,
        // smaller on mobile.
        sizes="(max-width: 768px) 70vw, 280px"
        className="object-cover"
      />
    </div>
  );
}
