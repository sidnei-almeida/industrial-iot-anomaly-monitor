"use client";

import { useSyncExternalStore } from "react";

import {
  readChartTheme,
  readSparklineColor,
  SERVER_CHART_THEME,
  type ChartThemeColors,
} from "@/lib/monitor-theme";

function getThemeKey(): string {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") ?? "dark";
}

let cachedChartTheme: ChartThemeColors = SERVER_CHART_THEME;
let chartThemeCacheKey = "";

let cachedSparklineColor = SERVER_CHART_THEME.line;
let sparklineCacheKey = "";

function getChartSnapshot(): ChartThemeColors {
  const key = getThemeKey();
  if (key === chartThemeCacheKey) {
    return cachedChartTheme;
  }
  chartThemeCacheKey = key;
  cachedChartTheme = readChartTheme();
  return cachedChartTheme;
}

function getSparklineSnapshot(): string {
  const key = getThemeKey();
  if (key === sparklineCacheKey) {
    return cachedSparklineColor;
  }
  sparklineCacheKey = key;
  cachedSparklineColor = readSparklineColor();
  return cachedSparklineColor;
}

function invalidateChartCache(): void {
  chartThemeCacheKey = "";
  sparklineCacheKey = "";
}

function subscribe(onStoreChange: () => void) {
  const handler = () => {
    invalidateChartCache();
    onStoreChange();
  };
  window.addEventListener("themechange", handler);
  return () => window.removeEventListener("themechange", handler);
}

function getChartServerSnapshot(): ChartThemeColors {
  return SERVER_CHART_THEME;
}

function getSparklineServerSnapshot(): string {
  return SERVER_CHART_THEME.line;
}

export function useChartTheme(): ChartThemeColors {
  return useSyncExternalStore(subscribe, getChartSnapshot, getChartServerSnapshot);
}

export function useSparklineColor(): string {
  return useSyncExternalStore(subscribe, getSparklineSnapshot, getSparklineServerSnapshot);
}
