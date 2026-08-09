"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { PhaseDef, getPhaseProgress, getPhaseStatus } from "@/lib/phases";
import type { PhaseProgress } from "@/lib/types";
import { useWorkspace } from "@/lib/workspace-store";
import { PhaseIcon, MoreIcon, ExternalLinkIcon, ResetIcon, TrashIcon } from "@/components/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function PhaseCardFrame({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "group relative h-full rounded-xl glass p-5 transition-all hover:border-primary/40 hover:shadow-[0_0_0_1px_rgba(139,92,246,0.15),0_8px_28px_-12px_rgba(139,92,246,0.35)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function PhaseCardBody({
  phase,
  progress,
  action,
}: {
  phase: PhaseDef;
  progress: PhaseProgress;
  action?: ReactNode;
}) {
  const status = getPhaseStatus(progress);
  const statusLabel =
    status === "complete"
      ? "100% Complete"
      : status === "in-progress"
        ? `${progress.percent}% Complete`
        : "Not started";

  return (
    <>
      <div className="flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-accent-foreground">
          <PhaseIcon name={phase.icon} className="h-4.5 w-4.5" />
        </div>
        {action}
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
    </>
  );
}

export function PhaseCard({ phase, isCustom = false }: { phase: PhaseDef; isCustom?: boolean }) {
  const { data, resetPhase, removeCustomStage } = useWorkspace();
  const progress = getPhaseProgress(phase, data);

  return (
    <PhaseCardFrame>
      <Link
        href={`/canvas/${phase.id}`}
        aria-label={`Open ${phase.label}`}
        className="absolute inset-0 z-0 rounded-xl"
      />

      <div className="pointer-events-none relative z-10">
        <PhaseCardBody
          phase={phase}
          progress={progress}
          action={
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Stage options"
                className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground opacity-0 outline-none transition-opacity hover:bg-secondary hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100 data-[state=open]:bg-secondary"
              >
                <MoreIcon className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem asChild>
                  <Link href={`/canvas/${phase.id}`}>
                    <ExternalLinkIcon className="h-4 w-4" />
                    Open
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => resetPhase(phase.id)}>
                  <ResetIcon className="h-4 w-4" />
                  Reset progress
                </DropdownMenuItem>
                {isCustom && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => removeCustomStage(phase.id)}
                    >
                      <TrashIcon className="h-4 w-4" />
                      Remove stage
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          }
        />
      </div>
    </PhaseCardFrame>
  );
}
