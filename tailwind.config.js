/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Ria", "Inter", "system-ui", "sans-serif"],
      },
      textShadow: {
        lg: "2px 2px 4px rgba(0,0,0,0.1)",
      },
      keyframes: {
        "fly-in": {
          "0%": {
            opacity: "0",
            transform: "translateY(-30px) scale(0.5)",
          },
          "50%": {
            transform: "translateY(-10px) scale(1.2)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0) scale(1)",
          },
        },
        "fade-in-smooth": {
          "0%": {
            opacity: "0",
            transform: "translateY(-15px) scale(0.5)",
          },
          "70%": {
            opacity: "1",
            transform: "translateY(0) scale(1.1)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0) scale(1)",
          },
        },
        wave: {
          "0%, 100%": {
            transform: "translateY(0) scale(1)",
          },
          "50%": {
            transform: "translateY(-8px) scale(1.05)",
          },
        },
        "spin-slow": {
          "0%": {
            transform: "rotate(0deg)",
          },
          "100%": {
            transform: "rotate(360deg)",
          },
        },
        "spin-reverse": {
          "0%": {
            transform: "rotate(360deg)",
          },
          "100%": {
            transform: "rotate(0deg)",
          },
        },
      },
      animation: {
        "fly-in": "fly-in 0.5s ease-out forwards",
        "fade-in-smooth":
          "fade-in-smooth 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        wave: "wave 0.6s ease-in-out",
        "spin-slow": "spin-slow 3s linear infinite",
        "spin-reverse": "spin-reverse 2s linear infinite",
      },
    },
  },
  plugins: [],
};
