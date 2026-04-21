/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#18181b',
        panel: '#27272a',
        primary: {
          DEFAULT: '#eab308',
          hover: '#facc15',
        }
      }
    },
  },
  plugins: [],
}
