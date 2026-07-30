"use client";

import { useState } from "react";
import { CopyButton } from "@/components/phases/CopyButton";
import { Button } from "@/components/ui/button";
import { LockIcon, ZapIcon, CheckCircleIcon } from "@/components/icons";
import { useSubscription } from "@/lib/use-subscription";
import { PremiumDialog } from "@/components/billing/PremiumDialog";
import { generateMachineWorkflows, MachineFile } from "@/lib/machine-workflows";
import { WorkspaceData } from "@/lib/types";

export function MachineWorkflowsView({ data }: { data: WorkspaceData }) {
  const { canUseMachineWorkflows } = useSubscription();
  const [payOpen, setPayOpen] = useState(false);
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
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-foreground">Autonomous Machine Workflows</h2>
              <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-amber-400 uppercase">
                Black Label VIP
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Copy &amp; commit .jules configs, GitHub Actions, and test-driven CI/CD deployment gates into your repo.
            </p>
          </div>
        </div>

        {!canUseMachineWorkflows && (
          <Button
            onClick={() => setPayOpen(true)}
            size="sm"
            className="bg-amber-500 text-black hover:bg-amber-400 font-mono text-xs uppercase tracking-wider gap-1.5"
          >
            <LockIcon className="h-3.5 w-3.5" /> Unlock Workflows (50 USDT)
          </Button>
        )}
      </div>

      <PremiumDialog
        open={payOpen}
        title="Unlock Autonomous Machine Workflows"
        description="Access .jules instructions, .github/workflows/ CI/CD automation, issue-driven test generators, and test-gated deployment pipelines."
        onClose={() => setPayOpen(false)}
        onActivated={() => setPayOpen(false)}
      />

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
      <div className="rounded-xl border border-zinc-800 bg-[#09090A] p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div>
            <span className="font-mono text-xs font-semibold text-foreground">{activeFile.path}</span>
            <p className="text-[11px] text-muted-foreground">{activeFile.description}</p>
          </div>
          {canUseMachineWorkflows ? (
            <CopyButton value={activeFile.content} />
          ) : (
            <Button onClick={() => setPayOpen(true)} size="sm" variant="outline" className="text-xs gap-1.5">
              <LockIcon className="h-3 w-3" /> Copy File (50 USDT Plan)
            </Button>
          )}
        </div>

        <div className="relative">
          <pre className="max-h-96 overflow-x-auto overflow-y-auto rounded-lg bg-black/60 p-4 font-mono text-xs text-zinc-300 leading-relaxed">
            {canUseMachineWorkflows
              ? activeFile.content
              : activeFile.content.slice(0, 180) + "\n\n/* ... Locked — Upgrade to Black Label VIP (50 USDT) to copy full machine workflow ... */"}
          </pre>
        </div>
      </div>
    </div>
  );
}
