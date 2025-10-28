/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'forest': {
          50: '#f0f5f4',
          100: '#d4e6e0',
          200: '#a9cdc0',
          300: '#7eb4a1',
          400: '#539b81',
          500: '#2d5f4f',
          600: '#234d3f',
          700: '#1a3b2f',
          800: '#11281f',
          900: '#081610'
        },
        'mustard': {
          50: '#fffef0',
          100: '#fffce6',
          200: '#fff8cc',
          300: '#fff4b3',
          400: '#fff099',
          500: '#ffcc00',
          600: '#cc9900',
          700: '#996600',
          800: '#663300',
          900: '#331a00'
        },
        'marigold': {
          50: '#fff9f0',
          100: '#ffe6d4',
          200: '#ffcda9',
          300: '#ffb47e',
          400: '#ff9b53',
          500: '#ff8216',
          600: '#cc6812',
          700: '#994e0d',
          800: '#663408',
          900: '#331a04'
        },
        'off-white': '#fafafa'
      },
      fontFamily: {
        'montserrat': ['Montserrat', 'sans-serif'],
        'merriweather': ['Merriweather', 'serif'],
        'inter': ['Inter', 'sans-serif'],
        'noto': ['Noto Serif', 'serif']
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'bounce-gentle': 'bounceGentle 0.6s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        bounceGentle: {
          '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
          '40%': { transform: 'translateY(-4px)' },
          '60%': { transform: 'translateY(-2px)' }
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        }
      }
    },
  },
  plugins: [],
};