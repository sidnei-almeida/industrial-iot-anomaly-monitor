import { BRAND_WAVEFORM_PATH } from "@/lib/brand";
import { cn } from "@/lib/utils";

export interface BrandMarkProps {
  className?: string;
  strokeWidth?: number;
}

/** Sidebar logo — Lucide AudioWaveform (industrial signal). */
export function BrandMark({ className, strokeWidth = 2 }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <path
        d={BRAND_WAVEFORM_PATH}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
