"use client";

import {
  DATA_SOURCE_LABEL,
  getFooterInferenceLabel,
  STREAM_MODE_LABEL,
} from "@/lib/inference-mode";
import type { ApiStatus, ScoringSource, StreamStatus } from "@/types/secom";

interface DashboardFooterProps {
  streamStatus: StreamStatus;
  apiStatus: ApiStatus;
  packetCounter: number;
  scoringSource?: ScoringSource;
  apiModeEnabled: boolean;
}

export function DashboardFooter({
  streamStatus,
  apiStatus,
  packetCounter,
  scoringSource,
  apiModeEnabled,
}: DashboardFooterProps) {
  const operational =
    streamStatus !== "idle" || apiStatus === "online" || packetCounter > 0;

  const inferenceLabel = getFooterInferenceLabel(
    scoringSource,
    apiStatus,
    apiModeEnabled,
  );

  return (
    <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-1 py-3 text-[10px] text-text-muted">
      <div className="flex flex-wrap items-center gap-4">
        <span>
          Source:{" "}
          <span className="text-text-muted">{DATA_SOURCE_LABEL.replace(" Cleaned", "")}</span>
        </span>
        <span>
          Stream: <span className="text-text-muted">{STREAM_MODE_LABEL}</span>
        </span>
        <span>
          Inference: <span className="text-text-muted">{inferenceLabel}</span>
        </span>
        <span>
          Uptime:{" "}
          <span className="font-mono text-text-muted">
            {packetCounter > 0 ? `${packetCounter}s sim` : "—"}
          </span>
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-text-muted">© Real-Time Industrial Anomaly Monitor</span>
        <span className="flex items-center gap-1.5">
          <span
            className={`size-1.5 rounded-full ${operational ? "bg-accent-aqua" : "bg-text-muted"}`}
          />
          <span className={operational ? "text-accent-aqua" : "text-text-muted"}>
            {operational ? "System operational" : "Standby"}
          </span>
        </span>
      </div>
    </footer>
  );
}
