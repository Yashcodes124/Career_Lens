import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Palette, Search, SlidersHorizontal, X } from "lucide-react";
import { useAuth } from "../../features/auth/useAuth";
import { useTheme } from "../../context/ThemeContext";
import { THEME_REGISTRY } from "../../lib/theme";
import { NAV_ITEMS } from "./navigation";

interface CommandEntry {
  id: string;
  label: string;
  description: string;
  path?: string;
  action?: () => void;
  group: string;
  keywords: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onClose,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isAdmin = user?.role === "ADMIN";
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const entries = useMemo<CommandEntry[]>(() => {
    const nextTheme = theme === "dark" ? THEME_REGISTRY.swiss : THEME_REGISTRY.dark;
    const navEntries: CommandEntry[] = NAV_ITEMS.filter(
      (item) => !item.adminOnly || isAdmin,
    ).map((item) => ({
      id: `nav-${item.path}`,
      label: item.label,
      description: `Go to ${item.label}`,
      path: item.path,
      group:
        item.group === "workspace"
          ? "Workspace"
          : item.group === "pipeline"
            ? "Job Pipeline"
            : "Account",
      keywords: `${item.label} ${item.path} ${item.group}`,
      icon: item.icon,
    }));

    navEntries.push({
      id: "action-toggle-theme",
      label: `Switch Theme to ${nextTheme.name}`,
      description: nextTheme.description,
      action: toggleTheme,
      group: "Appearance",
      keywords: "theme dark light obsidian swiss cobalt color mode appearance",
      icon: Palette,
    });

    navEntries.push({
      id: "action-edit-profile",
      label: "Edit Target Role & Preferences",
      description: "Update target role, locations, and experience level",
      path: "/profile-setup",
      group: "Quick Actions",
      keywords: "profile preferences target role settings locations",
      icon: SlidersHorizontal,
    });

    return navEntries;
  }, [isAdmin, theme, toggleTheme]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (entry) =>
        entry.label.toLowerCase().includes(q) ||
        entry.description.toLowerCase().includes(q) ||
        entry.keywords.toLowerCase().includes(q),
    );
  }, [entries, query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!open) return null;

  const handleSelect = (entry: CommandEntry) => {
    onClose();
    if (entry.action) {
      entry.action();
    } else if (entry.path) {
      navigate(entry.path);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        filtered.length === 0 ? 0 : (prev + 1) % filtered.length,
      );
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        filtered.length === 0
          ? 0
          : (prev - 1 + filtered.length) % filtered.length,
      );
      return;
    }
    if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault();
      handleSelect(filtered[selectedIndex]);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-20 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Quick navigation command palette"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-surface shadow-elevated"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
          <Search
            className="h-4 w-4 shrink-0 text-content-secondary"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to a workspace page or action..."
            aria-label="Search workspace pages"
            className="w-full bg-transparent text-sm text-content-heading placeholder:text-content-secondary outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close quick jump"
            className="rounded-sm p-1 text-content-secondary hover:bg-muted hover:text-content-heading"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="px-3 py-8 text-center text-xs text-content-secondary">
              No matching pages for "{query}".
            </p>
          ) : (
            <ul role="listbox" className="space-y-0.5">
              {filtered.map((entry, idx) => {
                const Icon = entry.icon;
                const isSelected = idx === selectedIndex;
                return (
                  <li key={entry.id} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      onClick={() => handleSelect(entry)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex w-full items-center justify-between gap-3 rounded-input px-3 py-2.5 text-left transition-colors ${
                        isSelected
                          ? "bg-primary-soft text-primary"
                          : "text-content-body hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className="h-4 w-4 shrink-0" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-content-heading">
                            {entry.label}
                          </p>
                          <p className="truncate text-xs text-content-secondary">
                            {entry.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-content-secondary">
                          {entry.group}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 opacity-60" />
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border bg-muted/50 px-4 py-2 text-[11px] text-content-secondary">
          <span>Use ↑ ↓ to navigate · Enter to open</span>
          <span>Esc to close</span>
        </div>
      </motion.div>
    </div>
  );
};

export default CommandPalette;
