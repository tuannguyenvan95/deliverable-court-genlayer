/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      colors: {
        background: '#030014',
        surface: '#0f0a29',
        border: '#2a1a5e',
        primary: '#b155ff',
        secondary: '#55b5ff',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 10px rgba(177, 85, 255, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(177, 85, 255, 0.8), 0 0 40px rgba(85, 181, 255, 0.5)' },
        }
      }
    },
  },
  plugins: [],
}
