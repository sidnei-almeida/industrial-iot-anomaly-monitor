/** Shared shell dimensions — sidebar logo row height matches topbar */
export const SIDEBAR_WIDTH_PX = 68;
export const TOPBAR_HEIGHT_PX = 88;

/** Dashboard middle row — fixed px heights (no flex sizing) */
export const DASHBOARD_CHART_ROW_HEIGHT = 612;
export const DASHBOARD_CHART_ROW_HEIGHT_MOBILE = 540;
/** Plot area inside Live Anomaly panel (row − header − legend) */
export const DASHBOARD_CHART_PLOT_HEIGHT = 532;
export const DASHBOARD_CHART_PLOT_HEIGHT_MOBILE = 460;
/** Scroll body inside telemetry / model panels (row − header) */
export const DASHBOARD_PANEL_BODY_HEIGHT = 560;
export const DASHBOARD_PANEL_BODY_HEIGHT_MOBILE = 488;

export const shellLayout = {
  sidebarWidthClass: "w-[68px]" as const,
  topbarHeightClass: "h-[88px]" as const,
  mainOffset: "ml-[68px] pt-[88px] max-sm:pt-[148px]" as const,
  topbarLeft: "left-[68px]" as const,
};

/** Reference format: May 18, 2025 10:24:37 AM */
export function formatHeaderTimestamp(date: Date): string {
  const datePart = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  return `${datePart} ${timePart}`;
}
