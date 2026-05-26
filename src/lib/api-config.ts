/** Hugging Face Space — FastAPI SECOM autoencoder (production demo). */
export const DEFAULT_SECOM_API_URL =
  "https://salmeida-secom-production-anomaly.hf.space";

export function getSecomApiBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SECOM_API_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }
  return DEFAULT_SECOM_API_URL;
}
