import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        background: 'oklch(0.145 0 0)',
        foreground: 'oklch(0.985 0 0)',
        card: 'oklch(0.17 0 0)',
        border: 'oklch(0.3 0 0)',
        muted: 'oklch(0.22 0 0)',
        accent: 'oklch(0.62 0.18 252)',
      },
      height: {
        toolbar: '48px',
      },
    },
  },
  plugins: [animate],
};

export default config;
