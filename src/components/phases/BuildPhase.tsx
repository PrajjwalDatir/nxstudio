"use client";

import { useState } from "react";
import Link from "next/link";
import { useWorkspace } from "@/lib/workspace-store";
import { useCompiledPrompts } from "@/lib/use-compiled-prompts";
import { CompiledPrompt } from "@/lib/prompts-server";
import { compileStack } from "@/lib/platform-engine";
import { PhaseHeader } from "./PhaseHeader";
import { CopyButton } from "./CopyButton";
import { PremiumDialog } from "@/components/billing/PremiumDialog";
import {
  BadgeCheckIcon,
  LockIcon,
  ZapIcon,
  UsersIcon,
  RocketIcon,
  WandIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  LayersIcon,
  LoaderIcon,
} from "@/components/icons";

const DEPTH_ICONS: Record<string, typeof BadgeCheckIcon> = {
  qa: BadgeCheckIcon,
  security: LockIcon,
  performance: ZapIcon,
  accessibility: UsersIcon,
  deploy: RocketIcon,
};

export function BuildPhase() {
  const { data, isStepDone, toggleChecklist } = useWorkspace();
  const stack = compileStack(data.tech);
  const { prompts, locked, loading, refresh } = useCompiledPrompts();

  const [showMaster, setShowMaster] = useState(false);
  const [openDepth, setOpenDepth] = useState<string | null>(null);
  const [payOpen, setPayOpen] = useState(false);

  const openPaywall = () => setPayOpen(true);

  if (!stack) {
    return (
      <>
        <PhaseHeader title="Build" status="in-progress" phaseId="build" />
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <LayersIcon className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-3 text-sm text-muted-foreground">
            Pick your surfaces in the{" "}
            <Link href="/canvas/tech-stack" className="text-primary hover:underline">
              Tech Stack
            </Link>{" "}
            phase first — the build prompt is generated from your derived stack.
          </p>
        </div>
      </>
    );
  }

  const masterPrompt = prompts?.master.prompt ?? "";
  const depthPrompts: CompiledPrompt[] = prompts?.depth ?? [];

  const buildSteps = [
    { id: "foundation", label: "Project Foundation & Setup", description: "Environment, workspace, shared utilities." },
    { id: "core", label: "Core Features Implementation", description: "Data models, auth, main modules." },
    { id: "polish", label: "Polish & Deployment", description: "Optimization and production pipeline." },
  ];

  const doneCount = buildSteps.filter((s) => isStepDone("build", s.id)).length;
  const status = doneCount >= buildSteps.length ? "complete" : "in-progress";

  return (
    <>
      <PhaseHeader title="Build" status={status} phaseId="build" />

      <PremiumDialog open={payOpen} onClose={() => setPayOpen(false)} onActivated={() => { setPayOpen(false); refresh(); }} />

      {/* Interactive Task Checklist */}
      <div className="mb-8 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Deliverables Checklist</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Track implementation progress as your AI agent executes each step.
        </p>

        <div className="mt-4 space-y-2.5">
          {buildSteps.map((step) => {
            const checked = isStepDone("build", step.id);
            return (
              <div
                key={step.id}
                onClick={() => {
                  toggleChecklist("build", step.id);
                  toggleChecklist("checklist", step.id);
                }}
                className="flex cursor-pointer items-center gap-3.5 rounded-xl border border-border bg-secondary/20 px-4 py-3 transition-colors hover:border-primary/40 hover:bg-secondary/40"
              >
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                    checked
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary/60"
                  }`}
                >
                  {checked && <BadgeCheckIcon className="h-3.5 w-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${checked ? "text-muted-foreground line-through" : "text-foreground"}`}>
                    {step.label}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{step.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* The one build prompt — the hero */}
      <div className="rounded-2xl border border-primary/30 bg-accent/20 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <WandIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Zip only. Say &quot;Start&quot;.</h2>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Download your <span className="font-mono text-primary">.nx/</span> context bundle into your repo root.
                Your AI agent reads disk directly — you only need to say &quot;Start&quot;.
              </p>
            </div>
          </div>
          {locked ? (
            <CopyButton value="" label="Unlock" variant="solid" className="shrink-0" locked onLockedClick={openPaywall} />
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={async () => {
                  const { exportNxZip } = await import("@/lib/nx-exporter");
                  await exportNxZip(data);
                }}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5"
              >
                <LayersIcon className="h-4 w-4" />
                Download .nx/ ZIP
              </button>
              <CopyButton
                value="Start"
                label="Copy 'Start'"
                variant="ghost"
              />
            </div>
          )}
        </div>

        {locked ? (
          <button
            onClick={openPaywall}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-primary/40 bg-background/60 p-6 text-sm text-muted-foreground hover:text-foreground"
          >
            <LockIcon className="h-4 w-4" />
            Premium unlocks your full build prompt — tap to subscribe with crypto.
          </button>
        ) : (
          <>
            <div className="mt-4 flex items-center justify-between gap-2">
              <button
                onClick={() => setShowMaster((v) => !v)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                {showMaster ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
                {showMaster ? "Hide" : "Preview"} the full prompt
              </button>
              <CopyButton value={masterPrompt} label="Copy full prompt" variant="ghost" />
            </div>
            {showMaster && (
              <pre className="mt-3 max-h-[420px] overflow-auto rounded-lg border border-border bg-background p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">
                {loading && !masterPrompt ? "Compiling…" : masterPrompt}
              </pre>
            )}
          </>
        )}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Works in Cursor, Claude Code, or any agentic IDE. Let the run finish, then keep iterating in
        the editor to get the details right.
      </p>

      {/* Depth prompts — optional, after it exists */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold">Refine after it&apos;s built</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Optional. Paste any of these into your project once it exists — each reads your{" "}
          <span className="font-mono text-primary">.nx/</span> context and reviews one dimension
          in depth.
        </p>

        <div className="mt-4 space-y-3">
          {depthPrompts.map((p) => {
            const Icon = DEPTH_ICONS[p.id] ?? BadgeCheckIcon;
            const isOpen = openDepth === p.id;
            return (
              <div key={p.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium">{p.title}</div>
                      <div className="text-sm text-muted-foreground">{p.description}</div>
                    </div>
                  </div>
                  {locked ? (
                    <CopyButton value="" label="Unlock" locked onLockedClick={openPaywall} />
                  ) : (
                    <CopyButton value={p.prompt} label="Copy" />
                  )}
                </div>

                {!locked && (
                  <>
                    <button
                      onClick={() => setOpenDepth(isOpen ? null : p.id)}
                      className="mt-3 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                    >
                      {isOpen ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
                      {isOpen ? "Hide" : "Preview"}
                    </button>
                    {isOpen && (
                      <pre className="mt-3 overflow-x-auto rounded-lg border border-border bg-background p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">
                        {p.prompt}
                      </pre>
                    )}
                  </>
                )}
              </div>
            );
          })}
          {loading && !prompts && (
            <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
              <LoaderIcon className="h-4 w-4 animate-spin" /> Compiling prompts…
            </div>
          )}
        </div>
      </div>
    </>
  );
}
