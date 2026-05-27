"use client";

import { useCallback, useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Label,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DashboardPanel, PanelHeader } from "@/components/dashboard/DashboardPanel";
import { useChartTheme } from "@/hooks/use-chart-theme";
import { DISPLAY_THRESHOLD } from "@/lib/constants";
import type { ChartThemeColors } from "@/lib/monitor-theme";
import { cn } from "@/lib/utils";
import type { ChartPoint } from "@/types/secom";

interface LiveAnomalyChartProps {
  className?: string;
  data: ChartPoint[];
}

type ChartRow = ChartPoint & { isLast: boolean; labelAnomaly: boolean };

function ChartTooltip({
  active,
  payload,
  theme,
}: {
  active?: boolean;
  payload?: Array<{ payload?: ChartRow }>;
  theme: ChartThemeColors;
}) {
  if (!active || !payload?.[0]?.payload) return null;
  const point = payload[0].payload;

  return (
    <div
      className="rounded-lg border px-3 py-2 text-[11px] shadow-lg"
      style={{
        background: theme.tooltipBg,
        borderColor: theme.tooltipBorder,
        color: theme.tooltipText,
      }}
    >
      <p className="font-medium text-text-secondary">Packet #{point.packetId}</p>
      <p className="text-text-muted">{point.time}</p>
      <div className="mt-2 space-y-0.5 text-text-muted">
        <p>
          Score: <span className="font-mono text-text-primary">{point.score}</span> / 100
        </p>
        <p>
          Threshold: <span className="font-mono text-text-primary">{point.threshold}</span>
        </p>
        <p>
          Status:{" "}
          <span
            className={cn(
              point.status === "Critical" && "text-danger",
              point.status === "Warning" && "text-warning",
              point.status === "Normal" && "text-normal",
            )}
          >
            {point.status}
          </span>
        </p>
        <p>
          Prediction: <span className="text-text-secondary">{point.prediction}</span>
        </p>
        <p>
          Ground truth: <span className="text-text-secondary">{point.groundTruth}</span>
        </p>
        <p className="text-text-muted">
          Recon. error: {point.reconstructionError.toFixed(4)}
        </p>
      </div>
    </div>
  );
}

export function LiveAnomalyChart({ className, data }: LiveAnomalyChartProps) {
  const chartTheme = useChartTheme();

  const latestCriticalIndex = [...data]
    .map((p, i) => (p.isAnomaly ? i : -1))
    .filter((i) => i >= 0)
    .pop();

  const chartData: ChartRow[] = data.map((point, index) => ({
    ...point,
    isLast: index === data.length - 1,
    labelAnomaly: index === latestCriticalIndex,
  }));

  const lastPoint = chartData[chartData.length - 1];
  const hasAnomaly = lastPoint?.isAnomaly;

  const renderDot = useCallback(
    (props: { cx?: number; cy?: number; payload?: ChartRow }) => {
      const { cx, cy, payload } = props;
      if (cx == null || cy == null || !payload) return null;

      let fill: string = chartTheme.normal;
      let radius = 3;
      let stroke = "transparent";

      if (payload.isAnomaly) {
        fill = chartTheme.critical;
        radius = payload.labelAnomaly ? 5 : 4;
        stroke = chartTheme.criticalStroke;
      } else if (payload.isWarning) {
        fill = chartTheme.warning;
        radius = 4;
        stroke = chartTheme.warningStroke;
      }

      return (
        <g>
          <circle cx={cx} cy={cy} r={radius} fill={fill} stroke={stroke} strokeWidth={1} />
          {payload.labelAnomaly ? (
            <text
              x={cx}
              y={cy - 12}
              textAnchor="middle"
              fill={chartTheme.critical}
              fontSize={9}
              fontWeight={600}
            >
              Anomaly
            </text>
          ) : null}
        </g>
      );
    },
    [chartTheme],
  );

  const tooltipContent = useMemo(
    () => <ChartTooltip theme={chartTheme} />,
    [chartTheme],
  );

  return (
    <DashboardPanel
      className={cn("overflow-hidden", className)}
      emphasis={hasAnomaly ? "critical" : "none"}
    >
      <PanelHeader
        title="Live Anomaly Score"
        subtitle="Display scale 0–100 · threshold at 60"
        action={
          <select className="py-0.5 text-[10px]" defaultValue="15m" aria-label="Time range">
            <option value="15m">Last 15 Minutes</option>
          </select>
        }
      />
      <div className="relative h-[532px] px-3 py-3">
        {data.length === 0 ? (
          <div className="grid h-full place-items-center text-xs text-text-muted">
            Start stream to populate live chart
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%" debounce={1}>
              <AreaChart data={chartData} margin={{ top: 16, right: 12, left: 0, bottom: 4 }}>
                <defs>
                  <linearGradient id="anomalyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartTheme.line} stopOpacity={0.12} />
                    <stop offset="100%" stopColor={chartTheme.line} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={chartTheme.grid} vertical={false} />
                <XAxis
                  dataKey="time"
                  tick={{ fill: chartTheme.axis, fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={32}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: chartTheme.axis, fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                />
                <Tooltip content={tooltipContent} />
                <ReferenceLine
                  y={DISPLAY_THRESHOLD}
                  stroke={chartTheme.threshold}
                  strokeDasharray="5 5"
                  strokeWidth={1}
                  strokeOpacity={0.85}
                >
                  <Label
                    value="Threshold (60)"
                    position="insideTopRight"
                    fill={chartTheme.thresholdLabel}
                    fontSize={10}
                  />
                </ReferenceLine>
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke={chartTheme.line}
                  strokeWidth={2}
                  fill="url(#anomalyGradient)"
                  dot={renderDot}
                  activeDot={{ r: 4, fill: chartTheme.line }}
                />
              </AreaChart>
            </ResponsiveContainer>
            {lastPoint?.isAnomaly ? (
              <div className="pointer-events-none absolute right-8 top-6 rounded bg-red-subtle px-2 py-0.5 text-[11px] font-medium text-danger">
                {lastPoint.score} · Above threshold
              </div>
            ) : null}
          </>
        )}
      </div>
      <p className="px-5 pb-4 text-[10px] text-text-muted">
        <span className="text-danger">Critical</span> ≥60 ·{" "}
        <span className="text-warning">Warning</span> 50–59 ·{" "}
        <span className="text-normal">Normal</span> &lt;50
      </p>
    </DashboardPanel>
  );
}
