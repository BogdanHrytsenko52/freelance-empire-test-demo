/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0f1117',
        surface: '#171a23',
        elevated: '#1f2330',
        border: '#2a2f3e',
        muted: '#8b93a7',
        text: '#e6e9f2',
        primary: { DEFAULT: '#4f8cff', hover: '#6b9eff' },
        success: '#3ecf8e',
        danger: '#f0616d',
        warning: '#f5b84b',
      },
    },
  },
  plugins: [],
}
