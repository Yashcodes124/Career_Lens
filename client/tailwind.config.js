/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "var(--bg-canvas)",
        surface: "var(--bg-surface)",
        muted: "var(--bg-muted)",
        border: {
          DEFAULT: "var(--border-default)",
          subtle: "var(--border-subtle)",
          strong: "var(--border-strong)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          soft: "var(--primary-soft)",
          foreground: "var(--primary-foreground)",
        },
        content: {
          heading: "var(--text-heading)",
          body: "var(--text-body)",
          secondary: "var(--text-secondary)",
        },
        status: {
          success: {
            DEFAULT: "var(--status-success)",
            soft: "var(--status-success-soft)",
            border: "var(--status-success-border)",
          },
          warning: {
            DEFAULT: "var(--status-warning)",
            soft: "var(--status-warning-soft)",
            border: "var(--status-warning-border)",
          },
          danger: {
            DEFAULT: "var(--status-danger)",
            soft: "var(--status-danger-soft)",
            border: "var(--status-danger-border)",
          },
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        card: "var(--radius-card)",
        input: "var(--radius-input)",
        sm: "var(--radius-sm)",
        md: "var(--radius-sm)",
        lg: "var(--radius-input)",
        xl: "var(--radius-card)",
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        card: "var(--shadow-card)",
        elevated: "var(--shadow-elevated)",
        DEFAULT: "var(--shadow-sm)",
      },
      transitionTimingFunction: {
        editorial: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      spacing: {
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        5: "20px",
        6: "24px",
        8: "32px",
        10: "40px",
        12: "48px",
        16: "64px",
      },
    },
  },
  plugins: [],
};
