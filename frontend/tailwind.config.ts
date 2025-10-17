import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'georgia': ['Georgia', 'serif'],
        'garamond': ['Garamond', 'serif'],
        'cinzel': ['Cinzel', 'serif'],
        'uncial': ['Uncial Antiqua', 'cursive'],
        'im-fell': ['IM Fell English', 'serif'],
      },
    },
  },
  plugins: [],
} satisfies Config

