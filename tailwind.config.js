/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: '#c5a059',
          50: '#fbf8f1',
          100: '#f5edd9',
          200: '#ebdbb1',
          300: '#dec484',
          400: '#d0ab5b',
          500: '#c5a059',
          600: '#aa813e',
          700: '#876233',
          800: '#6f4f2e',
          900: '#5c4128',
          foreground: '#0a0a0c',
        },
        gold: {
          light: '#f5edd9',
          DEFAULT: '#c5a059',
          dark: '#876233',
          bright: '#d4af37',
        },
        background: '#090a0f',
        surface: {
          DEFAULT: '#11131c',
          subtle: '#181b27',
          border: 'rgba(197, 160, 89, 0.15)',
        },
        text: {
          main: '#f8fafc',
          muted: '#94a3b8',
          gold: '#c5a059',
        },
      },
      borderRadius: {
        lg: '1rem',
        md: '0.75rem',
        sm: '0.5rem',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '0.9', transform: 'scale(1.05)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out forwards',
        'pulse-glow': 'pulse-glow 4s infinite ease-in-out',
      },
    },
  },
  plugins: [],
};
