import type { Config } from "tailwindcss";

/**
 * Color tokens use `<alpha-value>` so utilities like `bg-brand/10` work.
 * The actual RGB values are defined in styles.css as CSS variables, so
 * dark mode only has to swap variables, not rebuild the config.
 */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        "bg-soft": "rgb(var(--bg-soft) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-soft": "rgb(var(--surface-soft) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        fg: "rgb(var(--fg) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        subtle: "rgb(var(--subtle) / <alpha-value>)",

        brand: "rgb(var(--brand) / <alpha-value>)",
        "brand-soft": "rgb(var(--brand-soft) / <alpha-value>)",
        info: "rgb(var(--info) / <alpha-value>)",
        success: "rgb(var(--success) / <alpha-value>)",
        warn: "rgb(var(--warn) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",

        // Keep legacy aliases so any leftover classes keep rendering
        ink: "rgb(var(--fg) / <alpha-value>)",
        panel: "rgb(var(--surface) / <alpha-value>)",
        mist: "rgb(var(--bg-soft) / <alpha-value>)"
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "PingFang SC",
          "Hiragino Sans GB",
          "Microsoft YaHei",
          "Helvetica Neue",
          "Helvetica",
          "Arial",
          "sans-serif"
        ]
      },
      boxShadow: {
        soft: "0 18px 45px rgb(var(--shadow) / 0.18)",
        inset: "inset 0 1px 0 0 rgb(var(--surface) / 0.05)",
        ring: "0 0 0 6px rgb(var(--brand) / 0.14)"
      },
      borderRadius: {
        xl: "14px",
        "2xl": "18px"
      },
      keyframes: {
        "pulse-ring": {
          "0%":   { transform: "scale(1)",   opacity: "0.55" },
          "80%":  { transform: "scale(1.9)", opacity: "0"    },
          "100%": { transform: "scale(1.9)", opacity: "0"    }
        },
        "fade-in": {
          "0%":   { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)"   }
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0"  }
        }
      },
      animation: {
        "pulse-ring": "pulse-ring 2s cubic-bezier(0.22, 1, 0.36, 1) infinite",
        "fade-in":   "fade-in 220ms ease-out both",
        shimmer:     "shimmer 2.4s linear infinite"
      }
    }
  },
  plugins: []
} satisfies Config;
