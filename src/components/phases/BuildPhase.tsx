"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useWorkspace } from "@/lib/workspace-store";
import { useCompiledPrompts } from "@/lib/use-compiled-prompts";
import { CompiledPrompt, PromptCategory } from "@/lib/prompts-server";
import { compileStack } from "@/lib/platform-engine";
import { PhaseHeader } from "./PhaseHeader";
import { CopyButton } from "./CopyButton";
import { PremiumDialog } from "@/components/billing/PremiumDialog";
import { SubmitPromptDialog } from "@/components/prompts/SubmitPromptDialog";
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
  PlusIcon,
} from "@/components/icons";

const DEPTH_ICONS: Record<string, typeof BadgeCheckIcon> = {
  apple_hig: WandIcon,
  accessibility: UsersIcon,
  qa: BadgeCheckIcon,
  security: LockIcon,
  performance: ZapIcon,
  deploy: RocketIcon,
};

const CATEGORY_GRADIENTS: Record<string, string> = {
  visual: "from-purple-500/20 via-indigo-500/10 to-background/50",
  security: "from-amber-500/20 via-orange-500/10 to-background/50",
  qa: "from-emerald-500/20 via-teal-500/10 to-background/50",
  performance: "from-cyan-500/20 via-blue-500/10 to-background/50",
  deploy: "from-fuchsia-500/20 via-pink-500/10 to-background/50",
  general: "from-secondary/80 via-background to-background/50",
};

const CATEGORY_TABS: { id: PromptCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "visual", label: "Visual & HIG" },
  { id: "security", label: "Security" },
  { id: "qa", label: "QA & Testing" },
  { id: "performance", label: "Performance" },
  { id: "deploy", label: "Deploy & Ops" },
];

export function BuildPhase() {
  const { data, isStepDone, toggleChecklist } = useWorkspace();
  const stack = compileStack(data.tech);
  const { prompts, locked, loading, refresh } = useCompiledPrompts();

  const [showMaster, setShowMaster] = useState(false);
  const [previewPrompt, setPreviewPrompt] = useState<CompiledPrompt | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const openPaywall = () => setPayOpen(true);

  const depthPrompts: CompiledPrompt[] = useMemo(() => {
    const list = prompts?.depth ?? [];
    let filtered = list;
    if (selectedCategory !== "all") {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [prompts, selectedCategory, searchQuery]);

  if (!stack) {
    return (
      <>
        <PhaseHeader title="Build" status="in-progress" phaseId="build" />
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <LayersIcon className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-3 text-sm text-muted-foreground">
            Pick your surfaces in the{" "}
            <Link href="/canvas/tech-stack" className="text-accent-foreground hover:underline">
              Tech Stack
            </Link>{" "}
            phase first — the build prompt is generated from your derived stack.
          </p>
        </div>
      </>
    );
  }

  const masterPrompt = prompts?.master.prompt ?? "";

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
      <SubmitPromptDialog open={submitOpen} onClose={() => setSubmitOpen(false)} />

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
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-accent-foreground">
              <WandIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Zip only. Say &quot;Start&quot;.</h2>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Download your <span className="font-mono text-accent-foreground">.nx/</span> context bundle into your repo root.
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
            Premium unlocks your full build prompt — tap to subscribe.
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

      {/* ── Refine after it's built (HIG Gallery Grid) ────────────────────────── */}
      <div className="mt-12">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold tracking-tight">Refine after it&apos;s built</h2>
              <button
                onClick={() => setSubmitOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-accent-foreground transition-all hover:bg-primary/20 hover:-translate-y-0.5"
              >
                <PlusIcon className="h-3.5 w-3.5" /> Submit Prompt
              </button>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Optional. Paste any of these into your project once it exists — each reads your{" "}
              <span className="font-mono text-accent-foreground">.nx/</span> context and reviews one dimension in depth.
            </p>
          </div>

          {/* Quick Keyword Search Filter */}
          <div className="relative shrink-0 w-full lg:w-64">
            <input
              type="text"
              aria-label="Search prompts"
              placeholder="Search prompts…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-border bg-card px-3.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Apple HIG Segmented Pill Controls (Fluid Animated Layout) */}
        <div className="mt-6 flex overflow-x-auto pb-1 scrollbar-none">
          <div className="relative inline-flex items-center gap-1 rounded-full border border-border bg-card p-1.5 shadow-sm">
            {CATEGORY_TABS.map((tab) => {
              const active = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`relative z-10 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                    active ? "text-background font-semibold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="gallery-category-pill"
                      className="absolute inset-0 z-[-1] rounded-full bg-foreground shadow-sm"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    />
                  )}
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Gallery Grid (Responsive 1/2/3 Column Grid matching reference UI) */}
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {depthPrompts.map((p) => {
            const Icon = DEPTH_ICONS[p.id] ?? BadgeCheckIcon;
            const gradient = CATEGORY_GRADIENTS[p.category] ?? CATEGORY_GRADIENTS.general;
            const wordCount = p.prompt ? p.prompt.split(/\s+/).length : 0;

            return (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-foreground/20 hover:shadow-xl"
              >
                {/* Visual Header / Gallery Card Window Cover Frame */}
                <div
                  onClick={() => setPreviewPrompt(p)}
                  className={`relative flex h-36 w-full cursor-pointer flex-col justify-between border-b border-border bg-gradient-to-br ${gradient} p-3.5 transition-all group-hover:brightness-105`}
                >
                  {p.category && (
                    <div className="flex items-center justify-end">
                      <span className="rounded-full border border-primary/25 bg-background/80 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-accent-foreground uppercase shadow-xs backdrop-blur-md">
                        {p.category}
                      </span>
                    </div>
                  )}

                  {/* Luminous Center Emblem Badge */}
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-border/80 bg-background/90 text-accent-foreground shadow-md backdrop-blur-md transition-transform group-hover:scale-110">
                    <Icon className="h-6 w-6" />
                  </div>

                  {/* Simulated Architecture Snippet */}
                  <div className="flex items-center justify-between font-mono text-[9px] text-muted-foreground/60 opacity-60">
                    <span>.nx/context.md</span>
                    <span>~{wordCount} words</span>
                  </div>
                </div>

                {/* Card Content Area */}
                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    <h3
                      onClick={() => setPreviewPrompt(p)}
                      className="cursor-pointer text-sm font-semibold tracking-tight text-foreground transition-colors group-hover:text-accent-foreground"
                    >
                      {p.title}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  </div>

                  {/* Footer Action Bar */}
                  <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
                    <button
                      onClick={() => setPreviewPrompt(p)}
                      className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <ChevronRightIcon className="h-3.5 w-3.5 text-accent-foreground" /> Preview
                    </button>
                    {locked ? (
                      <CopyButton value="" label="Unlock" locked onLockedClick={openPaywall} />
                    ) : (
                      <CopyButton value={p.prompt} label="Copy" />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {depthPrompts.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No refinement prompts found matching your search filter.
          </div>
        )}

        {loading && !prompts && (
          <div className="mt-6 flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
            <LoaderIcon className="h-4 w-4 animate-spin" /> Compiling prompts…
          </div>
        )}
      </div>

      {/* HIG Prompt Preview Modal */}
      <AnimatePresence>
        {previewPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-2xl flex flex-col"
            >
              <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-accent-foreground">
                    {(() => {
                      const Icon = DEPTH_ICONS[previewPrompt.id] ?? BadgeCheckIcon;
                      return <Icon className="h-5 w-5" />;
                    })()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold tracking-tight">{previewPrompt.title}</h3>
                      <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase text-accent-foreground">
                        {previewPrompt.category}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{previewPrompt.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewPrompt(null)}
                  aria-label="Close preview"
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4">
                <pre className="overflow-x-auto rounded-xl border border-border bg-background p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">
                  {previewPrompt.prompt}
                </pre>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
                <button
                  onClick={() => setPreviewPrompt(null)}
                  className="rounded-lg px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  Close
                </button>
                {locked ? (
                  <CopyButton value="" label="Unlock" locked onLockedClick={openPaywall} />
                ) : (
                  <CopyButton value={previewPrompt.prompt} label="Copy Prompt" variant="solid" />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
