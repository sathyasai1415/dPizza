import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/**/*.{html,ts}',
  ],
  theme: {
    extend: {
      colors: {
        // Light theme colors
        'light-bg': '#FFFFFF',
        'light-card': '#F3F4F6',
        'light-text': '#1F2937',
        'light-muted': '#6B7280',
        'light-border': '#E5E7EB',
        'light-accent': '#F59E0B',

        // Dark theme colors
        'dark-bg': '#0F0F0F',
        'dark-card': '#1A1A1A',
        'dark-text': '#FFFFFF',
        'dark-muted': '#9CA3AF',
        'dark-border': '#374151',
        'dark-accent': '#D4AF37',

        // Brand colors
        'brand-orange': '#FF8A00',
        'brand-gold': '#D4AF37',
      },
    },
  },
  darkMode: 'class', // Enable class-based dark mode
  plugins: [],
} satisfies Config;
