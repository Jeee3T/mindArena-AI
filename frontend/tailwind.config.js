/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep premium dashboard colors
        debate: {
          darkBg: "#0f172a", // slate-900
          darkPanel: "#1e293b", // slate-800
          cardBorder: "#334155", // slate-700
          accentBlue: "#38bdf8", // sky-400
          accentViolet: "#a78bfa", // violet-400
          accentGreen: "#34d399", // emerald-400
          accentPink: "#f472b6", // pink-400
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
