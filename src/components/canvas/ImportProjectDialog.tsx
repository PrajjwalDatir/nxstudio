"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/lib/workspace-store";
import { normalizeGitHubRepo, fetchGitHubRepoContext } from "@/lib/github";
import {
  SparklesIcon,
  LoaderIcon,
  XIcon,
  CheckIcon,
  PaperclipIcon,
  LayersIcon,
  GithubIcon,
  GitBranchIcon,
  RotateCcwIcon,
  PlusIcon,
} from "@/components/icons";

export interface ImportProjectDialogProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  mode?: "active" | "new" | "ask";
  trigger?: React.ReactNode;
  buttonLabel?: string;
  className?: string;
}

export function ImportProjectDialog({
  isOpen: controlledIsOpen,
  onOpenChange,
  mode = "active",
  trigger,
  buttonLabel = "Import Existing Codebase",
  className,
}: ImportProjectDialogProps = {}) {
  const router = useRouter();
  const { applyWorkspacePatch, setRepo, importProject, data } = useWorkspace();

  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const setIsOpen = (next: boolean) => {
    if (isControlled) {
      onOpenChange?.(next);
    } else {
      setInternalIsOpen(next);
    }
  };

  const [targetMode, setTargetMode] = useState<"active" | "new">(mode === "new" ? "new" : "active");
  const [githubRepo, setGithubRepo] = useState("");
  const [githubBranch, setGithubBranch] = useState("main");
  const [repoName, setRepoName] = useState("");
  const [codeContext, setCodeContext] = useState("");
  const [isFetchingRepo, setIsFetchingRepo] = useState(false);
  const [repoFetchSuccess, setRepoFetchSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setGithubRepo("");
    setGithubBranch("main");
    setRepoName("");
    setCodeContext("");
    setRepoFetchSuccess(null);
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(resetForm, 200);
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    let combined = codeContext;
    for (const f of Array.from(files)) {
      try {
        const text = await f.text();
        combined += `\n\n--- File: ${f.name} ---\n` + text;
      } catch {
        // skip binary files
      }
    }
    setCodeContext(combined.trim());
  };

  const handleFetchFromGitHub = async () => {
    const cleanRepo = normalizeGitHubRepo(githubRepo);
    if (!cleanRepo) {
      setError("Please enter a valid GitHub repository (e.g. owner/repo).");
      return;
    }

    setIsFetchingRepo(true);
    setError(null);
    setRepoFetchSuccess(null);

    try {
      const res = await fetchGitHubRepoContext(cleanRepo, githubBranch.trim() || "main");
      if (res.combinedContext) {
        setCodeContext((prev) => {
          if (!prev.trim()) return res.combinedContext;
          return `${prev.trim()}\n\n--- Fetched from GitHub (${cleanRepo}) ---\n${res.combinedContext}`;
        });
      }

      if (!repoName && res.productName) {
        setRepoName(res.productName);
      }
      if (res.branch && res.branch !== githubBranch) {
        setGithubBranch(res.branch);
      }

      const fileCount = res.files?.length ?? 0;
      const treeCount = res.fileTree?.length ?? 0;
      setRepoFetchSuccess(
        `Fetched ${fileCount} file${fileCount === 1 ? "" : "s"} & ${treeCount} tree items from ${cleanRepo}`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to fetch repository files from GitHub.";
      setError(msg);
    } finally {
      setIsFetchingRepo(false);
    }
  };

  const handleImport = async () => {
    const cleanRepo = githubRepo.trim() ? normalizeGitHubRepo(githubRepo) : null;
    const hasContext = codeContext.trim().length >= 20;

    if (!hasContext && !cleanRepo) {
      setError("Please provide a GitHub repository or paste codebase context / schema.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/context/import-repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codebaseContext: codeContext.trim() || undefined,
          repoName: repoName.trim() || undefined,
          githubRepo: cleanRepo || undefined,
          githubBranch: githubBranch.trim() || "main",
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to import codebase context");
      }

      if (json.patch) {
        const finalRepo = json.github?.repo || cleanRepo;
        const finalBranch = json.github?.branch || githubBranch.trim() || "main";
        const finalName =
          json.patch.productName || repoName.trim() || (cleanRepo ? cleanRepo.split("/")[1] : "Imported Product");

        if (targetMode === "new") {
          importProject(finalName, json.patch, finalRepo ? { repo: finalRepo, branch: finalBranch } : undefined);
        } else {
          applyWorkspacePatch(json.patch);
          if (finalRepo) {
            setRepo(finalRepo, finalBranch);
          }
        }

        setSuccess(true);
        setTimeout(() => {
          handleClose();
          if (targetMode === "new") {
            router.push("/canvas");
          }
        }, 1000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred during analysis.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => setIsOpen(true)} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={
            className ||
            "inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-medium text-accent-foreground hover:bg-primary/20 transition-all shadow-sm"
          }
        >
          <SparklesIcon className="h-3.5 w-3.5 text-primary" />
          <span>{buttonLabel}</span>
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <LayersIcon className="h-4 w-4" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Import Existing Product Codebase</h3>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Connect a GitHub repository or paste code/schemas. Our AI engine reverse-engineers the idea, brand, tech, and database ERD tables in a single run.
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Target workspace option when mode is flexible */}
            {mode === "ask" ? (
              <div className="flex items-center gap-2 p-1 rounded-lg border border-border bg-secondary/20 text-xs">
                <button
                  type="button"
                  onClick={() => setTargetMode("active")}
                  className={`flex-1 py-1.5 px-3 rounded-md font-medium transition-all ${
                    targetMode === "active"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Map to Current Workspace
                </button>
                <button
                  type="button"
                  onClick={() => setTargetMode("new")}
                  className={`flex-1 py-1.5 px-3 rounded-md font-medium transition-all ${
                    targetMode === "new"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Create as New Project
                </button>
              </div>
            ) : mode === "new" ? (
              <div className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                <PlusIcon className="h-3 w-3" />
                <span>Will create a new project workspace upon import</span>
              </div>
            ) : null}

            {/* GitHub Repository Addition */}
            <div className="space-y-1.5 rounded-xl border border-border/70 bg-secondary/20 p-3.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <GithubIcon className="h-3.5 w-3.5 text-primary" />
                  GitHub Repository (optional)
                </label>
                <span className="text-[11px] text-muted-foreground">
                  Public repo or private (via Settings PAT)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[1fr_110px_auto] gap-2 pt-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="owner/repo or https://github.com/owner/repo"
                    value={githubRepo}
                    onChange={(e) => {
                      setGithubRepo(e.target.value);
                      setError(null);
                      setRepoFetchSuccess(null);
                    }}
                    className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-primary font-mono"
                  />
                </div>
                <div className="relative flex items-center">
                  <GitBranchIcon className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="main"
                    value={githubBranch}
                    onChange={(e) => setGithubBranch(e.target.value)}
                    className="h-9 w-full rounded-lg border border-border bg-background pl-8 pr-2.5 text-xs outline-none focus:border-primary font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleFetchFromGitHub}
                  disabled={isFetchingRepo || !githubRepo.trim()}
                  className="inline-flex items-center justify-center gap-1.5 h-9 rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground hover:bg-secondary disabled:opacity-50 transition-all shadow-sm shrink-0"
                >
                  {isFetchingRepo ? (
                    <>
                      <LoaderIcon className="h-3.5 w-3.5 animate-spin text-primary" />
                      <span>Fetching…</span>
                    </>
                  ) : (
                    <>
                      <RotateCcwIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Fetch from GitHub</span>
                    </>
                  )}
                </button>
              </div>

              {repoFetchSuccess && (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-2.5 py-1 mt-1">
                  <CheckIcon className="h-3.5 w-3.5 shrink-0" />
                  <span>{repoFetchSuccess}</span>
                </div>
              )}
            </div>

            {/* Optional Project Name */}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Project Name (optional)
              </label>
              <input
                type="text"
                placeholder={data.productName || "e.g. My SaaS Product"}
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-secondary/30 px-3 text-xs outline-none focus:border-primary font-mono"
              />
            </div>

            {/* Codebase Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Codebase Context / Schema / Routes / Summary
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium"
                >
                  <PaperclipIcon className="h-3 w-3" />
                  Attach schema/files
                </button>
              </div>
              <textarea
                value={codeContext}
                onChange={(e) => setCodeContext(e.target.value)}
                placeholder="Paste code snippets, file tree, package.json dependencies, prisma/sql schemas, or README here (or click Fetch from GitHub above)..."
                rows={6}
                className="w-full rounded-xl border border-border bg-secondary/30 p-3 font-mono text-xs outline-none focus:border-primary leading-relaxed resize-none"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-400">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-[11px] text-muted-foreground">
                Reconstructs Idea, Tech Stack, Brand, and ERD Tables
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading || isFetchingRepo}
                  className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={isLoading || isFetchingRepo || (!codeContext.trim() && !githubRepo.trim())}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all shadow-sm"
                >
                  {isLoading ? (
                    <>
                      <LoaderIcon className="h-3.5 w-3.5 animate-spin" />
                      <span>Reverse-Engineering Codebase…</span>
                    </>
                  ) : success ? (
                    <>
                      <CheckIcon className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Context Mapped & Linked!</span>
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-3.5 w-3.5" />
                      <span>
                        {targetMode === "new"
                          ? "Create & Reverse-Engineer Project"
                          : "Reverse-Engineer & Map to Canvas"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
