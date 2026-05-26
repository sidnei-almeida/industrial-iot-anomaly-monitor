"use client";

import { useCallback, useSyncExternalStore } from "react";

import { applyTheme, getStoredTheme, toggleTheme, type ThemeMode } from "@/lib/theme";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("themechange", onStoreChange);
  return () => window.removeEventListener("themechange", onStoreChange);
}

function getSnapshot(): ThemeMode {
  if (typeof document === "undefined") return "dark";
  const attr = document.documentElement.getAttribute("data-theme");
  return attr === "light" ? "light" : "dark";
}

function getServerSnapshot(): ThemeMode {
  return "dark";
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTheme = useCallback((mode: ThemeMode) => {
    applyTheme(mode);
  }, []);

  const toggle = useCallback(() => {
    return toggleTheme();
  }, []);

  return { theme, setTheme, toggle, isLight: theme === "light" };
}
