/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        orange: {
          500: '#FF9900',
          600: '#E68A00', // darker shade for hover
        },
        navy: {
          900: '#0F172A',
          800: '#1E293B',
        }
      },
      fontFamily: {
        sans: ['Poppins', 'Noto Sans KR', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
