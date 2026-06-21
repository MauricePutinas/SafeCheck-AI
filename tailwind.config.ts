import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Security-Premium-Palette (dunkel, seriös)
        ink: {
          950: "#070a0f",
          900: "#0b0f17",
          800: "#111726",
          700: "#1a2236",
          600: "#26304a",
        },
        line: "#1e2840",
        // Ampel-System
        safe: {
          DEFAULT: "#22c55e",
          soft: "#16361f",
          ring: "#22c55e33",
        },
        warn: {
          DEFAULT: "#f59e0b",
          soft: "#3a2a07",
          ring: "#f59e0b33",
        },
        danger: {
          DEFAULT: "#ef4444",
          soft: "#3a1212",
          ring: "#ef444433",
        },
        critical: {
          DEFAULT: "#f43f5e",
          soft: "#3d0f1c",
          ring: "#f43f5e33",
        },
        accent: {
          DEFAULT: "#38bdf8",
          soft: "#0c2a3a",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(56,189,248,0.15), 0 8px 40px -12px rgba(56,189,248,0.25)",
        card: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 18px 50px -24px rgba(0,0,0,0.8)",
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(to right, rgba(56,189,248,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(56,189,248,0.04) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};

export default config;
