"use client";

import { BootScreen } from "@/components/BootScreen";
import { AppShell } from "@/components/dashboard/AppShell";
import { useApiWakeup } from "@/hooks/use-api-wakeup";
import { cn } from "@/lib/utils";

export function DashboardPage() {
  const wakeup = useApiWakeup();

  if (!wakeup.ready) {
    return (
      <BootScreen
        phase={wakeup.phase}
        steps={wakeup.steps}
        statusMessage={wakeup.statusMessage}
        retryCount={wakeup.retryCount}
        elapsedMs={wakeup.elapsedMs}
        showSlowMessage={wakeup.showSlowMessage}
        inferenceOnline={wakeup.inferenceOnline}
        healthCheckUrl={wakeup.healthCheckUrl}
        onRetry={wakeup.retryNow}
      />
    );
  }

  return (
    <div className={cn("min-h-screen animate-fade-in")}>
      <AppShell />
    </div>
  );
}
