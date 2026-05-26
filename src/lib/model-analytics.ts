import type { ApiStatus, ScoringSource } from "@/types/secom";

import {
  CSV_FEATURE_COUNT,
  DEFAULT_API_THRESHOLD,
  DISPLAY_THRESHOLD,
  MODEL_FEATURE_COUNT,
} from "@/lib/constants";
import { SECOM_API_MODE_ENABLED } from "@/lib/inference-mode";

export const MODEL_FILE_NAME = "secom_autoencoder_model.keras";
export const MODEL_REPO_URL =
  "https://github.com/sidnei-almeida/secom_failure_prediction/tree/main/models";

export const MODEL_PIPELINE_STEPS = [
  "Input sensor vector",
  "Encoder",
  "Latent representation",
  "Decoder",
  "Reconstruction error",
  "Anomaly decision",
] as const;

export const AUTOENCODER_VALUE_CARDS = [
  {
    title: "Unsupervised anomaly detection",
    body: "Autoencoders are useful when failures are rare and normal samples dominate the dataset.",
  },
  {
    title: "Reconstruction-based scoring",
    body: "The model converts high-dimensional sensor behavior into a reconstruction error that can be monitored over time.",
  },
  {
    title: "Real-time monitoring compatible",
    body: "Each incoming sensor packet can be scored independently and visualized as a live risk signal.",
  },
] as const;

export function getApiIntegrationLabel(apiModeEnabled: boolean, apiStatus: ApiStatus): string {
  if (!apiModeEnabled) return "API-ready (disabled)";
  if (apiStatus === "online") return "Enabled · online";
  if (apiStatus === "checking") return "Enabled · checking";
  return "Enabled · offline";
}

export function getDashboardModeSummary(
  apiModeEnabled: boolean = SECOM_API_MODE_ENABLED,
  useApi?: boolean,
  apiStatus?: ApiStatus,
  scoringSource?: ScoringSource,
): string {
  if (scoringSource === "api_fallback") {
    return "Dataset Replay + Local Scoring";
  }
  if (apiModeEnabled && useApi && apiStatus === "online" && scoringSource === "api") {
    return "Dataset Replay + FastAPI Autoencoder";
  }
  return "Dataset Replay + Local Scoring";
}

export function getDatasetModelAlignmentRows(params: {
  totalRows: number;
  featureCount: number;
  adapterReady: boolean;
  apiModeEnabled: boolean;
  useApi: boolean;
  apiStatus: ApiStatus;
  scoringSource?: ScoringSource;
}) {
  const {
    totalRows,
    featureCount,
    adapterReady,
    apiModeEnabled,
    useApi,
    apiStatus,
    scoringSource,
  } = params;

  return [
    { label: "Cleaned dataset rows", value: totalRows.toLocaleString() },
    { label: "Sensor columns available", value: String(featureCount || CSV_FEATURE_COUNT) },
    { label: "Model expected input", value: `${MODEL_FEATURE_COUNT} features (preprocessing)` },
    {
      label: "Feature adapter",
      value: adapterReady ? "Required · ready for API" : "Required · local scoring path",
    },
    {
      label: "Dashboard mode",
      value: getDashboardModeSummary(apiModeEnabled, useApi, apiStatus, scoringSource),
    },
    {
      label: "API integration",
      value: getApiIntegrationLabel(apiModeEnabled, apiStatus),
    },
  ];
}

export const INFERENCE_CONTRACT = {
  endpoint: "POST /predict",
  payload: `{
  "instances": [[...numeric sensor features...]],
  "threshold": ${DEFAULT_API_THRESHOLD}
}`,
  response: `{
  "threshold": ${DEFAULT_API_THRESHOLD},
  "predictions": [
    {
      "reconstruction_error": number,
      "is_anomaly": boolean
    }
  ]
}`,
  architectureNote: "API-ready architecture",
  displayThresholdNote: `Dashboard maps reconstruction error to 0–100 risk (alert at ${DISPLAY_THRESHOLD})`,
} as const;
