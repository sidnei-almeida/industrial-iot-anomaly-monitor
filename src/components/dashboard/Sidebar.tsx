"use client";

import { HelpCircle } from "lucide-react";

import { BrandMark } from "@/components/brand/brand-mark";
import { NAV_ITEMS } from "@/lib/dashboard-nav";
import { shellLayout } from "@/lib/dashboard-layout";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { DashboardSection } from "@/types/secom";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeSection: DashboardSection;
  onNavigate: (section: DashboardSection) => void;
}

export function Sidebar({ activeSection, onNavigate }: SidebarProps) {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col bg-bg-sidebar",
        shellLayout.sidebarWidthClass,
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center justify-center",
          shellLayout.topbarHeightClass,
        )}
      >
        <button
          type="button"
          aria-label="Home — Dashboard"
          onClick={() => onNavigate("dashboard")}
          className="flex size-9 items-center justify-center text-text-muted transition-colors hover:text-text-secondary"
        >
          <BrandMark className="size-[20px]" strokeWidth={2} />
        </button>
      </div>

      <nav className="flex flex-1 flex-col items-center gap-1 px-2 py-4">
        {NAV_ITEMS.map(({ id, icon: Icon, label }) => {
          const active = activeSection === id;
          return (
            <Tooltip key={id}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={label}
                  aria-current={active ? "page" : undefined}
                  onClick={() => onNavigate(id)}
                  className={cn(
                    "relative flex size-10 items-center justify-center rounded-lg transition-colors",
                    active ? "text-accent-gold" : "text-text-muted hover:text-text-secondary",
                  )}
                >
                  <Icon
                    className="relative size-[18px]"
                    strokeWidth={active ? 2.25 : 1.75}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      <div className="flex shrink-0 flex-col items-center px-2 py-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Help"
              className="flex size-10 items-center justify-center rounded-lg text-text-muted transition-colors hover:text-text-secondary"
            >
              <HelpCircle className="size-[18px]" strokeWidth={1.75} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Help</TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}
