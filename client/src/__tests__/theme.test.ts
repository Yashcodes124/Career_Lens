import { describe, expect, it } from "vitest";
import {
  DEFAULT_THEME,
  THEME_REGISTRY,
  THEME_STORAGE_KEY,
  getNextTheme,
  normalizeTheme,
  persistTheme,
  readStoredTheme,
} from "../lib/theme";

describe("Dual Theme Utility (Obsidian Dark & Swiss Cobalt)", () => {
  it("normalizes unknown values to default obsidian dark theme", () => {
    expect(DEFAULT_THEME).toBe("dark");
    expect(normalizeTheme("dark")).toBe("dark");
    expect(normalizeTheme("swiss")).toBe("swiss");
    expect(normalizeTheme("unknown")).toBe("dark");
    expect(normalizeTheme(null)).toBe("dark");
  });

  it("toggles cleanly between dark and swiss 2-color themes", () => {
    expect(getNextTheme("dark")).toBe("swiss");
    expect(getNextTheme("swiss")).toBe("dark");
  });

  it("reads and persists theme preference safely in storage", () => {
    const store = new Map<string, string>();
    const fakeStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
    };

    expect(readStoredTheme(fakeStorage)).toBe("dark");
    persistTheme("swiss", fakeStorage);
    expect(store.get(THEME_STORAGE_KEY)).toBe("swiss");
    expect(readStoredTheme(fakeStorage)).toBe("swiss");
  });

  it("exposes 2-color designer metadata for both themes", () => {
    expect(THEME_REGISTRY.dark.swatches).toHaveLength(2);
    expect(THEME_REGISTRY.swiss.swatches).toHaveLength(2);
  });
});
