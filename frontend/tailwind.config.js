/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        headline: ['Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Dark mode colors (default)
        dark: {
          bg: {
            primary: '#0a0a0a',
            secondary: '#111111',
          },
          primary: {
            DEFAULT: '#00ff88',
            dark: '#00cc6a',
          },
          text: {
            primary: '#ffffff',
            secondary: '#b3b3b3',
          },
        },
        // Light mode colors
        light: {
          bg: {
            primary: '#ffffff',
            secondary: '#f5f5f5',
          },
          primary: {
            DEFAULT: '#00cc6a',
            dark: '#00a855',
          },
          text: {
            primary: '#0a0a0a',
            secondary: '#666666',
          },
        },
        // Unified primary color (adapts to theme)
        primary: {
          DEFAULT: '#00ff88',
          dark: '#00cc6a',
          hover: '#00cc6a',
        },
      },
      backgroundColor: {
        'app-primary': '#ffffff',
        'app-secondary': '#f5f5f5',
        'dark-app-primary': '#0a0a0a',
        'dark-app-secondary': '#111111',
      },
      textColor: {
        'app-primary': '#0a0a0a',
        'app-secondary': '#666666',
        'dark-app-primary': '#ffffff',
        'dark-app-secondary': '#b3b3b3',
      },
      borderColor: {
        'app-primary': 'rgba(0, 204, 106, 0.2)',
        'dark-app-primary': 'rgba(0, 255, 136, 0.1)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(circle, var(--tw-gradient-stops))',
      },
      animation: {
        'pulse-radial': 'pulseRadial 4s ease-in-out infinite',
        'pulse-radial-delayed': 'pulseRadial 4s ease-in-out infinite 1s',
        'pulse-radial-slow': 'pulseRadial 6s ease-in-out infinite',
      },
      keyframes: {
        pulseRadial: {
          '0%, 100%': {
            transform: 'scale(1)',
            opacity: '0.3',
          },
          '50%': {
            transform: 'scale(1.2)',
            opacity: '0.5',
          },
        },
      },
    },
  },
  plugins: [],
}
