/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        billow: {
          bg: '#f8fafc',
          surface: '#ffffff',
          surfaceHover: '#f1f5f9',
          border: '#e2e8f0',
          borderSubtle: '#edf2f7',
          blue: '#0066ff',
          blueHover: '#0052cc',
          indigo: '#1400ff',
          navy: '#0b192c',
          slate: '#0f172a',
          muted: '#64748b',
          lightMuted: '#94a3b8',
        },
      },
      boxShadow: {
        'billow-card': '0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 4px 14px 0 rgba(15, 23, 42, 0.03)',
        'billow-card-hover': '0 8px 30px -4px rgba(15, 23, 42, 0.08), 0 4px 10px -2px rgba(15, 23, 42, 0.04)',
        'billow-glow': '0 4px 20px -2px rgba(0, 102, 255, 0.35)',
        'billow-modal': '0 25px 60px -15px rgba(15, 23, 42, 0.25), 0 0 1px 1px rgba(15, 23, 42, 0.05)',
        'billow-pill': '0 1px 2px 0 rgba(15, 23, 42, 0.06)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
