import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['ui-serif', 'Georgia', 'serif'],
        mono: ['ui-monospace', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse-slow 3s infinite ease-in-out',
        'fade-in-down': 'fade-in-down 0.3s ease-out forwards',
      },
      keyframes: {
        'pulse-slow': {
          '0%, 100%': { opacity: '0.8' },
          '50%': { opacity: '1', textShadow: '0 0 10px rgba(220,38,38,0.8)' },
        },
        'fade-in-down': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
