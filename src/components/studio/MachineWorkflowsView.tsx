"use client";

import { useState } from "react";
import { CopyButton } from "@/components/phases/CopyButton";
import { ZapIcon } from "@/components/icons";
import { generateMachineWorkflows, MachineFile } from "@/lib/machine-workflows";
import { WorkspaceData } from "@/lib/types";

export function MachineWorkflowsView({ data }: { data: WorkspaceData }) {
  const workflows = generateMachineWorkflows(data);
  const [activeFile, setActiveFile] = useState<MachineFile>(workflows.githubActionWorkflow);

  return (
    <div className="space-y-6 rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-950/10 via-card to-background p-6 shadow-xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <ZapIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">Autonomous Machine Workflows</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Copy &amp; commit .jules configs, GitHub Actions, and test-driven CI/CD deployment gates into your repo.
            </p>
          </div>
        </div>
      </div>

      {/* File selector tabs */}
      <div className="flex flex-wrap gap-2">
        {workflows.allFiles.map((file) => (
          <button
            key={file.path}
            onClick={() => setActiveFile(file)}
            className={`rounded-lg px-3 py-1.5 font-mono text-xs font-medium transition-all ${
              activeFile.path === file.path
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm"
                : "bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            {file.path}
          </button>
        ))}
      </div>

      {/* Code Editor view */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <span className="font-mono text-xs font-semibold text-foreground">{activeFile.path}</span>
            <p className="text-[11px] text-muted-foreground">{activeFile.description}</p>
          </div>
          <CopyButton value={activeFile.content} />
        </div>

        <div className="relative">
          <pre className="max-h-96 overflow-x-auto overflow-y-auto rounded-lg bg-background/80 p-4 font-mono text-xs text-foreground leading-relaxed">
            {activeFile.content}
          </pre>
        </div>
      </div>
    </div>
  );
}
