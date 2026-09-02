import { NextResponse } from "next/server";

import {
  getDefaultThreshold,
  getFeatureCount,
  getModelDescriptor,
  predictBatch,
} from "@/lib/model/autoencoder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Guard against oversized payloads; the dashboard sends one sample per tick. */
const MAX_INSTANCES = 32;

interface PredictRequestBody {
  instances?: unknown;
  threshold?: unknown;
}

function badRequest(detail: string) {
  return NextResponse.json({ detail }, { status: 400 });
}

/** Service metadata, mirroring the root endpoint of the previous FastAPI service. */
export function GET() {
  const descriptor = getModelDescriptor();
  return NextResponse.json({
    project: descriptor.projectName,
    model_type: descriptor.modelType,
    default_threshold: descriptor.defaultThreshold,
    metrics: {
      precision_anomaly: descriptor.metrics.precisionAnomaly,
      recall_anomaly: descriptor.metrics.recallAnomaly,
      f1_anomaly: descriptor.metrics.f1Anomaly,
      accuracy: descriptor.metrics.accuracy,
    },
    features: descriptor.featureCount,
    runtime: "nextjs-route-handler",
  });
}

export async function POST(request: Request) {
  let body: PredictRequestBody;
  try {
    body = (await request.json()) as PredictRequestBody;
  } catch {
    return badRequest("Invalid JSON payload.");
  }

  const { instances, threshold } = body;
  const featureCount = getFeatureCount();

  if (!Array.isArray(instances) || instances.length === 0) {
    return badRequest("`instances` must contain at least one sample.");
  }
  if (instances.length > MAX_INSTANCES) {
    return badRequest(`At most ${MAX_INSTANCES} samples per request.`);
  }

  const samples: number[][] = [];
  for (const [index, sample] of instances.entries()) {
    if (!Array.isArray(sample) || sample.length !== featureCount) {
      const received = Array.isArray(sample) ? sample.length : "a non-array value";
      return badRequest(
        `Sample at index ${index} has ${received} features but ${featureCount} are required.`,
      );
    }
    const values = new Array<number>(sample.length);
    for (let i = 0; i < sample.length; i += 1) {
      const value = Number(sample[i]);
      if (!Number.isFinite(value)) {
        return badRequest(`Sample at index ${index} has a non-numeric value at position ${i}.`);
      }
      values[i] = value;
    }
    samples.push(values);
  }

  let resolvedThreshold = getDefaultThreshold();
  if (threshold !== undefined && threshold !== null) {
    const parsed = Number(threshold);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return badRequest("`threshold` must be a non-negative number.");
    }
    resolvedThreshold = parsed;
  }

  try {
    const predictions = predictBatch(samples, resolvedThreshold).map((prediction) => ({
      reconstruction_error: prediction.reconstructionError,
      is_anomaly: prediction.isAnomaly,
    }));

    return NextResponse.json(
      { threshold: resolvedThreshold, predictions },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Inference failed." },
      { status: 500 },
    );
  }
}
