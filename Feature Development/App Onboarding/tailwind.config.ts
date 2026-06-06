import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: '#f4ede0',
        card: '#fbf6ec',
        chrome: '#efe7d6',
        ink: '#1c1a14',
        muted: '#6e6757',
        sage: '#5d6b40',
        terra: '#b65a30',
        butter: '#e8b85a',
        rose: '#c97e6e',
      },
    },
  },
  plugins: [],
}

export default config
