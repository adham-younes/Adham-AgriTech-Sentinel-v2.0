/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0a", // Matte Black
        surface: "#141414",    // Slightly lighter black for cards
        primary: "#00ff7f",    // Vivid Spring Green
        secondary: "#00cc66",  // Darker Green
        text: "#ffffff",
        muted: "#a3a3a3",
        info: "#38bdf8",
        warning: "#fbbf24",
        success: "#34d399",
        danger: "#f87171",
        accent: "#1f1f1f",     // Dark accent
      },
    },
  },
  plugins: [],
};
