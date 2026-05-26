import type { DashboardSection } from "@/types/secom";
import type { LucideIcon } from "lucide-react";
import { Bell, LayoutDashboard, LineChart, Settings } from "lucide-react";

export const NAV_ITEMS: Array<{
  id: DashboardSection;
  label: string;
  icon: LucideIcon;
}> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "analytics", label: "Dataset & Model", icon: LineChart },
  { id: "alerts", label: "Alerts / Event Log", icon: Bell },
  { id: "settings", label: "Control Center", icon: Settings },
];
