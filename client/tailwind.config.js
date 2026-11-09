/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "var(--bg-canvas)", // #f6f8fb
        surface: "var(--bg-surface)", // #ffffff
        muted: "var(--bg-muted)", // #f1f5f9
        border: {
          DEFAULT: "var(--border-default)", // #e2e8f0
          subtle: "var(--border-subtle)", // #e2e8f0
          strong: "var(--border-strong)", // #cbd5e1
        },
        primary: {
          DEFAULT: "var(--primary)", // #2563eb
          hover: "var(--primary-hover)", // #1d4ed8
          soft: "var(--primary-soft)", // #eff6ff
        },
        content: {
          heading: "var(--text-heading)", // #0f172a
          body: "var(--text-body)", // #334155
          secondary: "var(--text-secondary)", // #64748b
        },
        status: {
          success: {
            DEFAULT: "var(--status-success)", // #15803d
            soft: "var(--status-success-soft)", // #f0fdf4
            border: "var(--status-success-border)", // #bbf7d0
          },
          warning: {
            DEFAULT: "var(--status-warning)", // #b45309
            soft: "var(--status-warning-soft)", // #fffbeb
            border: "var(--status-warning-border)", // #fde68a
          },
          danger: {
            DEFAULT: "var(--status-danger)", // #b91c1c
            soft: "var(--status-danger-soft)", // #fef2f2
            border: "var(--status-danger-border)", // #fecaca
          },
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        card: "var(--radius-card)", // 12px
        input: "var(--radius-input)", // 10px
        sm: "var(--radius-sm)", // 6px
        md: "var(--radius-sm)", // 6px
        lg: "var(--radius-input)", // 10px
        xl: "var(--radius-card)", // 12px
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        card: "var(--shadow-card)",
        DEFAULT: "var(--shadow-sm)",
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
