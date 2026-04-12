/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#FF6B35",
          light: "#FF8C5A",
          dark: "#E55A25",
          glow: "rgba(255,107,53,0.15)",
        },
        surface: {
          DEFAULT: "#222230",
          dark: "#141418",
          darker: "#0C0C0E",
          border: "#2A2A3A",
        },
      },
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
