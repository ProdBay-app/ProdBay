/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['Montserrat', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        wedding: {
          primary: '#87A38D', // Sage - primary actions, success, active nav
          'primary-hover': '#6B8B72',
          'primary-light': '#A8C4AD',
          secondary: '#F7E7CE', // Champagne - subtle backgrounds, card accents
          accent: '#C5A059', // Gold/Ochre - highlights, icons, premium
          'accent-hover': '#A88642',
          neutral: '#FAF9F6', // Off-white - main backgrounds
          slate: '#2D3436', // High-contrast typography
          'slate-muted': '#636E72',
        },
      },
      borderRadius: {
        'wedding': '0.75rem', // 12px - softer feel
        'wedding-lg': '1rem', // 16px
        'wedding-xl': '1.25rem', // 20px
      },
      boxShadow: {
        'wedding': '0 1px 3px 0 rgb(45 52 54 / 0.06), 0 1px 2px -1px rgb(45 52 54 / 0.06)',
        'wedding-md': '0 4px 6px -1px rgb(45 52 54 / 0.05), 0 2px 4px -2px rgb(45 52 54 / 0.05)',
        'wedding-lg': '0 10px 15px -3px rgb(45 52 54 / 0.05), 0 4px 6px -4px rgb(45 52 54 / 0.05)',
      },
    },
  },
  plugins: [],
};
