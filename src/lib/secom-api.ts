import { getSecomApiBaseUrl } from "@/lib/api-config";
import { DEFAULT_API_THRESHOLD, MODEL_FEATURE_COUNT } from "@/lib/constants";
import { adaptFeaturesForModel } from "@/lib/feature-adapter";
import type { PredictApiResponse } from "@/types/secom";

export function getApiBaseUrl(): string {
  return getSecomApiBaseUrl();
}

/** Boot gate: HTTP 200 on /health (Hugging Face Space when awake). */
export async function pingApiHealth(timeoutMs = 5000): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${getApiBaseUrl()}/health`, {
      signal: controller.signal,
      cache: "no-store",
      mode: "cors",
    });
    if (!response.ok) return false;
    try {
      const data = (await response.json()) as { status?: string };
      if (data.status !== undefined) {
        return String(data.status).toLowerCase() === "ok";
      }
    } catch {
      /* non-JSON health is fine if status is 200 */
    }
    return response.status === 200;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export async function checkApiHealth(): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(`${getApiBaseUrl()}/health`, {
      signal: controller.signal,
    });
    if (!response.ok) return false;
    const data = (await response.json()) as { status?: string };
    return String(data.status).toLowerCase() === "ok";
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export async function predictWithApi(
  features: number[],
  threshold = DEFAULT_API_THRESHOLD,
): Promise<{
  reconstructionError: number;
  isAnomaly: boolean;
  threshold: number;
  latencyMs: number;
}> {
  const adapted = adaptFeaturesForModel(features);
  if (adapted.length !== MODEL_FEATURE_COUNT) {
    throw new Error(`Feature adapter produced ${adapted.length} features, expected ${MODEL_FEATURE_COUNT}`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  const started = performance.now();

  try {
    const response = await fetch(`${getApiBaseUrl()}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [adapted],
        threshold,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `API error ${response.status}`);
    }

    const data = (await response.json()) as PredictApiResponse;
    const prediction = data.predictions?.[0];
    if (!prediction) {
      throw new Error("API returned no predictions");
    }

    return {
      reconstructionError: prediction.reconstruction_error,
      isAnomaly: prediction.is_anomaly,
      threshold: data.threshold ?? threshold,
      latencyMs: Math.round(performance.now() - started),
    };
  } finally {
    clearTimeout(timeout);
  }
}
