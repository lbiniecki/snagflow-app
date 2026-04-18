/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Primary brand — updated from #FF6B35 to #F97316 per design spec.
        // Existing bg-brand / text-brand / bg-brand/10 classes keep working.
        brand: {
          DEFAULT: "#F97316",
          light:   "#FB923C",
          dark:    "#EA580C",
        },
        // Semantic palette (theme-independent). Usable with opacity modifiers:
        //   bg-info/10, text-warning, border-l-critical, etc.
        info:     "#3B82F6",   // informational counts (Total Items)
        success:  "#16A34A",   // completed / closed
        warning:  "#D97706",   // open / in-progress / offline
        critical: "#DC2626",   // destructive actions, errors, high priority
      },
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
