/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0D2B3E',
        'navy-mid': '#1A4560',
        sky: '#5BA3BE',
        'sky-light': '#C6D1C7',
        'sky-pale': '#E8F2F6',
        gold: '#C9A96E',
        'gold-light': '#F5ECD8',
        kavach: '#F0F4F8',
        'k-green': '#1E7E5E',
        'k-orange': '#D4691E',
        'k-red': '#B83232',
        muted: '#7A8EA0',
      },
      fontFamily: {
        serif: ['"DM Serif Display"', 'serif'],
        sans: ['"DM Sans"', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
      borderRadius: {
        xl: '16px',
        '2xl': '20px',
      },
      boxShadow: {
        card: '0 4px 24px rgba(13,43,62,0.08)',
        lg: '0 8px 48px rgba(13,43,62,0.14)',
      },
      backgroundImage: {
        'hero-grid':
          'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
      },
      keyframes: {
        'zone-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.15)', opacity: '0.7' },
        },
        'float-card': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'zone-pulse': 'zone-pulse 2s ease-in-out infinite',
        'float-card': 'float-card 3s ease-in-out infinite',
        marquee: 'marquee 22s linear infinite',
      },
      maxWidth: {
        content: '1240px',
      },
    },
  },
  plugins: [],
}
