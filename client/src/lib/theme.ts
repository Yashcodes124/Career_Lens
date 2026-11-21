export type AppTheme = "dark" | "swiss";

export const THEME_STORAGE_KEY = "truehire_theme";
export const DEFAULT_THEME: AppTheme = "dark";

export interface ThemeMeta {
  id: AppTheme;
  name: string;
  shortLabel: string;
  description: string;
  swatches: [string, string];
}

export const THEME_REGISTRY: Record<AppTheme, ThemeMeta> = {
  dark: {
    id: "dark",
    name: "Obsidian Dark",
    shortLabel: "Obsidian",
    description: "Deep obsidian canvas with calibrated sapphire accents",
    swatches: ["#090C10", "#3B82F6"],
  },
  swiss: {
    id: "swiss",
    name: "Swiss Cobalt",
    shortLabel: "Swiss",
    description: "2-color designer palette: warm ivory paper & Klein cobalt",
    swatches: ["#F5F3EE", "#1D4ED8"],
  },
};

export function normalizeTheme(value: unknown): AppTheme {
  return value === "swiss" ? "swiss" : "dark";
}

export function getNextTheme(current: AppTheme): AppTheme {
  return current === "dark" ? "swiss" : "dark";
}

export function readStoredTheme(storage?: Pick<Storage, "getItem"> | null): AppTheme {
  try {
    const raw = storage?.getItem(THEME_STORAGE_KEY);
    return normalizeTheme(raw);
  } catch {
    return DEFAULT_THEME;
  }
}

export function persistTheme(
  theme: AppTheme,
  storage?: Pick<Storage, "setItem"> | null,
): void {
  try {
    storage?.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage quota or private-mode restrictions
  }
}
