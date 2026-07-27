"use client";

import { useState } from "react";
import { PHASES, customStageToPhase, getPhaseProgress, getPhaseStatus } from "@/lib/phases";
import { useWorkspace } from "@/lib/workspace-store";
import { useSync } from "@/lib/sync-store";
import { useCommand } from "@/components/shell/CommandPalette";
import { PhaseCard } from "@/components/canvas/PhaseCard";
import { NxLogo, ArrowUpIcon, FilterIcon, PlusIcon, CheckIcon } from "@/components/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  const { data, customStages, addCustomStage } = useWorkspace();
  const { status, lastSyncedAt } = useSync();
  const { open } = useCommand();
  const healthy = status === "ok";

  const [filter, setFilter] = useState<StatusFilter>("all");
  const [newOpen, setNewOpen] = useState(false);
  const [stageName, setStageName] = useState("");

  const allPhases = [...PHASES, ...customStages.map(customStageToPhase)];
  const visible = allPhases.filter((phase) => {
    if (filter === "all") return true;
    return getPhaseStatus(getPhaseProgress(phase, data)) === filter;
  });
  const customIds = new Set(customStages.map((s) => s.id));

  const createStage = () => {
    const n = stageName.trim();
    if (!n) return;
    addCustomStage(n);
    setStageName("");
    setNewOpen(false);
  };

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

      {/* Phase grid (glass cards over an ambient glow) */}
      <div className="relative mt-6">
        <div className="canvas-glow" aria-hidden />
        <div className="relative z-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((phase) => (
            <PhaseCard key={phase.id} phase={phase} isCustom={customIds.has(phase.id)} />
          ))}

          {/* Add custom stage */}
          {filter === "all" && (
            <Popover open={newOpen} onOpenChange={setNewOpen}>
              <PopoverTrigger asChild>
                <button className="flex min-h-[184px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                    <PlusIcon className="h-5 w-5" />
                  </div>
                  <span className="text-sm">Add Custom Stage</span>
                </button>
              </PopoverTrigger>
              <PopoverContent align="center" className="w-64 p-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    createStage();
                  }}
                >
                  <label className="text-xs font-medium text-muted-foreground">Stage name</label>
                  <Input
                    autoFocus
                    value={stageName}
                    onChange={(e) => setStageName(e.target.value)}
                    placeholder="e.g. Beta Program"
                    className="mt-1.5 h-9"
                  />
                  <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
                    Adds a stage to the canvas. Open it to define its checklist.
                  </p>
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setStageName("");
                        setNewOpen(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" disabled={!stageName.trim()}>
                      Add Stage
                    </Button>
                  </div>
                </form>
              </PopoverContent>
            </Popover>
          )}
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
