import { CSV_FEATURE_COUNT, MODEL_FEATURE_COUNT } from "@/lib/constants";
import {
  COLUMN_MIN,
  COLUMN_RANGE,
  MODEL_COLUMN_INDICES,
} from "@/lib/model/feature-space";

/**
 * Bridges the replay CSV and the autoencoder's input space.
 *
 * public/data/secom_cleaned_dataset.csv keeps all 590 SECOM columns, imputed and
 * min-max normalized to [0, 1] — convenient for the sensor gauges, but not what
 * the model was trained on. The autoencoder takes the 558 columns that survived
 * cleaning, in raw sensor units, because its StandardScaler holds raw means and
 * standard deviations.
 *
 * So a CSV row is adapted in two steps: select the model's columns, then undo
 * the min-max normalization with the per-column bounds of the original dataset.
 * See scripts/export_feature_space.py for how those bounds are derived.
 */
export function adaptFeaturesForModel(features: number[]): number[] {
  // Already in model space (558 raw values) — nothing to do.
  if (features.length === MODEL_FEATURE_COUNT) {
    return features;
  }

  const adapted = new Array<number>(MODEL_FEATURE_COUNT);
  for (let i = 0; i < MODEL_FEATURE_COUNT; i += 1) {
    const normalized = features[MODEL_COLUMN_INDICES[i]] ?? 0;
    adapted[i] = normalized * COLUMN_RANGE[i] + COLUMN_MIN[i];
  }
  return adapted;
}

export function getFeatureAdapterStatus(features: number[]): {
  csvCount: number;
  modelCount: number;
  strategy: string;
  ready: boolean;
} {
  const csvCount = features.length || CSV_FEATURE_COUNT;
  const ready =
    csvCount === CSV_FEATURE_COUNT || csvCount === MODEL_FEATURE_COUNT;

  return {
    csvCount,
    modelCount: MODEL_FEATURE_COUNT,
    strategy: ready
      ? `${MODEL_FEATURE_COUNT} model columns of ${csvCount}, rescaled to raw units`
      : "Unexpected column count — local scoring only",
    ready,
  };
}
