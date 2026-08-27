import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: undefined,
  theme: {
    extend: {
      colors: {
        teal: {
          50: "#effcf9",
          100: "#c9f6ec",
          200: "#94ecd9",
          500: "#0f9488",
          600: "#0c7a70",
          700: "#0a6158",
        },
        coral: {
          50: "#fef2f1",
          100: "#fde1de",
          400: "#f2725a",
          500: "#e2513a",
          600: "#c23f2b",
        },
        ink: {
          50: "#f7f8f9",
          100: "#eceef1",
          200: "#d7dbe1",
          400: "#8993a1",
          600: "#4b5563",
          800: "#1f2733",
          900: "#12161d",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
