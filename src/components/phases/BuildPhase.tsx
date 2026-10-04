"use client";

import { useState, useMemo, useId } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useWorkspace, useSync } from "@/lib/workspace-store";
import { useCompiledPrompts } from "@/lib/use-compiled-prompts";
import { CompiledPrompt, PromptCategory } from "@/lib/prompts-server";
import { compileStack } from "@/lib/platform-engine";
import { BUILD_STEPS } from "@/lib/phases";
import { AgentTarget, IterationEntry, WorkspaceData } from "@/lib/types";
import type { GhIssue } from "@/lib/github-types";
import { closeGitHubIssue } from "@/lib/github";
import { getStoredValue, setStoredValue } from "@/lib/storage";
import { ClaudeMark, CursorMark, WindsurfMark, V0Mark } from "@/components/landing/brand-icons";
import { PhaseHeader } from "./PhaseHeader";
import { CopyButton } from "./CopyButton";
import { PremiumDialog } from "@/components/billing/PremiumDialog";
import { SubmitPromptDialog } from "@/components/prompts/SubmitPromptDialog";
import { McpFleetSelector } from "@/components/mcp/McpFleetSelector";
import { PhaseSectionNav, type PhaseSectionItem } from "./PhaseSectionNav";
import {
  BadgeCheckIcon,
  ListChecksIcon,
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
  WrenchIcon,
  GitBranchIcon,
  CreditCardIcon,
  ActivityIcon,
  CompassIcon,
  GlobeIcon,
  MessageCircleIcon,
  GemIcon,
  ShieldCheckIcon,
  TargetIcon,
  XIcon,
} from "@/components/icons";

/**
 * Only the tools whose compiled output actually differs get a dedicated
 * option — Zed/Antigravity/Aider read AGENTS.md natively with no pointer file
 * needed, so they collapse into one "Other IDE" choice rather than separate
 * buttons. Claude Code, Cursor, and Windsurf/Devin Desktop each get their own
 * one-line pointer file (see AGENT_POINTER_FILE in prompts-server.ts); v0
 * gets different build instructions entirely since it doesn't read repo files.
 * "Windsurf" is labeled "Devin Desktop" — Cognition's June 2026 rebrand —
 * while keeping the underlying id/output ("windsurf") unchanged, since the
 * legacy .windsurfrules pointer file still works under either name.
 */
const AGENT_OPTIONS: { id: AgentTarget; label: string; Mark: typeof ClaudeMark | null; color: string }[] = [
  { id: "claude", label: "Claude Code", Mark: ClaudeMark, color: "text-[#D97757]" },
  { id: "cursor", label: "Cursor", Mark: CursorMark, color: "text-foreground" },
  { id: "windsurf", label: "Devin Desktop", Mark: WindsurfMark, color: "text-[#00D2FF]" },
  { id: "v0", label: "v0", Mark: V0Mark, color: "text-foreground" },
  { id: "generic", label: "Other IDE", Mark: null, color: "text-muted-foreground" },
];

const DEPTH_ICONS: Record<string, typeof BadgeCheckIcon> = {
  apple_hig: WandIcon,
  accessibility: UsersIcon,
  qa: BadgeCheckIcon,
  security: LockIcon,
  performance: ZapIcon,
  deploy: RocketIcon,
  consistency: WrenchIcon,
  payments: CreditCardIcon,
  telemetry: ActivityIcon,
  onboarding: CompassIcon,
  "marketing-site": GlobeIcon,
  support: MessageCircleIcon,
  referrals: GemIcon,
  legal: ShieldCheckIcon,
  pitch: TargetIcon,
};

const CATEGORY_GRADIENTS: Record<string, string> = {
  visual: "from-purple-500/20 via-indigo-500/10 to-background/50",
  security: "from-amber-500/20 via-orange-500/10 to-background/50",
  qa: "from-emerald-500/20 via-teal-500/10 to-background/50",
  performance: "from-cyan-500/20 via-blue-500/10 to-background/50",
  deploy: "from-fuchsia-500/20 via-pink-500/10 to-background/50",
  growth: "from-lime-500/20 via-green-500/10 to-background/50",
  general: "from-secondary/80 via-background to-background/50",
};

const CATEGORY_TABS: { id: PromptCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "visual", label: "Visual & HIG" },
  { id: "security", label: "Security" },
  { id: "qa", label: "QA & Testing" },
  { id: "performance", label: "Performance" },
  { id: "deploy", label: "Deploy & Ops" },
  { id: "growth", label: "Growth" },
];

interface ScopeChangeResponse {
  prompt: CompiledPrompt;
  affectedPaths: string[];
  iteration: IterationEntry;
  mergePatch: Partial<WorkspaceData>;
}

type ScopeState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "done"; result: ScopeChangeResponse };

/**
 * The post-launch loop. BuildPhase used to stop at "ship once" — three fixed
 * checklist items, then six generic audit prompts. This is what happens
 * after: a founder describes a feature or bug (or picks an open GitHub
 * issue, already fetched by useSync but never rendered anywhere before this),
 * and gets a small prompt scoped to just the .nx/ files that change touches —
 * not the whole bundle — instead of leaving nx-studio entirely to keep going.
 */
function IterateSection() {
  const { data, activeId, github, addIteration, markIterationShipped, applyWorkspacePatch } =
    useWorkspace();
  const { result: syncResult } = useSync();
  const [changeText, setChangeTextState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("nx_build_change_text") || "";
    }
    return "";
  });

  const setChangeText = (text: string) => {
    setChangeTextState(text);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("nx_build_change_text", text);
    }
  };
  const [selectedIssue, setSelectedIssue] = useState<GhIssue | null>(null);
  const [state, setState] = useState<ScopeState>({ status: "idle" });
  const [shipErrors, setShipErrors] = useState<Record<string, string>>({});

  const issues = syncResult?.issues ?? [];
  const canScope = (changeText.trim().length > 0 || !!selectedIssue) && state.status !== "loading";
  const describeId = useId();

  const scope = async () => {
    const description = selectedIssue
      ? `${selectedIssue.title} (GitHub issue #${selectedIssue.number})`
      : changeText.trim();
    if (!description) return;

    // Snapshot of what's sent, so the response's mergePatch only overwrites
    // fields the founder hasn't touched locally while the request was in flight.
    const requestSnapshot = data;

    setState({ status: "loading" });
    try {
      const res = await fetch("/api/context/scope-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: activeId,
          changeDescription: description,
          data: requestSnapshot,
          repo: github.repo,
          branch: github.branch,
          sourceIssue: selectedIssue
            ? { number: selectedIssue.number, url: selectedIssue.url, title: selectedIssue.title }
            : undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Scoping failed.");
      const result = body as ScopeChangeResponse;
      applyWorkspacePatch(result.mergePatch, requestSnapshot);
      addIteration(result.iteration);
      setState({ status: "done", result });
      setChangeText("");
      setSelectedIssue(null);
    } catch (e) {
      setState({ status: "error", message: e instanceof Error ? e.message : "Scoping failed." });
    }
  };

  const shipIteration = async (it: IterationEntry) => {
    setShipErrors((errs) => {
      const { [it.id]: _removed, ...rest } = errs;
      return rest;
    });
    markIterationShipped(it.id);
    if (it.sourceIssue && github.repo) {
      const closed = await closeGitHubIssue(github.repo, it.sourceIssue.number).catch(() => false);
      if (!closed) {
        setShipErrors((errs) => ({
          ...errs,
          [it.id]: `Couldn't close GitHub issue #${it.sourceIssue!.number} — close it manually.`,
        }));
      }
    }
  };

  return (
    <div className="mt-12">
      <h2 className="text-xl font-bold tracking-tight">Iterate</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Ship one feature or fix at a time — scoped to just the{" "}
        <span className="font-mono text-accent-foreground">.nx/</span> files it touches, not the
        whole bundle.
      </p>

      {issues.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <GitBranchIcon className="h-3.5 w-3.5" /> Open GitHub issues
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {issues.map((iss) => (
              <button
                key={iss.number}
                type="button"
                onClick={() => {
                  setSelectedIssue(iss);
                  setChangeText("");
                }}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                  selectedIssue?.number === iss.number
                    ? "border-primary bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground"
                }`}
              >
                #{iss.number} {iss.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 rounded-xl glass p-5">
        {selectedIssue ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/30 p-3 text-sm">
            <span className="truncate">
              Scoping issue #{selectedIssue.number} — {selectedIssue.title}
            </span>
            <button
              type="button"
              onClick={() => setSelectedIssue(null)}
              className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          </div>
        ) : (
          <>
            <label htmlFor={describeId} className="text-sm font-medium">Or describe a change</label>
            <textarea
              id={describeId}
              value={changeText}
              onChange={(e) => setChangeText(e.target.value)}
              placeholder="e.g. Add payments with Razorpay so users can subscribe monthly"
              rows={2}
              className="mt-2 w-full resize-none rounded-lg border border-border bg-secondary/30 p-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
            />
          </>
        )}

        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={scope}
            disabled={!canScope}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {state.status === "loading" ? (
              <LoaderIcon className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <WrenchIcon className="h-3.5 w-3.5" />
            )}
            {state.status === "loading" ? "Scoping…" : "Scope this change"}
          </button>
          {state.status === "error" && <span className="text-xs text-rose-400">{state.message}</span>}
        </div>

        {state.status === "done" && (
          <div className="mt-4 space-y-3 border-t border-border pt-4">
            <div className="flex flex-wrap items-center gap-1.5">
              {state.result.affectedPaths.map((p) => (
                <span
                  key={p}
                  className="rounded-full border border-border bg-secondary/40 px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
                >
                  {p.replace(".nx/", "")}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">Scoped prompt ready</span>
              <CopyButton value={state.result.prompt.prompt} label="Copy prompt" variant="solid" />
            </div>
          </div>
        )}
      </div>

      {data.iterations.length > 0 && (
        <div className="mt-6">
          <div className="text-xs font-medium text-muted-foreground">Changelog</div>
          <div className="mt-2 space-y-2">
            {[...data.iterations].reverse().map((it) => (
              <div
                key={it.id}
                className="rounded-lg border border-border bg-secondary/20 px-4 py-2.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{it.title}</div>
                    <div className="truncate text-xs text-muted-foreground">{it.description}</div>
                  </div>
                  {it.status === "shipped" ? (
                    <span className="shrink-0 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium uppercase text-emerald-400">
                      Shipped
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void shipIteration(it)}
                      className="shrink-0 rounded-lg border border-border bg-secondary/30 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      Mark shipped
                    </button>
                  )}
                </div>
                {shipErrors[it.id] && (
                  <p className="mt-1.5 text-xs text-amber-400">{shipErrors[it.id]}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function BuildPhase() {
  const { data, isStepDone, toggleChecklist } = useWorkspace();
  const stack = compileStack(data.tech);
  const [agentTarget, setAgentTargetState] = useState<AgentTarget>(() =>
    getStoredValue("agentTarget", "generic")
  );
  const setAgentTarget = (target: AgentTarget) => {
    setAgentTargetState(target);
    setStoredValue("agentTarget", target);
  };
  const { prompts, locked, loading, refresh } = useCompiledPrompts(agentTarget);

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
            Pick your surfaces in the Tech Stack section of the{" "}
            <Link href="/canvas/idea" className="text-accent-foreground hover:underline">
              Brief
            </Link>{" "}
            first — the build prompt is generated from your derived stack.
          </p>
        </div>
      </>
    );
  }

  const masterPrompt = prompts?.master.prompt ?? "";

  const doneCount = BUILD_STEPS.filter((s) => isStepDone("build", s.id)).length;
  const status = doneCount >= BUILD_STEPS.length ? "complete" : "in-progress";

  const [activeSection, setActiveSectionState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "");
      if (["checklist", "scaffold", "mcp", "refine", "iterate"].includes(hash)) {
        return hash;
      }
      const saved = localStorage.getItem("nx_build_active_section");
      if (saved && ["checklist", "scaffold", "mcp", "refine", "iterate"].includes(saved)) {
        return saved;
      }
    }
    return "checklist";
  });

  const setActiveSection = (section: string) => {
    setActiveSectionState(section);
    if (typeof window !== "undefined") {
      localStorage.setItem("nx_build_active_section", section);
    }
  };

  const BUILD_SECTIONS: PhaseSectionItem[] = [
    {
      id: "checklist",
      label: "Deliverables Checklist",
      shortLabel: "Checklist",
      description: "Track build progress step-by-step",
      icon: ListChecksIcon,
      isDone: doneCount >= BUILD_STEPS.length,
    },
    {
      id: "scaffold",
      label: "Scaffold & Prompt",
      shortLabel: "Scaffold",
      description: "Master prompt, IDE rules & .nx/ bundle",
      icon: WandIcon,
      isDone: Boolean(masterPrompt),
    },
    {
      id: "mcp",
      label: "MCP Fleet",
      shortLabel: "MCP",
      description: "Native protocol server & tool registry",
      icon: ZapIcon,
      isDone: Boolean(data.selectedMcpServers && data.selectedMcpServers.length > 0),
    },
    {
      id: "refine",
      label: "Refine & Audit",
      shortLabel: "Refine",
      description: "Apple HIG prompt gallery for security & perf",
      icon: ShieldCheckIcon,
      isDone: false,
    },
    {
      id: "iterate",
      label: "Iterate & Ship",
      shortLabel: "Iterate",
      description: "Scope changes and issue closure",
      icon: GitBranchIcon,
      isDone: (data.iterations || []).some((it) => it.status === "shipped"),
    },
  ];

  return (
    <>
      <PhaseHeader title="Build" status={status} phaseId="build" />

      <PremiumDialog open={payOpen} onClose={() => setPayOpen(false)} onActivated={() => { setPayOpen(false); refresh(); }} />
      <SubmitPromptDialog open={submitOpen} onClose={() => setSubmitOpen(false)} />

      {/* Top Section Navigation with Progress Bar */}
      <PhaseSectionNav
        sections={BUILD_SECTIONS}
        activeId={activeSection}
        onSelect={setActiveSection}
        phaseLabel="Build"
      />

      {/* ── SECTION 1: DELIVERABLES CHECKLIST ────────────────────────── */}
      {activeSection === "checklist" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Deliverables Checklist</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Track implementation progress as your AI agent executes each step.
                </p>
              </div>
              <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-full border border-primary/30 bg-primary/10 text-accent-foreground">
                {doneCount} / {BUILD_STEPS.length} Completed
              </span>
            </div>

            <div className="mt-6 space-y-2.5">
              {BUILD_STEPS.map((step) => {
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
        </div>
      )}

      {/* ── SECTION 2: SCAFFOLD & PROMPT ─────────────────────────────── */}
      {activeSection === "scaffold" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-primary/30 bg-accent/20 p-6 shadow-sm">
            {/* IDE picker */}
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Target Agent Environment:</span>
              {AGENT_OPTIONS.map((opt) => {
                const active = agentTarget === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAgentTarget(opt.id)}
                    aria-pressed={active}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
                      active
                        ? "border-primary bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {opt.Mark && <opt.Mark className={`h-3.5 w-3.5 shrink-0 ${active ? opt.color : ""}`} />}
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-accent-foreground">
                  <WandIcon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Zip only. Say &quot;Start&quot;.</h2>
                  <p className="mt-1 max-w-xl text-xs text-muted-foreground">
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
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5"
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
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/40 pt-3">
                  <button
                    onClick={() => setShowMaster((v) => !v)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
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

          <div className="rounded-xl border border-border bg-card/40 p-4 text-xs text-muted-foreground">
            Ships an <span className="font-mono text-accent-foreground">AGENTS.md</span> — the shared
            standard read natively by Zed, Aider, Antigravity, and most agentic IDEs. Pick Claude Code,
            Cursor, or Devin Desktop above and you also get that tool&apos;s own one-line pointer file, so
            it finds <span className="font-mono text-accent-foreground">AGENTS.md</span> even without
            relying on native auto-discovery.
          </div>
        </div>
      )}

      {/* ── SECTION 3: MCP FLEET CONFIGURATION ───────────────────────── */}
      {activeSection === "mcp" && (
        <div className="space-y-6">
          <McpFleetSelector />
        </div>
      )}

      {/* ── SECTION 4: REFINE AFTER IT'S BUILT ───────────────────────── */}
      {activeSection === "refine" && (
        <div className="space-y-6">
          <div>
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
                <p className="mt-1 text-xs text-muted-foreground">
                  Paste any of these into your project once it exists — each reads your{" "}
                  <span className="font-mono text-accent-foreground">.nx/</span> context and reviews one dimension in depth.
                </p>
              </div>

              {/* Quick Keyword Search Filter */}
              <div className="relative shrink-0 w-full lg:w-64">
                <input
                  type="text"
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
                    <XIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Apple HIG Segmented Pill Controls */}
            <div className="mt-6 flex overflow-x-auto pb-1 scrollbar-none">
              <div className="relative inline-flex items-center gap-1 rounded-full border border-border bg-card p-1.5 shadow-sm">
                {CATEGORY_TABS.map((tab) => {
                  const active = selectedCategory === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedCategory(tab.id)}
                      className={`relative z-10 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                        active ? "text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {active && (
                        <motion.div
                          layoutId="gallery-category-pill"
                          className="absolute inset-0 z-[-1] rounded-full bg-primary shadow-sm"
                          transition={{ type: "spring", stiffness: 450, damping: 35 }}
                        />
                      )}
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Gallery Grid */}
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
                    {/* Visual Header */}
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

                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-border/80 bg-background/90 text-accent-foreground shadow-md backdrop-blur-md transition-transform group-hover:scale-110">
                        <Icon className="h-6 w-6" />
                      </div>

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
        </div>
      )}

      {/* ── SECTION 5: ITERATE & SHIP ────────────────────────────────── */}
      {activeSection === "iterate" && (
        <div className="space-y-6">
          <IterateSection />
        </div>
      )}

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
                  <XIcon className="h-4 w-4" />
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
