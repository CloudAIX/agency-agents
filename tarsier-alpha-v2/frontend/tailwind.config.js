/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // TarsierAlpha brand
        brand: {
          dark: '#0a0e1a',
          panel: '#111827',
          border: '#1f2937',
          accent: '#6366f1',   // indigo
          long: '#22c55e',     // green — longs
          short: '#ef4444',    // red — shorts
          hedge: '#f59e0b',    // amber — hedge
          muted: '#6b7280'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      animation: {
        'pulse-green': 'pulse 1.5s cubic-bezier(0.4,0,0.6,1) infinite',
        'fade-in': 'fadeIn 0.2s ease-in'
      },
      keyframes: {
        fadeIn: { from: { opacity: 0, transform: 'translateY(4px)' }, to: { opacity: 1, transform: 'translateY(0)' } }
      }
    }
  },
  plugins: []
};
