/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#050A0E',
        surface: '#0B1418',
        emerald: { DEFAULT: '#00E0A8', deep: '#00B388' },
        gold: '#E5C77E',
        ink: '#F5F8F7',
        muted: '#7E8E89',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
