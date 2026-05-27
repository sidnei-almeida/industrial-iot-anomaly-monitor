"use client";

import type { ReactNode } from "react";
import { AlertTriangle, ChevronRight, RotateCcw } from "lucide-react";

import { DashboardPanel, PanelHeader } from "@/components/dashboard/DashboardPanel";
import { Button } from "@/components/ui/button";
import type { SecomMonitor } from "@/hooks/use-secom-monitor";
import {
  DEFAULT_API_THRESHOLD,
  DISPLAY_THRESHOLD,
  WARNING_THRESHOLD,
} from "@/lib/constants";
import { formatEventTime } from "@/lib/event-log";
import {
  DATA_SOURCE_LABEL,
  getFooterInferenceLabel,
  STREAM_MODE_LABEL,
} from "@/lib/inference-mode";
import { getApiIntegrationLabel } from "@/lib/model-analytics";
import { cn } from "@/lib/utils";
import type { StreamStatus } from "@/types/secom";

interface SettingsSectionProps {
  monitor: SecomMonitor;
}

const STREAM_SPEEDS = [
  { label: "0.5s", ms: 500 },
  { label: "1s", ms: 1000 },
  { label: "2s", ms: 2000 },
] as const;

const CHART_WINDOWS = [30, 60, 120] as const;

const SUMMARY_PIPELINE = [
  "SECOM Cleaned Dataset",
  "Dataset Replay Stream",
  "Local Scoring",
  "Threshold Engine",
  "Dashboard Alert",
] as const;

function streamStatusLabel(status: StreamStatus): string {
  if (status === "running") return "Running";
  if (status === "paused") return "Paused";
  return "Standby";
}

function InfoRow({
  label,
  value,
  mono,
  valueClassName,
}: {
  label: string;
  value: string;
  mono?: boolean;
  valueClassName?: string;
}) {
  return (
    <div className="spec-row flex items-center justify-between gap-3 py-2 text-[11px]">
      <span className="text-text-muted">{label}</span>
      <span
        className={cn(
          "text-right font-medium text-text-primary",
          mono && "font-mono text-[10px]",
          valueClassName,
        )}
      >
        {value}
      </span>
    </div>
  );
}

function StatusBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "ok" | "warn" | "sky" | "off";
}) {
  const toneClass = {
    neutral: "bg-[var(--border-subtle)] text-text-secondary",
    ok: "badge-status-normal border-0",
    warn: "badge-status-warning border-0",
    sky: "badge-status-normal border-0",
    off: "bg-[var(--border-subtle)] text-text-muted",
  }[tone];

  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
        toneClass,
      )}
    >
      {label}
    </span>
  );
}

function PillGroup<T extends string | number | boolean>({
  options,
  value,
  onChange,
  formatLabel,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  formatLabel?: (v: T) => string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={String(opt)}
          aria-pressed={value === opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
            value === opt
              ? "bg-green-subtle text-normal"
              : "bg-[var(--border-subtle)] text-text-muted hover:bg-bg-card-hover hover:text-text-secondary",
          )}
        >
          {formatLabel ? formatLabel(opt) : String(opt)}
        </button>
      ))}
    </div>
  );
}

function ControlBlock({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="py-2">
      <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wide text-text-muted">
        {label}
      </p>
      {children}
    </div>
  );
}

export function SettingsSection({ monitor }: SettingsSectionProps) {
  const inferenceMode = getFooterInferenceLabel(
    monitor.currentPacket?.source,
    monitor.apiStatus,
    monitor.apiModeEnabled,
  );

  const apiLabel = getApiIntegrationLabel(monitor.apiModeEnabled, monitor.apiStatus);
  const apiTone = monitor.apiModeEnabled
    ? monitor.apiStatus === "online"
      ? "ok"
      : "sky"
    : "off";

  const streamTone =
    monitor.streamStatus === "running"
      ? "ok"
      : monitor.streamStatus === "paused"
        ? "warn"
        : "neutral";

  const speedLabel =
    STREAM_SPEEDS.find((s) => s.ms === monitor.streamIntervalMs)?.label ??
    `${monitor.streamIntervalMs}ms`;

  const lastResetDisplay = monitor.lastResetAt
    ? formatEventTime(monitor.lastResetAt)
    : "—";

  return (
    <div className="flex flex-col gap-2 pb-1">
      <div className="grid grid-cols-12 items-stretch gap-2">
        {/* Card 1 — Stream Replay */}
        <DashboardPanel className="col-span-3 flex flex-col">
          <PanelHeader title="Stream Replay" subtitle="Dataset cursor & timing" />
          <div className="flex flex-1 flex-col p-3 pt-1">
            <ControlBlock label="Stream speed">
              <PillGroup
                options={STREAM_SPEEDS.map((s) => s.ms)}
                value={monitor.streamIntervalMs}
                onChange={(ms) => monitor.setStreamIntervalMs(ms)}
                formatLabel={(ms) =>
                  STREAM_SPEEDS.find((s) => s.ms === ms)?.label ?? `${ms}ms`
                }
              />
            </ControlBlock>
            <ControlBlock label="Chart window">
              <PillGroup
                options={CHART_WINDOWS}
                value={monitor.chartMaxPoints}
                onChange={(n) => monitor.setChartMaxPoints(n)}
                formatLabel={(n) => `Last ${n}`}
              />
            </ControlBlock>
            <ControlBlock label="Replay behavior">
              <PillGroup
                options={[false, true] as const}
                value={monitor.loopDataset}
                onChange={(loop) => monitor.setLoopDataset(loop)}
                formatLabel={(loop) => (loop ? "Loop dataset" : "Stop at end")}
              />
            </ControlBlock>
            <div className="mt-auto border-t border-border pt-2">
              <InfoRow
                label="Current packet index"
                value={monitor.rowsLoaded ? String(monitor.cursorIndex) : "—"}
                mono
              />
              <InfoRow
                label="Dataset rows loaded"
                value={
                  monitor.meta.loaded ? monitor.meta.totalRows.toLocaleString() : "—"
                }
                mono
              />
            </div>
          </div>
        </DashboardPanel>

        {/* Card 2 — Scoring & Thresholds */}
        <DashboardPanel className="col-span-3 flex flex-col">
          <PanelHeader title="Scoring & Thresholds" subtitle="Risk engine parameters" />
          <div className="flex flex-1 flex-col p-3 pt-0">
            <div className="mb-2 flex flex-wrap gap-1.5">
              <StatusBadge label={inferenceMode} tone="ok" />
              <StatusBadge label={apiLabel} tone={apiTone} />
            </div>
            <InfoRow label="Inference mode" value={inferenceMode} />
            <InfoRow
              label="Display threshold"
              value={`${DISPLAY_THRESHOLD} / 100`}
              mono
            />
            <InfoRow
              label="Warning range"
              value={`${WARNING_THRESHOLD}–${DISPLAY_THRESHOLD - 1}`}
              mono
            />
            <InfoRow label="Critical range" value={`${DISPLAY_THRESHOLD}+`} mono />
            <InfoRow
              label="Raw API threshold"
              value={String(DEFAULT_API_THRESHOLD)}
              mono
            />
            {monitor.apiModeEnabled ? (
              <ControlBlock label="API preference">
                <PillGroup
                  options={[true, false] as const}
                  value={monitor.useApi}
                  onChange={(v) => monitor.setUseApi(v)}
                  formatLabel={(v) => (v ? "API first" : "Local scoring")}
                />
              </ControlBlock>
            ) : (
              <p className="mt-2 text-[10px] leading-snug text-text-muted">
                API scoring is disabled. Enable{" "}
                <span className="font-mono text-text-muted">NEXT_PUBLIC_USE_SECOM_API</span>{" "}
                for optional FastAPI inference.
              </p>
            )}
          </div>
        </DashboardPanel>

        {/* Card 3 — Anomaly Injection */}
        <DashboardPanel className="col-span-3 flex flex-col">
          <PanelHeader title="Anomaly Injection" subtitle="Known failure samples" />
          <div className="flex flex-1 flex-col p-3 pt-0">
            <Button
              type="button"
              onClick={monitor.injectAnomaly}
              disabled={!monitor.rowsLoaded || monitor.isProcessing}
              className="mb-3 h-9 w-full gap-2 border border-red-border bg-red-subtle text-danger hover:bg-red-subtle"
            >
              <AlertTriangle className="size-3.5" />
              Inject known failure sample
            </Button>
            <ControlBlock label="Auto-inject anomaly">
              <PillGroup
                options={[false, true] as const}
                value={monitor.autoInjectEnabled}
                onChange={(v) => monitor.setAutoInjectEnabled(v)}
                formatLabel={(v) => (v ? "On" : "Off")}
              />
              <p className="mt-1.5 text-[9px] text-text-muted">
                When on, injects a failure row every 15 packets while the stream runs.
              </p>
            </ControlBlock>
            <div className="mt-auto border-t border-border pt-2">
              <InfoRow
                label="Failure samples available"
                value={monitor.failureSampleCount.toLocaleString()}
                mono
              />
              <InfoRow
                label="Last injected packet"
                value={
                  monitor.lastInjectedPacketId != null
                    ? `#${monitor.lastInjectedPacketId}`
                    : "—"
                }
                mono
              />
              <InfoRow label="Injection strategy" value="Pass/Fail = 1 rows" mono />
            </div>
            <p className="mt-2 text-[10px] leading-snug text-text-muted">
              Uses real labeled failure rows from the cleaned SECOM dataset — not synthetic
              noise.
            </p>
          </div>
        </DashboardPanel>

        {/* Card 4 — Runtime Status */}
        <DashboardPanel className="col-span-3 flex flex-col">
          <PanelHeader title="Runtime Status" subtitle="Live session state" />
          <div className="flex flex-1 flex-col p-3 pt-0">
            <div className="mb-2 flex flex-wrap gap-1.5">
              <StatusBadge label={streamStatusLabel(monitor.streamStatus)} tone={streamTone} />
              <StatusBadge label={apiLabel} tone={apiTone} />
            </div>
            <InfoRow label="Data source" value={DATA_SOURCE_LABEL} />
            <InfoRow label="Stream mode" value={STREAM_MODE_LABEL} />
            <InfoRow
              label="System status"
              value={streamStatusLabel(monitor.streamStatus)}
            />
            <InfoRow label="API status" value={apiLabel} />
            <InfoRow
              label="Uptime"
              value={monitor.packetCounter > 0 ? `${monitor.packetCounter} packets` : "—"}
              mono
            />
            <InfoRow label="Last reset" value={lastResetDisplay} mono />
            <Button
              type="button"
              variant="outline"
              onClick={monitor.resetStream}
              className="mt-auto gap-2 border-border bg-[var(--border-subtle)] text-text-secondary hover:text-text-primary"
            >
              <RotateCcw className="size-3.5" />
              Reset simulation
            </Button>
          </div>
        </DashboardPanel>
      </div>

      {/* Card 5 — Configuration Summary */}
      <DashboardPanel className="col-span-12">
        <PanelHeader
          title="Configuration Summary"
          subtitle="Active pipeline & session config"
        />
        <div className="p-3">
          <div className="flex flex-wrap items-center gap-1 overflow-x-auto pb-3 [scrollbar-width:thin]">
            {SUMMARY_PIPELINE.map((step, index) => (
              <div key={step} className="flex items-center">
                <span className="whitespace-nowrap text-[10px] font-medium text-text-secondary">
                  {step}
                </span>
                {index < SUMMARY_PIPELINE.length - 1 ? (
                  <ChevronRight className="mx-1 size-3 text-text-ghost" aria-hidden />
                ) : null}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-5 gap-2 border-t border-border pt-3">
            {[
              { label: "Speed", value: speedLabel },
              { label: "Chart window", value: `Last ${monitor.chartMaxPoints}` },
              { label: "Threshold", value: `${DISPLAY_THRESHOLD} / 100` },
              { label: "Mode", value: inferenceMode },
              {
                label: "Auto-inject",
                value: monitor.autoInjectEnabled ? "On" : "Off",
              },
              {
                label: "Replay",
                value: monitor.loopDataset ? "Loop" : "Stop at end",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-md border border-border bg-bg-card-subtle px-2.5 py-2"
              >
                <p className="text-[8px] font-semibold uppercase tracking-wide text-text-muted">
                  {item.label}
                </p>
                <p className="mt-0.5 text-[11px] font-medium text-text-secondary">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </DashboardPanel>
    </div>
  );
}
