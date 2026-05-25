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
    },
  },
  plugins: [],
}

export default config
