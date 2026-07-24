"use client";

import { useWorkspace } from "@/lib/workspace-store";
import { useSync } from "@/lib/sync-store";
import { getPhase, getPhaseProgress } from "@/lib/phases";
import { buildValidationPrompt } from "@/lib/prompts";
import { PhaseHeader } from "./PhaseHeader";
import { CopyButton } from "./CopyButton";
import { CheckIcon, CompassIcon, GithubIcon, WandIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export function ValidationPhase() {
  const { data, isStepDone, toggleChecklist } = useWorkspace();
  const { result, status } = useSync();
  const phase = getPhase("validation")!;
  const progress = getPhaseProgress(phase, data);
  const steps = phase.steps ?? [];
  const commits = result?.commits ?? [];

  // Focus = first incomplete step; Next = the one after.
  const firstIncomplete = steps.findIndex((s) => !isStepDone("validation", s.id));
  const focus = steps[firstIncomplete] ?? steps[steps.length - 1];
  const next = steps[firstIncomplete + 1];

  return (
    <>
      <PhaseHeader title="Validation Phase" status="in-progress" phaseId="validation" showTeam />

      {/* Focus / Next */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border-l-2 border-l-primary border-y border-r border-border bg-card p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
            <CompassIcon className="h-3.5 w-3.5" />
            Current Focus
          </div>
          <h3 className="mt-3 text-lg font-semibold">{focus?.label}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{focus?.description}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <CompassIcon className="h-3.5 w-3.5" />
            Next Suggested
          </div>
          <h3 className="mt-3 text-lg font-semibold">
            {next?.label ?? "Wrap up validation"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {next?.description ?? "You're ready to move to Prototype."}
          </p>
        </div>
      </div>

      {/* Workflow steps */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Workflow Steps</h2>
          <div className="flex items-center gap-3">
            <div className="h-1 w-28 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <span className="text-sm text-muted-foreground">{progress.percent}%</span>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {steps.map((step, i) => {
            const done = isStepDone("validation", step.id);
            const isActive = i === firstIncomplete;
            return (
              <button
                key={step.id}
                onClick={() => toggleChecklist("validation", step.id)}
                className={cn(
                  "flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-colors",
                  isActive
                    ? "border-primary/40 bg-accent/40"
                    : "border-border bg-card hover:border-border/80"
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                    done
                      ? "bg-primary/15 text-primary"
                      : isActive
                        ? "bg-primary text-primary-foreground"
                        : "border border-border text-muted-foreground"
                  )}
                >
                  {done ? <CheckIcon className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{step.label}</div>
                  <div className="truncate text-sm text-muted-foreground">
                    {done ? "Completed" : isActive ? "Ready · in progress" : step.description}
                  </div>
                </div>
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide",
                    done
                      ? "bg-secondary text-muted-foreground"
                      : isActive
                        ? "bg-primary/15 text-primary"
                        : "bg-secondary text-muted-foreground"
                  )}
                >
                  {done ? "COMPLETED" : isActive ? "READY" : "NOT STARTED"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Research prompt */}
      <div className="mt-8 flex items-center gap-4 rounded-xl border border-border bg-card p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
          <WandIcon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium">Generate a research plan</div>
          <div className="truncate text-sm text-muted-foreground">
            Personas, an interview script, and a go/pivot signal
          </div>
        </div>
        <CopyButton value={buildValidationPrompt(data)} label="Copy" variant="solid" />
      </div>

      {/* Repository activity (real, from sync) */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold">Repository Activity</h2>
        {commits.length > 0 ? (
          <div className="mt-4 space-y-2">
            {commits.slice(0, 6).map((c) => (
              <div
                key={c.sha}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                  <GithubIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{c.message}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.author} · {c.sha}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {status === "disconnected"
              ? "Connect GitHub in Settings to see repository activity."
              : status === "no-repo"
                ? "Link a repository in Settings to see commits here."
                : "No commits yet."}
          </div>
        )}
      </div>
    </>
  );
}
