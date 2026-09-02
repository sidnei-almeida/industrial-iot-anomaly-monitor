/**
 * Pure-TypeScript inference for the SECOM dense autoencoder.
 *
 * The trained Keras model is a stack of Dense layers (558 -> 128 -> 64 -> 32 ->
 * 64 -> 128 -> 558) with ReLU activations and a linear output, so the forward
 * pass is a few matrix multiplications. Running it here means the dashboard no
 * longer depends on an external Python service: the same weights that were
 * served by FastAPI are decoded from a base64 float32 buffer and evaluated
 * inside the Next.js runtime on Vercel.
 */

import { MODEL_DESCRIPTOR, MODEL_WEIGHTS_BASE64 } from "./weights";
import type { DenseLayerSpec, ModelDescriptor } from "./types";

interface DenseLayer extends DenseLayerSpec {
  /** Row-major kernel of shape (inputSize x outputSize). */
  kernel: Float32Array;
  bias: Float32Array;
}

interface LoadedModel {
  descriptor: ModelDescriptor;
  scalerMean: Float32Array;
  scalerScale: Float32Array;
  layers: DenseLayer[];
  /** Widest layer output, used to size the scratch buffers. */
  maxWidth: number;
}

export interface Prediction {
  reconstructionError: number;
  isAnomaly: boolean;
}

function decodeBase64(encoded: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(encoded, "base64"));
  }
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function loadModel(): LoadedModel {
  const bytes = decodeBase64(MODEL_WEIGHTS_BASE64);
  // Copy into an aligned buffer: Buffer.from may return a view at a non-zero
  // byte offset, which Float32Array cannot wrap unless it is 4-byte aligned.
  const aligned = new Uint8Array(bytes.byteLength);
  aligned.set(bytes);
  const floats = new Float32Array(aligned.buffer);

  const { featureCount, layers: specs } = MODEL_DESCRIPTOR;
  let cursor = 0;

  const take = (length: number): Float32Array => {
    const slice = floats.subarray(cursor, cursor + length);
    cursor += length;
    return slice;
  };

  const scalerMean = take(featureCount);
  const scalerScale = take(featureCount);

  const layers = specs.map((spec) => ({
    ...spec,
    kernel: take(spec.inputSize * spec.outputSize),
    bias: take(spec.outputSize),
  }));

  if (cursor !== floats.length) {
    throw new Error(
      `Weight buffer size mismatch: consumed ${cursor} of ${floats.length} float32 values.`,
    );
  }

  return {
    descriptor: MODEL_DESCRIPTOR,
    scalerMean,
    scalerScale,
    layers,
    maxWidth: Math.max(featureCount, ...specs.map((spec) => spec.outputSize)),
  };
}

let cached: LoadedModel | null = null;

/** Decode once per runtime instance; warm invocations reuse the same buffers. */
function getModel(): LoadedModel {
  if (cached === null) {
    cached = loadModel();
  }
  return cached;
}

export function getModelDescriptor(): ModelDescriptor {
  return getModel().descriptor;
}

export function getFeatureCount(): number {
  return MODEL_DESCRIPTOR.featureCount;
}

export function getDefaultThreshold(): number {
  return MODEL_DESCRIPTOR.defaultThreshold;
}

function denseForward(
  layer: DenseLayer,
  input: Float32Array,
  output: Float32Array,
): void {
  const { inputSize, outputSize, kernel, bias, activation } = layer;

  for (let j = 0; j < outputSize; j += 1) {
    output[j] = bias[j];
  }

  for (let i = 0; i < inputSize; i += 1) {
    const value = input[i];
    if (value === 0) continue;
    const rowOffset = i * outputSize;
    for (let j = 0; j < outputSize; j += 1) {
      output[j] += value * kernel[rowOffset + j];
    }
  }

  if (activation === "relu") {
    for (let j = 0; j < outputSize; j += 1) {
      if (output[j] < 0) output[j] = 0;
    }
  }
}

/**
 * Standard-scale one sample, reconstruct it, and return the mean absolute error
 * between the scaled input and its reconstruction — the same score the FastAPI
 * service produced.
 */
export function reconstructionError(features: ArrayLike<number>): number {
  const model = getModel();
  const { featureCount } = model.descriptor;

  if (features.length !== featureCount) {
    throw new Error(
      `Expected ${featureCount} features but received ${features.length}.`,
    );
  }

  const scaled = new Float32Array(featureCount);
  for (let i = 0; i < featureCount; i += 1) {
    const value = features[i];
    if (!Number.isFinite(value)) {
      throw new Error(`Feature at index ${i} is not a finite number.`);
    }
    scaled[i] = (value - model.scalerMean[i]) / model.scalerScale[i];
  }

  let current: Float32Array = scaled;
  let scratchA = new Float32Array(model.maxWidth);
  let scratchB = new Float32Array(model.maxWidth);

  for (const layer of model.layers) {
    const target = scratchA;
    denseForward(layer, current, target);
    current = target.subarray(0, layer.outputSize);
    scratchA = scratchB;
    scratchB = target;
  }

  let sum = 0;
  for (let i = 0; i < featureCount; i += 1) {
    sum += Math.abs(current[i] - scaled[i]);
  }
  return sum / featureCount;
}

export function predict(
  features: ArrayLike<number>,
  threshold = getDefaultThreshold(),
): Prediction {
  const error = reconstructionError(features);
  return { reconstructionError: error, isAnomaly: error > threshold };
}

export function predictBatch(
  instances: ArrayLike<number>[],
  threshold = getDefaultThreshold(),
): Prediction[] {
  return instances.map((instance) => predict(instance, threshold));
}
