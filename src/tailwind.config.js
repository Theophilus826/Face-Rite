/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      animation: {
        "spin-slow": "spin 3s linear infinite",
        "loading-bar": "loading 2s ease-in-out infinite",
      },
      keyframes: {
        loading: {
          "0%": { width: "0%" },
          "50%": { width: "80%" },
          "100%": { width: "0%" },
        },
      },
    },
  },
  plugins: [],
};