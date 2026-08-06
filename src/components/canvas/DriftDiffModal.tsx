"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { computeLineDiff } from "@/lib/nx-diff";
import { FileTextIcon, GitBranchIcon, LockIcon, CheckIcon, CopyIcon } from "@/components/icons";

export interface DriftDiffModalProps {
  path: string | null;
  status: "drifted" | "extra" | "missing" | "unchanged";
  originalContent: string;
  currentContent: string;
  onClose: () => void;
}

export function DriftDiffModal({ path, status, originalContent, currentContent, onClose }: DriftDiffModalProps) {
  const [activeTab, setActiveTab] = useState<"diff" | "timeline">("diff");
  const [copied, setCopied] = useState(false);

  const diffResult = useMemo(() => {
    return computeLineDiff(originalContent || "", currentContent || "");
  }, [originalContent, currentContent]);

  if (!path) return null;

  const shortPath = path.replace(/^\.nx\//, "");

  const timelineEvents = [
    {
      title: "Initial Studio Compile (t₀)",
      time: "Workspace Creation",
      desc: "Original .nx/ context generated from project brief.",
      badge: "Studio Emitted",
    },
    {
      title: "Agent Execution & Iteration (t₁)",
      time: "AI Build Run",
      desc: "AI coding agent (Cursor/Claude Code) modified file in local repo.",
      badge: "Repo Edited",
    },
    {
      title: "Current Detected State (t₂)",
      time: "Live Status",
      desc: `Detected ${diffResult.additions} additions and ${diffResult.deletions} deletions vs studio baseline.`,
      badge: "Live Drift",
    },
  ];

  const copyDiffText = () => {
    const raw = diffResult.lines
      .map((l) => {
        const prefix = l.type === "add" ? "+" : l.type === "delete" ? "-" : " ";
        return `${prefix} ${l.text}`;
      })
      .join("\n");

    navigator.clipboard.writeText(raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="flex h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <FileTextIcon className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-mono text-base font-bold text-foreground">{shortPath}</h3>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase ${
                      status === "extra"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : "border-primary/30 bg-primary/10 text-primary"
                    }`}
                  >
                    {status === "extra" ? "New File in Repo" : "Context Drifted"}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-3 font-mono text-xs text-muted-foreground">
                  <span className="text-emerald-400">+{diffResult.additions} additions</span>
                  <span className="text-rose-400">-{diffResult.deletions} deletions</span>
                  <span>{diffResult.unchanged} unchanged</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              ✕
            </button>
          </div>

          {/* Sub-header Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-5 py-2.5">
            <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
              <button
                onClick={() => setActiveTab("diff")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  activeTab === "diff"
                    ? "bg-foreground text-background shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <GitBranchIcon className="h-3.5 w-3.5" /> Diff View
              </button>
              <button
                onClick={() => setActiveTab("timeline")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  activeTab === "timeline"
                    ? "bg-foreground text-background shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LockIcon className="h-3.5 w-3.5" /> Temporal History
              </button>
            </div>

            <button
              onClick={copyDiffText}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {copied ? <CheckIcon className="h-3.5 w-3.5 text-emerald-400" /> : <CopyIcon className="h-3.5 w-3.5" />}
              {copied ? "Copied Diff" : "Copy Diff"}
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto bg-background p-4">
            {activeTab === "diff" ? (
              <div className="rounded-xl border border-border bg-black/40 font-mono text-xs leading-relaxed overflow-x-auto">
                {diffResult.lines.map((line, idx) => {
                  let bgClass = "hover:bg-secondary/30 text-muted-foreground/80";
                  let prefix = " ";
                  let symbolColor = "text-muted-foreground/40";

                  if (line.type === "add") {
                    bgClass = "bg-emerald-500/10 text-emerald-300 border-l-2 border-emerald-500";
                    prefix = "+";
                    symbolColor = "text-emerald-400 font-bold";
                  } else if (line.type === "delete") {
                    bgClass = "bg-rose-500/10 text-rose-300 border-l-2 border-rose-500 line-through opacity-80";
                    prefix = "-";
                    symbolColor = "text-rose-400 font-bold";
                  }

                  return (
                    <div key={idx} className={`flex items-start px-3 py-0.5 ${bgClass}`}>
                      <span className="w-10 shrink-0 text-right text-muted-foreground/40 select-none pr-3">
                        {line.oldLine ?? ""}
                      </span>
                      <span className="w-10 shrink-0 text-right text-muted-foreground/40 select-none pr-3">
                        {line.newLine ?? ""}
                      </span>
                      <span className={`w-6 shrink-0 select-none ${symbolColor}`}>{prefix}</span>
                      <span className="flex-1 whitespace-pre-wrap break-all">{line.text}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Temporal Timeline View */
              <div className="space-y-6 p-4 max-w-2xl mx-auto">
                <div className="mb-4 text-xs text-muted-foreground text-center">
                  Git temporal history tracks how this file evolved over time between studio emissions and agent runs.
                </div>
                {timelineEvents.map((evt, idx) => (
                  <div key={idx} className="relative flex items-start gap-4">
                    {idx < timelineEvents.length - 1 && (
                      <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-border" />
                    )}
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary z-10">
                      <LockIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 rounded-xl border border-border bg-card p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground">{evt.title}</span>
                        <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary">
                          {evt.badge}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{evt.desc}</p>
                      <div className="mt-2 text-[10px] font-mono text-muted-foreground/60">{evt.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-border p-4 bg-card">
            <button
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
