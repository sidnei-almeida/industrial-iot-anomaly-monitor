import { CSV_FEATURE_COUNT, MODEL_FEATURE_COUNT } from "@/lib/constants";

/**
 * The autoencoder API expects 558 features after SECOM cleaning.
 * Our replay CSV retains 590 numeric columns (0–589).
 * Until column-drop indices are published, we send the first 558 features.
 */
export function adaptFeaturesForModel(features: number[]): number[] {
  if (features.length === MODEL_FEATURE_COUNT) {
    return features;
  }

  if (features.length >= MODEL_FEATURE_COUNT) {
    return features.slice(0, MODEL_FEATURE_COUNT);
  }

  const padded = [...features];
  while (padded.length < MODEL_FEATURE_COUNT) {
    padded.push(0);
  }
  return padded;
}

export function getFeatureAdapterStatus(features: number[]): {
  csvCount: number;
  modelCount: number;
  strategy: string;
  ready: boolean;
} {
  return {
    csvCount: features.length || CSV_FEATURE_COUNT,
    modelCount: MODEL_FEATURE_COUNT,
    strategy:
      features.length >= MODEL_FEATURE_COUNT
        ? `First ${MODEL_FEATURE_COUNT} of ${features.length || CSV_FEATURE_COUNT} CSV columns`
        : "Insufficient features — local scoring only",
    ready: features.length >= MODEL_FEATURE_COUNT,
  };
}
