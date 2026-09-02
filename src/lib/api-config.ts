/**
 * Inference runs inside this Next.js deployment (see src/app/api/predict).
 * The relative base keeps every request same-origin, so the dashboard works on
 * Vercel, on a preview URL, and locally without any environment configuration.
 *
 * NEXT_PUBLIC_SECOM_API_URL still points the dashboard at an external service
 * that speaks the same /health and /predict contract, if one is ever deployed.
 */
export const DEFAULT_SECOM_API_URL = "/api";

export function getSecomApiBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SECOM_API_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }
  return DEFAULT_SECOM_API_URL;
}
