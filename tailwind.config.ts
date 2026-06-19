import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        surface2: "var(--surface-2)",
        border: "var(--border)",
        border2: "var(--border-2)",
        accent: "var(--accent)",
        accentDim: "var(--accent-dim)",
        gold: "var(--gold)",
        goldDim: "var(--gold-dim)",
        text1: "var(--text-1)",
        text2: "var(--text-2)",
        text3: "var(--text-3)",
        win: "var(--win)",
        setback: "var(--setback)",
        milestone: "var(--milestone)",
        realization: "var(--realization)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
        logo: ["var(--font-logo)"],
      },
    },
  },
  plugins: [],
};
export default config;
