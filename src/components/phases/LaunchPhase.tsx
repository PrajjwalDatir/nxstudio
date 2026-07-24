"use client";

import { useWorkspace } from "@/lib/workspace-store";
import { getPhase, getPhaseProgress } from "@/lib/phases";
import { compileStack } from "@/lib/platform-engine";
import { buildLaunchPrompt } from "@/lib/prompts";
import { PhaseHeader } from "./PhaseHeader";
import { CopyButton } from "./CopyButton";
import { CheckIcon, RocketIcon, WandIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export function LaunchPhase() {
  const { data, isStepDone, toggleChecklist } = useWorkspace();
  const phase = getPhase("launch")!;
  const progress = getPhaseProgress(phase, data);
  const steps = phase.steps ?? [];
  const stack = compileStack(data.tech);

  const firstIncomplete = steps.findIndex((s) => !isStepDone("launch", s.id));
  const focus = steps[firstIncomplete] ?? steps[steps.length - 1];

  return (
    <>
      <PhaseHeader title="Launch" status="in-progress" meta="Due Oct 24" showTeam />

      {/* Launch prompt */}
      <div className="mb-6 flex items-center gap-4 rounded-xl border border-border bg-card p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
          <WandIcon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium">Generate the launch runbook</div>
          <div className="truncate text-sm text-muted-foreground">
            Deploy, domain, analytics, waitlist, and a launch post
          </div>
        </div>
        <CopyButton value={buildLaunchPrompt(data)} label="Copy" variant="solid" />
      </div>

      {/* Focus */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <RocketIcon className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Current Focus
            </div>
            <div className="font-semibold">{focus?.label}</div>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {progress.done >= progress.total
            ? `${data.productName} is live. 🎉`
            : `${focus?.description}${stack ? ` Deploying to ${stack.hosting}.` : ""}`}
        </p>
      </div>

      {/* Launch checklist */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Launch Checklist</h2>
          <div className="flex items-center gap-3">
            <div className="h-1 w-28 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-primary" style={{ width: `${progress.percent}%` }} />
            </div>
            <span className="text-sm text-muted-foreground">{progress.percent}%</span>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {steps.map((step, i) => {
            const done = isStepDone("launch", step.id);
            return (
              <button
                key={step.id}
                onClick={() => toggleChecklist("launch", step.id)}
                className={cn(
                  "flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-colors",
                  done ? "border-border bg-card" : "border-border bg-card hover:border-primary/40"
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs",
                    done ? "bg-primary/15 text-primary" : "border border-border text-muted-foreground"
                  )}
                >
                  {done ? <CheckIcon className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className={cn("font-medium", done && "text-muted-foreground line-through")}>
                    {step.label}
                  </div>
                  <div className="truncate text-sm text-muted-foreground">{step.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
