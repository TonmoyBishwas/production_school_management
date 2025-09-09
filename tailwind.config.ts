import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1e40af', // Navy blue
          dark: '#1e3a8a',
          light: '#3b82f6'
        },
        secondary: {
          DEFAULT: '#64748b', // Slate gray
          dark: '#475569',
          light: '#94a3b8'
        },
        success: '#16a34a',
        warning: '#eab308',
        error: '#dc2626'
      }
    },
  },
  plugins: [],
}
export default config