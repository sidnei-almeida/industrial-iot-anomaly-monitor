/** Chart / monitor colors — read from CSS variables (theme-aware). */

export type ChartThemeColors = {
  line: string;
  lineMuted: string;
  grid: string;
  axis: string;
  threshold: string;
  thresholdLabel: string;
  normal: string;
  warning: string;
  critical: string;
  criticalStroke: string;
  warningStroke: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
  tooltipCursor: string;
};

/** Stable snapshot for SSR / useSyncExternalStore server snapshot */
export const SERVER_CHART_THEME: ChartThemeColors = {
  line: "#888888",
  lineMuted: "rgba(136, 136, 136, 0.25)",
  grid: "rgba(255, 255, 255, 0.04)",
  axis: "#2E2E2E",
  threshold: "#DCB13C",
  thresholdLabel: "#DCB13C",
  normal: "#5A9E7A",
  warning: "#DCB13C",
  critical: "#A03C3C",
  criticalStroke: "rgba(160, 60, 60, 0.4)",
  warningStroke: "rgba(220, 177, 60, 0.35)",
  tooltipBg: "var(--bg-card)",
  tooltipBorder: "var(--border)",
  tooltipText: "#F0EDE6",
  tooltipCursor: "rgba(255, 255, 255, 0.04)",
};

function cssVar(name: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

const FALLBACK = SERVER_CHART_THEME;

export function readChartTheme(): ChartThemeColors {
  if (typeof document === "undefined") return SERVER_CHART_THEME;

  const gold = cssVar("--gold", SERVER_CHART_THEME.threshold);
  const red = cssVar("--red", SERVER_CHART_THEME.critical);
  const green = cssVar("--green", SERVER_CHART_THEME.normal);
  const line = cssVar("--chart-line", SERVER_CHART_THEME.line);
  const muted = cssVar("--text-muted", SERVER_CHART_THEME.axis);
  const card = cssVar("--bg-card", "#111111");
  const border = cssVar("--border", SERVER_CHART_THEME.tooltipBorder);

  return {
    line,
    lineMuted: `color-mix(in srgb, ${line} 25%, transparent)`,
    grid: cssVar("--border-subtle", FALLBACK.grid),
    axis: muted,
    threshold: cssVar("--chart-gold", gold),
    thresholdLabel: cssVar("--chart-gold", gold),
    normal: green,
    warning: gold,
    critical: cssVar("--chart-red", red),
    criticalStroke: cssVar("--red-border", FALLBACK.criticalStroke),
    warningStroke: cssVar("--gold-border", FALLBACK.warningStroke),
    tooltipBg: card,
    tooltipBorder: border,
    tooltipText: cssVar("--text-primary", FALLBACK.tooltipText),
    tooltipCursor: cssVar("--chart-cursor", FALLBACK.tooltipCursor),
  };
}

export function readSparklineColor(): string {
  return cssVar("--chart-line", FALLBACK.line);
}

/** @deprecated Use readChartTheme() — kept for gradual migration */
export const CHART_THEME = SERVER_CHART_THEME;

export const MONITOR_PALETTE = {
  get gold() {
    return cssVar("--gold", "#DCB13C");
  },
  get textMuted() {
    return cssVar("--text-muted", "#2E2E2E");
  },
} as const;
