import type { ReactNode } from "react";
import { PhaseDef, getPhaseStatus } from "@/lib/phases";
import type { PhaseProgress } from "@/lib/types";
import { PhaseIcon } from "@/components/phase-icon";
import { cn } from "@/lib/utils";

/**
 * The visual body of a phase card.
 *
 * Shared deliberately: the live Canvas board (PhaseCard) wraps this with a
 * stretched link and the options menu, and the marketing site renders it bare
 * with static progress. The landing is showing the actual product component —
 * so it can't drift into a lookalike that flatters what we've really built.
 */
export function PhaseCardBody({
  phase,
  progress,
  action,
}: {
  phase: PhaseDef;
  progress: PhaseProgress;
  /** Options menu on the board; nothing on the marketing site. */
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
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary">
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

/** The card chrome itself — same glass treatment on the board and the site. */
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
