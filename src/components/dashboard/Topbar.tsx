"use client";

import { Clock, Moon, Sun } from "lucide-react";

import { useTheme } from "@/hooks/use-theme";

import { StreamControls } from "@/components/dashboard/StreamControls";
import { formatHeaderTimestamp, shellLayout } from "@/lib/dashboard-layout";
import { cn } from "@/lib/utils";
import type { StreamStatus } from "@/types/secom";

const DASHBOARD_SUBTITLE =
  "Live monitoring and AI-driven anomaly detection for industrial sensor data";

interface TopbarProps {
  sectionTitle?: string;
  showLiveIndicator?: boolean;
  statusChips?: string[];
  subtitle?: string;
  streamStatus: StreamStatus;
  simulatedClock: Date;
  systemHealthy: boolean;
  rowsLoaded: boolean;
  isProcessing: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onInject: () => void;
}

function HealthBadge({ systemHealthy }: { systemHealthy: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] font-medium",
        systemHealthy ? "text-normal" : "text-accent-gold",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          systemHealthy ? "bg-normal" : "bg-accent-gold",
        )}
        aria-hidden
      />
      {systemHealthy ? "System Healthy" : "Elevated Risk"}
    </span>
  );
}

export function Topbar({
  sectionTitle = "Real-Time Industrial Anomaly Monitor",
  showLiveIndicator = true,
  statusChips,
  subtitle = DASHBOARD_SUBTITLE,
  streamStatus,
  simulatedClock,
  systemHealthy,
  rowsLoaded,
  isProcessing,
  onStart,
  onPause,
  onReset,
  onInject,
}: TopbarProps) {
  const { toggle, isLight } = useTheme();
  const formattedDate = formatHeaderTimestamp(simulatedClock);

  const controlsProps = {
    streamStatus,
    rowsLoaded,
    isProcessing,
    onStart,
    onPause,
    onReset,
    onInject,
  };

  return (
    <header
      className={cn(
        "fixed right-0 top-0 z-30 border-b border-border bg-bg-sidebar",
        shellLayout.topbarHeightClass,
        shellLayout.topbarLeft,
        "max-sm:min-h-[88px] max-sm:h-auto",
      )}
    >
      <div className="flex h-full items-center justify-between gap-6 px-5 sm:px-6">
        <div className="min-w-0 flex-1 py-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[20px] font-semibold leading-tight tracking-tight text-text-primary lg:text-[21px]">
              {sectionTitle}
            </h1>
            {showLiveIndicator ? (
              <span className="inline-flex items-center gap-1.5 text-normal">
                <span
                  className="live-pulse-dot size-1.5 rounded-full bg-normal"
                  aria-hidden
                />
                <span className="text-[10px] font-semibold uppercase tracking-wider">
                  Live
                </span>
              </span>
            ) : null}
          </div>
          {subtitle ? (
            <p className="mt-1 text-[12px] leading-snug text-text-secondary">{subtitle}</p>
          ) : null}
          {statusChips && statusChips.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-text-muted">
              {statusChips.map((chip, i) => (
                <span key={chip} className="inline-flex items-center gap-2">
                  {i > 0 ? <span aria-hidden>·</span> : null}
                  <span>{chip}</span>
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="hidden shrink-0 flex-col items-end gap-2 sm:flex">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 font-mono text-[12px] text-text-secondary">
              <Clock className="size-3.5 text-text-muted" strokeWidth={2} />
              <span className="whitespace-nowrap tabular-nums">{formattedDate}</span>
            </div>
            <HealthBadge systemHealthy={systemHealthy} />
            <button
              type="button"
              aria-label={isLight ? "Switch to dark theme" : "Switch to light theme"}
              onClick={() => toggle()}
              className="flex size-7 items-center justify-center rounded-md text-text-muted transition-colors hover:text-text-secondary"
            >
              {isLight ? (
                <Moon className="size-4" strokeWidth={2} />
              ) : (
                <Sun className="size-4" strokeWidth={2} />
              )}
            </button>
          </div>
          <StreamControls {...controlsProps} />
        </div>
      </div>

      <div className="flex flex-col gap-2 px-5 py-3 sm:hidden">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-mono text-[12px] text-text-secondary">
            <Clock className="size-3.5 text-text-muted" />
            <span className="tabular-nums">{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <HealthBadge systemHealthy={systemHealthy} />
            <button
              type="button"
              aria-label={isLight ? "Switch to dark theme" : "Switch to light theme"}
              onClick={() => toggle()}
              className="flex size-7 items-center justify-center rounded-md text-text-muted transition-colors hover:text-text-secondary"
            >
              {isLight ? (
                <Moon className="size-4" strokeWidth={2} />
              ) : (
                <Sun className="size-4" strokeWidth={2} />
              )}
            </button>
          </div>
        </div>
        <StreamControls {...controlsProps} />
      </div>
    </header>
  );
}
