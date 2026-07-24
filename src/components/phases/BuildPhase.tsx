"use client";

import { useMemo, useState } from "react";
import { useWorkspace } from "@/lib/workspace-store";
import { buildBuildPrompts, buildScaffoldPrompt } from "@/lib/prompts";
import { compileStack } from "@/lib/platform-engine";
import { PhaseHeader } from "./PhaseHeader";
import { CopyButton } from "./CopyButton";
import {
  RocketIcon,
  BadgeCheckIcon,
  DownloadIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FolderIcon,
  WrenchIcon,
  WandIcon,
} from "@/components/icons";

const STEP_ICONS = [FolderIcon, WrenchIcon, WandIcon];

export function BuildPhase() {
  const { data } = useWorkspace();
  const stack = compileStack(data.tech);
  const prompts = useMemo(() => buildBuildPrompts(data), [data]);
  const [open, setOpen] = useState<string | null>(null);

  const downloadAll = () => {
    // Prompts only — the IDE creates files, not nx-studio.
    const body =
      `===== PROMPT 0: Scaffold .nxhuman context (run first) =====\n${buildScaffoldPrompt(data)}` +
      "\n\n" +
      prompts.map((p) => `===== BUILD PROMPT ${p.order}: ${p.title} =====\n${p.prompt}`).join("\n\n");
    const blob = new Blob([body], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(data.productName || "product").toLowerCase().replace(/\s+/g, "-")}-build-prompts.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PhaseHeader title="Build Phase" status="ready" phaseId="build" />

      {/* Ready banner */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
            <RocketIcon className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Current Focus
            </div>
            <div className="font-semibold">READY TO BUILD</div>
          </div>
        </div>
      </div>

      {/* Generated banner */}
      <div className="mt-4 rounded-xl border border-border bg-card p-6">
        <div className="mb-4 h-0.5 w-full rounded-full bg-gradient-to-r from-primary to-primary/20" />
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <BadgeCheckIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Build Prompts Generated</h2>
            <p className="text-sm text-muted-foreground">
              Structure optimized for{" "}
              <span className="font-mono text-primary">.nxhuman/</span> standard.
            </p>
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          The build sequence is split into 3 core phases to ensure maximum context preservation for
          AI agents. All prompts reference the{" "}
          <span className="font-mono text-primary">.nxhuman/</span> directory for architectural
          rules, UI guidelines, and technical decisions
          {stack ? ` (${stack.frontend} · ${stack.language}).` : "."}
        </p>
      </div>

      {/* Master prompts */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Master Build Prompts</h2>
          <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground">
            {prompts.length} PROMPTS AVAILABLE
          </span>
        </div>

        <div className="mt-4 space-y-4">
          {prompts.map((p, i) => {
            const Icon = STEP_ICONS[i] ?? FolderIcon;
            const isOpen = open === p.id;
            return (
              <div key={p.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {p.order}. {p.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">{p.description}</p>
                    </div>
                  </div>
                  <CopyButton value={p.prompt} label="Copy Prompt" variant="solid" />
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Includes
                    </div>
                    <ul className="mt-2 space-y-1.5">
                      {p.includes.map((inc) => (
                        <li key={inc} className="flex items-center gap-2 text-sm">
                          <span className="h-1.5 w-1.5 rounded-full border border-primary" />
                          {inc}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      References
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {p.references.map((ref) => (
                        <span
                          key={ref}
                          className="rounded-md border border-border bg-background px-2 py-1 font-mono text-[11px] text-muted-foreground"
                        >
                          {ref}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setOpen(isOpen ? null : p.id)}
                  className="mt-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  {isOpen ? (
                    <ChevronDownIcon className="h-4 w-4" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4" />
                  )}
                  {isOpen ? "Hide" : "View"} Full Prompt Details
                </button>
                {isOpen && (
                  <pre className="mt-3 overflow-x-auto rounded-lg border border-border bg-background p-4 font-mono text-xs leading-relaxed text-muted-foreground">
                    {p.prompt}
                  </pre>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={downloadAll}
            className="inline-flex items-center gap-2 rounded-lg bg-secondary px-5 py-2.5 text-sm font-medium hover:bg-secondary/70"
          >
            <DownloadIcon className="h-4 w-4" />
            Download All Prompts
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <h3 className="font-semibold">Instructions</h3>
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {[
            { n: "01", t: "Prepare Files", d: "Ensure the .nxhuman/ folder is at your project root." },
            { n: "02", t: "Initialize Agent", d: "Open the chat with your AI agent and paste Prompt 1." },
            { n: "03", t: "Sequential Build", d: "Wait for Prompt 1 to finish before moving to Prompt 2." },
            { n: "04", t: "Verify Output", d: "Run local tests after each phase to ensure stability." },
          ].map((s) => (
            <div key={s.n}>
              <div className="text-sm font-semibold text-primary">{s.n}</div>
              <div className="mt-1 text-sm font-medium">{s.t}</div>
              <div className="text-sm text-muted-foreground">{s.d}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
