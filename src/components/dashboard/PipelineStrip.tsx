"use client";

import type { LucideIcon } from "lucide-react";
import { Bell, Brain, ChevronRight, LayoutGrid, Radio, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";

const steps: Array<{
  label: string;
  sub: string;
  icon: LucideIcon;
}> = [
  { label: "IoT Sensor Stream", sub: "Dataset replay", icon: Radio },
  { label: "Preprocessing", sub: "Filtering & normalization", icon: LayoutGrid },
  { label: "Anomaly Detection Model", sub: "Autoencoder", icon: Brain },
  { label: "Risk Score", sub: "0–100 scale", icon: ShieldCheck },
  { label: "Live Dashboard Alert", sub: "Real-time notifications", icon: Bell },
];

interface PipelineStripProps {
  className?: string;
  activeIndex?: number;
}

function StepSeparator() {
  return (
    <ChevronRight
      className="mx-2 size-[0.9rem] shrink-0 text-[var(--pipeline-separator)]"
      strokeWidth={1.75}
      aria-hidden
    />
  );
}

function PipelineStepPill({
  label,
  sub,
  icon: Icon,
  active = false,
  className,
}: {
  label: string;
  sub: string;
  icon: LucideIcon;
  active?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "pipeline-pill flex min-w-0 items-start gap-2 rounded-[6px] px-[0.9rem] py-[0.4rem]",
        active && "pipeline-pill-active",
        className,
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 size-3.5 shrink-0",
          active ? "text-accent-gold" : "text-text-secondary",
        )}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-[0.75rem] font-semibold leading-tight",
            active ? "text-accent-gold" : "text-text-primary",
          )}
        >
          {label}
        </p>
        <p className="mt-0.5 truncate text-[0.65rem] leading-snug text-text-muted">{sub}</p>
      </div>
    </div>
  );
}

export function PipelineStrip({ className, activeIndex = 2 }: PipelineStripProps) {
  const active = Math.min(Math.max(activeIndex, 0), steps.length - 1);

  return (
    <section className={cn("pipeline-strip", className)}>
      <div className="flex w-full items-center">
        {steps.map((step, index) => (
          <div key={step.label} className="flex min-w-0 flex-1 items-center">
            {index > 0 ? <StepSeparator /> : null}
            <PipelineStepPill
              label={step.label}
              sub={step.sub}
              icon={step.icon}
              active={index === active}
              className="w-full"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
