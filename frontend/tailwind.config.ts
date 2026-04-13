import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0e17',
        surface: '#0f1623',
        border: '#1e2a3a',
        teal: {
          DEFAULT: '#00d4aa',
          dim: '#00a882',
        },
        amber: {
          DEFAULT: '#f59e0b',
          dim: '#d97706',
        },
        gain: '#22c55e',
        loss: '#ef4444',
        muted: '#64748b',
        text: '#e2e8f0',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config
