"use client";

import { ExternalLink } from "lucide-react";

import { DashboardPanel, PanelHeader } from "@/components/dashboard/DashboardPanel";
import { Button } from "@/components/ui/button";
import { computeEventSummary } from "@/lib/event-log";
import { getSourceBadgeClassName, getSourceBadgeLabel } from "@/lib/inference-mode";
import { cn } from "@/lib/utils";
import type { EventLogEntry, EventLogStatus, GroundTruthLabel, ScoringSource } from "@/types/secom";

interface EventLogProps {
  className?: string;
  events: EventLogEntry[];
  title?: string;
}

const COLUMNS = [
  { key: "time", label: "Time", className: "w-[72px]" },
  { key: "packet", label: "Packet", className: "w-[56px]" },
  { key: "event", label: "Event", className: "min-w-[120px]" },
  { key: "status", label: "Status", className: "w-[76px]" },
  { key: "score", label: "Score", className: "w-[72px]" },
  { key: "threshold", label: "Threshold", className: "w-[64px]" },
  { key: "groundTruth", label: "Ground Truth", className: "w-[80px]" },
  { key: "source", label: "Source", className: "w-[72px]" },
  { key: "topSensor", label: "Top Sensor", className: "min-w-[100px]" },
  { key: "action", label: "Action", className: "min-w-[120px]" },
] as const;

function StatusBadge({ status }: { status: EventLogStatus }) {
  const styles: Record<EventLogStatus, string> = {
    Normal: "badge-status-normal",
    Warning: "badge-status-warning",
    Critical: "badge-status-anomaly",
    System: "badge-status-system",
  };
  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap rounded px-1.5 py-0.5 text-[9px] font-semibold",
        styles[status],
      )}
    >
      {status}
    </span>
  );
}

function SourceBadge({ source }: { source: ScoringSource }) {
  return (
    <span
      className={cn(
        "inline-block rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase",
        getSourceBadgeClassName(source),
      )}
    >
      {getSourceBadgeLabel(source)}
    </span>
  );
}

function GroundTruthBadge({ label }: { label: GroundTruthLabel }) {
  return (
    <span
      className={cn(
        "inline-block rounded border px-1.5 py-0.5 text-[9px] font-semibold",
        label === "Failure"
          ? "badge-status-anomaly"
          : "badge-status-normal border-0",
      )}
    >
      {label}
    </span>
  );
}

function SummaryChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "default" | "red" | "amber" | "sky";
}) {
  const toneClass = {
    default: "text-text-secondary",
    red: "text-danger",
    amber: "text-text-primary",
    sky: "text-normal",
  }[tone ?? "default"];

  return (
    <span className="text-[10px] text-text-muted">
      {label}{" "}
      <span className={cn("font-semibold tabular-nums", toneClass)}>{value}</span>
    </span>
  );
}

export function EventLog({ className, events, title = "Live Event Log" }: EventLogProps) {
  const summary = computeEventSummary(events);

  return (
    <DashboardPanel className={cn("flex h-full min-h-0 flex-col", className)}>
      <PanelHeader
        title={title}
        subtitle={
          events.length > 0 ? (
            <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <SummaryChip label="Total" value={summary.total} />
              <span className="text-text-ghost">·</span>
              <SummaryChip label="Critical" value={summary.critical} tone="red" />
              <span className="text-text-ghost">·</span>
              <SummaryChip label="Warnings" value={summary.warnings} tone="amber" />
              <span className="text-text-ghost">·</span>
              <SummaryChip label="Local" value={summary.local} tone="sky" />
            </span>
          ) : undefined
        }
        action={
          <Button
            variant="ghost"
            size="sm"
            className="h-7 shrink-0 gap-1 px-2 text-[10px] text-text-muted hover:bg-bg-card-hover hover:text-text-secondary"
          >
            View All Logs
            <ExternalLink className="size-3" />
          </Button>
        }
      />

      <div className="min-h-0 flex-1 overflow-auto px-2 pb-3">
        <table className="w-full min-w-[960px] border-collapse text-left text-[10px]">
          <thead className="sticky top-0 z-10 bg-bg-card">
            <tr className="text-[9px] font-semibold uppercase tracking-[0.12em] text-text-secondary">
              {COLUMNS.map((col) => (
                <th key={col.key} className={cn("px-3 py-3 first:pl-4 last:pr-4", col.className)}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-10 text-center text-text-muted">
                  No events yet — start the stream to populate the log
                </td>
              </tr>
            ) : (
              events.map((event, index) => (
                <tr
                  key={event.id}
                  className={cn(
                    "table-row-hover transition-colors",
                    index % 2 === 1 && "table-row-zebra",
                  )}
                >
                  <td className="whitespace-nowrap px-2 py-1.5 pl-3 font-mono text-text-muted">
                    {event.timestamp}
                  </td>
                  <td
                    className={cn(
                      "whitespace-nowrap px-2 py-1.5 font-mono",
                      event.packetId != null ? "text-text-muted" : "text-text-ghost",
                    )}
                  >
                    {event.packetId != null ? `#${event.packetId}` : "—"}
                  </td>
                  <td className="px-2 py-1.5 text-text-secondary">{event.event}</td>
                  <td className="px-2 py-1.5">
                    <StatusBadge status={event.status} />
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5 font-mono tabular-nums">
                    {event.displayScore != null ? (
                      <span
                        className={cn(
                          event.status === "Critical" && "text-danger",
                          (event.status === "Warning" || event.status === "Normal") &&
                            "text-text-primary",
                          event.status === "System" && "text-text-muted",
                        )}
                      >
                        {event.displayScore}
                        <span className="text-text-muted"> / 100</span>
                      </span>
                    ) : (
                      <span className="text-text-ghost">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5 font-mono text-text-muted">
                    {event.displayThreshold ?? (
                      <span className="text-text-ghost">—</span>
                    )}
                  </td>
                  <td className="px-2 py-1.5">
                    {event.groundTruthLabel ? (
                      <GroundTruthBadge label={event.groundTruthLabel} />
                    ) : (
                      <span className="text-text-ghost">—</span>
                    )}
                  </td>
                  <td className="px-2 py-1.5">
                    {event.source ? (
                      <SourceBadge source={event.source} />
                    ) : (
                      <span className="text-text-ghost">—</span>
                    )}
                  </td>
                  <td className="max-w-[140px] truncate px-2 py-1.5 text-text-secondary">
                    {event.topSensor ?? <span className="text-text-ghost">—</span>}
                  </td>
                  <td className="px-2 py-1.5 pr-3 text-text-secondary">
                    {event.action ?? <span className="text-text-ghost">—</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </DashboardPanel>
  );
}
