"use client";

import { useState } from "react";
import { useWorkspace } from "@/lib/workspace-store";
import { PhaseIcon, CheckIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { PhaseHeader } from "@/components/phases/PhaseHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CustomStagePhase({ stageId }: { stageId: string }) {
  const { customStages, isStepDone, toggleChecklist, addCustomStep, removeCustomStep } =
    useWorkspace();
  const stage = customStages.find((s) => s.id === stageId);
  const [label, setLabel] = useState("");

  if (!stage) return null;

  const done = stage.steps.filter((s) => isStepDone(stageId, s.id)).length;
  const total = stage.steps.length;
  const status = total > 0 && done >= total ? "complete" : "in-progress";

  const add = () => {
    const l = label.trim();
    if (!l) return;
    addCustomStep(stageId, l);
    setLabel("");
  };

  return (
    <div>
      <PhaseHeader
        title={stage.label}
        status={status}
        phaseId={stage.id}
        meta={total > 0 ? `${done} of ${total} steps complete` : "No steps yet"}
        finished={status === "complete"}
      />

      <div className="rounded-xl glass p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary">
            <PhaseIcon name={stage.icon} className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="font-semibold">Checklist</h2>
            <p className="text-xs text-muted-foreground">
              Define what &ldquo;done&rdquo; means for this stage.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          {stage.steps.map((step) => {
            const checked = isStepDone(stageId, step.id);
            return (
              <div
                key={step.id}
                className="group flex items-center gap-3 rounded-lg border border-border bg-secondary/30 px-3 py-2.5"
              >
                <button
                  onClick={() => toggleChecklist(stageId, step.id)}
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
                <span className={cn("flex-1 text-sm", checked && "text-muted-foreground line-through")}>
                  {step.label}
                </span>
                <button
                  onClick={() => removeCustomStep(stageId, step.id)}
                  aria-label="Remove step"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            );
          })}

          {stage.steps.length === 0 && (
            <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
              No steps yet — add the first one below.
            </p>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
          className="mt-4 flex items-center gap-2"
        >
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Add a step…"
            className="h-9"
          />
          <Button type="submit" size="sm" className="gap-1.5" disabled={!label.trim()}>
            <PlusIcon className="h-4 w-4" />
            Add
          </Button>
        </form>
      </div>
    </div>
  );
}
