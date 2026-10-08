/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        shield: {
          void: '#0B0D12',
          deep: '#0F1117',
          canvas: '#1A1D24',
          surface: '#1E2128',
          layer: '#222530',
          tier: '#262A36',
          mist: '#2A2E3A',
          panel: '#2C303A',
          elevated: '#3A404B',
          edge: '#3A404B',
          'edge-strong': '#4A505B',
          muted: '#9CA3AF',
          fg: '#E8EAED',
          brand: '#46A1E2',
          'brand-dim': '#3A8BC9',
          accent: '#E8B44C',
          'accent-dim': '#C99A35',
        },
        'shield-black': '#000000',
        'shield-white': '#FFFFFF',
        'shield-blue': '#46A1E2',
        'shield-gray': '#1a1a1a',
        'shield-light-gray': '#2a2a2a',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        scripture: ['Literata', 'Georgia', 'Cambria', 'serif'],
      },
      backgroundImage: {
        'shield-radial':
          'radial-gradient(ellipse 120% 80% at 50% -30%, rgba(70, 161, 226, 0.22) 0%, transparent 55%)',
        'shield-radial-soft':
          'radial-gradient(ellipse 90% 60% at 80% 20%, rgba(70, 161, 226, 0.12) 0%, transparent 50%)',
        'shield-mesh':
          'radial-gradient(at 40% 20%, rgba(70, 161, 226, 0.08) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(232, 180, 76, 0.06) 0px, transparent 45%), radial-gradient(at 0% 50%, rgba(70, 161, 226, 0.05) 0px, transparent 40%)',
        'gradient-shield-brand':
          'linear-gradient(135deg, #46A1E2 0%, #2E8BC4 45%, #1E6A9E 100%)',
        'gradient-shield-hero':
          'linear-gradient(165deg, #12151C 0%, #1A1D24 38%, #1E2430 72%, #232A38 100%)',
        'gradient-shield-footer':
          'linear-gradient(to top, #12151C 0%, #1A1D24 45%, #2C303A 100%)',
      },
      boxShadow: {
        'shield-glow': '0 0 60px -12px rgba(70, 161, 226, 0.35)',
        'shield-glow-sm': '0 0 32px -8px rgba(70, 161, 226, 0.28)',
        'shield-card':
          '0 20px 50px -24px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.04)',
        'shield-inset': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.06)',
      },
      animation: {
        'shield-float': 'shield-float 14s ease-in-out infinite',
      },
      keyframes: {
        'shield-float': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(1%, -1%) scale(1.02)' },
        },
      },
    },
  },
  plugins: [],
}
