/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: '#FFE6A7',
        primary: '#6F1D1B',
        secondary: '#BB9457',
        dark: '#432818',
        warm: '#99582A',
        light: '#FFE6A7',
        accent: '#BB9457',
        input: 'rgba(255, 230, 167, 0.8)',
        content: '#432818',
      },
      borderRadius: {
        card: '1rem',
        button: '0.75rem',
        input: '0.75rem',
      },
      boxShadow: {
        card: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        nav: '0 1px 3px 0 rgb(0 0 0 / 0.08)',
      },
    },
  },
  plugins: [],
}
