export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // الخلفيات: أسود مطفي
        'adham-base': '#0a0a0a', 
        'adham-panel': '#141414',
        // التمييز: أخضر حيوي
        'adham-accent': '#00ff7f', 
        'adham-accent-dim': 'rgba(0, 255, 127, 0.1)',
      }
    },
  },
  plugins: [],
}
