"use client";

import { useState, useRef } from "react";
import { useWorkspace } from "@/lib/workspace-store";
import {
  SparklesIcon,
  LoaderIcon,
  XIcon,
  CheckIcon,
  PaperclipIcon,
  LayersIcon,
} from "@/components/icons";

export function ImportProjectDialog() {
  const { applyWorkspacePatch, data } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const [codeContext, setCodeContext] = useState("");
  const [repoName, setRepoName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImport = async () => {
    if (!codeContext.trim()) {
      setError("Please paste codebase context, package.json, or schema.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/context/import-repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codebaseContext: codeContext,
          repoName: repoName.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to import codebase context");
      }

      if (json.patch) {
        applyWorkspacePatch(json.patch);
        setSuccess(true);
        setTimeout(() => {
          setIsOpen(false);
          setSuccess(false);
          setCodeContext("");
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during analysis.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-medium text-accent-foreground hover:bg-primary/20 transition-all shadow-sm"
      >
        <SparklesIcon className="h-3.5 w-3.5 text-primary" />
        <span>Import Existing Codebase</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
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
                  Paste your repository files, <code className="text-foreground">package.json</code>, Prisma/SQL schemas, or README. Our AI engine will reverse-engineer your Product OS Canvas in a single run.
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Optional Repo Name */}
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
                placeholder="Paste code snippets, file tree, package.json dependencies, prisma/sql schemas, or README here..."
                rows={8}
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
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                  className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={isLoading || !codeContext.trim()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all shadow-sm"
                >
                  {isLoading ? (
                    <>
                      <LoaderIcon className="h-3.5 w-3.5 animate-spin" />
                      <span>Reverse-Engineering Codebase...</span>
                    </>
                  ) : success ? (
                    <>
                      <CheckIcon className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Context Mapped!</span>
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-3.5 w-3.5" />
                      <span>Reverse-Engineer & Map to Canvas</span>
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
