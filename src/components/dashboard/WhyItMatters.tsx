"use client";

import { Clock, Layers, Shield, TrendingUp } from "lucide-react";

import { DashboardPanel, PanelHeader } from "@/components/dashboard/DashboardPanel";
import { cn } from "@/lib/utils";

const tiles = [
  {
    icon: Clock,
    title: "Prevent Costly Downtime",
    body: "Detect anomalies early before failures propagate.",
  },
  {
    icon: Shield,
    title: "Protect Product Quality",
    body: "Ensure consistent process conditions across runs.",
  },
  {
    icon: TrendingUp,
    title: "Improve Operational Efficiency",
    body: "Real-time insights for engineering and quality teams.",
  },
  {
    icon: Layers,
    title: "Scalable & Production Ready",
    body: "Model inference runs in the deployment itself, with local scoring as a fallback.",
  },
];

interface WhyItMattersProps {
  className?: string;
}

export function WhyItMatters({ className }: WhyItMattersProps) {
  return (
    <DashboardPanel className={cn("flex h-full min-h-0 flex-col", className)}>
      <PanelHeader title="Why this project matters" />
      <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-2.5 p-3">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <div
              key={tile.title}
              className="flex h-full min-h-0 flex-col justify-center rounded-lg border border-border bg-bg-card-subtle p-3 sm:p-4"
            >
              <div className="mb-3 flex size-9 items-center justify-center rounded-lg border border-border bg-bg-card-subtle text-text-secondary">
                <Icon className="size-4" />
              </div>
              <p className="text-[12px] font-semibold leading-snug text-text-primary">{tile.title}</p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-text-muted">{tile.body}</p>
            </div>
          );
        })}
      </div>
    </DashboardPanel>
  );
}
