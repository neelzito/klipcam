/** @type {import('tailwindcss').Config} */
export default {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          500: "#FF7825", // Orange from styleguide
          600: "#E4681F",
        },
        secondary: {
          500: "#E114E7", // Magenta from styleguide
          600: "#C313C7",
        },
        accent: {
          purple: "#7c3aed",
          blue: "#3080ff",
          green: "#00c758",
          red: "#fb2c36",
        },
      },
      fontFamily: {
        sans: ['Geist', 'sans-serif'],
        mono: ['Geist Mono', 'monospace'],
        serif: ['ui-serif', 'serif'],
      },
      animation: {
        'gradient-xy': 'gradient-xy 15s ease infinite',
      },
      keyframes: {
        'gradient-xy': {
          '0%, 100%': {
            'background-size': '400% 400%',
            'background-position': 'left center',
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center',
          },
        },
      },
    },
  },
  plugins: [],
};


