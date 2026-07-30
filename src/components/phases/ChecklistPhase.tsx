"use client";

import { useState } from "react";
import { useWorkspace } from "@/lib/workspace-store";
import { CheckIcon, PlusIcon, TrashIcon, LayersIcon } from "@/components/icons";
import { PhaseHeader } from "@/components/phases/PhaseHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DEFAULT_STEPS = [
  { id: "foundation", label: "Project Foundation & Setup", description: "Environment, workspace, shared utilities." },
  { id: "core", label: "Core Features Implementation", description: "Data models, auth, main modules." },
  { id: "polish", label: "Polish & Deployment", description: "Optimization and production pipeline." },
];

export function ChecklistPhase() {
  const { isStepDone, toggleChecklist, addCustomStep, removeCustomStep, customStages } = useWorkspace();
  const [label, setLabel] = useState("");

  const checklistCustom = customStages.find((s) => s.id === "checklist")?.steps ?? [];
  const allSteps = [...DEFAULT_STEPS, ...checklistCustom];
  const done = allSteps.filter((s) => isStepDone("checklist", s.id) || isStepDone("build", s.id)).length;
  const total = allSteps.length;
  const status = total > 0 && done >= total ? "complete" : "in-progress";

  const add = () => {
    const l = label.trim();
    if (!l) return;
    addCustomStep("checklist", l);
    setLabel("");
  };

  return (
    <div>
      <PhaseHeader
        title="Checklist"
        status={status}
        phaseId="checklist"
        meta={total > 0 ? `${done} of ${total} deliverables complete` : "No deliverables yet"}
        finished={status === "complete"}
      />

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <LayersIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Project Deliverables &amp; Tasks</h2>
            <p className="text-xs text-muted-foreground">
              Track execution progress as your AI agent works through the repository.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-2.5">
          {allSteps.map((step) => {
            const checked = isStepDone("checklist", step.id) || isStepDone("build", step.id);
            const isCustom = !DEFAULT_STEPS.some((d) => d.id === step.id);

            return (
              <div
                key={step.id}
                className="group flex items-center gap-3.5 rounded-xl border border-border bg-secondary/30 px-4 py-3 transition-colors hover:border-primary/40 hover:bg-secondary/50"
              >
                <button
                  onClick={() => {
                    toggleChecklist("checklist", step.id);
                    toggleChecklist("build", step.id);
                  }}
                  aria-label={checked ? "Mark incomplete" : "Mark complete"}
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                    checked
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary/60"
                  )}
                >
                  {checked && <CheckIcon className="h-3.5 w-3.5" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className={cn("text-sm font-medium", checked && "text-muted-foreground line-through")}>
                    {step.label}
                  </div>
                  {(step as { description?: string }).description && (
                    <div className="text-xs text-muted-foreground truncate font-normal">
                      {(step as { description?: string }).description}
                    </div>
                  )}
                </div>
                {isCustom && (
                  <button
                    onClick={() => removeCustomStep("checklist", step.id)}
                    aria-label="Remove task"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
          className="mt-5 flex items-center gap-2"
        >
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Add a custom task or feature deliverable…"
            className="h-10 text-sm"
          />
          <Button type="submit" size="default" className="gap-1.5 shrink-0" disabled={!label.trim()}>
            <PlusIcon className="h-4 w-4" />
            Add Task
          </Button>
        </form>
      </div>
    </div>
  );
}
