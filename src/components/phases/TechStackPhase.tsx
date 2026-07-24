"use client";

import { useState } from "react";
import { useWorkspace } from "@/lib/workspace-store";
import {
  PLATFORM_OPTIONS,
  RECOMMENDED_REASON,
  compileStack,
  getPlatformOption,
  stackSlots,
} from "@/lib/platform-engine";
import { PlatformTargetId, TechStackInput } from "@/lib/types";
import { buildScaffoldPrompt } from "@/lib/prompts";
import { PhaseHeader } from "./PhaseHeader";
import { CopyButton } from "./CopyButton";
import {
  BadgeCheckIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  CompassIcon,
  LayersIcon,
  CheckIcon,
} from "@/components/icons";
import { cn } from "@/lib/utils";

const WIZARD_STEPS = [
  { key: "platform", focus: "Platform Selection", desc: "Determining the optimal delivery method for your target audience.", next: "Build Strategy" },
  { key: "strategy", focus: "Build Strategy", desc: "Choosing between native fidelity and a single shared codebase.", next: "Backend Services" },
  { key: "backend", focus: "Backend Services", desc: "Deciding what the product needs to persist and secure.", next: "Experience Layer" },
  { key: "experience", focus: "Experience Layer", desc: "Layering in any richer front-of-house requirements.", next: "Review & Confirm" },
  { key: "review", focus: "Review & Confirm", desc: "Locking the stack and generating setup prompts.", next: "Build Phase" },
] as const;

export function TechStackPhase() {
  const { data, updateTech, toggleChecklist, isStepDone } = useWorkspace();
  const [step, setStep] = useState(0);

  const committed = isStepDone("tech-stack", "configured");
  const stack = compileStack(data.tech);
  const option = getPlatformOption(data.tech.target);

  /* ------------------------------------------------------------ */
  /* Committed → summary view                                     */
  /* ------------------------------------------------------------ */
  if (committed && stack) {
    const slots = stackSlots(stack);
    const allPrompts = stack.setupPrompts
      .map((p) => `# ${p.title}\n${p.command}`)
      .join("\n\n");

    return (
      <>
        <PhaseHeader title="Tech Stack" status="in-progress" phaseId="tech-stack" />

        {/* Stack configured card */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-5 h-0.5 w-full rounded-full bg-gradient-to-r from-primary to-primary/20" />
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <BadgeCheckIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Stack Configured</h2>
                <p className="text-sm text-muted-foreground">
                  All core technologies have been selected and verified.
                </p>
              </div>
            </div>
            <span className="text-sm text-primary">5/5</span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {slots.map((s) => (
              <div key={s.label} className="rounded-lg border border-border bg-background p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {s.label}
                </div>
                <div className="mt-1 text-sm font-medium">{s.value}</div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center gap-4">
            <button className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/70">
              View Full Stack Details
            </button>
            <button
              onClick={() => {
                toggleChecklist("tech-stack", "configured");
                setStep(0);
              }}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Edit Choices
            </button>
          </div>
        </div>

        {/* Scaffold prompt — creates the .nxhuman/ context in the IDE */}
        <div className="mt-8 rounded-xl border border-primary/30 bg-accent/20 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-primary/15 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-primary">
                  STEP 1
                </span>
                <h3 className="font-semibold">Create your project context</h3>
              </div>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Paste this into your AI IDE. It creates the{" "}
                <span className="font-mono text-primary">.nxhuman/</span> directory that every
                build prompt reads. Commit it — nx-studio syncs it back from GitHub.
              </p>
            </div>
            <CopyButton value={buildScaffoldPrompt(data)} label="Copy Prompt" variant="solid" />
          </div>
        </div>

        {/* Setup prompts */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Setup Prompts</h2>
          <p className="text-sm text-muted-foreground">
            Commands to initialize your environment, tailored to your stack.
          </p>

          <div className="mt-4 space-y-3">
            {stack.setupPrompts.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                  <LayersIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{p.title}</div>
                  <div className="truncate font-mono text-xs text-muted-foreground">
                    {p.command}
                  </div>
                </div>
                <CopyButton value={p.command} />
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-center">
            <CopyButton
              value={allPrompts}
              label="Copy All Setup Prompts"
              variant="solid"
              className="px-5 py-2.5"
            />
          </div>
        </div>
      </>
    );
  }

  /* ------------------------------------------------------------ */
  /* Wizard view                                                  */
  /* ------------------------------------------------------------ */
  const meta = WIZARD_STEPS[step];
  const offersStrategy = option?.offersStrategy ?? false;

  const canContinue = () => {
    if (step === 0) return !!data.tech.target;
    if (step === 1) return !offersStrategy || !!data.tech.strategy;
    return true;
  };

  const next = () => {
    if (step < WIZARD_STEPS.length - 1) setStep(step + 1);
  };
  const back = () => step > 0 && setStep(step - 1);

  const finish = () => {
    if (!data.tech.strategy && offersStrategy) return;
    toggleChecklist("tech-stack", "configured");
  };

  return (
    <>
      <PhaseHeader title="Tech Stack" status="in-progress" phaseId="tech-stack" />

      {/* Configuring / Next suggested */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border-l-2 border-l-primary border-y border-r border-border bg-card p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
            <LayersIcon className="h-3.5 w-3.5" />
            Configuring
          </div>
          <h3 className="mt-3 text-lg font-semibold">{meta.focus}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{meta.desc}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <CompassIcon className="h-3.5 w-3.5" />
            Next Suggested
          </div>
          <h3 className="mt-3 text-lg font-semibold">{meta.next}</h3>
          <span className="mt-2 inline-block rounded-md bg-secondary px-2 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground">
            {step === WIZARD_STEPS.length - 1 ? "READY TO GENERATE" : "AI RECOMMENDATION READY"}
          </span>
        </div>
      </div>

      {/* Wizard card */}
      <div className="mt-6 rounded-xl border border-border bg-card p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">Tech Stack Configuration</h2>
            <p className="text-sm text-muted-foreground">Let&apos;s define the foundation of your product.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-1 w-24 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${((step + 1) / WIZARD_STEPS.length) * 100}%` }}
              />
            </div>
            <span className="text-sm text-primary">
              {step + 1}/{WIZARD_STEPS.length}
            </span>
          </div>
        </div>

        <div className="mt-6">
          {step === 0 && <PlatformStep target={data.tech.target} onPick={(t) => updateTech("target", t)} />}
          {step === 1 && (
            <StrategyStep
              offersStrategy={offersStrategy}
              platformLabel={option?.label ?? ""}
              frontend={stack?.frontend ?? ""}
              value={data.tech.strategy}
              onPick={(s) => updateTech("strategy", s)}
            />
          )}
          {step === 2 && <BackendStep tech={data.tech} onToggle={updateTech} />}
          {step === 3 && <ExperienceStep tech={data.tech} onToggle={updateTech} stack={stack} />}
          {step === 4 && <ReviewStep stack={stack} />}
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-end justify-between gap-4 border-t border-border pt-5">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <span className="mt-0.5">ⓘ</span>
            <span className="max-w-md">
              {step === 0 ? `Recommended: ${RECOMMENDED_REASON}` : meta.desc}
            </span>
          </div>
          <div className="flex shrink-0 gap-2">
            {step > 0 && (
              <button
                onClick={back}
                className="inline-flex items-center gap-1 rounded-lg bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/70"
              >
                <ChevronLeftIcon className="h-4 w-4" />
                Back
              </button>
            )}
            {step < WIZARD_STEPS.length - 1 ? (
              <button
                onClick={next}
                disabled={!canContinue()}
                className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
              >
                Continue
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={finish}
                disabled={!stack}
                className="inline-flex items-center gap-1 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
              >
                <CheckIcon className="h-4 w-4" />
                Generate Stack
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Steps                                                              */
/* ------------------------------------------------------------------ */

function PlatformStep({
  target,
  onPick,
}: {
  target: PlatformTargetId | "";
  onPick: (t: PlatformTargetId) => void;
}) {
  return (
    <div className="space-y-3">
      <h3 className="font-medium">What type of app are you building?</h3>
      {PLATFORM_OPTIONS.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onPick(opt.id)}
          className={cn(
            "flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all",
            target === opt.id
              ? "border-primary bg-accent/40"
              : "border-border hover:border-primary/50"
          )}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-xl">
            {opt.icon || "🍎"}
          </div>
          <div>
            <div className="font-medium">{opt.label}</div>
            <div className="text-sm text-muted-foreground">{opt.description}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

function StrategyStep({
  offersStrategy,
  platformLabel,
  frontend,
  value,
  onPick,
}: {
  offersStrategy: boolean;
  platformLabel: string;
  frontend: string;
  value: "native" | "cross-platform" | "";
  onPick: (s: "native" | "cross-platform") => void;
}) {
  if (!offersStrategy) {
    return (
      <div className="rounded-xl border border-border bg-background p-5">
        <h3 className="font-medium">No strategy choice needed</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          For <span className="text-foreground">{platformLabel}</span>, nxstudio builds with{" "}
          <span className="text-foreground">{frontend}</span> — a single codebase with no
          cross-platform runtime to decide on. Continue to backend services.
        </p>
      </div>
    );
  }

  const OPTIONS = [
    {
      id: "cross-platform" as const,
      label: "Cross-Platform",
      desc: "One shared codebase (Flutter) ships to both iOS and Android. Fastest to build & maintain.",
      badge: "Recommended",
    },
    {
      id: "native" as const,
      label: "Fully Native",
      desc: "Separate Swift and Kotlin apps for maximum per-platform fidelity. More to maintain.",
    },
  ];

  return (
    <div className="space-y-3">
      <h3 className="font-medium">Native fidelity or a shared codebase?</h3>
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          onClick={() => onPick(o.id)}
          className={cn(
            "flex w-full items-start justify-between gap-4 rounded-xl border-2 p-4 text-left transition-all",
            value === o.id ? "border-primary bg-accent/40" : "border-border hover:border-primary/50"
          )}
        >
          <div>
            <div className="font-medium">{o.label}</div>
            <div className="text-sm text-muted-foreground">{o.desc}</div>
          </div>
          {o.badge && (
            <span className="shrink-0 rounded-md bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
              {o.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        "flex w-full items-center justify-between gap-4 rounded-xl border-2 p-4 text-left transition-all",
        checked ? "border-primary bg-accent/40" : "border-border hover:border-primary/50"
      )}
    >
      <div>
        <div className="font-medium">{label}</div>
        <div className="text-sm text-muted-foreground">{desc}</div>
      </div>
      <span
        className={cn(
          "flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 transition-colors",
          checked ? "bg-primary" : "bg-secondary"
        )}
      >
        <span
          className={cn(
            "h-5 w-5 rounded-full bg-white transition-transform",
            checked ? "translate-x-4" : "translate-x-0"
          )}
        />
      </span>
    </button>
  );
}

function BackendStep({
  tech,
  onToggle,
}: {
  tech: TechStackInput;
  onToggle: <K extends keyof TechStackInput>(field: K, value: TechStackInput[K]) => void;
}) {
  return (
    <div className="space-y-3">
      <h3 className="font-medium">What does your backend need?</h3>
      <ToggleRow
        label="User Authentication"
        desc="Sign-up, login, and session management."
        checked={tech.needsAuth}
        onChange={(v) => onToggle("needsAuth", v)}
      />
      <ToggleRow
        label="Database"
        desc="Persist user data, content, and records."
        checked={tech.needsDatabase}
        onChange={(v) => onToggle("needsDatabase", v)}
      />
      <ToggleRow
        label="Realtime"
        desc="Live updates, presence, or collaborative features."
        checked={tech.needsRealtime}
        onChange={(v) => onToggle("needsRealtime", v)}
      />
    </div>
  );
}

function ExperienceStep({
  tech,
  onToggle,
  stack,
}: {
  tech: TechStackInput;
  onToggle: <K extends keyof TechStackInput>(field: K, value: TechStackInput[K]) => void;
  stack: ReturnType<typeof compileStack>;
}) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium">Any richer experience requirements?</h3>
      <ToggleRow
        label="3D / Animated Surfaces"
        desc="Immersive WebGL hero scenes (pulls in Three.js on web targets)."
        checked={tech.richGraphics}
        onChange={(v) => onToggle("richGraphics", v)}
      />
      {stack && (
        <div className="rounded-xl border border-border bg-background p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Current compile
          </div>
          <div className="mt-1 text-sm">
            {stack.frontend} · {stack.language} · {stack.hosting}
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewStep({ stack }: { stack: ReturnType<typeof compileStack> }) {
  if (!stack) {
    return <p className="text-sm text-muted-foreground">Select a platform to compile your stack.</p>;
  }
  return (
    <div className="space-y-4">
      <h3 className="font-medium">Your compiled stack</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stackSlots(stack).map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-background p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {s.label}
            </div>
            <div className="mt-1 text-sm font-medium">{s.value}</div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-primary/30 bg-accent/30 p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-primary">
          Why this stack
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{stack.rationale}</p>
      </div>
    </div>
  );
}
