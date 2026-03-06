import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E6EEF9',
          100: '#CCE0F6',
          200: '#99C1EB',
          300: '#6699DD',
          400: '#3366CC',
          500: '#0043BB',
          600: '#003399',
          700: '#002966',
          800: '#001F4D',
          900: '#001433',
          950: '#000B22',
        },
        secondary: {
          50: '#FEF0E6',
          100: '#FDE0CC',
          200: '#FBC199',
          300: '#F99966',
          400: '#F77033',
          500: '#ED5900',
          600: '#CC4A00',
          700: '#994A00',
          800: '#663200',
          900: '#331900',
          950: '#1A0C00',
        },
        ocean: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c3d66',
          950: '#051e3e',
        },
      },
    },
  },
  plugins: [],
}

export default config
