/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0284c7',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        health: {
          teal: '#0d9488',
          cyan: '#06b6d4',
          emerald: '#059669',
          rose: '#e11d48',
          indigo: '#4f46e5',
        }
      },
    },
  },
  plugins: [],
}
