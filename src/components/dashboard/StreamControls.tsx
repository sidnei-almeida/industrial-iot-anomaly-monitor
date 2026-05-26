"use client";

import { AlertTriangle, Pause, Play, RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";
import type { StreamStatus } from "@/types/secom";

interface StreamControlsProps {
  streamStatus: StreamStatus;
  rowsLoaded: boolean;
  isProcessing: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onInject: () => void;
}

const btnBase =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-3 text-[12px] font-medium transition-colors disabled:pointer-events-none disabled:opacity-40";

export function StreamControls({
  streamStatus,
  rowsLoaded,
  isProcessing,
  onStart,
  onPause,
  onReset,
  onInject,
}: StreamControlsProps) {
  const running = streamStatus === "running";

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <button
        type="button"
        onClick={onStart}
        disabled={!rowsLoaded || running || isProcessing}
        className={cn(btnBase, "btn-stream-start")}
      >
        <Play className="size-3 fill-current" strokeWidth={0} />
        Start Stream
      </button>
      <button
        type="button"
        onClick={onPause}
        disabled={!running}
        className={cn(btnBase, "btn-stream-muted")}
      >
        <Pause className="size-3" />
        Pause
      </button>
      <button type="button" onClick={onReset} className={cn(btnBase, "btn-stream-muted")}>
        <RotateCcw className="size-3" />
        Reset
      </button>
      <button
        type="button"
        onClick={onInject}
        disabled={!rowsLoaded || isProcessing}
        className={cn(btnBase, "btn-stream-inject")}
      >
        <AlertTriangle className="size-3" />
        Inject Anomaly
      </button>
    </div>
  );
}
