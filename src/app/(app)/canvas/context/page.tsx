"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useWorkspace, useSync } from "@/lib/workspace-store";
import { diffNx, NX_ROOT, NxDriftStatus, compileNxFiles } from "@/lib/nx-compiler";
import { computeLineDiff } from "@/lib/nx-diff";
import { fetchFileCommits, fetchFileContentAtSha, TemporalCommit } from "@/lib/github-temporal";
import {
  FileTextIcon,
  GitBranchIcon,
  CheckIcon,
  PlusIcon,
  PencilLineIcon,
  CopyIcon,
  ExternalLinkIcon,
  ArrowLeftIcon,
  LockIcon,
} from "@/components/icons";
import { cn } from "@/lib/utils";

export default function ContextDirectoryPage() {
  const { data } = useWorkspace();
  const { status: syncStatus, result } = useSync();
  const searchParams = useSearchParams();

  const initialFile = searchParams.get("file");

  const docs = result?.context?.docs;

  // Compile all .nx/ files from studio + compare with repo
  const allNxFiles = useMemo(() => {
    const repoDocs = docs ?? {};
    return diffNx(repoDocs, data);
  }, [docs, data]);

  const [selectedPath, setSelectedPath] = useState<string>(() => {
    if (initialFile && allNxFiles.some((f) => f.path === initialFile)) {
      return initialFile;
    }
    return allNxFiles[0]?.path ?? `${NX_ROOT}/architecture.md`;
  });

  const [filter, setFilter] = useState<"all" | "drifted" | "extra" | "unchanged">("all");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"diff" | "timeline">("diff");
  const [copied, setCopied] = useState(false);

  // GitHub Temporal Commit History State
  const [commits, setCommits] = useState<TemporalCommit[]>([]);
  const [loadingCommits, setLoadingCommits] = useState(false);
  const [selectedCommit, setSelectedCommit] = useState<TemporalCommit | null>(null);
  const [revisionContent, setRevisionContent] = useState<string | null>(null);
  const [loadingRevision, setLoadingRevision] = useState(false);

  const shortPath = (p: string) => p.replace(`${NX_ROOT}/`, "");

  const counts = useMemo(() => {
    // Optimization: Single loop avoids multiple array allocations and O(3N) traversal
    // from chaining .filter(condition).length
    let drifted = 0;
    let extra = 0;
    let synced = 0;
    for (let i = 0; i < allNxFiles.length; i++) {
      const status = allNxFiles[i].status;
      if (status === "drifted") drifted++;
      else if (status === "extra") extra++;
      else if (status === "unchanged") synced++;
    }
    return { all: allNxFiles.length, drifted, extra, synced };
  }, [allNxFiles]);

  const filteredFiles = useMemo(() => {
    let list = allNxFiles;
    if (filter !== "all") {
      list = list.filter((f) => f.status === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((f) => f.path.toLowerCase().includes(q));
    }
    return list;
  }, [allNxFiles, filter, search]);

  const activeFile = useMemo(() => {
    return allNxFiles.find((f) => f.path === selectedPath) ?? allNxFiles[0];
  }, [allNxFiles, selectedPath]);

  // Compute original studio emit content vs repo head / historical SHA content
  const originalContent = useMemo(() => {
    if (!activeFile) return "";
    const emittedFiles = compileNxFiles(data);
    return emittedFiles.find((f) => f.path === activeFile.path)?.content ?? "";
  }, [data, activeFile]);

  const currentContent = useMemo(() => {
    if (!activeFile || !docs) return "";
    return docs[activeFile.path] ?? "";
  }, [docs, activeFile]);

  const diffResult = useMemo(() => {
    const target = revisionContent !== null ? revisionContent : currentContent;
    return computeLineDiff(originalContent || "", target || "");
  }, [originalContent, currentContent, revisionContent]);

  useEffect(() => {
    if (!activeFile?.path) return;
    setSelectedCommit(null);
    setRevisionContent(null);
    setLoadingCommits(true);
    fetchFileCommits(activeFile.path).then((res) => {
      setCommits(res);
      setLoadingCommits(false);
    });
  }, [activeFile?.path]);

  const handleSelectCommit = async (commit: TemporalCommit) => {
    if (!activeFile?.path) return;
    setSelectedCommit(commit);
    setLoadingRevision(true);
    const text = await fetchFileContentAtSha(commit.sha, activeFile.path);
    setRevisionContent(text ?? currentContent);
    setLoadingRevision(false);
    setActiveTab("diff");
  };

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

  const statusBadge = (s: NxDriftStatus) => {
    switch (s) {
      case "drifted":
        return { label: "Drifted", class: "border-primary/40 bg-primary/10 text-accent-foreground" };
      case "extra":
        return { label: "New file", class: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" };
      case "unchanged":
        return { label: "Synced", class: "border-border bg-secondary/60 text-muted-foreground" };
      default:
        return { label: s, class: "border-border bg-secondary text-muted-foreground" };
    }
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-background text-foreground overflow-hidden">
      {/* Top Header Bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/canvas"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-secondary/40 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            title="Back to Project Canvas"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <GitBranchIcon className="h-4 w-4 text-accent-foreground" />
            <h1 className="text-sm font-bold tracking-tight">.nx/ Context Directory</h1>
            <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-medium text-accent-foreground">
              {counts.all} Files
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {syncStatus === "syncing" ? "Syncing with repo..." : "Synced with local repo"}
          </span>
        </div>
      </header>

      {/* Main Split Layout: Left File Explorer + Right Diff/Timeline Inspector */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar File List */}
        <aside className="flex w-full max-w-xs shrink-0 flex-col border-r border-border bg-card/50 lg:max-w-sm">
          {/* Controls Header */}
          <div className="flex flex-col gap-2.5 border-b border-border p-4">
            <input
              type="text"
              placeholder="Filter by file path…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
            />

            {/* Category Pills */}
            <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-border bg-secondary/30 p-1">
              <button
                onClick={() => setFilter("all")}
                className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
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
                  className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
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
                  className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
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
                className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  filter === "unchanged"
                    ? "bg-foreground text-background shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Synced ({counts.synced})
              </button>
            </div>
          </div>

          {/* File Cards List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {filteredFiles.map((f) => {
              const isSelected = activeFile?.path === f.path;
              const badge = statusBadge(f.status);

              return (
                <button
                  key={f.path}
                  onClick={() => setSelectedPath(f.path)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl p-3 text-left transition-all border",
                    isSelected
                      ? "border-primary/50 bg-primary/10 shadow-xs"
                      : "border-transparent hover:border-border hover:bg-secondary/40"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileTextIcon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        isSelected ? "text-accent-foreground" : "text-muted-foreground"
                      )}
                    />
                    <span className="truncate font-mono text-xs font-semibold text-foreground">
                      {shortPath(f.path)}
                    </span>
                  </div>

                  <span className={`rounded-full border px-2 py-0.5 font-mono text-[9px] font-medium uppercase ${badge.class}`}>
                    {badge.label}
                  </span>
                </button>
              );
            })}

            {filteredFiles.length === 0 && (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No files found matching filter.
              </div>
            )}
          </div>
        </aside>

        {/* Right Main Inspector Panel */}
        {activeFile ? (
          <main className="flex flex-1 flex-col overflow-hidden bg-background">
            {/* Inspector Subheader */}
            <div className="flex items-center justify-between border-b border-border bg-card/40 px-6 py-3.5">
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-mono text-base font-bold text-foreground">.nx/{shortPath(activeFile.path)}</h2>
                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase ${statusBadge(activeFile.status).class}`}>
                      {statusBadge(activeFile.status).label}
                    </span>
                    {selectedCommit && (
                      <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[10px] text-amber-400">
                        SHA: {selectedCommit.sha}
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

              {/* Action Buttons & Tabs */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1 shadow-xs">
                  <button
                    onClick={() => setActiveTab("diff")}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                      activeTab === "diff"
                        ? "bg-foreground text-background shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <GitBranchIcon className="h-3.5 w-3.5" /> Line Diff
                  </button>
                  <button
                    onClick={() => setActiveTab("timeline")}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                      activeTab === "timeline"
                        ? "bg-foreground text-background shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <LockIcon className="h-3.5 w-3.5" /> Git History ({commits.length})
                  </button>
                </div>

                {selectedCommit && (
                  <button
                    onClick={() => {
                      setSelectedCommit(null);
                      setRevisionContent(null);
                    }}
                    className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-amber-400 hover:bg-secondary transition-colors"
                  >
                    Reset Head
                  </button>
                )}

                <button
                  onClick={copyDiffText}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {copied ? <CheckIcon className="h-3.5 w-3.5 text-emerald-400" /> : <CopyIcon className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy Diff"}
                </button>
              </div>
            </div>

            {/* Inspector Workspace Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingRevision ? (
                <div className="flex h-48 items-center justify-center text-xs text-muted-foreground">
                  Fetching revision content from GitHub...
                </div>
              ) : activeTab === "diff" ? (
                <div className="rounded-xl border border-border bg-black/50 font-mono text-xs leading-relaxed overflow-x-auto shadow-sm">
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
                /* Temporal Git History Timeline View */
                <div className="space-y-4 p-2 max-w-2xl mx-auto">
                  <div className="mb-4 text-xs text-muted-foreground text-center">
                    Real Git commit history fetched from GitHub for <span className="font-mono text-accent-foreground">.nx/{shortPath(activeFile.path)}</span>. Tap any commit to inspect its exact historical revision.
                  </div>

                  {loadingCommits ? (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      Fetching commit history from GitHub API…
                    </div>
                  ) : commits.length > 0 ? (
                    commits.map((c) => {
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
          </main>
        ) : (
          <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">
            Select a file on the left to inspect diffs and git temporal history.
          </div>
        )}
      </div>
    </div>
  );
}
