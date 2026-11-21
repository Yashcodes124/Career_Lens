import React from "react";
import { Moon, Palette } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import { THEME_REGISTRY, type AppTheme } from "../../lib/theme";

export interface ThemeToggleProps {
  variant?: "segmented" | "compact";
  className?: string;
}

const OPTIONS: Array<{ id: AppTheme; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "dark", label: "Obsidian", icon: Moon },
  { id: "swiss", label: "Swiss", icon: Palette },
];

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = "compact",
  className = "",
}) => {
  const { theme, setTheme, toggleTheme } = useTheme();
  const currentMeta = THEME_REGISTRY[theme];
  const nextMeta = THEME_REGISTRY[theme === "dark" ? "swiss" : "dark"];

  if (variant === "segmented") {
    return (
      <div
        role="group"
        aria-label="Theme selector"
        className={`inline-flex items-center rounded-input border border-border bg-muted p-0.5 ${className}`}
      >
        {OPTIONS.map((opt) => {
          const active = theme === opt.id;
          const Icon = opt.icon;
          const swatches = THEME_REGISTRY[opt.id].swatches;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setTheme(opt.id)}
              aria-pressed={active}
              title={THEME_REGISTRY[opt.id].description}
              className={`relative inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                active
                  ? "text-content-heading"
                  : "text-content-secondary hover:text-content-heading"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="active-theme-pill"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  className="absolute inset-0 rounded-[8px] border border-border bg-surface shadow-xs"
                  aria-hidden="true"
                />
              )}
              <span className="relative z-10 inline-flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{opt.label}</span>
                <span
                  className="inline-flex items-center -space-x-1"
                  aria-hidden="true"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full border border-border-strong"
                    style={{ backgroundColor: swatches[0] }}
                  />
                  <span
                    className="h-2.5 w-2.5 rounded-full border border-border-strong"
                    style={{ backgroundColor: swatches[1] }}
                  />
                </span>
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch theme to ${nextMeta.name}`}
      title={`Current: ${currentMeta.name}. Click for ${nextMeta.name}`}
      className={`inline-flex h-8 items-center gap-2 rounded-sm border border-border bg-surface px-2.5 text-xs font-medium text-content-body whitespace-nowrap transition-all duration-150 hover:border-border-strong hover:bg-muted hover:text-content-heading active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${className}`}
    >
      <span
        className="inline-flex items-center -space-x-1"
        aria-hidden="true"
      >
        <span
          className="h-2.5 w-2.5 rounded-full border border-border-strong"
          style={{ backgroundColor: currentMeta.swatches[0] }}
        />
        <span
          className="h-2.5 w-2.5 rounded-full border border-border-strong"
          style={{ backgroundColor: currentMeta.swatches[1] }}
        />
      </span>
      <span className="hidden sm:inline">{currentMeta.shortLabel}</span>
    </button>
  );
};
