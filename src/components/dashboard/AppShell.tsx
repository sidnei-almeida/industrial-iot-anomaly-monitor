"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

import { DashboardFooter } from "@/components/dashboard/DashboardFooter";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { AlertsSection } from "@/components/dashboard/sections/AlertsSection";
import { AnalyticsSection } from "@/components/dashboard/sections/AnalyticsSection";
import { MonitorDashboardView } from "@/components/dashboard/sections/DashboardSection";
import { SettingsSection } from "@/components/dashboard/sections/SettingsSection";
import { useSecomMonitor } from "@/hooks/use-secom-monitor";
import { shellLayout } from "@/lib/dashboard-layout";
import { getFooterInferenceLabel } from "@/lib/inference-mode";
import type { DashboardSection } from "@/types/secom";

const SECTION_META: Record<
  DashboardSection,
  { title: string; subtitle?: string; showLive?: boolean }
> = {
  dashboard: {
    title: "Real-Time Industrial Anomaly Monitor",
    subtitle:
      "Live monitoring and AI-driven anomaly detection for industrial sensor data",
    showLive: true,
  },
  analytics: {
    title: "Dataset & Model Analytics",
    subtitle: "SECOM dataset profile, autoencoder context, and inference contract",
  },
  alerts: {
    title: "Alerts / Event Log",
    subtitle: "Anomaly history, system events, and scoring source",
  },
  settings: {
    title: "Simulation Control Center",
    subtitle:
      "Configure stream replay, scoring behavior, thresholds, and dashboard runtime preferences",
  },
};

export function AppShell() {
  const monitor = useSecomMonitor();
  const [activeSection, setActiveSection] = useState<DashboardSection>("dashboard");

  const systemHealthy =
    monitor.currentPacket?.processStatus !== "Critical" &&
    monitor.currentPacket?.processStatus !== "Warning";

  return (
    <div className="min-h-screen bg-bg-page text-text-primary">

      <Sidebar activeSection={activeSection} onNavigate={setActiveSection} />

      <Topbar
        sectionTitle={SECTION_META[activeSection].title}
        subtitle={SECTION_META[activeSection].subtitle}
        showLiveIndicator={SECTION_META[activeSection].showLive ?? false}
        statusChips={
          SECTION_META[activeSection].showLive
            ? [
                "SECOM Dataset",
                "Dataset Replay",
                getFooterInferenceLabel(
                  monitor.currentPacket?.source,
                  monitor.apiStatus,
                  monitor.apiModeEnabled,
                ),
              ]
            : undefined
        }
        streamStatus={monitor.streamStatus}
        simulatedClock={monitor.simulatedClock}
        systemHealthy={systemHealthy}
        rowsLoaded={monitor.rowsLoaded}
        isProcessing={monitor.isProcessing}
        onStart={monitor.startStream}
        onPause={monitor.pauseStream}
        onReset={monitor.resetStream}
        onInject={monitor.injectAnomaly}
      />

      <main
        className={cn(
          "relative flex h-screen max-h-screen flex-col overflow-hidden bg-bg-page",
          shellLayout.mainOffset,
        )}
      >
        <div className="animate-slide-up flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 lg:p-5">
          {activeSection === "dashboard" && (
            <MonitorDashboardView monitor={monitor} className="min-h-0 flex-1" />
          )}
          {activeSection === "analytics" && (
            <div className="min-h-0 flex-1 overflow-y-auto">
              <AnalyticsSection monitor={monitor} />
            </div>
          )}
          {activeSection === "alerts" && (
            <div className="min-h-0 flex-1 overflow-y-auto">
              <AlertsSection monitor={monitor} />
            </div>
          )}
          {activeSection === "settings" && (
            <div className="min-h-0 flex-1 overflow-y-auto">
              <SettingsSection monitor={monitor} />
            </div>
          )}

          <DashboardFooter
            streamStatus={monitor.streamStatus}
            apiStatus={monitor.apiStatus}
            packetCounter={monitor.packetCounter}
            scoringSource={monitor.currentPacket?.source}
            apiModeEnabled={monitor.apiModeEnabled}
          />
        </div>
      </main>
    </div>
  );
}
