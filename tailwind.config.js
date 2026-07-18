/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: {
          DEFAULT: '#080B14',
          50: '#F4F5F8',
          100: '#0E1320',
          200: '#131826',
          300: '#1B2333',
          400: '#242E42',
          500: '#323E56',
        },
        ink: {
          100: '#E8EAF0',
          300: '#B7BDCC',
          500: '#8B93A7',
          700: '#5B6478',
        },
        gold: {
          DEFAULT: '#F2B705',
          soft: '#F7CE4B',
          dim: '#7A5F0C',
        },
        teal: {
          DEFAULT: '#2DD4BF',
          dim: '#134E4A',
        },
        rose: {
          DEFAULT: '#FB7185',
          dim: '#4C1D24',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'star-field': "radial-gradient(circle at 20% 20%, rgba(242,183,5,0.06), transparent 40%), radial-gradient(circle at 80% 0%, rgba(45,212,191,0.05), transparent 35%), radial-gradient(circle at 50% 100%, rgba(242,183,5,0.04), transparent 45%)",
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(242,183,5,0.15), 0 0 24px rgba(242,183,5,0.25)',
        'glow-teal': '0 0 0 1px rgba(45,212,191,0.15), 0 0 24px rgba(45,212,191,0.2)',
        card: '0 1px 0 rgba(255,255,255,0.03) inset, 0 8px 24px rgba(0,0,0,0.35)',
      },
      keyframes: {
        twinkle: {
          '0%, 100%': { opacity: 0.35 },
          '50%': { opacity: 1 },
        },
        'pop-in': {
          '0%': { transform: 'scale(0.6)', opacity: 0 },
          '60%': { transform: 'scale(1.15)', opacity: 1 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
        rise: {
          '0%': { transform: 'translateY(8px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
      },
      animation: {
        twinkle: 'twinkle 3s ease-in-out infinite',
        'pop-in': 'pop-in 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        rise: 'rise 0.4s ease-out both',
      },
    },
  },
  plugins: [],
}
