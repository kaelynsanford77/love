/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f4ff",
          100: "#dde9ff",
          200: "#c3d5ff",
          300: "#9db5ff",
          400: "#6b8cff",
          500: "#4563f5",
          600: "#3247ea",
          700: "#2937d8",
          800: "#272faf",
          900: "#252e8a",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
    },
  },
  plugins: [],
};
