// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  // darkMode: 'class', // ❌ この行を削除
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}