/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "#F36B16",
          dark: "#C6520D",
          light: "#FFF0E7",
        },
        ink: {
          DEFAULT: "#151710",
          mid: "#5C6258",
          faint: "#8B9085",
        },
        line: "#D7DAD0",
        surface: "#F1F1EB",
        up: "#168C5A",
        "up-bg": "#EAF5EF",
        down: "#C7473F",
        "down-bg": "#FAECE9",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl: "0.55rem",
        "2xl": "0.75rem",
      },
      boxShadow: {
        card: "0 1px 0 rgba(21,23,16,.04), 0 10px 30px -24px rgba(21,23,16,.25)",
        pop: "0 20px 40px -24px rgba(243,107,22,.45)",
      },
    },
  },
  plugins: [],
};
