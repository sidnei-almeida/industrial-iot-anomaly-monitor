"use client";

import { DashboardPanel, PanelHeader } from "@/components/dashboard/DashboardPanel";
import type { SecomMonitor } from "@/hooks/use-secom-monitor";
import { getInferenceModeLabel } from "@/lib/inference-mode";
import type { AlertRecord } from "@/types/secom";
import { cn } from "@/lib/utils";

interface AlertsSectionProps {
  monitor: SecomMonitor;
}

function countByLevel(alerts: AlertRecord[], level: AlertRecord["level"]): number {
  return alerts.filter((a) => a.level === level).length;
}

const statusClass: Record<string, string> = {
  Critical: "badge-status-anomaly",
  Warning: "badge-status-warning",
  Normal: "badge-status-normal",
};

export function AlertsSection({ monitor }: AlertsSectionProps) {
  const alerts = monitor.alertHistory;
  const systemEvents = monitor.events.filter((e) => e.level === "system");
  const localScoringEvents = systemEvents.filter(
    (e) =>
      e.message.toLowerCase().includes("switched to local scoring") ||
      e.event.toLowerCase().includes("local scoring"),
  ).length;

  const lastCritical = alerts.find((a) => a.level === "critical");

  const summary = [
    { label: "Total events", value: alerts.length + systemEvents.length },
    { label: "Warnings", value: countByLevel(alerts, "warning") },
    { label: "Critical", value: countByLevel(alerts, "critical") },
    { label: "Local scoring", value: localScoringEvents },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
      <div className="grid grid-cols-4 gap-2">
        {summary.map((s) => (
          <div
            key={s.label}
            className="lux-card px-4 py-3"
          >
            <p className="stat-kpi-label">{s.label}</p>
            <p className="stat-kpi-value mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {lastCritical ? (
        <div className="rounded-lg border border-red-border bg-red-subtle px-3 py-2 text-[11px] text-danger">
          Last anomaly: Packet #{lastCritical.packetId} · score {lastCritical.displayScore} ·{" "}
          {lastCritical.timestamp}
        </div>
      ) : null}

      <DashboardPanel className="min-h-0 flex-1">
        <PanelHeader title="Alert & event history" subtitle="Full session log" />
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full text-left text-[10px]">
            <thead className="sticky top-0 bg-bg-card">
              <tr className="text-[9px] font-semibold uppercase tracking-wide text-text-secondary">
                <th className="px-2 py-2">Time</th>
                <th className="px-2 py-2">Packet</th>
                <th className="px-2 py-2">Score</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Ground truth</th>
                <th className="px-2 py-2">Source</th>
                <th className="px-2 py-2">Message</th>
                <th className="px-2 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-text-muted">
                    No packet events yet — start the stream.
                  </td>
                </tr>
              ) : (
                alerts.map((row, index) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "table-row-hover transition-colors",
                      index % 2 === 1 && "table-row-zebra",
                    )}
                  >
                    <td className="whitespace-nowrap px-2 py-1.5 font-mono text-text-muted">
                      {row.timestamp}
                    </td>
                    <td className="px-2 py-1.5 font-mono text-text-secondary">#{row.packetId}</td>
                    <td className="px-2 py-1.5 font-mono text-text-primary">{row.displayScore}</td>
                    <td className="px-2 py-1.5">
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase",
                          statusClass[row.processStatus] ?? "badge-status-system",
                        )}
                      >
                        {row.processStatus}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-text-muted">{row.groundTruthLabel}</td>
                    <td className="px-2 py-1.5 text-text-muted">
                      {getInferenceModeLabel(row.source)}
                    </td>
                    <td className="max-w-[180px] truncate px-2 py-1.5 text-text-secondary">
                      {row.message}
                    </td>
                    <td className="max-w-[160px] truncate px-2 py-1.5 text-text-secondary">
                      {row.recommendedAction}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DashboardPanel>
    </div>
  );
}
