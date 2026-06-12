/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B0D10",
        panel: "#13161B",
        line: "#23272E",
        signal: "#7C5CFF",
        ember: "#FF8A4C",
        mist: "#9AA3AE",
        paper: "#E9ECF1",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
