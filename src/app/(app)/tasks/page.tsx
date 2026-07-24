"use client";

import Link from "next/link";
import { useWorkspace } from "@/lib/workspace-store";
import { useSync } from "@/lib/sync-store";
import { PHASES, getPhaseProgress } from "@/lib/phases";
import { CheckIcon, GithubIcon, ExternalLinkIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export default function TasksPage() {
  const { data, isStepDone, toggleChecklist } = useWorkspace();
  const { result, status } = useSync();
  const issues = result?.issues ?? [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
      <p className="mt-1 text-muted-foreground">
        Every step across {data.productName}, plus open GitHub issues.
      </p>

      {/* Workflow tasks */}
      <div className="mt-8 space-y-6">
        {PHASES.map((phase) => {
          const steps = phase.steps;
          const progress = getPhaseProgress(phase, data);
          return (
            <div key={phase.id}>
              <div className="mb-2 flex items-center justify-between">
                <Link
                  href={`/phase/${phase.id}`}
                  className="text-sm font-semibold hover:text-primary"
                >
                  {phase.label}
                </Link>
                <span className="text-xs text-muted-foreground">
                  {progress.done}/{progress.total}
                </span>
              </div>

              {steps ? (
                <div className="space-y-1.5">
                  {steps.map((step) => {
                    const done = isStepDone(phase.id, step.id);
                    return (
                      <button
                        key={step.id}
                        onClick={() => toggleChecklist(phase.id, step.id)}
                        className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-left hover:border-primary/40"
                      >
                        <span
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs",
                            done ? "border-primary bg-primary/15 text-primary" : "border-border"
                          )}
                        >
                          {done && <CheckIcon className="h-3 w-3" />}
                        </span>
                        <span className={cn("text-sm", done && "text-muted-foreground line-through")}>
                          {step.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <Link
                  href={`/phase/${phase.id}`}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 hover:border-primary/40"
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs",
                      progress.done >= progress.total && progress.total > 0
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border"
                    )}
                  >
                    {progress.done >= progress.total && progress.total > 0 && (
                      <CheckIcon className="h-3 w-3" />
                    )}
                  </span>
                  <span className="text-sm">
                    {phase.id === "idea" ? "Complete the idea brief" : "Configure the tech stack"}
                  </span>
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* GitHub issues */}
      <div className="mt-10">
        <div className="mb-3 flex items-center gap-2">
          <GithubIcon className="h-4 w-4" />
          <h2 className="font-semibold">Open GitHub Issues</h2>
        </div>
        {issues.length > 0 ? (
          <div className="space-y-1.5">
            {issues.map((i) => (
              <a
                key={i.number}
                href={i.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 hover:border-primary/40"
              >
                <span className="text-xs text-muted-foreground">#{i.number}</span>
                <span className="flex-1 truncate text-sm">{i.title}</span>
                {i.labels.slice(0, 2).map((l) => (
                  <span key={l} className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {l}
                  </span>
                ))}
                <ExternalLinkIcon className="h-3.5 w-3.5 text-muted-foreground" />
              </a>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {status === "disconnected"
              ? "Connect GitHub in Settings to pull issues."
              : status === "no-repo"
                ? "Link a repository in Settings to see issues."
                : "No open issues."}
          </div>
        )}
      </div>
    </div>
  );
}
