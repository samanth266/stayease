/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#FF385C',
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
