/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', "Georgia", "serif"],
        sans: ['"Inter"', "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        canvas: "#FBF9F5",
        obsidian: "#0B0D12",
        surface: "#13161E",
        ink: "#16181D",
        accent: "#C4933F",
        "accent-dark": "#A37527",
      },
    },
  },
  plugins: [],
};
