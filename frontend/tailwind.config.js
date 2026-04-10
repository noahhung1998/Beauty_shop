/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          'rose-gold': '#B76E79',
          'rose-gold-light': '#D4A0A7',
          'rose-gold-dark': '#8E4A53',
          'soft-pink': '#F8E8E8',
          'blush': '#FADADD',
          'cream': '#FFF8F0',
          'cream-dark': '#F5EDE3',
          'charcoal': '#2D2D2D',
          'charcoal-light': '#4A4A4A',
          'warm-gray': '#8C8279',
          'gold': '#C9A96E',
          'gold-light': '#E8D5B0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      fontSize: {
        'display-lg': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-md': ['2.5rem', { lineHeight: '1.15', letterSpacing: '-0.01em' }],
        'display-sm': ['1.875rem', { lineHeight: '1.2' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(183, 110, 121, 0.1), 0 10px 20px -2px rgba(183, 110, 121, 0.04)',
        'card': '0 4px 24px -4px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 8px 32px -4px rgba(0, 0, 0, 0.12)',
        'drawer': '-8px 0 32px -4px rgba(0, 0, 0, 0.15)',
      },
      animation: {
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-out-right': 'slideOutRight 0.3s ease-in',
        'fade-in': 'fadeIn 0.2s ease-out',
        'fade-in-up': 'fadeInUp 0.4s ease-out',
      },
      keyframes: {
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideOutRight: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
