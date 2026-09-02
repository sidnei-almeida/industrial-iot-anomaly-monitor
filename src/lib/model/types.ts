/** Shapes shared between the generated weights module and the inference runtime. */

export type DenseActivation = "relu" | "linear";

export interface DenseLayerSpec {
  name: string;
  inputSize: number;
  outputSize: number;
  activation: DenseActivation;
}

export interface ModelMetrics {
  precisionAnomaly: number | null;
  recallAnomaly: number | null;
  f1Anomaly: number | null;
  accuracy: number | null;
}

export interface ModelDescriptor {
  featureCount: number;
  defaultThreshold: number;
  modelType: string;
  projectName: string;
  kerasVersion: string | null;
  metrics: ModelMetrics;
  layers: readonly DenseLayerSpec[];
}
