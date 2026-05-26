# Brand kit — Vercel & social

Mark: **AudioWaveform** (Lucide) — same icon as the top-left sidebar.

## Files

| File | Use |
|------|-----|
| `mark.svg` | Gold mark on transparent (dark UI) |
| `mark-mono.svg` | `currentColor` — embed in CSS/components |
| `icon.svg` | Favicon source (dark card, 32×32) |
| `icon-light.svg` | Favicon / PWA on light backgrounds |
| `og.svg` | Open Graph / Vercel social preview (1200×630) |

Next.js also generates runtime icons from `src/app/icon.tsx` and `src/app/opengraph-image.tsx`.

## Vercel project settings

1. **Project → Settings → General → Project Icon**  
   Upload **`public/brand/icon-512.png`** (512×512 PNG with gold waveform on dark background).

2. **Social preview**  
   Uses `opengraph-image` from the app (PNG at build). Fallback: upload `og.svg` converted to PNG if needed.

3. **Production URL**  
   Favicon is served automatically at `/icon` (Next.js metadata).
