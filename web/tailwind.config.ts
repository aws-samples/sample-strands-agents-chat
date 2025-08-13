import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // Use class-based dark mode
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;
