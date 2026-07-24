"use client";

import Link from "next/link";
import { PhaseDef, getPhaseProgress, getPhaseStatus } from "@/lib/phases";
import { useWorkspace } from "@/lib/workspace-store";
import { PhaseIcon } from "@/components/phase-icon";
import { MoreIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export function PhaseCard({ phase, index }: { phase: PhaseDef; index: number }) {
  const { data } = useWorkspace();
  const progress = getPhaseProgress(phase, data);
  const status = getPhaseStatus(progress);

  const statusLabel =
    status === "complete"
      ? "100% Complete"
      : status === "in-progress"
        ? `${progress.percent}% Complete`
        : "Not started";

  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <Link
        href={`/phase/${phase.id}`}
        className="group block h-full rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-[0_0_0_1px_rgba(139,92,246,0.15)]"
      >
        <div className="flex items-start justify-between">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary">
            <PhaseIcon name={phase.icon} className="h-4.5 w-4.5" />
          </div>
          <MoreIcon className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </div>

        <h3 className="mt-4 font-semibold">{phase.label}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {phase.description}
        </p>

        <div className="mt-5">
          <div className="flex items-center justify-between text-xs">
            <span
              className={cn(
                "font-medium",
                status === "not-started" ? "text-muted-foreground" : "text-foreground"
              )}
            >
              {statusLabel}
            </span>
            <span className="text-muted-foreground">
              {progress.done}/{progress.total}
            </span>
          </div>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      </Link>
    </div>
  );
}
