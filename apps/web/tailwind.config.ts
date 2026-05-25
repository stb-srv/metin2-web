import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './modules/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        'surface-2': 'var(--color-surface-2)',
        accent: 'var(--color-accent)',
        danger: 'var(--color-danger)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        text: 'var(--color-text)',
        muted: 'var(--color-text-muted)',
        border: 'var(--color-border)',
        glow: 'var(--color-glow)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      keyframes: {
        'rainbow-glow': {
          '0%, 100%': { filter: 'drop-shadow(0 0 15px rgba(255, 0, 0, 0.8))' },
          '16%': { filter: 'drop-shadow(0 0 15px rgba(255, 127, 0, 0.8))' },
          '33%': { filter: 'drop-shadow(0 0 15px rgba(255, 255, 0, 0.8))' },
          '50%': { filter: 'drop-shadow(0 0 15px rgba(0, 255, 0, 0.8))' },
          '66%': { filter: 'drop-shadow(0 0 15px rgba(0, 0, 255, 0.8))' },
          '83%': { filter: 'drop-shadow(0 0 15px rgba(139, 0, 255, 0.8))' },
        }
      },
      animation: {
        'rainbow-glow': 'rainbow-glow 3s linear infinite',
      }
    },
  },
  plugins: [],
}

export default config
