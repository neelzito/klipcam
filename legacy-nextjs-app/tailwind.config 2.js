/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          500: "#e434ed",
          600: "#c41ed1",
        },
        secondary: {
          500: "#f43f5e",
          600: "#e11d48",
        },
      },
    },
  },
  plugins: [],
};
