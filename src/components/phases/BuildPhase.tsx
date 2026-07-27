"use client";

import { useState } from "react";
import Link from "next/link";
import { useWorkspace } from "@/lib/workspace-store";
import { useCompiledPrompts } from "@/lib/use-compiled-prompts";
import { CompiledPrompt } from "@/lib/prompts";
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
  const { data } = useWorkspace();
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

  return (
    <>
      <PhaseHeader title="Build" status="ready" phaseId="build" />

      <PremiumDialog open={payOpen} onClose={() => setPayOpen(false)} onActivated={() => { setPayOpen(false); refresh(); }} />

      {/* The one build prompt — the hero */}
      <div className="rounded-2xl border border-primary/30 bg-accent/20 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <WandIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Your build prompt</h2>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                One prompt. Paste it into your AI IDE — it creates your{" "}
                <span className="font-mono text-primary">.nx/</span> context and builds the{" "}
                {stack.frontend} foundation in a single run.
              </p>
            </div>
          </div>
          {locked ? (
            <CopyButton value="" label="Unlock" variant="solid" className="shrink-0" locked onLockedClick={openPaywall} />
          ) : (
            <CopyButton value={masterPrompt} label="Copy prompt" variant="solid" className="shrink-0" />
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
            <button
              onClick={() => setShowMaster((v) => !v)}
              className="mt-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              {showMaster ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
              {showMaster ? "Hide" : "Preview"} the full prompt
            </button>
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
