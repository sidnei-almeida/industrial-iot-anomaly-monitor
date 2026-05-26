"use client";

import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Brain,
  ChevronRight,
  Gauge,
  Layers,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { DEFAULT_API_THRESHOLD, DISPLAY_THRESHOLD } from "@/lib/constants";
import { MODEL_PIPELINE_STEPS } from "@/lib/model-analytics";
import { cn } from "@/lib/utils";

const BADGES = ["Unsupervised", "Reconstruction-based", "Anomaly Detection"] as const;

const FLOW_ICONS: LucideIcon[] = [Layers, Brain, Sparkles, Brain, Activity, ShieldCheck];

const EXPLANATION_BLOCKS = [
  {
    title: "Learn Normal Behavior",
    text: "The autoencoder learns to reconstruct normal manufacturing sensor patterns.",
    icon: Brain,
  },
  {
    title: "Measure Reconstruction Error",
    text: "Each input sample is compared with its reconstructed version to calculate reconstruction error.",
    icon: Gauge,
  },
  {
    title: "Detect Anomalies",
    text: "If the reconstruction error exceeds the threshold, the sample is flagged as anomalous.",
    icon: AlertTriangle,
  },
] as const;

function ModelFlowStrip() {
  return (
    <div className="border-b border-border bg-[var(--border-subtle)] px-3 py-2.5">
      <p className="mb-2 text-[9px] font-semibold uppercase tracking-wide text-text-secondary">
        Model flow
      </p>
      <div className="overflow-x-auto [scrollbar-width:thin]">
        <div className="flex min-w-max items-stretch gap-0">
          {MODEL_PIPELINE_STEPS.map((step, index) => {
            const Icon = FLOW_ICONS[index] ?? Layers;
            return (
              <div key={step} className="flex items-center">
                <div className="flex min-w-[88px] max-w-[120px] flex-col items-center gap-1 px-1 text-center">
                  <Icon className="size-3.5 text-text-secondary" strokeWidth={1.75} />
                  <span className="text-[9px] font-medium leading-tight text-text-secondary">
                    {step}
                  </span>
                </div>
                {index < MODEL_PIPELINE_STEPS.length - 1 ? (
                  <ChevronRight className="mx-0.5 size-3 shrink-0 text-text-muted" aria-hidden />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ExplanationBlock({
  title,
  text,
  icon: Icon,
}: {
  title: string;
  text: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex min-h-0 flex-col rounded-md border border-border bg-bg-card-subtle p-2.5">
      <div className="mb-1.5 flex items-center gap-1.5">
        <Icon className="size-3.5 shrink-0 text-text-muted" strokeWidth={1.75} />
        <p className="text-[10px] font-semibold text-text-primary">{title}</p>
      </div>
      <p className="flex-1 text-[10px] leading-snug text-text-muted">{text}</p>
    </div>
  );
}

function DecisionLogicSummary() {
  return (
    <div className="border-t border-border bg-bg-card-subtle px-3 py-2.5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-wide text-text-muted">
            Decision logic
          </p>
          <ul className="mt-1.5 space-y-1 text-[10px]">
            <li className="flex items-start gap-2">
              <ArrowRight className="mt-0.5 size-3 shrink-0 text-text-muted" />
              <span>
                Reconstruction error{" "}
                <span className="font-mono text-text-secondary">&gt; {DEFAULT_API_THRESHOLD}</span>
                <span className="text-danger"> → Anomaly</span>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="mt-0.5 size-3 shrink-0 text-text-muted" />
              <span>
                Reconstruction error{" "}
                <span className="font-mono text-text-secondary">≤ {DEFAULT_API_THRESHOLD}</span>
                <span className="text-normal"> → Normal</span>
              </span>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-wide text-text-muted">
            Dashboard mapping
          </p>
          <ul className="mt-1.5 space-y-1 text-[10px] text-text-muted">
            <li className="flex items-start gap-2">
              <ArrowRight className="mt-0.5 size-3 shrink-0 text-text-muted" />
              <span>
                Raw reconstruction error → display score{" "}
                <span className="font-mono text-text-secondary">(0–100)</span>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="mt-0.5 size-3 shrink-0 text-text-muted" />
              <span>
                API threshold{" "}
                <span className="font-mono text-text-secondary">{DEFAULT_API_THRESHOLD}</span>
                {" → "}visual alert at{" "}
                <span className="font-mono text-text-secondary">{DISPLAY_THRESHOLD}</span>
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export function HowModelWorksPanel({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <ModelFlowStrip />

      <div className="flex min-h-0 flex-1 flex-col gap-2 p-3">
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-3">
          {EXPLANATION_BLOCKS.map((block) => (
            <ExplanationBlock
              key={block.title}
              title={block.title}
              text={block.text}
              icon={block.icon}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {BADGES.map((badge) => (
            <span
              key={badge}
              className="rounded-md bg-[var(--border-subtle)] px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-text-muted"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>

      <DecisionLogicSummary />
    </div>
  );
}
