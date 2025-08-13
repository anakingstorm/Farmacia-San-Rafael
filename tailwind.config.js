/**** Tailwind Config ****/ 
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0582CA',
          dark: '#03588C',
          light: '#A7E0FF'
        }
      }
    }
  },
  plugins: []
};
