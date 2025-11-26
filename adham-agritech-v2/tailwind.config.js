/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "#0D0D0D",
        surface: "#1A1A1A",
        primary: "#00E676",
        text: "#FFFFFF",
        muted: "#B3B3B3",
        info: "#4FC3F7",
        warning: "#FFD54F",
        success: "#66BB6A",
        danger: "#FF7043",
        accent: "#2A2A2A",
      },
    },
  },
  plugins: [],
};
