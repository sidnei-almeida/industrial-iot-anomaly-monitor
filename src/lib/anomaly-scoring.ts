import {
  DEFAULT_API_THRESHOLD,
  DISPLAY_THRESHOLD,
  RECOMMENDED_ACTIONS,
  VISIBLE_SENSOR_MAP,
  WARNING_THRESHOLD,
} from "@/lib/constants";
import type {
  GroundTruthLabel,
  PassFailLabel,
  PredictionLabel,
  ProcessStatus,
  ScoringSource,
  VisibleSensor,
} from "@/types/secom";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function getProcessStatus(score: number): ProcessStatus {
  if (score >= DISPLAY_THRESHOLD) return "Critical";
  if (score >= WARNING_THRESHOLD) return "Warning";
  return "Normal";
}

export function getPrediction(score: number): PredictionLabel {
  return score >= DISPLAY_THRESHOLD ? "Anomaly" : "Normal";
}

export function reconstructionErrorToDisplayScore(
  reconstructionError: number,
  apiThreshold = DEFAULT_API_THRESHOLD,
): number {
  if (!Number.isFinite(reconstructionError) || apiThreshold <= 0) return 0;
  return Math.min(100, Math.round((reconstructionError / apiThreshold) * DISPLAY_THRESHOLD));
}

export function displayScoreToSyntheticReconstructionError(
  displayScore: number,
  apiThreshold = DEFAULT_API_THRESHOLD,
): number {
  return (displayScore / DISPLAY_THRESHOLD) * apiThreshold;
}

export interface ScoreResult {
  displayScore: number;
  reconstructionError: number;
  displayThreshold: number;
  apiThresholdRaw: number;
  prediction: PredictionLabel;
  processStatus: ProcessStatus;
  confidence: number;
}

export interface FallbackScoreResult extends ScoreResult {
  groundTruthLabel: GroundTruthLabel;
}

export function scoreFallbackPacket(passFail: PassFailLabel): FallbackScoreResult {
  const isFailure = passFail === 1;
  let displayScore: number;

  if (isFailure) {
    displayScore = Math.round(randomBetween(70, 95));
  } else {
    displayScore = Math.round(randomBetween(15, 45));
    if (Math.random() < 0.08) {
      displayScore = Math.round(randomBetween(WARNING_THRESHOLD, 58));
    }
  }

  const processStatus = getProcessStatus(displayScore);
  const prediction = getPrediction(displayScore);
  const confidence = clamp(
    isFailure ? 0.78 + Math.random() * 0.18 : 0.62 + Math.random() * 0.28,
    0.55,
    0.99,
  );

  return {
    displayScore,
    reconstructionError: displayScoreToSyntheticReconstructionError(displayScore),
    displayThreshold: DISPLAY_THRESHOLD,
    apiThresholdRaw: DEFAULT_API_THRESHOLD,
    prediction,
    processStatus,
    confidence,
    groundTruthLabel: isFailure ? "Failure" : "Normal",
  };
}

export function scoreFromApiReconstruction(
  reconstructionError: number,
  apiThreshold = DEFAULT_API_THRESHOLD,
): ScoreResult {
  const displayScore = reconstructionErrorToDisplayScore(reconstructionError, apiThreshold);
  const processStatus = getProcessStatus(displayScore);
  const prediction = getPrediction(displayScore);

  const confidence = clamp(
    displayScore >= DISPLAY_THRESHOLD
      ? 0.72 + (displayScore / 100) * 0.25
      : 0.65 + ((DISPLAY_THRESHOLD - displayScore) / DISPLAY_THRESHOLD) * 0.3,
    0.55,
    0.99,
  );

  return {
    displayScore,
    reconstructionError,
    displayThreshold: DISPLAY_THRESHOLD,
    apiThresholdRaw: apiThreshold,
    prediction,
    processStatus,
    confidence,
  };
}

export function buildVisibleSensors(features: number[]): VisibleSensor[] {
  return VISIBLE_SENSOR_MAP.map((sensor) => ({
    id: sensor.id,
    name: sensor.name,
    columnIndex: sensor.columnIndex,
    value: features[sensor.columnIndex] ?? 0,
    unit: sensor.unit,
  }));
}

export function findTopContributingSensor(
  features: number[],
  source: ScoringSource,
  processStatus: ProcessStatus,
): string {
  const ranked = VISIBLE_SENSOR_MAP.map((sensor) => ({
    name: sensor.name,
    deviation: Math.abs((features[sensor.columnIndex] ?? 0.5) - 0.5),
    columnIndex: sensor.columnIndex,
  })).sort((a, b) => b.deviation - a.deviation);

  const top = ranked[0];
  if (!top) return "—";
  const pct = Math.round(top.deviation * 200);

  if (processStatus === "Critical") {
    return `${top.name} (${pct}% approx.)`;
  }
  if (processStatus === "Warning") {
    return `${top.name} (drift)`;
  }
  return source === "api" ? `${top.name} (stable)` : `${top.name}`;
}

export function getRecommendedAction(status: ProcessStatus): string {
  if (status === "Critical") return RECOMMENDED_ACTIONS.critical;
  if (status === "Warning") return RECOMMENDED_ACTIONS.warning;
  return RECOMMENDED_ACTIONS.normal;
}

export function getEventLogForScore(
  packetId: number,
  displayScore: number,
  injected: boolean,
): { message: string; level: "info" | "warning" | "critical" } {
  if (injected) {
    if (displayScore >= DISPLAY_THRESHOLD) {
      return {
        message: `Known failure sample injected — Anomaly detected (score ${displayScore})`,
        level: "critical",
      };
    }
    if (displayScore >= WARNING_THRESHOLD) {
      return {
        message: `Known failure sample injected — Warning: score ${displayScore} near threshold`,
        level: "warning",
      };
    }
    return {
      message: `Known failure sample injected — score ${displayScore} (below threshold)`,
      level: "warning",
    };
  }

  if (displayScore >= DISPLAY_THRESHOLD) {
    return {
      message: `Packet #${packetId} processed — Anomaly detected (score ${displayScore})`,
      level: "critical",
    };
  }
  if (displayScore >= WARNING_THRESHOLD) {
    return {
      message: `Packet #${packetId} processed — Warning: score near threshold (${displayScore})`,
      level: "warning",
    };
  }
  return {
    message: `Packet #${packetId} processed — Normal (score ${displayScore})`,
    level: "info",
  };
}
