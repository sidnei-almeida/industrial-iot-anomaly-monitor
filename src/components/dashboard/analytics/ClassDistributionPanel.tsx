"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DashboardPanel, PanelHeader } from "@/components/dashboard/DashboardPanel";
import { useChartTheme } from "@/hooks/use-chart-theme";
import { cn } from "@/lib/utils";

interface ClassDistributionPanelProps {
  className?: string;
  normalSamples: number;
  failureSamples: number;
  failureRate: number;
}

export function ClassDistributionPanel({
  className,
  normalSamples,
  failureSamples,
  failureRate,
}: ClassDistributionPanelProps) {
  const chartTheme = useChartTheme();
  const total = normalSamples + failureSamples;
  const classData = [
    {
      name: "Normal",
      count: normalSamples,
      fill: chartTheme.normal,
      pct: (normalSamples / total) * 100,
    },
    {
      name: "Failure",
      count: failureSamples,
      fill: chartTheme.critical,
      pct: (failureSamples / total) * 100,
    },
  ];

  return (
    <DashboardPanel className={cn("flex min-h-[340px] flex-col", className)}>
      <PanelHeader title="Class distribution" subtitle="Pass/Fail ground truth" />
      <div className="flex min-h-[280px] flex-1 flex-col p-2 pt-1">
        <ResponsiveContainer width="100%" height="100%" minHeight={260}>
          <BarChart
            data={classData}
            margin={{ top: 12, right: 12, left: 4, bottom: 8 }}
            barCategoryGap="28%"
          >
            <CartesianGrid stroke={chartTheme.grid} vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: chartTheme.axis, fontSize: 11, fontWeight: 500 }}
              axisLine={{ stroke: chartTheme.grid }}
            />
            <YAxis
              tick={{ fill: chartTheme.axis, fontSize: 10 }}
              width={48}
              axisLine={{ stroke: chartTheme.grid }}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
            />
            <Tooltip
              cursor={{ fill: chartTheme.tooltipCursor }}
              contentStyle={{
                background: chartTheme.tooltipBg,
                border: `1px solid ${chartTheme.tooltipBorder}`,
                color: chartTheme.tooltipText,
                fontSize: 11,
                borderRadius: 6,
              }}
              labelStyle={{ color: chartTheme.tooltipText }}
              itemStyle={{ color: chartTheme.tooltipText }}
              wrapperStyle={{ outline: "none" }}
              formatter={(value, _name, item) => {
                const n = typeof value === "number" ? value : Number(value);
                const pct = (item?.payload as { pct?: number })?.pct ?? 0;
                return [`${n.toLocaleString()} (${pct.toFixed(1)}%)`, "Samples"];
              }}
            />
            <Bar
              dataKey="count"
              radius={[6, 6, 0, 0]}
              maxBarSize={72}
              activeBar={{ fillOpacity: 1, stroke: chartTheme.tooltipBorder, strokeWidth: 1 }}
            >
              {classData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-2 border-t border-border px-3 py-2">
        {classData.map((row) => (
          <div
            key={row.name}
            className="rounded-md border border-border bg-bg-card-subtle px-2 py-1.5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-medium text-text-secondary">{row.name}</span>
              <span
                className={cn(
                  "font-mono text-[11px] font-semibold tabular-nums",
                  row.name === "Normal" ? "text-normal" : "text-danger",
                )}
              >
                {row.count.toLocaleString()}
              </span>
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[var(--border-subtle)]">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${row.pct}%`,
                  backgroundColor: row.fill,
                  opacity: 0.85,
                }}
              />
            </div>
            <p className="mt-1 text-[9px] tabular-nums text-text-muted">
              {row.pct.toFixed(1)}% of dataset
            </p>
          </div>
        ))}
        <p className="col-span-2 text-center text-[9px] text-text-muted">
          Failure rate {failureRate.toFixed(1)}% · {total.toLocaleString()} labeled samples
        </p>
      </div>
    </DashboardPanel>
  );
}
