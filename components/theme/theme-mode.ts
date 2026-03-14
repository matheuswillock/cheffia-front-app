export type ThemeMode = "dark" | "light";

export const THEME_SESSION_STORAGE_KEY = "cheffia:theme";
export const DEFAULT_THEME_MODE: ThemeMode = "dark";

export const isThemeMode = (value: unknown): value is ThemeMode =>
  value === "dark" || value === "light";

export const getThemeInitScript = () => `
(() => {
  try {
    const key = "${THEME_SESSION_STORAGE_KEY}";
    const stored = sessionStorage.getItem(key);
    const theme = stored === "light" ? "light" : "${DEFAULT_THEME_MODE}";
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    root.setAttribute("data-theme", theme);
    sessionStorage.setItem(key, theme);
  } catch {
    document.documentElement.classList.add("dark");
    document.documentElement.setAttribute("data-theme", "${DEFAULT_THEME_MODE}");
  }
})();
`;
