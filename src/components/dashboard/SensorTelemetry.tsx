"use client";

import { Gauge, Thermometer, Waves, Wind, Zap } from "lucide-react";

import { DashboardPanel, PanelHeader } from "@/components/dashboard/DashboardPanel";
import { MiniSparkline } from "@/components/dashboard/MiniSparkline";
import { CSV_FEATURE_COUNT, VISIBLE_SENSOR_MAP } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { StreamPacket, VisibleSensor } from "@/types/secom";

const sensorIcons: Record<string, typeof Gauge> = {
  "chamber-pressure": Gauge,
  "etch-rate": Waves,
  "rf-power": Zap,
  "wafer-temperature": Thermometer,
  "gas-flow": Wind,
  "vacuum-level": Gauge,
};

const BODY_CLASS = "flex h-[488px] flex-col lg:h-[560px]";

interface SensorTelemetryProps {
  className?: string;
  sensors: VisibleSensor[];
  processStatus: StreamPacket["processStatus"] | undefined;
  topContributingSensor?: string;
}

type SensorRowState = "normal" | "warning" | "critical";

function sparkFromValue(value: number): number[] {
  return [value * 0.92, value * 0.96, value, Math.min(1, value * 1.01), value * 0.98];
}

function getSensorRowState(
  sensor: VisibleSensor,
  processStatus: StreamPacket["processStatus"] | undefined,
  topName: string | undefined,
): SensorRowState {
  const isTop = topName === sensor.name;
  if (processStatus === "Critical" && isTop) return "critical";
  if (processStatus === "Warning" && (isTop || sensor.columnIndex <= 3)) return "warning";
  return "normal";
}

function countSensorStates(
  sensors: VisibleSensor[],
  processStatus: StreamPacket["processStatus"] | undefined,
  topName: string | undefined,
) {
  let stable = 0;
  let warning = 0;
  let critical = 0;
  for (const sensor of sensors) {
    const state = getSensorRowState(sensor, processStatus, topName);
    if (state === "critical") critical += 1;
    else if (state === "warning") warning += 1;
    else stable += 1;
  }
  return { stable, warning, critical };
}

function formatSensorDisplay(sensor: VisibleSensor): string {
  if (sensor.id === "rf-power") return `${Math.round(sensor.value * 1200)} W`;
  if (sensor.id === "wafer-temperature") return `${(sensor.value * 100).toFixed(0)}°C`;
  if (sensor.id === "chamber-pressure") return sensor.value.toFixed(2);
  return sensor.value.toFixed(3);
}

function SummaryStat({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] font-medium uppercase tracking-wide text-text-muted">{label}</p>
      <p className={cn("mt-0.5 truncate text-[12px] font-semibold tabular-nums", valueClassName)}>
        {value}
      </p>
    </div>
  );
}

export function SensorTelemetry({
  className,
  sensors,
  processStatus,
  topContributingSensor,
}: SensorTelemetryProps) {
  const topName = topContributingSensor?.split(" (")[0]?.trim();
  const displaySensors =
    sensors.length > 0
      ? sensors
      : VISIBLE_SENSOR_MAP.map((s) => ({
          id: s.id,
          name: s.name,
          columnIndex: s.columnIndex,
          value: 0,
          unit: s.unit,
        }));

  const counts = countSensorStates(displaySensors, processStatus, topName);
  const mostAffected =
    processStatus === "Normal" || !topName ? "None" : topName;

  return (
    <DashboardPanel className={cn("flex h-full flex-col", className)}>
      <PanelHeader title="Sensor Telemetry (Live)" subtitle="Readable SECOM sensor subset" />

      <div className={BODY_CLASS}>
        <div className="min-h-0 flex-[7] space-y-0.5 overflow-y-auto px-4 py-3">
          {sensors.length === 0 ? (
            <p className="px-1 py-2 text-xs text-text-muted">Waiting for packets…</p>
          ) : (
            displaySensors.map((sensor) => {
              const Icon = sensorIcons[sensor.id] ?? Gauge;
              const rowState = getSensorRowState(sensor, processStatus, topName);
              const critical = rowState === "critical";
              const warn = rowState === "warning";

              return (
                <div
                  key={sensor.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-2 py-2.5",
                    critical && "bg-red-subtle",
                    warn && !critical && "bg-[var(--border-subtle)]",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4 shrink-0",
                      critical
                        ? "text-danger"
                        : warn
                          ? "text-text-secondary"
                          : "text-text-muted",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-medium text-text-primary">
                      {sensor.name}
                    </p>
                    <p className="text-[10px] text-text-muted">{sensor.unit}</p>
                  </div>
                  <MiniSparkline
                    data={sparkFromValue(sensor.value)}
                    width={48}
                    height={20}
                  />
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-[13px] font-bold tabular-nums text-text-primary">
                      {formatSensorDisplay(sensor)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex shrink-0 flex-[3] flex-col justify-end bg-bg-card-subtle px-5 py-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-text-secondary">
            Telemetry Summary
          </p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 sm:grid-cols-4">
            <SummaryStat
              label="Active"
              value={`${VISIBLE_SENSOR_MAP.length} / ${CSV_FEATURE_COUNT}`}
              valueClassName="text-accent-aqua"
            />
            <SummaryStat
              label="Stable"
              value={String(counts.stable)}
              valueClassName="text-normal"
            />
            <SummaryStat
              label="Warning"
              value={String(counts.warning)}
              valueClassName="text-warning"
            />
            <SummaryStat
              label="Critical"
              value={String(counts.critical)}
              valueClassName="text-danger"
            />
          </div>
          <div className="mt-2 border-t border-border pt-2">
            <SummaryStat
              label="Most affected"
              value={mostAffected}
              valueClassName={
                mostAffected === "None" ? "text-text-secondary" : "text-danger"
              }
            />
          </div>
        </div>
      </div>
    </DashboardPanel>
  );
}
