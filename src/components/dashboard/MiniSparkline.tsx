"use client";

import { useSparklineColor } from "@/hooks/use-chart-theme";
import { cn } from "@/lib/utils";

interface MiniSparklineProps {
  data: number[];
  className?: string;
  width?: number;
  height?: number;
}

export function MiniSparkline({
  data,
  className,
  width = 56,
  height = 24,
}: MiniSparklineProps) {
  const stroke = useSparklineColor();

  if (data.length < 2) {
    return <svg width={width} height={height} className={className} aria-hidden />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;

  const points = data
    .map((value, index) => {
      const x = padding + (index / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className={cn("shrink-0", className)} aria-hidden>
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        opacity={0.85}
      />
    </svg>
  );
}
