"use client";

import type { ReactNode } from "react";

import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import {
  DATA_SOURCE_LABEL,
  getInferenceModeLabel,
  getSourceBadgeClassName,
  STREAM_MODE_LABEL,
} from "@/lib/inference-mode";
import { cn } from "@/lib/utils";
import type { ProcessStatus, StreamPacket } from "@/types/secom";

interface ModelOutputProps {
  className?: string;
  packet: StreamPacket | null;
}

const ZONE_CLASS = "flex min-h-0 flex-col overflow-hidden";
const TINY_LABEL = "text-[0.6rem] font-medium uppercase tracking-wide text-text-secondary";
const HERO_LABEL = "text-[0.6rem] font-medium uppercase tracking-[0.12em] text-text-secondary";
const METRIC_LABEL = "truncate text-[0.6rem] font-medium uppercase leading-tight text-text-secondary";
const METRIC_VALUE = "truncate text-[0.8rem] font-medium leading-tight text-text-primary";

function statusPillLabel(packet: StreamPacket): string {
  if (packet.processStatus === "Critical") return "ANOMALY";
  if (packet.processStatus === "Warning") return "WARNING";
  return "NORMAL";
}

function statusPillClass(status: ProcessStatus): string {
  if (status === "Critical") return "badge-status-anomaly";
  if (status === "Warning") return "badge-status-warning";
  return "badge-status-normal";
}

function actionTitle(status: ProcessStatus): string {
  if (status === "Critical") return "Immediate review required";
  if (status === "Warning") return "Elevated monitoring";
  return "Routine monitoring";
}

function priorityForStatus(status: ProcessStatus): string {
  if (status === "Critical") return "High";
  if (status === "Warning") return "Medium";
  return "Low";
}

function nextStepForStatus(status: ProcessStatus): string {
  if (status === "Critical") return "Review affected process sensors";
  if (status === "Warning") return "Monitor high-variance sensors";
  return "Continue monitoring";
}

function MetricCell({ label, children, title }: { label: string; children: ReactNode; title?: string }) {
  return (
    <div className="min-h-0 min-w-0">
      <p className={METRIC_LABEL}>{label}</p>
      <div className={METRIC_VALUE} title={title}>
        {children}
      </div>
    </div>
  );
}

export function ModelOutput({ className, packet }: ModelOutputProps) {
  const isAnomaly = packet?.processStatus === "Critical";
  const isWarning = packet?.processStatus === "Warning";

  return (
    <DashboardPanel
      className={cn("flex h-full min-h-0 flex-col overflow-hidden", className)}
      emphasis={isAnomaly ? "critical" : isWarning ? "warning" : "none"}
      overflowBehavior="clip"
    >
      <header className="shrink-0 px-4 pt-3 pb-1">
        <h2 className="text-[12px] font-semibold tracking-tight text-text-primary">
          Model Inference Output
        </h2>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-3">
        {!packet ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-[0.75rem] text-text-muted">Awaiting inference…</p>
          </div>
        ) : (
          <>
            {/* Zone 1 — Status + scores (~30%) */}
            <section className={cn(ZONE_CLASS, "flex-[3] gap-1.5 pb-1")}>
              <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                <span
                  className={cn(
                    "rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                    statusPillClass(packet.processStatus),
                  )}
                >
                  {statusPillLabel(packet)}
                </span>
                <span
                  className={cn(
                    "rounded px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
                    getSourceBadgeClassName(packet.source),
                  )}
                >
                  {getInferenceModeLabel(packet.source)}
                </span>
              </div>

              <div className="flex min-h-0 flex-1 items-stretch">
                <div className="score-block flex min-w-0 flex-1 flex-col justify-center">
                  <p className={HERO_LABEL}>Display score</p>
                  <p className="mt-0.5 flex items-baseline justify-center gap-0.5 font-mono leading-none tabular-nums">
                    <span className="text-[2rem] font-semibold text-accent-gold">
                      {packet.displayScore}
                    </span>
                    <span className="text-[0.85rem] font-medium text-text-muted">/ 100</span>
                  </p>
                </div>

                <div
                  className="w-px shrink-0 self-stretch bg-border"
                  aria-hidden
                />

                <div className="score-block flex min-w-0 flex-1 flex-col justify-center">
                  <p className={HERO_LABEL}>Confidence</p>
                  <p className="mt-0.5 font-mono text-[2rem] font-semibold leading-none text-accent-gold tabular-nums">
                    {(packet.confidence * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </section>

            {/* Zone 2 — Model metrics (~40%) */}
            <section className={cn(ZONE_CLASS, "flex-[4] gap-1 border-t border-border/60 pt-1.5")}>
              <p className={cn(TINY_LABEL, "shrink-0")}>Model metrics</p>
              <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-4 gap-2 content-start">
                <MetricCell label="Raw recon. error">
                  <span className="font-mono">{packet.reconstructionError.toFixed(4)}</span>
                </MetricCell>
                <MetricCell label="Threshold">
                  <span className="font-mono">
                    {packet.apiThresholdRaw.toFixed(2)}
                    <span className="text-text-muted"> / {packet.displayThreshold}</span>
                  </span>
                </MetricCell>
                <MetricCell label="Ground truth">
                  <span
                    className={cn(
                      packet.groundTruthLabel === "Failure" ? "text-danger" : "text-normal",
                    )}
                  >
                    {packet.groundTruthLabel}
                  </span>
                </MetricCell>
                <MetricCell label="Process status">
                  <span
                    className={cn(
                      isAnomaly && "text-danger",
                      isWarning && "text-warning",
                      packet.processStatus === "Normal" && "text-normal",
                    )}
                  >
                    {packet.processStatus}
                  </span>
                </MetricCell>
                <MetricCell label="Top sensor" title={packet.topContributingSensor}>
                  <span className={cn(isAnomaly && "text-danger")}>
                    {packet.topContributingSensor}
                  </span>
                </MetricCell>
                <MetricCell label="Updated">
                  <span className="font-mono">
                    {new Date(packet.simulatedTimestamp).toLocaleTimeString("en-US", {
                      hour12: true,
                    })}
                  </span>
                </MetricCell>
                <MetricCell label="Last prediction">
                  <span
                    className={cn(
                      "uppercase",
                      isAnomaly && "text-danger",
                      isWarning && "text-warning",
                      packet.processStatus === "Normal" && "text-normal",
                    )}
                  >
                    {packet.prediction}
                  </span>
                </MetricCell>
                <MetricCell label="Latency">
                  <span className="font-mono text-text-secondary">
                    {packet.apiLatencyMs != null ? `${packet.apiLatencyMs} ms` : "—"}
                  </span>
                </MetricCell>
              </div>
            </section>

            {/* Zone 3 — Action + footer (~30%) */}
            <section
              className={cn(
                ZONE_CLASS,
                "flex-[3] justify-between gap-1 border-t border-border/60 pt-1.5",
              )}
            >
              <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                <p className={cn(TINY_LABEL, "shrink-0")}>Recommended action</p>
                <p className="mt-0.5 shrink-0 text-[0.9rem] font-semibold leading-tight text-text-primary">
                  {actionTitle(packet.processStatus)}
                </p>
                <p className="mt-0.5 line-clamp-2 text-[0.75rem] leading-snug text-text-secondary">
                  {packet.recommendedAction}
                </p>

                <div className="mt-auto flex shrink-0 items-end justify-between gap-2 pt-1">
                  <div className="min-w-0">
                    <p className={TINY_LABEL}>Priority</p>
                    <p className="mt-0.5 text-[0.75rem] font-medium text-text-primary">
                      {priorityForStatus(packet.processStatus)}
                    </p>
                  </div>
                  <div className="min-w-0 max-w-[58%] text-right">
                    <p className={TINY_LABEL}>Next step</p>
                    <p
                      className="mt-0.5 line-clamp-2 text-[0.75rem] leading-snug text-text-primary"
                      title={nextStepForStatus(packet.processStatus)}
                    >
                      {nextStepForStatus(packet.processStatus)}
                    </p>
                  </div>
                </div>
              </div>

              <footer className="shrink-0 truncate text-[0.6rem] leading-tight text-text-muted">
                Data Source: {DATA_SOURCE_LABEL} · Stream Mode: {STREAM_MODE_LABEL} · Inference
                Mode: {getInferenceModeLabel(packet.source)} · Packet #{packet.packetId}
              </footer>
            </section>
          </>
        )}
      </div>
    </DashboardPanel>
  );
}
