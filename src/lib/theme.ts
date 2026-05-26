export type ThemeMode = "dark" | "light";

const STORAGE_KEY = "theme";

export function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === "light" ? "light" : "dark";
}

export function applyTheme(theme: ThemeMode): void {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.classList.toggle("dark", theme === "dark");
  localStorage.setItem(STORAGE_KEY, theme);
  window.dispatchEvent(new Event("themechange"));
}

export function toggleTheme(): ThemeMode {
  const next: ThemeMode =
    document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
  applyTheme(next);
  return next;
}
