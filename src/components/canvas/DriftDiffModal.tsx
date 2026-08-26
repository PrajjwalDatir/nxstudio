"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { computeLineDiff } from "@/lib/nx-diff";
import { fetchFileCommits, fetchFileContentAtSha, TemporalCommit } from "@/lib/github-temporal";
import {
  FileTextIcon,
  GitBranchIcon,
  LockIcon,
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
} from "@/components/icons";

export interface DriftDiffModalProps {
  path: string | null;
  status: "drifted" | "extra" | "missing" | "unchanged";
  originalContent: string;
  currentContent: string;
  onClose: () => void;
}

export function DriftDiffModal({
  path,
  status,
  originalContent,
  currentContent,
  onClose,
}: DriftDiffModalProps) {
  const [activeTab, setActiveTab] = useState<"diff" | "timeline">("diff");
  const [copied, setCopied] = useState(false);

  // GitHub Temporal Commit History State
  const [commits, setCommits] = useState<TemporalCommit[]>([]);
  const [loadingCommits, setLoadingCommits] = useState(false);
  const [selectedCommit, setSelectedCommit] = useState<TemporalCommit | null>(null);
  const [revisionContent, setRevisionContent] = useState<string | null>(null);
  const [loadingRevision, setLoadingRevision] = useState(false);

  // Compute current baseline vs current head diff
  const diffResult = useMemo(() => {
    const target = revisionContent !== null ? revisionContent : currentContent;
    return computeLineDiff(originalContent || "", target || "");
  }, [originalContent, currentContent, revisionContent]);

  useEffect(() => {
    if (!path) return;
    setLoadingCommits(true);
    fetchFileCommits(path).then((data) => {
      setCommits(data);
      setLoadingCommits(false);
    });
  }, [path]);

  const handleSelectCommit = async (commit: TemporalCommit) => {
    if (!path) return;
    setSelectedCommit(commit);
    setLoadingRevision(true);
    const text = await fetchFileContentAtSha(commit.sha, path);
    setRevisionContent(text ?? currentContent);
    setLoadingRevision(false);
    setActiveTab("diff"); // Jump to diff tab to inspect this historical revision!
  };

  if (!path) return null;

  const shortPath = path.replace(/^\.nx\//, "");

  const statusBadge = useMemo(() => {
    switch (status) {
      case "drifted":
        return { label: "Context Drifted", class: "border-primary/30 bg-primary/10 text-accent-foreground" };
      case "extra":
        return { label: "New File in Repo", class: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" };
      case "unchanged":
        return { label: "Synced", class: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" };
      case "missing":
        return { label: "Pending Sync", class: "border-muted/40 bg-muted/20 text-muted-foreground" };
      default:
        return { label: status, class: "border-border bg-secondary text-muted-foreground" };
    }
  }, [status]);

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
      {/* Light, non-intrusive backdrop: keeps the webapp completely visible in the background */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[2px]">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.15 }}
          className="flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border p-5 bg-card/50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-accent-foreground">
                <FileTextIcon className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-mono text-base font-bold text-foreground">.nx/{shortPath}</h3>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase ${statusBadge.class}`}>
                    {statusBadge.label}
                  </span>
                  {selectedCommit && (
                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[10px] text-amber-400">
                      Comparing SHA: {selectedCommit.sha}
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-3 font-mono text-xs text-muted-foreground">
                  <span className="text-emerald-400">+{diffResult.additions} additions</span>
                  <span className="text-rose-400">-{diffResult.deletions} deletions</span>
                  <span>{diffResult.unchanged} unchanged lines</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-5 py-2.5">
            <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1 shadow-xs">
              <button
                onClick={() => setActiveTab("diff")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  activeTab === "diff"
                    ? "bg-foreground text-background shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <GitBranchIcon className="h-3.5 w-3.5" /> Line-by-Line Diff
              </button>
              <button
                onClick={() => setActiveTab("timeline")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  activeTab === "timeline"
                    ? "bg-foreground text-background shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LockIcon className="h-3.5 w-3.5" /> Git Temporal History ({commits.length})
              </button>
            </div>

            <div className="flex items-center gap-2">
              {selectedCommit && (
                <button
                  onClick={() => {
                    setSelectedCommit(null);
                    setRevisionContent(null);
                  }}
                  className="rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-amber-400 hover:bg-secondary transition-colors"
                >
                  Reset to Live Head
                </button>
              )}
              <button
                onClick={copyDiffText}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {copied ? <CheckIcon className="h-3.5 w-3.5 text-emerald-400" /> : <CopyIcon className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy Diff"}
              </button>
            </div>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto bg-background/60 p-4">
            {loadingRevision ? (
              <div className="flex h-48 items-center justify-center text-xs text-muted-foreground">
                Fetching revision content from GitHub...
              </div>
            ) : activeTab === "diff" ? (
              <div className="rounded-xl border border-border bg-black/50 font-mono text-xs leading-relaxed overflow-x-auto">
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
              /* Temporal Git Revision Timeline View */
              <div className="space-y-4 p-2 max-w-2xl mx-auto">
                <div className="mb-2 text-xs text-muted-foreground text-center">
                  Real Git commit history fetched from GitHub for <span className="font-mono text-accent-foreground">.nx/{shortPath}</span>. Tap any commit to inspect its exact historical diff.
                </div>

                {loadingCommits ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    Fetching commit history from GitHub API…
                  </div>
                ) : commits.length > 0 ? (
                  commits.map((c, idx) => {
                    const isSelected = selectedCommit?.sha === c.sha;
                    return (
                      <div
                        key={c.sha}
                        onClick={() => handleSelectCommit(c)}
                        className={`group cursor-pointer rounded-xl border p-4 transition-all ${
                          isSelected
                            ? "border-primary bg-primary/10 shadow-sm"
                            : "border-border bg-card hover:border-primary/50 hover:bg-secondary/40"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-accent-foreground">{c.sha}</span>
                            <span className="text-xs font-semibold text-foreground truncate max-w-md">{c.message}</span>
                          </div>
                          <a
                            href={c.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLinkIcon className="h-3.5 w-3.5" />
                          </a>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>Author: {c.author}</span>
                          <span>{c.date}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                    No remote git commit history found yet for this file.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border p-4 bg-card/60">
            <span className="text-xs text-muted-foreground">
              {selectedCommit ? `Inspecting commit ${selectedCommit.sha}` : "Live workspace baseline vs head"}
            </span>
            <button
              onClick={onClose}
              className="rounded-xl border border-border bg-secondary/40 px-4 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
