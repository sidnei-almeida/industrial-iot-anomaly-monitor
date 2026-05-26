"use client";

import type { LucideIcon } from "lucide-react";
import { Box, GitBranch, Layers } from "lucide-react";

import { ClassDistributionPanel } from "@/components/dashboard/analytics/ClassDistributionPanel";
import { HowModelWorksPanel } from "@/components/dashboard/analytics/HowModelWorksPanel";
import { DashboardPanel, PanelHeader } from "@/components/dashboard/DashboardPanel";
import type { SecomMonitor } from "@/hooks/use-secom-monitor";
import {
  CSV_FEATURE_COUNT,
  DEFAULT_API_THRESHOLD,
  DISPLAY_THRESHOLD,
  MODEL_FEATURE_COUNT,
} from "@/lib/constants";
import {
  DATA_SOURCE_LABEL,
  STREAM_MODE_LABEL,
} from "@/lib/inference-mode";
import {
  AUTOENCODER_VALUE_CARDS,
  getApiIntegrationLabel,
  getDashboardModeSummary,
  getDatasetModelAlignmentRows,
  INFERENCE_CONTRACT,
  MODEL_FILE_NAME,
  MODEL_REPO_URL,
} from "@/lib/model-analytics";
import { cn } from "@/lib/utils";

interface AnalyticsSectionProps {
  monitor: SecomMonitor;
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="lux-card px-4 py-4">
      <p className="stat-kpi-label">{label}</p>
      <p className={cn("stat-kpi-value mt-1", accent ?? "text-text-primary")}>{value}</p>
      {sub ? <p className="mt-1 text-[10px] text-text-muted">{sub}</p> : null}
    </div>
  );
}

function SpecRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="spec-row flex justify-between gap-3 py-1.5 text-[11px]">
      <span className="shrink-0 text-text-secondary">{label}</span>
      <span className={cn("text-right text-text-primary", mono && "font-mono text-[10px]")}>
        {value}
      </span>
    </div>
  );
}

function CodeBlock({ title, code }: { title: string; code: string }) {
  return (
    <div>
      <p className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-text-secondary">
        {title}
      </p>
      <pre className="code-block">{code}</pre>
    </div>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="meta-chip">
      <p className="text-[8px] font-medium uppercase tracking-wide text-text-secondary">{label}</p>
      <p className="mt-0.5 truncate text-[10px] font-medium text-text-primary">{value}</p>
    </div>
  );
}

function ApiStatusBadge({ label }: { label: string }) {
  const isDisabled = label.toLowerCase().includes("disabled");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
        isDisabled
          ? "badge-status-source border-0"
          : "badge-status-normal border-0",
      )}
    >
      {label}
    </span>
  );
}

function ValueCard({ title, body, icon: Icon }: { title: string; body: string; icon: LucideIcon }) {
  return (
    <div className="value-card">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-md border border-border bg-bg-card-subtle">
          <Icon className="size-3.5 text-text-secondary" />
        </div>
        <p className="text-[11px] font-semibold text-text-primary">{title}</p>
      </div>
      <p className="text-[11px] leading-snug text-text-muted">{body}</p>
    </div>
  );
}

export function AnalyticsSection({ monitor }: AnalyticsSectionProps) {
  const a = monitor.analytics;

  if (!monitor.rowsLoaded || !a) {
    return (
      <DashboardPanel className="flex h-[320px] items-center justify-center">
        <p className="p-6 text-sm text-text-muted">Loading dataset & model analytics…</p>
      </DashboardPanel>
    );
  }

  const dashboardMode = getDashboardModeSummary(
    monitor.apiModeEnabled,
    monitor.useApi,
    monitor.apiStatus,
    monitor.currentPacket?.source,
  );

  const alignmentRows = getDatasetModelAlignmentRows({
    totalRows: a.totalSamples,
    featureCount: a.featureCount,
    adapterReady: monitor.featureAdapter.ready,
    apiModeEnabled: monitor.apiModeEnabled,
    useApi: monitor.useApi,
    apiStatus: monitor.apiStatus,
    scoringSource: monitor.currentPacket?.source,
  });

  return (
    <div className="flex flex-col gap-2 pb-1">
      {/* Row 1 — dataset KPIs */}
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total samples" value={a.totalSamples.toLocaleString()} />
        <StatCard label="Sensor features" value={String(a.featureCount)} />
        <StatCard
          label="Normal samples"
          value={a.normalSamples.toLocaleString()}
          accent="text-normal"
        />
        <StatCard
          label="Failure samples"
          value={a.failureSamples.toLocaleString()}
          accent="text-danger"
        />
        <StatCard
          label="Failure rate"
          value={`${a.failureRate.toFixed(1)}%`}
          accent="text-text-primary"
        />
        <StatCard label="Missing values" value={String(a.missingValues)} sub="Cleaned export" />
      </div>

      {/* Row 2 — distribution + quality (equal-height row) */}
      <div className="grid grid-cols-12 items-stretch gap-2">
        <ClassDistributionPanel
          className="col-span-12 lg:col-span-5"
          normalSamples={a.normalSamples}
          failureSamples={a.failureSamples}
          failureRate={a.failureRate}
        />

        <DashboardPanel className="col-span-12 flex min-h-[340px] flex-col lg:col-span-4">
          <PanelHeader title="Dataset quality" subtitle={DATA_SOURCE_LABEL} />
          <div className="flex flex-1 flex-col justify-between p-3">
            <div>
              <SpecRow label="Data source" value={DATA_SOURCE_LABEL} />
              <SpecRow label="Stream mode" value={STREAM_MODE_LABEL} />
              <SpecRow label="Completeness" value="100%" />
              <SpecRow label="Numeric features" value={String(a.featureCount)} />
              <SpecRow
                label="Imbalance ratio"
                value={`~${(a.normalSamples / Math.max(a.failureSamples, 1)).toFixed(0)}:1`}
              />
              <SpecRow label="Time span" value="2008 manufacturing" />
            </div>
            <p className="mt-2 rounded-md border border-border bg-bg-card-subtle p-2 text-[10px] text-text-muted">
              Cleaned export with no missing values — suitable for replay simulation and
              reconstruction-based scoring.
            </p>
          </div>
        </DashboardPanel>

        <DashboardPanel className="col-span-12 flex min-h-[340px] flex-col lg:col-span-3">
          <PanelHeader title="Failure pattern" subtitle="Ground-truth summary" />
          <div className="flex flex-1 flex-col gap-2 p-3 text-[11px]">
            <p className="text-text-secondary">
              {a.failureSamples} failure rows ({a.failureRate.toFixed(1)}%) for inject-anomaly
              simulation and model validation.
            </p>
            <div className="rounded-md border border-border bg-bg-card-subtle p-2">
              <p className="text-[10px] font-medium text-text-secondary">Class imbalance</p>
              <p className="mt-1 text-[10px] text-text-muted">
                ~{(a.normalSamples / Math.max(a.failureSamples, 1)).toFixed(0)} normal samples per
                failure — typical for rare-event monitoring.
              </p>
            </div>
            <p className="mt-auto rounded-md border border-red-border bg-red-subtle p-2 text-danger">
              Sparse failures — surface rare high-risk events without alert noise.
            </p>
          </div>
        </DashboardPanel>
      </div>

      {/* Row 3 — model context */}
      <div className="grid grid-cols-12 items-stretch gap-2">
        <DashboardPanel className="col-span-12 flex min-h-[380px] flex-col lg:col-span-4">
          <PanelHeader
            title="Model Overview"
            subtitle="Trained artifact · metadata only"
          />
          <div className="grid grid-cols-2 gap-1.5 px-3 pb-2">
            <MetaChip label="Model type" value="Autoencoder" />
            <MetaChip label="Artifact" value={MODEL_FILE_NAME} />
            <MetaChip label="Input" value="SECOM feature vector" />
            <MetaChip label="Output" value="Reconstruction error" />
            <MetaChip label="Threshold" value={`>${DEFAULT_API_THRESHOLD} = anomaly`} />
            <MetaChip label="Dashboard" value={dashboardMode} />
          </div>
          <div className="flex flex-1 flex-col border-t border-border p-3 pt-2">
            <SpecRow label="Task" value="Semiconductor process anomaly detection" />
            <SpecRow
              label="Display threshold"
              value={`${DISPLAY_THRESHOLD} / 100 risk scale`}
            />
            <SpecRow label="Repository" value="secom_failure_prediction" mono />
            <a
              href={MODEL_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex text-[10px] text-normal opacity-90 hover:opacity-100"
            >
              View model in reference repo →
            </a>
            <p className="mt-auto pt-2 text-[9px] leading-snug text-text-muted">
              Weights are not executed in the browser. Scoring uses FastAPI when enabled, otherwise
              local scoring during dataset replay.
            </p>
          </div>
        </DashboardPanel>

        <DashboardPanel className="col-span-12 flex min-h-[380px] flex-col lg:col-span-4">
          <PanelHeader title="How the Model Works" subtitle="Reconstruction-based detection" />
          <HowModelWorksPanel className="flex-1" />
        </DashboardPanel>

        <DashboardPanel className="col-span-12 flex min-h-[380px] flex-col lg:col-span-4">
          <PanelHeader
            title="Inference Contract"
            subtitle={INFERENCE_CONTRACT.architectureNote}
          />
          <div className="flex flex-1 flex-col gap-2 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <ApiStatusBadge
                label={getApiIntegrationLabel(monitor.apiModeEnabled, monitor.apiStatus)}
              />
              <span className="text-[9px] text-text-muted">
                Not called unless API mode is enabled
              </span>
            </div>
            <div className="meta-chip">
              <p className="text-[8px] font-semibold uppercase tracking-wide text-text-muted">
                Endpoint
              </p>
              <p className="mt-0.5 font-mono text-[11px] text-normal">
                {INFERENCE_CONTRACT.endpoint}
              </p>
            </div>
            <CodeBlock title="Request" code={INFERENCE_CONTRACT.payload} />
            <CodeBlock title="Response" code={INFERENCE_CONTRACT.response} />
            <p className="text-[9px] text-text-muted">{INFERENCE_CONTRACT.displayThresholdNote}</p>
          </div>
        </DashboardPanel>
      </div>

      {/* Row 4 — sensors + alignment */}
      <div className="grid grid-cols-12 items-stretch gap-2">
        <DashboardPanel className="col-span-12 flex min-h-[260px] flex-col lg:col-span-4">
          <PanelHeader title="Visible sensor variance" subtitle="Columns 0–5 overview" />
          <div className="overflow-x-auto p-2">
            <table className="w-full text-left text-[10px]">
              <thead className="text-text-muted">
                <tr>
                  <th className="pb-2 pr-2">Sensor</th>
                  <th className="pb-2 pr-2">Min</th>
                  <th className="pb-2 pr-2">Max</th>
                  <th className="pb-2 pr-2">Mean</th>
                  <th className="pb-2">Variance</th>
                </tr>
              </thead>
              <tbody>
                {a.visibleSensorStats.map((s) => (
                  <tr
                    key={s.columnIndex}
                    className="border-t border-border text-text-secondary transition-colors hover:bg-[var(--hover-row)]"
                  >
                    <td className="py-1.5 pr-2 text-text-secondary">{s.name}</td>
                    <td className="py-1.5 pr-2 font-mono">{s.min.toFixed(3)}</td>
                    <td className="py-1.5 pr-2 font-mono">{s.max.toFixed(3)}</td>
                    <td className="py-1.5 pr-2 font-mono">{s.mean.toFixed(3)}</td>
                    <td className="py-1.5 font-mono text-normal">{s.variance.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardPanel>

        <DashboardPanel className="col-span-12 flex min-h-[260px] flex-col lg:col-span-4">
          <PanelHeader title="Top unstable sensors" subtitle="Highest variance (cols 0–5)" />
          <div className="space-y-1.5 p-2">
            {a.topUnstableSensors.map((s, i) => (
              <div
                key={s.columnIndex}
                className="flex items-center justify-between rounded-md border border-border bg-bg-card-subtle px-2 py-1.5 transition-colors hover:bg-bg-card-hover"
              >
                <span className="text-[11px] text-text-secondary">
                  #{i + 1} {s.name}
                </span>
                <span className="font-mono text-[10px] text-text-primary">
                  σ² {s.variance.toFixed(4)}
                </span>
              </div>
            ))}
          </div>
        </DashboardPanel>

        <DashboardPanel className="col-span-12 flex min-h-[260px] flex-col lg:col-span-4">
          <PanelHeader title="Dataset-to-Model Alignment" subtitle="Preprocessing bridge" />
          <div className="flex flex-1 flex-col justify-between p-3">
            <div>
              {alignmentRows.map((row) => (
                <SpecRow key={row.label} label={row.label} value={row.value} />
              ))}
            </div>
            <div className="mt-2 space-y-1.5">
              <div className="flex justify-between text-[9px] text-text-muted">
                <span>CSV columns</span>
                <span className="font-mono text-text-secondary">{CSV_FEATURE_COUNT}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--border-subtle)]">
                <div
                  className="h-full rounded-full bg-green/40"
                  style={{ width: `${(MODEL_FEATURE_COUNT / CSV_FEATURE_COUNT) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-text-muted">
                <span>Model input</span>
                <span className="font-mono text-text-secondary">{MODEL_FEATURE_COUNT} features</span>
              </div>
              <p className="text-[9px] leading-snug text-text-muted">
                Feature adapter maps replay rows before optional API inference.
              </p>
            </div>
          </div>
        </DashboardPanel>
      </div>

      {/* Row 5 — value proposition */}
      <div>
        <p className="mb-1.5 px-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
          Why Autoencoder for SECOM?
        </p>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <ValueCard
            title={AUTOENCODER_VALUE_CARDS[0].title}
            body={AUTOENCODER_VALUE_CARDS[0].body}
            icon={Layers}
          />
          <ValueCard
            title={AUTOENCODER_VALUE_CARDS[1].title}
            body={AUTOENCODER_VALUE_CARDS[1].body}
            icon={GitBranch}
          />
          <ValueCard
            title={AUTOENCODER_VALUE_CARDS[2].title}
            body={AUTOENCODER_VALUE_CARDS[2].body}
            icon={Box}
          />
        </div>
      </div>
    </div>
  );
}
