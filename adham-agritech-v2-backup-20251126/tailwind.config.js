/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}"
    ],
    theme: {
        extend: {
            colors: {
                background: "#121212", // Matte Black
                surface: "#1E1E1E", // Dark Gray Cards
                primary: "#00E676", // Vivid Green
                text: "#FFFFFF",
                muted: "#A0A0A0",
            },
        },
    },
    plugins: [],
};
