"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface DashboardPanelProps {
  className?: string;
  children: React.ReactNode;
  emphasis?: "none" | "critical" | "warning";
  /** When "scroll", content can scroll vertically instead of being clipped. */
  overflowBehavior?: "clip" | "scroll";
}

const emphasisMap = {
  none: "",
  critical: "ring-1 ring-danger/15",
  warning: "ring-1 ring-accent-gold/10",
};

export function DashboardPanel({
  className,
  children,
  emphasis = "none",
  overflowBehavior = "clip",
}: DashboardPanelProps) {
  return (
    <div
      className={cn(
        "lux-card block h-full transition-premium",
        overflowBehavior === "scroll" ? "overflow-y-auto overflow-x-hidden" : "overflow-hidden",
        emphasisMap[emphasis],
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PanelHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex shrink-0 items-start justify-between gap-3 px-6 py-5">
      <div className="min-w-0 flex-1">
        <h2 className="text-[13px] font-semibold tracking-tight text-text-primary">{title}</h2>
        {subtitle ? (
          <div className="mt-1.5 text-[12px] text-text-secondary">{subtitle}</div>
        ) : null}
      </div>
      {action}
    </div>
  );
}
