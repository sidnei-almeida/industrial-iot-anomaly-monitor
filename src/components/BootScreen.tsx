"use client";

import { Check, Moon, Sun } from "lucide-react";

import { BrandMark } from "@/components/brand/brand-mark";
import {
  BOOT_STEP_DEFINITIONS,
  type ApiWakeupPhase,
  type BootStepId,
  type BootStepStatus,
} from "@/hooks/use-api-wakeup";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) {
    return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
  }
  return `${seconds}s`;
}

function BootMark() {
  return (
    <div
      className="flex size-9 items-center justify-center rounded-md border border-border bg-bg-card-subtle text-text-secondary"
      aria-hidden
    >
      <BrandMark className="size-5" strokeWidth={1.75} />
    </div>
  );
}

function StepIndicator({ status }: { status: BootStepStatus }) {
  if (status === "completed") {
    return (
      <span className="flex size-4 items-center justify-center rounded-full border border-green-border bg-green-subtle text-green">
        <Check className="size-2.5" strokeWidth={2.5} />
      </span>
    );
  }

  if (status === "active") {
    return (
      <span className="relative flex size-4 items-center justify-center">
        <span className="status-pulse absolute size-4 rounded-full border border-gold-border bg-gold-subtle" />
        <span className="relative size-1.5 rounded-full bg-gold" />
      </span>
    );
  }

  return <span className="size-4 rounded-full border border-border-secondary bg-bg-card" />;
}

export interface BootScreenProps {
  phase: ApiWakeupPhase;
  steps: Record<BootStepId, BootStepStatus>;
  statusMessage: string;
  retryCount: number;
  elapsedMs: number;
  showSlowMessage: boolean;
  inferenceOnline: boolean;
  healthCheckUrl: string;
  onRetry: () => void;
}

export function BootScreen({
  phase,
  steps,
  statusMessage,
  retryCount,
  elapsedMs,
  showSlowMessage,
  inferenceOnline,
  healthCheckUrl,
  onRetry,
}: BootScreenProps) {
  const { isLight, toggle } = useTheme();
  const exiting = phase === "online" || phase === "ready";

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-bg-page px-4 transition-premium",
        "animate-fade-in",
        exiting && "animate-fade-out pointer-events-none",
      )}
      role="status"
      aria-live="polite"
      aria-busy={!exiting}
    >
      <button
        type="button"
        aria-label={isLight ? "Switch to dark theme" : "Switch to light theme"}
        onClick={() => toggle()}
        className="absolute right-5 top-5 flex size-8 items-center justify-center rounded-md text-text-muted transition-premium hover:text-text-secondary"
      >
        {isLight ? <Moon className="size-4" strokeWidth={2} /> : <Sun className="size-4" strokeWidth={2} />}
      </button>

      <div
        className={cn(
          "w-full max-w-md rounded-xl border border-border bg-bg-card p-6 shadow-[var(--card-shadow)] transition-premium",
          "animate-slide-up",
        )}
      >
        <div className="mb-5 flex items-start gap-3">
          <BootMark />
          <div className="min-w-0 flex-1 pt-0.5">
            <h1 className="text-[15px] font-semibold tracking-tight text-text-primary">
              Real-Time Industrial Anomaly Monitor
            </h1>
            <p className="mt-1.5 text-[11px] leading-relaxed text-text-secondary">
              Waking up inference service and preparing SECOM replay environment.
            </p>
          </div>
        </div>

        <ol className="space-y-2.5 border-t border-border pt-4">
          {BOOT_STEP_DEFINITIONS.map((step, index) => {
            const status = steps[step.id];
            return (
              <li
                key={step.id}
                className={cn(
                  "flex items-center gap-3 text-[11px] transition-premium",
                  status === "pending" && "text-text-ghost",
                  status === "active" && "text-text-primary",
                  status === "completed" && "text-text-secondary",
                )}
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <StepIndicator status={status} />
                <span className="min-w-0 flex-1 leading-snug">{step.label}</span>
              </li>
            );
          })}
        </ol>

        <div className="mt-5 border-t border-border pt-4">
          <p
            className={cn(
              "font-mono text-[10px] tracking-wide transition-premium",
              inferenceOnline ? "text-green" : "text-text-muted",
            )}
          >
            {statusMessage}
            {!inferenceOnline && retryCount > 0 ? (
              <span className="text-text-ghost"> · attempt {retryCount}</span>
            ) : null}
          </p>

          <p className="mt-2 truncate font-mono text-[9px] text-text-ghost" title={healthCheckUrl}>
            {healthCheckUrl}
          </p>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] text-text-ghost">
            <span className="font-mono tabular-nums">Elapsed {formatElapsed(elapsedMs)}</span>
            <a
              href={healthCheckUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted underline-offset-2 transition-premium hover:text-text-secondary hover:underline"
            >
              Check API status
            </a>
          </div>

          {showSlowMessage && !inferenceOnline ? (
            <p className="mt-3 text-[11px] leading-relaxed text-text-secondary">
              The inference service is still waking up. This can take a moment on free hosting.
            </p>
          ) : null}

          {showSlowMessage && !inferenceOnline ? (
            <button
              type="button"
              onClick={onRetry}
              className="btn-stream-muted mt-3 rounded-md px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide transition-premium"
            >
              Retry now
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
