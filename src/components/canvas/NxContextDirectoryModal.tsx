"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NxDrift, NxDriftStatus, NX_ROOT, compileNxFiles } from "@/lib/nx-compiler";
import { useWorkspace } from "@/lib/workspace-store";
import { FileTextIcon, GitBranchIcon, CheckIcon, PlusIcon, PencilLineIcon, XIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export interface NxContextDirectoryModalProps {
  files: NxDrift[];
  docs?: Record<string, string>;
  onClose: () => void;
  onSelectFile: (path: string, status: NxDriftStatus) => void;
}

export function NxContextDirectoryModal({
  files,
  docs,
  onClose,
  onSelectFile,
}: NxContextDirectoryModalProps) {
  const { data } = useWorkspace();
  const [filter, setFilter] = useState<"all" | "drifted" | "extra" | "unchanged">("all");
  const [search, setSearch] = useState("");

  const shortPath = (p: string) => p.replace(`${NX_ROOT}/`, "");

  const counts = useMemo(() => {
    const drifted = files.filter((f) => f.status === "drifted").length;
    const extra = files.filter((f) => f.status === "extra").length;
    const synced = files.filter((f) => f.status === "unchanged").length;
    return { all: files.length, drifted, extra, synced };
  }, [files]);

  const filteredFiles = useMemo(() => {
    let list = files;
    if (filter !== "all") {
      list = list.filter((f) => f.status === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((f) => f.path.toLowerCase().includes(q));
    }
    return list;
  }, [files, filter, search]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[2px]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-accent-foreground">
                <GitBranchIcon className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold tracking-tight">.nx/ Context Directory</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Complete context bundle directory emitted by Nx Studio and maintained by your AI agents.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Close"
              className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Subheader Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border bg-secondary/30 px-5 py-3">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto rounded-full border border-border bg-card p-1 shadow-xs">
              <button
                onClick={() => setFilter("all")}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  filter === "all"
                    ? "bg-foreground text-background shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All ({counts.all})
              </button>
              {counts.drifted > 0 && (
                <button
                  onClick={() => setFilter("drifted")}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    filter === "drifted"
                      ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                      : "text-accent-foreground hover:bg-primary/10"
                  }`}
                >
                  Drifted ({counts.drifted})
                </button>
              )}
              {counts.extra > 0 && (
                <button
                  onClick={() => setFilter("extra")}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    filter === "extra"
                      ? "bg-emerald-500 text-white shadow-xs font-semibold"
                      : "text-emerald-400 hover:bg-emerald-500/10"
                  }`}
                >
                  New ({counts.extra})
                </button>
              )}
              <button
                onClick={() => setFilter("unchanged")}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  filter === "unchanged"
                    ? "bg-foreground text-background shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Synced ({counts.synced})
              </button>
            </div>

            {/* Quick Search */}
            <input
              type="text"
              placeholder="Filter by file path…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-56 rounded-full border border-border bg-card px-3.5 py-1 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Directory Cards Grid */}
          <div className="flex-1 overflow-y-auto bg-background p-5">
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredFiles.map((f) => {
                const isNew = f.status === "extra";
                const isDrifted = f.status === "drifted";
                const isSynced = f.status === "unchanged";

                return (
                  <div
                    key={f.path}
                    onClick={() => {
                      onSelectFile(f.path, f.status);
                    }}
                    className="group flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-3.5 transition-all hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary/50 text-muted-foreground group-hover:border-primary/40 group-hover:text-accent-foreground transition-colors">
                      <FileTextIcon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="truncate font-mono text-xs font-semibold text-foreground group-hover:text-accent-foreground transition-colors" title={shortPath(f.path)}>
                          {shortPath(f.path)}
                        </p>
                        <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground">
                          View Diff →
                        </span>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase",
                            isDrifted && "border-primary/40 bg-primary/10 text-accent-foreground",
                            isNew && "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
                            isSynced && "border-border bg-secondary/60 text-muted-foreground"
                          )}
                        >
                          {isDrifted && <PencilLineIcon className="h-2.5 w-2.5" />}
                          {isNew && <PlusIcon className="h-2.5 w-2.5" />}
                          {isSynced && <CheckIcon className="h-2.5 w-2.5 text-emerald-400" />}
                          {isDrifted ? "Drifted" : isNew ? "New file" : "Synced"}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground/60">
                          .nx/
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredFiles.length === 0 && (
              <div className="mt-8 rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                No files found matching your search filter.
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border p-4 bg-card text-xs text-muted-foreground">
            <span>Tap any file card to view line-by-line diffs and temporal history.</span>
            <button
              onClick={onClose}
              className="rounded-xl px-4 py-1.5 text-xs font-medium border border-border bg-secondary/40 text-foreground hover:bg-secondary transition-colors"
            >
              Close Directory
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
