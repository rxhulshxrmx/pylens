/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        amber: { DEFAULT: '#D97A14', 400: '#E8941A', 300: '#F5B860', 100: '#FBE4CC' },
        surface: { DEFAULT: '#FAF8F4', 2: '#F1EEE7' },
        ink: '#1A1714',
        muted: '#6B655C',
        faint: '#938C81',
        hairline: '#E4DFD5',
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}
