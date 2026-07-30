"use client";

import { useMemo, useState } from "react";
import { PHASES, customStageToPhase, getPhaseProgress, getPhaseStatus } from "@/lib/phases";
import { useWorkspace, useSync } from "@/lib/workspace-store";
import { diffNx, NX_ROOT } from "@/lib/nx-compiler";
import { useCommand } from "@/components/shell/CommandPalette";
import { PhaseCard } from "@/components/canvas/PhaseCard";
import {
  NxLogo,
  ArrowUpIcon,
  FilterIcon,
  CheckIcon,
  GitBranchIcon,
  FileTextIcon,
  PlusIcon,
  PencilLineIcon,
} from "@/components/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

function relTime(iso: string | null): string {
  if (!iso) return "never";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const SYNC_LABEL: Record<string, string> = {
  checking: "Checking GitHub…",
  disconnected: "GitHub not connected",
  "no-repo": "No repository linked",
  syncing: "Syncing…",
  ok: "Synced",
  error: "Sync error",
};

type StatusFilter = "all" | "not-started" | "in-progress" | "complete";
const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All stages" },
  { value: "not-started", label: "Not started" },
  { value: "in-progress", label: "In progress" },
  { value: "complete", label: "Complete" },
];

export default function CanvasPage() {
  const { data, customStages } = useWorkspace();
  const { status, lastSyncedAt, result } = useSync();
  const { open } = useCommand();
  const healthy = status === "ok";

  // Read side of the loop: compare the .nx/ committed in the repo against what
  // the studio would emit now, so agent-made changes surface here.
  const docs = result?.context?.docs;
  const changed = useMemo(() => {
    if (!docs) return [];
    // memory.json is nxstudio's own bookkeeping — re-emitted every compile, so it
    // would show as drifted on every sync. Exclude it to keep the signal on files
    // the agent actually authored.
    const memoryPath = `${NX_ROOT}/memory.json`;
    return diffNx(docs, data).filter(
      (d) => (d.status === "drifted" || d.status === "extra") && d.path !== memoryPath
    );
  }, [docs, data]);
  const shortPath = (p: string) => p.replace(`${NX_ROOT}/`, "");

  const [filter, setFilter] = useState<StatusFilter>("all");

  const allPhases = [...PHASES, ...customStages.map(customStageToPhase)];
  const visible = allPhases.filter((phase) => {
    if (filter === "all") return true;
    return getPhaseStatus(getPhaseProgress(phase, data)) === filter;
  });
  const customIds = new Set(customStages.map((s) => s.id));

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Canvas</h1>
          <p className="mt-1 text-muted-foreground">
            Manage and track project phases effectively for{" "}
            <span className="text-primary">{data.productName}</span>.
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors outline-none",
              filter === "all"
                ? "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
                : "border-primary/40 bg-primary/10 text-primary"
            )}
          >
            <FilterIcon className="h-4 w-4" />
            {filter === "all" ? "Filter" : FILTERS.find((f) => f.value === filter)?.label}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {FILTERS.map((f) => (
              <DropdownMenuItem key={f.value} onClick={() => setFilter(f.value)}>
                <CheckIcon className={cn("h-4 w-4", filter === f.value ? "opacity-100" : "opacity-0")} />
                {f.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Command bar */}
      <button
        onClick={open}
        className="mt-6 flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left hover:border-primary/40"
      >
        <NxLogo className="h-5 w-5 text-primary" />
        <span className="flex-1 text-sm text-muted-foreground">
          Command nx (Ctrl + K) for Commands and Search
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-foreground">
          <ArrowUpIcon className="h-4 w-4" />
        </span>
      </button>

      {/* Drift dashboard — the loop's read side, one box per changed context file */}
      {healthy && changed.length > 0 && (
        <section className="mt-6">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
              <GitBranchIcon className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-semibold tracking-tight">
              Context drift
              <span className="ml-2 font-mono text-xs font-normal text-muted-foreground">
                {changed.length} file{changed.length === 1 ? "" : "s"} changed since the last brief
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {changed.map((d) => {
              const isNew = d.status === "extra";
              return (
                <div
                  key={d.path}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary/40 text-muted-foreground">
                    <FileTextIcon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-sm text-foreground" title={shortPath(d.path)}>
                      {shortPath(d.path)}
                    </p>
                    <span
                      className={cn(
                        "mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                        isNew
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-border bg-secondary/50 text-muted-foreground"
                      )}
                    >
                      {isNew ? <PlusIcon className="h-2.5 w-2.5" /> : <PencilLineIcon className="h-2.5 w-2.5" />}
                      {isNew ? "New file" : "Edited in repo"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-3 text-xs leading-snug text-muted-foreground">
            The repo has moved past the studio&apos;s last compile. Update your Brief to reconcile, or re-copy the build prompt to fold these back in.
          </p>
        </section>
      )}

      {/* Phase grid (glass cards over an ambient glow) */}
      <div className="relative mt-6">
        <div className="canvas-glow" aria-hidden />
        <div className="relative z-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((phase) => (
            <PhaseCard key={phase.id} phase={phase} isCustom={customIds.has(phase.id)} />
          ))}
        </div>

        {visible.length === 0 && (
          <p className="relative z-10 mt-2 text-sm text-muted-foreground">
            No stages match this filter.
          </p>
        )}
      </div>

      {/* Footer status */}
      <div className="mt-10 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
        <span>nxstudio v2.4.0</span>
        <span className="flex items-center gap-2">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              healthy ? "bg-emerald-500" : status === "error" ? "bg-red-500" : "bg-muted-foreground"
            }`}
          />
          {SYNC_LABEL[status]}
          {status === "ok" && ` · ${relTime(lastSyncedAt)}`}
        </span>
      </div>
    </div>
  );
}
