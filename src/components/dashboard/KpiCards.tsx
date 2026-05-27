"use client";

import { MiniSparkline } from "@/components/dashboard/MiniSparkline";
import { DISPLAY_THRESHOLD } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ChartPoint, StreamPacket, StreamStatus } from "@/types/secom";

interface KpiCardsProps {
  className?: string;
  streamStatus: StreamStatus;
  packetCounter: number;
  currentPacket: StreamPacket | null;
  chartData: ChartPoint[];
}

export function KpiCards({
  className,
  streamStatus,
  packetCounter,
  currentPacket,
  chartData,
}: KpiCardsProps) {
  const live = streamStatus === "running";
  const score = currentPacket?.displayScore ?? 0;
  const scoreSpark = chartData.slice(-12).map((p) => p.displayScore);
  const liveSpark = chartData.slice(-8).map((p) => p.displayScore);

  const cards = [
    {
      title: "Stream Status",
      value: live ? "LIVE" : streamStatus.toUpperCase(),
      sub: live ? "Streaming" : "Idle",
      valueClass: live ? "text-accent-aqua" : "text-text-primary",
      spark: liveSpark.length > 1 ? liveSpark : [10, 30, 45, 55],
    },
    {
      title: "Current Anomaly Score",
      value: currentPacket ? `${score} / 100` : "—",
      sub: currentPacket
        ? currentPacket.processStatus === "Critical"
          ? "High Risk"
          : currentPacket.processStatus === "Warning"
            ? "Near threshold"
            : "Within range"
        : "Awaiting",
      valueClass: "text-text-primary",
      spark: scoreSpark.length > 1 ? scoreSpark : [20, 35, 40, score || 25],
    },
    {
      title: "Process Status",
      value: currentPacket?.processStatus ?? "—",
      sub: currentPacket?.prediction ?? "Awaiting",
      valueClass: "text-text-primary",
      spark: scoreSpark.length > 1 ? scoreSpark : [40, 42, 44, 46],
    },
    {
      title: "Sensor Packet",
      value: packetCounter.toLocaleString(),
      sub: "Packets processed",
      valueClass: "text-text-primary",
      spark: liveSpark.length > 1 ? liveSpark : [5, 15, 25, 35],
    },
    {
      title: "Inference Latency",
      value:
        currentPacket?.apiLatencyMs != null ? `${currentPacket.apiLatencyMs} ms` : "—",
      sub: "Average",
      valueClass: "text-text-primary",
      spark: [30, 35, 42, currentPacket?.apiLatencyMs ?? 40],
    },
    {
      title: "Stream Rate",
      value: live ? "1 Hz" : "0 Hz",
      sub: `Threshold ${DISPLAY_THRESHOLD}`,
      valueClass: "text-text-secondary",
      spark: [1, 1, 1, 1, 1],
    },
  ];

  return (
    <section className={cn("grid grid-cols-6 gap-4", className)}>
      {cards.map((card) => (
        <div key={card.title} className="lux-card p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="stat-kpi-label">{card.title}</p>
              <p
                className={cn(
                  "stat-kpi-value mt-2",
                  card.value === "—" ? "text-text-ghost" : card.valueClass,
                )}
              >
                {card.value}
              </p>
              <p className="mt-2 text-[11px] text-text-muted">{card.sub}</p>
            </div>
            <MiniSparkline data={card.spark} width={52} height={22} />
          </div>
        </div>
      ))}
    </section>
  );
}
