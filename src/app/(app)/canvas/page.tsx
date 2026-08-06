"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useWorkspace, useSync } from "@/lib/workspace-store";
import { PHASES, customStageToPhase, getPhaseProgress, getPhaseStatus } from "@/lib/phases";
import { diffNx, NX_ROOT, NxDriftStatus, compileNxFiles } from "@/lib/nx-compiler";
import { useCommand } from "@/components/shell/CommandPalette";
import { PhaseCard } from "@/components/canvas/PhaseCard";
import { DriftDiffModal } from "@/components/canvas/DriftDiffModal";
import { NxContextDirectoryModal } from "@/components/canvas/NxContextDirectoryModal";
import {
  NxLogo,
  ArrowUpIcon,
  FilterIcon,
  CheckIcon,
  GitBranchIcon,
  FileTextIcon,
  PlusIcon,
  PencilLineIcon,
  PaletteIcon,
  ArrowRightIcon,
  FolderIcon,
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

type StatusFilter = "all" | "not-started" | "in-progress" | "complete";
const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All stages" },
  { value: "not-started", label: "Not started" },
  { value: "in-progress", label: "In progress" },
  { value: "complete", label: "Complete" },
];

export default function CanvasPage() {
  const { data, customStages } = useWorkspace();
  const { status, result } = useSync();
  const { open } = useCommand();

  const [activeDiff, setActiveDiff] = useState<{
    path: string;
    status: NxDriftStatus;
    original: string;
    current: string;
  } | null>(null);

  const [dirOpen, setDirOpen] = useState(false);

  // Read side of the loop: compare .nx/ docs committed in repo vs studio emit
  const docs = result?.context?.docs;

  const allNxFiles = useMemo(() => {
    const repoDocs = docs ?? {};
    return diffNx(repoDocs, data);
  }, [docs, data]);

  // Only changed files (drifted or extra) shown inline
  const changed = useMemo(() => {
    const memoryPath = `${NX_ROOT}/memory.json`;
    return allNxFiles.filter(
      (d) => (d.status === "drifted" || d.status === "extra") && d.path !== memoryPath
    );
  }, [allNxFiles]);

  const shortPath = (p: string) => p.replace(`${NX_ROOT}/`, "");

  const [filter, setFilter] = useState<StatusFilter>("all");

  const allPhases = [...PHASES, ...customStages.map(customStageToPhase)];
  const visible = allPhases.filter((phase) => {
    if (filter === "all") return true;
    return getPhaseStatus(getPhaseProgress(phase, data)) === filter;
  });
  const customIds = new Set(customStages.map((s) => s.id));

  const handleOpenDiff = (path: string, fileStatus: NxDriftStatus) => {
    const emittedFiles = compileNxFiles(data);
    const original = emittedFiles.find((f) => f.path === path)?.content ?? "";
    const current = docs ? (docs[path] ?? "") : "";

    setActiveDiff({
      path,
      status: fileStatus,
      original,
      current,
    });
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Line-by-Line Diff & Temporal History Modal */}
      {activeDiff && (
        <DriftDiffModal
          path={activeDiff.path}
          status={activeDiff.status}
          originalContent={activeDiff.original}
          currentContent={activeDiff.current}
          onClose={() => setActiveDiff(null)}
        />
      )}

      {/* Complete .nx/ Context Directory Modal (Behind the Click) */}
      {dirOpen && (
        <NxContextDirectoryModal
          files={allNxFiles}
          docs={docs}
          onClose={() => setDirOpen(false)}
          onSelectFile={(path, fileStatus) => {
            handleOpenDiff(path, fileStatus);
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Canvas</h1>
          <p className="mt-1 text-muted-foreground">
            Manage and track project phases effectively for{" "}
            <span className="text-primary font-medium">{data.productName}</span>.
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
        <Link
          href="/studio"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-transform hover:-translate-y-0.5"
        >
          <PaletteIcon className="h-4 w-4" />
          Open Studio
        </Link>
      </div>

      {/* Command bar */}
      <button
        onClick={open}
        className="mt-6 flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left hover:border-primary/40 transition-colors shadow-xs"
      >
        <NxLogo className="h-5 w-5 text-primary" />
        <span className="flex-1 text-sm text-muted-foreground">
          Command nx (Ctrl + K) for Commands and Search
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-foreground">
          <ArrowUpIcon className="h-4 w-4" />
        </span>
      </button>

      {/* Context Drift Inline Section (Only changed files inline + Full Directory behind click) */}
      <section className="mt-8">
        {changed.length > 0 ? (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary shadow-xs">
                  <GitBranchIcon className="h-4 w-4" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold tracking-tight">Context drift</h2>
                    <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 font-mono text-[10px] font-medium text-primary">
                      {changed.length} file{changed.length === 1 ? "" : "s"} changed
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Agent-made changes detected in repository context since the last brief compile.
                  </p>
                </div>
              </div>

              {/* Behind the Click Button */}
              <button
                onClick={() => setDirOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-3.5 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-secondary hover:border-foreground/30"
              >
                <FolderIcon className="h-3.5 w-3.5 text-primary" />
                View Full .nx/ Directory ({allNxFiles.length})
              </button>
            </div>

            {/* Changed Files Inline Grid */}
            <div className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {changed.map((d) => {
                const isNew = d.status === "extra";
                return (
                  <div
                    key={d.path}
                    onClick={() => handleOpenDiff(d.path, d.status)}
                    className="group flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background p-3.5 transition-all hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary/50 text-muted-foreground group-hover:border-primary/40 group-hover:text-primary transition-colors">
                      <FileTextIcon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="truncate font-mono text-xs font-semibold text-foreground group-hover:text-primary transition-colors" title={shortPath(d.path)}>
                          {shortPath(d.path)}
                        </p>
                        <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground">
                          View Diff →
                        </span>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase",
                            isNew
                              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                              : "border-primary/40 bg-primary/10 text-primary"
                          )}
                        >
                          {isNew ? <PlusIcon className="h-2.5 w-2.5" /> : <PencilLineIcon className="h-2.5 w-2.5" />}
                          {isNew ? "New file" : "Edited in repo"}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground/60">.nx/</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3.5 text-xs text-muted-foreground">
              <p>
                The repo has moved past the studio&apos;s last compile. Tap any file to view line-by-line diffs.
              </p>
              <Link href="/tasks" className="inline-flex items-center gap-1 font-medium text-foreground hover:text-primary transition-colors">
                Review Sprint Tasks <ArrowRightIcon className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          /* Clean in-sync status bar when 0 files are drifted */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                <CheckIcon className="h-4 w-4" />
              </span>
              <div>
                <span className="text-xs font-semibold text-foreground">Context in Sync</span>
                <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                  All {allNxFiles.length} .nx/ files match studio baseline
                </span>
              </div>
            </div>

            <button
              onClick={() => setDirOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-3.5 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-secondary hover:border-foreground/30"
            >
              <FolderIcon className="h-3.5 w-3.5 text-primary" />
              View Full .nx/ Directory ({allNxFiles.length})
            </button>
          </div>
        )}
      </section>

      {/* Grid of phase cards */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((phase) => (
          <PhaseCard key={phase.id} phase={phase} isCustom={customIds.has(phase.id)} />
        ))}
      </div>

      {visible.length === 0 && (
        <div className="mt-12 rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          No phases match the filter &quot;{FILTERS.find((f) => f.value === filter)?.label}&quot;.
        </div>
      )}
    </div>
  );
}
