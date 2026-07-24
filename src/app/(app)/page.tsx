"use client";

import { PHASES } from "@/lib/phases";
import { useWorkspace } from "@/lib/workspace-store";
import { useSync } from "@/lib/sync-store";
import { useCommand } from "@/components/shell/CommandPalette";
import { PhaseCard } from "@/components/canvas/PhaseCard";
import { NxLogo, ArrowUpIcon, FilterIcon, PlusIcon } from "@/components/icons";

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

export default function CanvasPage() {
  const { data } = useWorkspace();
  const { status, lastSyncedAt } = useSync();
  const { open } = useCommand();
  const healthy = status === "ok";

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
        <button className="flex items-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
          <FilterIcon className="h-4 w-4" />
          Filter
        </button>
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

      {/* Phase grid */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {PHASES.map((phase, i) => (
          <PhaseCard key={phase.id} phase={phase} index={i} />
        ))}

        {/* Add custom stage */}
        <button className="flex min-h-[184px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
            <PlusIcon className="h-5 w-5" />
          </div>
          <span className="text-sm">Add Custom Stage</span>
        </button>
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
