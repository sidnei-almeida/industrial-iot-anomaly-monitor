import { DISPLAY_THRESHOLD } from "@/lib/constants";
import type {
  EventLogEntry,
  EventLogLevel,
  EventLogStatus,
  ProcessStatus,
  StreamPacket,
} from "@/types/secom";

export function formatEventTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function shortActionForStatus(status: ProcessStatus): string {
  if (status === "Critical") return "Inspect calibration";
  if (status === "Warning") return "Review drift";
  return "Continue monitoring";
}

export function topSensorForDisplay(
  topContributingSensor: string,
  processStatus: ProcessStatus,
): string {
  if (processStatus === "Normal") return "None";
  const name = topContributingSensor.split(" (")[0]?.trim();
  return name || "—";
}

export function eventLabelForPacket(
  level: EventLogLevel,
  injected: boolean,
  displayScore: number,
): string {
  if (injected && displayScore >= DISPLAY_THRESHOLD) return "Anomaly detected";
  if (injected) return "Failure sample injected";
  if (level === "critical") return "Anomaly detected";
  if (level === "warning") return "Warning";
  return "Packet processed";
}

export function statusForLevel(
  level: EventLogLevel,
  processStatus?: ProcessStatus,
): EventLogStatus {
  if (level === "system") return "System";
  if (processStatus) return processStatus;
  if (level === "critical") return "Critical";
  if (level === "warning") return "Warning";
  return "Normal";
}

export function eventFromPacket(
  packet: StreamPacket,
  message: string,
  level: EventLogLevel,
): EventLogEntry {
  return {
    id: `${packet.packetId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: formatEventTime(new Date(packet.simulatedTimestamp)),
    message,
    level,
    packetId: packet.packetId,
    event: eventLabelForPacket(level, packet.injected, packet.displayScore),
    status: packet.processStatus,
    displayScore: packet.displayScore,
    displayThreshold: packet.displayThreshold,
    groundTruthLabel: packet.groundTruthLabel,
    source: packet.source,
    topSensor: topSensorForDisplay(packet.topContributingSensor, packet.processStatus),
    action: shortActionForStatus(packet.processStatus),
  };
}

function inferSystemEvent(message: string): { event: string; status: EventLogStatus } {
  const lower = message.toLowerCase();
  if (lower.includes("switched to local scoring") || lower.includes("api unavailable")) {
    return { event: "Local scoring active", status: "System" };
  }
  if (lower.includes("local scoring")) {
    return { event: "Local scoring active", status: "System" };
  }
  if (lower.includes("dataset replay")) {
    return { event: "Dataset replay active", status: "System" };
  }
  if (lower.includes("paused") || lower.includes("end of dataset")) {
    return { event: "Stream paused", status: "System" };
  }
  if (lower.includes("stream started") || lower.includes("started")) {
    return { event: "Stream started", status: "System" };
  }
  if (lower.includes("reset")) {
    return { event: "Simulation reset", status: "System" };
  }
  if (lower.includes("connected") || lower.includes("api")) {
    return { event: "API status change", status: "System" };
  }
  if (lower.includes("dataset loaded")) {
    return { event: "Dataset loaded", status: "System" };
  }
  if (lower.includes("failed") || lower.includes("cannot")) {
    return { event: "System alert", status: "System" };
  }
  return { event: "System event", status: "System" };
}

export function createSystemEvent(
  message: string,
  level: EventLogLevel = "info",
  packetId?: number,
): EventLogEntry {
  const { event, status } = inferSystemEvent(message);
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: formatEventTime(new Date()),
    message,
    level,
    packetId,
    event,
    status,
    action: "—",
    topSensor: "—",
  };
}

export function computeEventSummary(events: EventLogEntry[]) {
  let critical = 0;
  let warnings = 0;
  let local = 0;

  for (const e of events) {
    if (e.status === "Critical" || e.level === "critical") critical += 1;
    if (e.status === "Warning" || e.level === "warning") warnings += 1;
    if (
      e.source === "local" ||
      e.source === "api_fallback" ||
      e.event.toLowerCase().includes("local scoring")
    ) {
      local += 1;
    }
  }

  return {
    total: events.length,
    critical,
    warnings,
    local,
  };
}
