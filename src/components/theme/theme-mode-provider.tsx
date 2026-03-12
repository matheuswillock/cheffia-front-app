"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import {
  DEFAULT_THEME_MODE,
  isThemeMode,
  THEME_SESSION_STORAGE_KEY,
  type ThemeMode,
} from "@/components/theme/theme-mode";

interface ThemeModeContextValue {
  themeMode: ThemeMode;
  setThemeMode: (theme: ThemeMode) => void;
  toggleThemeMode: () => void;
}

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

const applyThemeMode = (theme: ThemeMode) => {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.setAttribute("data-theme", theme);
};

export function ThemeModeProvider({ children }: PropsWithChildren) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(DEFAULT_THEME_MODE);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedTheme = window.sessionStorage.getItem(THEME_SESSION_STORAGE_KEY);
    const resolvedTheme = isThemeMode(storedTheme) ? storedTheme : DEFAULT_THEME_MODE;

    applyThemeMode(resolvedTheme);
    setThemeModeState(resolvedTheme);
    window.sessionStorage.setItem(THEME_SESSION_STORAGE_KEY, resolvedTheme);
  }, []);

  const setThemeMode = useCallback((theme: ThemeMode) => {
    applyThemeMode(theme);
    window.sessionStorage.setItem(THEME_SESSION_STORAGE_KEY, theme);
    setThemeModeState(theme);
  }, []);

  const toggleThemeMode = useCallback(() => {
    setThemeMode(themeMode === "dark" ? "light" : "dark");
  }, [themeMode, setThemeMode]);

  const value = useMemo(
    () => ({
      themeMode,
      setThemeMode,
      toggleThemeMode,
    }),
    [themeMode, setThemeMode, toggleThemeMode],
  );

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
}

export const useThemeMode = () => {
  const context = useContext(ThemeModeContext);

  if (!context) {
    throw new Error("useThemeMode must be used within a ThemeModeProvider");
  }

  return context;
};
