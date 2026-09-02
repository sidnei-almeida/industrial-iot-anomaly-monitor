import { NextResponse } from "next/server";

import { getModelDescriptor } from "@/lib/model/autoencoder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Boot gate for the dashboard. The model is decoded here so a 200 response
 * means inference is genuinely ready, not just that the route exists.
 */
export function GET() {
  try {
    const descriptor = getModelDescriptor();
    return NextResponse.json(
      {
        status: "ok",
        model: descriptor.modelType,
        features: descriptor.featureCount,
        runtime: "nextjs-route-handler",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        detail: error instanceof Error ? error.message : "Model failed to load.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
