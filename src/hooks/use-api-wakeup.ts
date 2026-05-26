"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getSecomApiBaseUrl } from "@/lib/api-config";
import { DATASET_PATH } from "@/lib/constants";
import { pingApiHealth } from "@/lib/secom-api";

export const BOOT_POLL_INTERVAL_MS = 2500;
export const BOOT_FETCH_TIMEOUT_MS = 8000;
export const BOOT_SLOW_MESSAGE_MS = 20_000;
export const BOOT_ONLINE_HOLD_MS = 600;
export const BOOT_READY_DELAY_MS = 450;

export type BootStepId = "shell" | "dataset" | "api-wake" | "health" | "stream";
export type BootStepStatus = "pending" | "active" | "completed";

export const BOOT_STEP_DEFINITIONS: ReadonlyArray<{
  id: BootStepId;
  label: string;
}> = [
  { id: "shell", label: "Initializing dashboard shell" },
  { id: "dataset", label: "Loading SECOM dataset metadata" },
  { id: "api-wake", label: "Waking FastAPI inference service" },
  { id: "health", label: "Verifying model health endpoint" },
  { id: "stream", label: "Preparing real-time stream" },
];

export type ApiWakeupPhase = "booting" | "online" | "ready";

function initialStepMap(): Record<BootStepId, BootStepStatus> {
  return {
    shell: "pending",
    dataset: "pending",
    "api-wake": "pending",
    health: "pending",
    stream: "pending",
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function preloadDatasetMetadata(): Promise<void> {
  try {
    await fetch(DATASET_PATH, { method: "HEAD", cache: "force-cache" });
  } catch {
    /* static asset may still load during replay */
  }
}

export function useApiWakeup() {
  const [steps, setSteps] = useState(initialStepMap);
  const [phase, setPhase] = useState<ApiWakeupPhase>("booting");
  const [retryCount, setRetryCount] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Waiting for API response…");
  const [showSlowMessage, setShowSlowMessage] = useState(false);
  const [inferenceOnline, setInferenceOnline] = useState(false);

  const patchStep = useCallback((id: BootStepId, status: BootStepStatus) => {
    setSteps((prev) => ({ ...prev, [id]: status }));
  }, []);

  const pollNowRef = useRef<(() => void) | null>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(() => {
    const abort = new AbortController();
    let pollTimer: ReturnType<typeof setTimeout> | null = null;
    let apiReady = false;

    const clearPollTimer = () => {
      if (pollTimer !== null) {
        clearTimeout(pollTimer);
        pollTimer = null;
      }
    };

    const finishBoot = async () => {
      if (apiReady || abort.signal.aborted) return;
      apiReady = true;
      clearPollTimer();

      patchStep("api-wake", "completed");
      patchStep("health", "active");
      await delay(180);
      if (abort.signal.aborted) return;

      patchStep("health", "completed");
      patchStep("stream", "active");
      setInferenceOnline(true);
      setStatusMessage("Inference service online");

      await delay(BOOT_ONLINE_HOLD_MS);
      if (abort.signal.aborted) return;

      patchStep("stream", "completed");
      setPhase("online");

      await delay(BOOT_READY_DELAY_MS);
      if (abort.signal.aborted) return;

      setPhase("ready");
    };

    const pollHealth = async () => {
      if (abort.signal.aborted || apiReady) return;

      setRetryCount((count) => count + 1);
      const ok = await pingApiHealth(BOOT_FETCH_TIMEOUT_MS);

      if (abort.signal.aborted || apiReady) return;

      if (ok) {
        await finishBoot();
        return;
      }

      pollTimer = setTimeout(() => {
        void pollHealth();
      }, BOOT_POLL_INTERVAL_MS);
    };

    pollNowRef.current = () => {
      clearPollTimer();
      void pollHealth();
    };

    const runBootSequence = async () => {
      patchStep("shell", "active");
      await delay(120);
      if (abort.signal.aborted) return;
      patchStep("shell", "completed");

      patchStep("dataset", "active");
      setStatusMessage("Loading SECOM dataset metadata…");
      await Promise.all([preloadDatasetMetadata(), delay(500)]);
      if (abort.signal.aborted) return;
      patchStep("dataset", "completed");

      patchStep("api-wake", "active");
      setStatusMessage("Waiting for Hugging Face inference service…");
      void pollHealth();
    };

    void runBootSequence();

    const elapsedTimer = window.setInterval(() => {
      setElapsedMs((prev) => {
        const next = prev + 1000;
        if (next >= BOOT_SLOW_MESSAGE_MS) {
          setShowSlowMessage(true);
        }
        return next;
      });
    }, 1000);

    return () => {
      abort.abort();
      clearPollTimer();
      pollNowRef.current = null;
      window.clearInterval(elapsedTimer);
    };
  }, [patchStep]);

  const retryNow = useCallback(() => {
    if (phaseRef.current === "ready") return;
    setStatusMessage("Waiting for Hugging Face inference service…");
    pollNowRef.current?.();
  }, []);

  const ready = phase === "ready";
  const apiBaseUrl = getSecomApiBaseUrl();
  const healthCheckUrl = `${apiBaseUrl}/health`;

  return {
    ready,
    phase,
    steps,
    retryCount,
    elapsedMs,
    statusMessage,
    showSlowMessage,
    inferenceOnline,
    apiBaseUrl,
    healthCheckUrl,
    retryNow,
  };
}
