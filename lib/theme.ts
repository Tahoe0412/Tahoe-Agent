export const THEME_STORAGE_KEY = "ai-video-ops-theme";

export type ThemePreference = "system" | "light" | "dark";

export function resolveTheme(preference: ThemePreference) {
  if (preference === "system") {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  }

  return preference;
}

export function applyTheme(preference: ThemePreference) {
  if (typeof document === "undefined") {
    return;
  }

  const theme = resolveTheme(preference);
  document.documentElement.setAttribute("data-theme", theme);
}
