/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0b0d10',
        panel: '#13171c',
        panel2: '#1a1f26',
        border: '#252b34',
        muted: '#7b8794',
        text: '#e6edf3',
        accent: '#6ee7b7',
        warn: '#fbbf24',
        bad: '#f87171',
        good: '#34d399'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace']
      }
    }
  },
  plugins: []
};
