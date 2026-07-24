"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/* ─── Types ──────────────────────────────────────────── */

interface ThemeContextValue {
  theme: string;
  setTheme: (theme: string) => void;
  /** "dark" / "light" / undefined during SSR to avoid hydration mismatch */
  resolvedTheme: string | undefined;
}

/* ─── Context ────────────────────────────────────────── */

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  setTheme: () => {},
  resolvedTheme: "light",
});

export function useTheme() {
  return useContext(ThemeContext);
}

/* ─── Provider ───────────────────────────────────────── */

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "theme",
  enableSystem = true,
}: {
  children: React.ReactNode;
  defaultTheme?: string;
  storageKey?: string;
  enableSystem?: boolean;
}) {
  const [theme, setThemeState] = useState<string>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  /* Read persisted theme from localStorage on mount */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) setThemeState(stored);
    } catch {
      /* localStorage unavailable */
    }
    setMounted(true);
  }, [storageKey]);

  /* Resolve "system" to the actual OS preference */
  const getSystemTheme = useCallback((): string => {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }, []);

  /* Derived resolved theme — undefined during SSR */
  const resolvedTheme = useMemo<string | undefined>(() => {
    if (!mounted) return undefined;
    if (theme === "system" && enableSystem) return getSystemTheme();
    return theme;
  }, [theme, mounted, enableSystem, getSystemTheme]);

  /* Listen to OS-level theme changes */
  useEffect(() => {
    if (!enableSystem) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (theme === "system") {
        applyTheme(getSystemTheme());
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, enableSystem]);

  /* Apply theme class whenever resolvedTheme changes */
  const applyTheme = useCallback((active: string) => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(active);
    root.style.colorScheme = active;
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const active =
      theme === "system" && enableSystem ? getSystemTheme() : theme;
    applyTheme(active);
  }, [theme, mounted, enableSystem, getSystemTheme, applyTheme]);

  /* Public setter — persists to localStorage */
  const setTheme = useCallback(
    (next: string) => {
      setThemeState(next);
      try {
        localStorage.setItem(storageKey, next);
      } catch {
        /* localStorage unavailable */
      }
    },
    [storageKey],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      resolvedTheme,
    }),
    [theme, setTheme, resolvedTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
