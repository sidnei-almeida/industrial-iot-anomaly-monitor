import { adaptFeaturesForModel } from "@/lib/feature-adapter";
import {
  buildVisibleSensors,
  findTopContributingSensor,
  getRecommendedAction,
  scoreFallbackPacket,
  scoreFromApiReconstruction,
  type ScoreResult,
} from "@/lib/anomaly-scoring";
import { predictWithApi } from "@/lib/secom-api";
import { DEFAULT_API_THRESHOLD, WARNING_THRESHOLD } from "@/lib/constants";
import { SECOM_API_MODE_ENABLED } from "@/lib/inference-mode";
import type { ApiStatus, ChartPoint, ScoringSource, SecomRow, StreamPacket } from "@/types/secom";

export async function buildStreamPacket(params: {
  row: SecomRow;
  packetId: number;
  simulatedTimestamp: Date;
  apiStatus: ApiStatus;
  useApi: boolean;
  apiModeEnabled?: boolean;
  apiThreshold?: number;
  injected?: boolean;
}): Promise<StreamPacket> {
  const {
    row,
    packetId,
    simulatedTimestamp,
    apiStatus,
    useApi,
    apiModeEnabled = SECOM_API_MODE_ENABLED,
    apiThreshold = DEFAULT_API_THRESHOLD,
    injected = false,
  } = params;

  const adaptedFeatures = adaptFeaturesForModel(row.features);
  const visibleSensors = buildVisibleSensors(row.features);

  let source: ScoringSource = "local";
  let apiLatencyMs: number | null = null;

  let scored: ScoreResult = scoreFallbackPacket(row.passFail);

  const canUseApi = apiModeEnabled && useApi && apiStatus === "online";

  if (canUseApi) {
    try {
      const apiResult = await predictWithApi(row.features, apiThreshold);
      source = "api";
      apiLatencyMs = apiResult.latencyMs;
      scored = scoreFromApiReconstruction(apiResult.reconstructionError, apiResult.threshold);
    } catch {
      scored = scoreFallbackPacket(row.passFail);
      source = "api_fallback";
    }
  }

  const processStatus = scored.processStatus;

  return {
    packetId,
    rowIndex: row.rowIndex,
    originalTime: row.originalTime,
    simulatedTimestamp: simulatedTimestamp.toISOString(),
    features: row.features,
    adaptedFeatures,
    visibleSensors,
    passFail: row.passFail,
    groundTruthLabel: row.groundTruthLabel,
    reconstructionError: scored.reconstructionError,
    displayScore: scored.displayScore,
    displayThreshold: scored.displayThreshold,
    apiThresholdRaw: scored.apiThresholdRaw,
    prediction: scored.prediction,
    confidence: scored.confidence,
    processStatus,
    source,
    recommendedAction: getRecommendedAction(processStatus),
    topContributingSensor: findTopContributingSensor(
      row.features,
      source,
      processStatus,
    ),
    apiLatencyMs,
    injected,
  };
}

export function pickFailureRow(rows: SecomRow[], failureIndices: number[]): SecomRow | null {
  if (!failureIndices.length) return null;
  const index = failureIndices[Math.floor(Math.random() * failureIndices.length)]!;
  return rows[index] ?? null;
}

export function getNextRowIndex(
  currentIndex: number,
  totalRows: number,
  loop = true,
): number | null {
  if (totalRows === 0) return null;
  const next = currentIndex + 1;
  if (next >= totalRows) {
    return loop ? 0 : null;
  }
  return next;
}

export function chartPointFromPacket(packet: StreamPacket, time: string): ChartPoint {
  return {
    packetId: packet.packetId,
    time,
    score: packet.displayScore,
    displayScore: packet.displayScore,
    reconstructionError: packet.reconstructionError,
    threshold: packet.displayThreshold,
    status: packet.processStatus,
    prediction: packet.prediction,
    groundTruth: packet.groundTruthLabel,
    isAnomaly: packet.displayScore >= packet.displayThreshold,
    isWarning:
      packet.displayScore >= WARNING_THRESHOLD &&
      packet.displayScore < packet.displayThreshold,
  };
}
