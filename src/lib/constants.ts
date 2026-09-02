export const DEFAULT_API_THRESHOLD = 0.45;
export const CONSERVATIVE_API_THRESHOLD = 0.5;
export const DISPLAY_THRESHOLD = 60;
export const WARNING_THRESHOLD = 50;

/**
 * Anchors for the 0-100 display scale.
 *
 * The autoencoder's reconstruction error never approaches 0 — over the replay
 * dataset it runs from ~0.16 to ~1.8, clustered around 0.37 — so mapping it
 * linearly from zero would waste the bottom of the scale and leave the median
 * sample sitting on the warning line. Instead the scale is anchored on the
 * observed distribution: the 5th percentile of the errors reads as 0, the model
 * threshold reads as DISPLAY_THRESHOLD, and the 99th percentile reads as 100.
 *
 * Anomaly decisions still use the raw error against DEFAULT_API_THRESHOLD; this
 * only controls how the score is presented. Re-derive with
 * scripts/calibrate_display_scale.py if the model is retrained.
 */
export const DISPLAY_SCALE_MIN_ERROR = 0.3;
export const DISPLAY_SCALE_MAX_ERROR = 0.75;
export const CSV_FEATURE_COUNT = 590;
export const MODEL_FEATURE_COUNT = 558;
export const STREAM_INTERVAL_MS = 1000;
export const CHART_MAX_POINTS = 60;
export const EVENT_LOG_MAX_ENTRIES = 50;
export const DATASET_PATH = "/data/secom_cleaned_dataset.csv";

export const DATASET_DISPLAY_NAME = "SECOM Cleaned Dataset";
export const STREAM_MODE_DISPLAY = "Dataset Replay";

/** @deprecated Use DEFAULT_API_THRESHOLD */
export const DEFAULT_THRESHOLD = DEFAULT_API_THRESHOLD;

export const VISIBLE_SENSOR_MAP = [
  { id: "chamber-pressure", name: "Chamber Pressure", columnIndex: 0, unit: "Torr" },
  { id: "etch-rate", name: "Etch Rate", columnIndex: 1, unit: "nm/min" },
  { id: "rf-power", name: "RF Power", columnIndex: 2, unit: "W" },
  { id: "wafer-temperature", name: "Wafer Temperature", columnIndex: 3, unit: "°C" },
  { id: "gas-flow", name: "Gas Flow", columnIndex: 4, unit: "sccm" },
  { id: "vacuum-level", name: "Vacuum Level", columnIndex: 5, unit: "mTorr" },
] as const;

export const RECOMMENDED_ACTIONS = {
  normal: "Continue monitoring.",
  warning: "Review process drift and monitor high-variance sensors.",
  critical:
    "Inspect equipment calibration, review recent maintenance records, and prioritize affected process sensors.",
} as const;
