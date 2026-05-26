import { ImageResponse } from "next/og";

import { BRAND_COLORS, BRAND_NAME } from "@/lib/brand";

export const alt = BRAND_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND_COLORS.darkBg,
          border: `1px solid ${BRAND_COLORS.line}`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 140,
            height: 140,
            borderRadius: 16,
            background: BRAND_COLORS.cardBg,
            border: `1px solid ${BRAND_COLORS.line}`,
            marginBottom: 40,
          }}
        >
          <svg viewBox="0 0 24 24" width="72" height="72" fill="none">
            <path
              d="M2 13a2 2 0 0 0 2-2V7a2 2 0 0 1 4 0v13a2 2 0 0 0 4 0V4a2 2 0 0 1 4 0v13a2 2 0 0 0 4 0v-4a2 2 0 0 1 2-2"
              stroke={BRAND_COLORS.gold}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div
          style={{
            fontSize: 40,
            fontWeight: 600,
            color: BRAND_COLORS.textPrimary,
            letterSpacing: "-0.02em",
            textAlign: "center",
            maxWidth: 900,
            lineHeight: 1.2,
          }}
        >
          {BRAND_NAME}
        </div>
        <div
          style={{
            marginTop: 16,
            fontSize: 20,
            color: BRAND_COLORS.textSecondary,
            textAlign: "center",
          }}
        >
          SECOM replay · live anomaly scoring · FastAPI autoencoder
        </div>
      </div>
    ),
    { ...size },
  );
}
