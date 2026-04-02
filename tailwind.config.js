/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand:        'var(--color-brand)',
        'brand-dark': 'var(--color-brand-dark)',
        warning:      'var(--color-warning)',
        danger:       'var(--color-danger)',
        navy:         'var(--color-navy)',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
      },
      animation: {
        'slide-up':     'slide-up 300ms ease-out forwards',
        'fade-out':     'fadeOut 250ms ease-out forwards',
        'fade-in':      'fadeIn 250ms ease-in forwards',
        'pulse-urgent': 'pulse-urgent 2s ease-in-out infinite',
        'shake':        'shake 400ms ease-in-out',
      },
      keyframes: {
        'slide-up': {
          from: { transform: 'translateY(100%)' },
          to:   { transform: 'translateY(0)' },
        },
        fadeOut: {
          from: { opacity: '1', transform: 'translateY(0)' },
          to:   { opacity: '0', transform: 'translateY(-8px)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-urgent': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.7' },
        },
        shake: {
          '0%, 100%':  { transform: 'translateX(0)' },
          '20%, 60%':  { transform: 'translateX(-8px)' },
          '40%, 80%':  { transform: 'translateX(8px)' },
        },
      },
    },
  },
  plugins: [],
};
