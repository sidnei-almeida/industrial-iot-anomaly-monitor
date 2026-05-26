export type PassFailLabel = -1 | 1;

export type GroundTruthLabel = "Normal" | "Failure";

export type ProcessStatus = "Normal" | "Warning" | "Critical";

export type PredictionLabel = "Normal" | "Anomaly";

/** How the current packet was scored */
export type ScoringSource = "local" | "api" | "api_fallback";

export type StreamStatus = "idle" | "running" | "paused";

export type ApiStatus = "checking" | "online" | "offline" | "disabled" | "unconfirmed";

export type DashboardSection = "dashboard" | "analytics" | "alerts" | "settings";

export interface VisibleSensor {
  id: string;
  name: string;
  columnIndex: number;
  value: number;
  unit: string;
}

export interface SecomRow {
  rowIndex: number;
  originalTime: string;
  features: number[];
  passFail: PassFailLabel;
  groundTruthLabel: GroundTruthLabel;
}

export interface StreamPacket {
  packetId: number;
  rowIndex: number;
  originalTime: string;
  simulatedTimestamp: string;
  features: number[];
  adaptedFeatures: number[];
  visibleSensors: VisibleSensor[];
  passFail: PassFailLabel;
  groundTruthLabel: GroundTruthLabel;
  reconstructionError: number;
  displayScore: number;
  displayThreshold: number;
  apiThresholdRaw: number;
  prediction: PredictionLabel;
  confidence: number;
  processStatus: ProcessStatus;
  source: ScoringSource;
  recommendedAction: string;
  topContributingSensor: string;
  apiLatencyMs: number | null;
  injected: boolean;
}

export interface ChartPoint {
  packetId: number;
  time: string;
  score: number;
  displayScore: number;
  reconstructionError: number;
  threshold: number;
  status: ProcessStatus;
  prediction: PredictionLabel;
  groundTruth: GroundTruthLabel;
  isAnomaly: boolean;
  isWarning: boolean;
}

export type EventLogLevel = "info" | "warning" | "critical" | "system";

export type EventLogStatus = ProcessStatus | "System";

export interface EventLogEntry {
  id: string;
  timestamp: string;
  message: string;
  level: EventLogLevel;
  packetId?: number;
  /** Short event label for the table */
  event: string;
  status: EventLogStatus;
  displayScore?: number;
  displayThreshold?: number;
  groundTruthLabel?: GroundTruthLabel;
  source?: ScoringSource;
  topSensor?: string;
  action?: string;
}

export interface AlertRecord {
  id: string;
  timestamp: string;
  packetId: number;
  displayScore: number;
  processStatus: ProcessStatus;
  groundTruthLabel: GroundTruthLabel;
  source: ScoringSource;
  message: string;
  recommendedAction: string;
  level: "info" | "warning" | "critical" | "system";
}

export interface DatasetMeta {
  totalRows: number;
  failureRows: number;
  featureCount: number;
  loaded: boolean;
}

export interface SensorColumnStats {
  columnIndex: number;
  name: string;
  min: number;
  max: number;
  mean: number;
  variance: number;
}

export interface DatasetAnalytics {
  totalSamples: number;
  featureCount: number;
  normalSamples: number;
  failureSamples: number;
  failureRate: number;
  missingValues: number;
  visibleSensorStats: SensorColumnStats[];
  topUnstableSensors: SensorColumnStats[];
  meanFailureScoreProxy: number;
}

export interface PredictApiResponse {
  threshold: number;
  predictions: Array<{
    reconstruction_error: number;
    is_anomaly: boolean;
  }>;
}
