/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      boxShadow: {
        soft: "0 10px 30px rgba(15, 23, 42, 0.08)"
      },
      colors: {
        brand: {
          50: "#eef3ff",
          100: "#dce7ff",
          200: "#bad0ff",
          300: "#8fb0ff",
          400: "#5e86ff",
          500: "#3f63ff",
          600: "#2e46f5",
          700: "#2535d1",
          800: "#242ea7",
          900: "#222c85"
        }
      }
    }
  },
  plugins: []
};

