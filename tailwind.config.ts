import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        lp: {
          bg: "var(--bg)",
          surface: "var(--surface)",
          surface2: "var(--surface2)",
          surface3: "var(--surface3)",
          border: "var(--border)",
          border2: "var(--border2)",
          accent: "var(--accent)",
          accent2: "var(--accent2)",
          accent3: "var(--accent3)",
          red: "var(--red)",
          text: "var(--text)",
          text2: "var(--text2)",
          text3: "var(--text3)",
        },
      },
      fontFamily: {
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        heading: ["var(--font-heading)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(184,255,87,0.08), 0 24px 80px rgba(0,0,0,0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
