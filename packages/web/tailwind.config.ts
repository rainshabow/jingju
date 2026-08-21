import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'opera-red': '#C41E3A',
        'opera-blue': '#2E5090',
        'opera-gold': '#C8A415',
        'opera-black': '#1A1A1A',
        'opera-green': '#2D6A4F',
        'paper': '#F5F0E8',
        'paper-deep': '#E9DDCA',
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', '"Songti SC"', 'serif'],
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
