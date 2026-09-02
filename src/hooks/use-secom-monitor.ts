"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getEventLogForScore } from "@/lib/anomaly-scoring";
import { createSystemEvent, eventFromPacket, formatEventTime } from "@/lib/event-log";
import { SECOM_API_MODE_ENABLED } from "@/lib/inference-mode";
import { computeDatasetAnalytics } from "@/lib/secom-analytics";
import {
  DATASET_PATH,
  DISPLAY_THRESHOLD,
  EVENT_LOG_MAX_ENTRIES,
  REPLAY_START_ROW,
} from "@/lib/constants";
import { getFeatureAdapterStatus } from "@/lib/feature-adapter";
import { getFailureRowIndices, loadSecomDataset } from "@/lib/secom-data";
import { checkApiHealth } from "@/lib/secom-api";
import {
  buildStreamPacket,
  chartPointFromPacket,
  getNextRowIndex,
  pickFailureRow,
} from "@/lib/secom-stream";
import type {
  AlertRecord,
  ApiStatus,
  ChartPoint,
  DatasetAnalytics,
  DatasetMeta,
  EventLogEntry,
  SecomRow,
  StreamPacket,
  StreamStatus,
} from "@/types/secom";

const ALERT_HISTORY_MAX = 500;
const DEFAULT_STREAM_MS = 1000;
const DEFAULT_CHART_MAX = 60;
const AUTO_INJECT_EVERY_PACKETS = 15;

function formatLogTime(date: Date): string {
  return formatEventTime(date);
}

function alertFromPacket(
  packet: StreamPacket,
  message: string,
  level: AlertRecord["level"],
): AlertRecord {
  return {
    id: `${packet.packetId}-${Date.now()}`,
    timestamp: formatLogTime(new Date(packet.simulatedTimestamp)),
    packetId: packet.packetId,
    displayScore: packet.displayScore,
    processStatus: packet.processStatus,
    groundTruthLabel: packet.groundTruthLabel,
    source: packet.source,
    message,
    recommendedAction: packet.recommendedAction,
    level,
  };
}

export function useSecomMonitor() {
  const [meta, setMeta] = useState<DatasetMeta>({
    totalRows: 0,
    failureRows: 0,
    featureCount: 590,
    loaded: false,
  });
  const [analytics, setAnalytics] = useState<DatasetAnalytics | null>(null);
  const [datasetError, setDatasetError] = useState<string | null>(null);
  const [streamStatus, setStreamStatus] = useState<StreamStatus>("idle");
  const [apiStatus, setApiStatus] = useState<ApiStatus>(
    SECOM_API_MODE_ENABLED ? "checking" : "disabled",
  );
  const [useApi, setUseApi] = useState(SECOM_API_MODE_ENABLED);
  const [packetCounter, setPacketCounter] = useState(0);
  const [cursorIndex, setCursorIndex] = useState(REPLAY_START_ROW);
  const [currentPacket, setCurrentPacket] = useState<StreamPacket | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [events, setEvents] = useState<EventLogEntry[]>([]);
  const [alertHistory, setAlertHistory] = useState<AlertRecord[]>([]);
  const [simulatedClock, setSimulatedClock] = useState<Date>(new Date());
  const [isProcessing, setIsProcessing] = useState(false);
  const [streamIntervalMs, setStreamIntervalMs] = useState(DEFAULT_STREAM_MS);
  const [chartMaxPoints, setChartMaxPoints] = useState(DEFAULT_CHART_MAX);
  const [featureAdapter, setFeatureAdapter] = useState(() =>
    getFeatureAdapterStatus([]),
  );
  const [failureSampleCount, setFailureSampleCount] = useState(0);
  const [loopDataset, setLoopDataset] = useState(false);
  const [autoInjectEnabled, setAutoInjectEnabled] = useState(false);
  const [lastInjectedPacketId, setLastInjectedPacketId] = useState<number | null>(null);
  const [lastResetAt, setLastResetAt] = useState<Date | null>(null);

  const rowsRef = useRef<SecomRow[]>([]);
  const failureIndicesRef = useRef<number[]>([]);
  const cursorRef = useRef(REPLAY_START_ROW);
  const packetCounterRef = useRef(0);
  const streamStatusRef = useRef<StreamStatus>("idle");
  const apiStatusRef = useRef<ApiStatus>(SECOM_API_MODE_ENABLED ? "checking" : "disabled");
  const useApiRef = useRef(SECOM_API_MODE_ENABLED);
  const processingRef = useRef(false);
  const simulatedClockRef = useRef(new Date());
  const injectPendingRef = useRef<SecomRow | null>(null);
  const streamIntervalRef = useRef(DEFAULT_STREAM_MS);
  const chartMaxPointsRef = useRef(DEFAULT_CHART_MAX);
  const loopDatasetRef = useRef(false);
  const autoInjectRef = useRef(false);
  const packetsSinceInjectRef = useRef(0);
  const autoStartedRef = useRef(false);
  const pausedByVisibilityRef = useRef(false);

  const pushEvent = useCallback(
    (message: string, level: EventLogEntry["level"] = "info", packetId?: number) => {
      setEvents((prev) =>
        [createSystemEvent(message, level, packetId), ...prev].slice(0, EVENT_LOG_MAX_ENTRIES),
      );
    },
    [],
  );

  const refreshApiStatus = useCallback(async () => {
    if (!SECOM_API_MODE_ENABLED) {
      setApiStatus("disabled");
      apiStatusRef.current = "disabled";
      return false;
    }

    setApiStatus("checking");
    apiStatusRef.current = "checking";
    const healthy = await checkApiHealth();
    const next: ApiStatus = healthy ? "online" : "offline";
    setApiStatus(next);
    apiStatusRef.current = next;
    if (!healthy) {
      pushEvent("Inference route unavailable — switched to local scoring", "system");
    } else {
      pushEvent("Autoencoder API connected", "system");
    }
    return healthy;
  }, [pushEvent]);

  useEffect(() => {
    streamIntervalRef.current = streamIntervalMs;
  }, [streamIntervalMs]);

  useEffect(() => {
    chartMaxPointsRef.current = chartMaxPoints;
  }, [chartMaxPoints]);

  useEffect(() => {
    loopDatasetRef.current = loopDataset;
  }, [loopDataset]);

  useEffect(() => {
    autoInjectRef.current = autoInjectEnabled;
  }, [autoInjectEnabled]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const { rows: loadedRows, meta: loadedMeta } = await loadSecomDataset(DATASET_PATH);
        if (cancelled) return;
        setMeta(loadedMeta);
        rowsRef.current = loadedRows;
        const failureIndices = getFailureRowIndices(loadedRows);
        failureIndicesRef.current = failureIndices;
        setFailureSampleCount(failureIndices.length);
        setFeatureAdapter(
          getFeatureAdapterStatus(loadedRows[0]?.features ?? []),
        );
        setAnalytics(computeDatasetAnalytics(loadedRows));
        setDatasetError(null);
        pushEvent(
          `Dataset loaded — ${loadedMeta.totalRows.toLocaleString()} rows, ${loadedMeta.failureRows} failure samples`,
          "system",
        );
        pushEvent("Dataset replay mode active", "system");
        pushEvent("Local scoring mode active", "system");
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Dataset load failed";
        setDatasetError(message);
        pushEvent(`Dataset load failed: ${message}`, "critical");
      }

      if (SECOM_API_MODE_ENABLED) {
        await refreshApiStatus();
      } else {
        setApiStatus("disabled");
        apiStatusRef.current = "disabled";
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [pushEvent, refreshApiStatus]);

  const processRow = useCallback(
    async (row: SecomRow, options?: { injected?: boolean }) => {
      if (processingRef.current) return;
      processingRef.current = true;
      setIsProcessing(true);

      try {
        const nextPacketId = packetCounterRef.current + 1;
        packetCounterRef.current = nextPacketId;
        simulatedClockRef.current = new Date(
          simulatedClockRef.current.getTime() + streamIntervalRef.current,
        );

        const packet = await buildStreamPacket({
          row,
          packetId: nextPacketId,
          simulatedTimestamp: simulatedClockRef.current,
          apiStatus: apiStatusRef.current,
          useApi: useApiRef.current,
          apiModeEnabled: SECOM_API_MODE_ENABLED,
          injected: options?.injected ?? false,
        });

        setPacketCounter(nextPacketId);
        setCurrentPacket(packet);
        setSimulatedClock(simulatedClockRef.current);

        const chartPoint = chartPointFromPacket(
          packet,
          formatLogTime(simulatedClockRef.current),
        );

        setChartData((prev) =>
          [...prev, chartPoint].slice(-chartMaxPointsRef.current),
        );

        const { message, level } = getEventLogForScore(
          packet.packetId,
          packet.displayScore,
          options?.injected ?? false,
        );
        const logEntry = eventFromPacket(packet, message, level);
        setEvents((prev) => [logEntry, ...prev].slice(0, EVENT_LOG_MAX_ENTRIES));
        setAlertHistory((prev) =>
          [alertFromPacket(packet, message, level), ...prev].slice(0, ALERT_HISTORY_MAX),
        );

        if (options?.injected) {
          setLastInjectedPacketId(nextPacketId);
        }
      } finally {
        processingRef.current = false;
        setIsProcessing(false);
      }
    },
    [pushEvent],
  );

  const tick = useCallback(async () => {
    if (streamStatusRef.current !== "running") return;
    if (!rowsRef.current.length) return;

    const injected = injectPendingRef.current;
    if (injected) {
      injectPendingRef.current = null;
      await processRow(injected, { injected: true });
      return;
    }

    if (autoInjectRef.current) {
      packetsSinceInjectRef.current += 1;
      if (packetsSinceInjectRef.current >= AUTO_INJECT_EVERY_PACKETS) {
        packetsSinceInjectRef.current = 0;
        const failureRow = pickFailureRow(rowsRef.current, failureIndicesRef.current);
        if (failureRow) {
          await processRow(failureRow, { injected: true });
          return;
        }
      }
    }

    const index = cursorRef.current;
    const row = rowsRef.current[index];
    if (!row) return;

    await processRow(row);

    const nextIndex = getNextRowIndex(index, rowsRef.current.length, loopDatasetRef.current);
    if (nextIndex === null) {
      setStreamStatus("paused");
      streamStatusRef.current = "paused";
      pushEvent("End of dataset reached — stream paused", "system");
      return;
    }
    if (nextIndex === 0 && index + 1 >= rowsRef.current.length && loopDatasetRef.current) {
      pushEvent("Dataset loop — replay restarted from row 0", "system");
    }
    cursorRef.current = nextIndex;
    setCursorIndex(nextIndex);
  }, [processRow, pushEvent]);

  useEffect(() => {
    if (streamStatus !== "running") return undefined;
    const id = window.setInterval(() => {
      void tick();
    }, streamIntervalMs);
    return () => window.clearInterval(id);
  }, [streamStatus, streamIntervalMs, tick]);

  const startStream = useCallback(() => {
    if (!rowsRef.current.length) {
      pushEvent("Cannot start — dataset not loaded", "warning");
      return;
    }
    setStreamStatus("running");
    streamStatusRef.current = "running";
    pausedByVisibilityRef.current = false;
    const hz = (1000 / streamIntervalRef.current).toFixed(1);
    pushEvent(`Stream started — replaying SECOM samples at ${hz} Hz`, "system");
    void tick();
  }, [pushEvent, tick]);

  const pauseStream = useCallback(() => {
    setStreamStatus("paused");
    streamStatusRef.current = "paused";
    pausedByVisibilityRef.current = false;
    pushEvent("Stream paused", "system");
  }, [pushEvent]);

  const resetStream = useCallback(() => {
    setStreamStatus("idle");
    streamStatusRef.current = "idle";
    pausedByVisibilityRef.current = false;
    cursorRef.current = REPLAY_START_ROW;
    packetCounterRef.current = 0;
    injectPendingRef.current = null;
    simulatedClockRef.current = new Date();
    setCursorIndex(REPLAY_START_ROW);
    setPacketCounter(0);
    setCurrentPacket(null);
    setChartData([]);
    setSimulatedClock(new Date());
    packetsSinceInjectRef.current = 0;
    setLastResetAt(new Date());
    setLastInjectedPacketId(null);
    pushEvent(`Simulation reset — cursor returned to row ${REPLAY_START_ROW}`, "system");
  }, [pushEvent]);

  /**
   * The dashboard presents itself as a live monitoring console, so it starts
   * streaming as soon as the dataset is ready rather than opening on an empty
   * chart. Only once: a reset returns control to the operator.
   */
  useEffect(() => {
    if (autoStartedRef.current) return;
    if (!meta.loaded) return;
    if (streamStatusRef.current !== "idle") return;
    autoStartedRef.current = true;
    startStream();
  }, [meta.loaded, startStream]);

  /**
   * Pause while the tab is in the background — nobody is watching, and every
   * tick is an inference request. Resume only if we were the ones who paused,
   * so returning to the tab never overrides an explicit pause.
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (streamStatusRef.current === "running") {
          pausedByVisibilityRef.current = true;
          setStreamStatus("paused");
          streamStatusRef.current = "paused";
        }
        return;
      }

      if (pausedByVisibilityRef.current && streamStatusRef.current === "paused") {
        pausedByVisibilityRef.current = false;
        setStreamStatus("running");
        streamStatusRef.current = "running";
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const injectAnomaly = useCallback(() => {
    const failureRow = pickFailureRow(rowsRef.current, failureIndicesRef.current);
    if (!failureRow) {
      pushEvent("No failure rows available in dataset", "warning");
      return;
    }
    injectPendingRef.current = failureRow;
    if (streamStatusRef.current === "running") {
      void tick();
    } else {
      void processRow(failureRow, { injected: true });
    }
  }, [processRow, tick]);

  return {
    meta,
    analytics,
    datasetError,
    streamStatus,
    apiStatus,
    useApi,
    setUseApi: (value: boolean) => {
      useApiRef.current = value;
      setUseApi(value);
    },
    packetCounter,
    cursorIndex,
    currentPacket,
    chartData,
    events,
    alertHistory,
    simulatedClock,
    isProcessing,
    displayThreshold: DISPLAY_THRESHOLD,
    streamIntervalMs,
    setStreamIntervalMs,
    chartMaxPoints,
    setChartMaxPoints,
    featureAdapter,
    failureSampleCount,
    startStream,
    pauseStream,
    resetStream,
    injectAnomaly,
    refreshApiStatus,
    rowsLoaded: meta.loaded,
    apiModeEnabled: SECOM_API_MODE_ENABLED,
    loopDataset,
    setLoopDataset,
    autoInjectEnabled,
    setAutoInjectEnabled,
    lastInjectedPacketId,
    lastResetAt,
  };
}

export type SecomMonitor = ReturnType<typeof useSecomMonitor>;
