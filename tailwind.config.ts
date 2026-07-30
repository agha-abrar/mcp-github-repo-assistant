import type { Config } from "tailwindcss";

// Design tokens for the "Repo Autopsy" visual direction:
// a terminal/commit-log aesthetic built for developers reading a repo report.
const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0B0E14",
          surface: "#131826",
          raised: "#1A2032",
        },
        border: {
          DEFAULT: "#232B3D",
          soft: "#1A2032",
        },
        ink: {
          DEFAULT: "#E6EDF3",
          muted: "#8B96A5",
          faint: "#5C6675",
        },
        accent: {
          mint: "#5EEAD4",
          amber: "#F5A623",
          danger: "#F0555A",
          info: "#6C8EF5",
        },
      },
      fontFamily: {
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
        sans: ["var(--font-sans)", "Inter", "ui-sans-serif", "system-ui"],
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(255,255,255,0.02) inset, 0 8px 24px -12px rgba(0,0,0,0.6)",
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(180deg, rgba(94,234,212,0.06) 0%, rgba(94,234,212,0) 60%)",
      },
    },
  },
  plugins: [],
};

export default config;
