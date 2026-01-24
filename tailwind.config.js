/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'sky-dark': '#101020',
        'sky-light': '#1a1a3a',
      },
      fontFamily: {
        'sans': ['"M PLUS Rounded 1c"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
