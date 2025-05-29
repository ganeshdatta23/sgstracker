import type { Config } from "tailwindcss";
import type { PluginAPI } from "tailwindcss/types/config";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
        heading: ['Poppins', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        brightGold: '#FFD700',
        deepOrange: '#FF8C00',
        electricPink: '#FF007F',
        vibrantTeal: '#00F5D4',
        lightForeground: '#FFF8E1',
        darkBackground: '#1A090D',
        neonGoldStart: '#FFD700',
        neonRedEnd: '#B22222',
      },
      borderRadius: {
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 2px)`,
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        'gradient-neon-gold-red': 'linear-gradient(90deg, #FFD700, #B22222)',
      },
      boxShadow: {
        neonGlow:
          '0 0 8px #FFD700, 0 0 12px #B22222, 0 0 20px #FFD700, 0 0 30px #B22222, 0 0 40px #FFD700',
      },
      textShadow: {
        neon: '0 0 5px #FFD700, 0 0 10px #B22222',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        glow: {
          '0%, 100%': {
            textShadow: '0 0 20px rgba(253, 224, 71, 0.7), 0 0 40px rgba(253, 224, 71, 0.5)',
          },
          '50%': {
            textShadow: '0 0 30px rgba(253, 224, 71, 0.9), 0 0 50px rgba(253, 224, 71, 0.7)',
          },
        },
        fadeIn: {
          from: {
            opacity: '0',
            transform: 'translate(-50%, 20px)',
          },
          to: {
            opacity: '1',
            transform: 'translate(-50%, 0)',
          },
        },
        slideIn: {
          from: {
            opacity: '0',
            transform: 'translateY(10px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        glow: 'glow 2s ease-in-out infinite',
        fadeIn: 'fadeIn 1s ease-out forwards',
        slideIn: 'slideIn 0.8s ease-out forwards',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    function ({ addUtilities }: PluginAPI) {
      addUtilities({
        '.text-neon': {
          textShadow: '0 0 5px #FFD700, 0 0 10px #B22222',
        },
      });
    },
  ],
};

export default config;
