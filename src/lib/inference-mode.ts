import type { ApiStatus, ScoringSource } from "@/types/secom";

/** Default on; set NEXT_PUBLIC_USE_SECOM_API=false to skip the inference route and score locally. */
export const SECOM_API_MODE_ENABLED =
  process.env.NEXT_PUBLIC_USE_SECOM_API !== "false";

export const DATA_SOURCE_LABEL = "SECOM Cleaned Dataset";
export const STREAM_MODE_LABEL = "Dataset Replay";

export function getInferenceModeLabel(source: ScoringSource): string {
  switch (source) {
    case "api":
      return "Autoencoder API";
    case "api_fallback":
    case "local":
    default:
      return "Local Scoring";
  }
}

export function getSourceBadgeLabel(source: ScoringSource): string {
  switch (source) {
    case "api":
      return "API";
    case "api_fallback":
    case "local":
    default:
      return "Local";
  }
}

export function getSourceBadgeClassName(source: ScoringSource): string {
  switch (source) {
    case "api":
      return "badge-status-normal";
    case "api_fallback":
      return "badge-status-warning";
    case "local":
    default:
      return "badge-status-source";
  }
}

export function getFooterInferenceLabel(
  source: ScoringSource | undefined,
  apiStatus: ApiStatus,
  apiModeEnabled: boolean,
): string {
  if (!apiModeEnabled) return "Local Scoring";
  if (source === "api") return "Autoencoder API";
  if (source === "api_fallback" || source === "local") return "Local Scoring";
  if (apiStatus === "online") return "Autoencoder API (available)";
  return "Local Scoring";
}
