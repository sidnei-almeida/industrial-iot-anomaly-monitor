export const DEFAULT_API_THRESHOLD = 0.45;
export const CONSERVATIVE_API_THRESHOLD = 0.5;
export const DISPLAY_THRESHOLD = 60;
export const WARNING_THRESHOLD = 50;
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
