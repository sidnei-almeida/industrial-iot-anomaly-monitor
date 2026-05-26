"use client";

import { EventLog } from "@/components/dashboard/EventLog";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { LiveAnomalyChart } from "@/components/dashboard/LiveAnomalyChart";
import { ModelOutput } from "@/components/dashboard/ModelOutput";
import { PipelineStrip } from "@/components/dashboard/PipelineStrip";
import { SensorTelemetry } from "@/components/dashboard/SensorTelemetry";
import type { SecomMonitor } from "@/hooks/use-secom-monitor";
import { cn } from "@/lib/utils";

const CHART_ROW_LG = "lg:h-[612px] lg:max-h-[612px]";
const CHART_ROW_MOBILE = "h-[540px] max-h-[540px]";

const RECENT_EVENT_LIMIT = 48;

interface MonitorDashboardViewProps {
  monitor: SecomMonitor;
  className?: string;
}

export function MonitorDashboardView({ monitor, className }: MonitorDashboardViewProps) {
  const recentEvents = monitor.events.slice(0, RECENT_EVENT_LIMIT);

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-3", className)}>
      <div className="grid shrink-0 grid-cols-12 gap-3">
        <PipelineStrip
          className="col-span-12"
          activeIndex={monitor.streamStatus === "running" ? 0 : 2}
        />
        <KpiCards
          className="col-span-12"
          streamStatus={monitor.streamStatus}
          packetCounter={monitor.packetCounter}
          currentPacket={monitor.currentPacket}
          chartData={monitor.chartData}
        />
      </div>

      <div className={cn("grid shrink-0 grid-cols-12 gap-2", CHART_ROW_MOBILE, CHART_ROW_LG)}>
        <LiveAnomalyChart
          className={cn("col-span-12", CHART_ROW_MOBILE, CHART_ROW_LG, "lg:col-span-6")}
          data={monitor.chartData}
        />
        <SensorTelemetry
          className={cn(
            "col-span-12 sm:col-span-6 lg:col-span-3",
            CHART_ROW_MOBILE,
            CHART_ROW_LG,
          )}
          sensors={monitor.currentPacket?.visibleSensors ?? []}
          processStatus={monitor.currentPacket?.processStatus}
          topContributingSensor={monitor.currentPacket?.topContributingSensor}
        />
        <ModelOutput
          className={cn(
            "col-span-12 sm:col-span-6 lg:col-span-3",
            CHART_ROW_MOBILE,
            CHART_ROW_LG,
          )}
          packet={monitor.currentPacket}
        />
      </div>

      <div className="grid min-h-[200px] flex-1 grid-cols-12 gap-2 overflow-hidden">
        <EventLog
          className="col-span-12 h-full min-h-0"
          events={recentEvents}
          title="Recent Event Log"
        />
      </div>
    </div>
  );
}
