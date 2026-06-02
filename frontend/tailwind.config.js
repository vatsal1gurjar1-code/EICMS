/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        danger: {
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
        },
        warning: {
          100: '#fef9c3',
          500: '#eab308',
          600: '#ca8a04',
        },
        success: {
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
