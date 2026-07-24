"use client";

import { useWorkspace } from "@/lib/workspace-store";
import { getPhase, getPhaseProgress } from "@/lib/phases";
import { buildPrototypePrompts } from "@/lib/prompts";
import { PhaseHeader } from "./PhaseHeader";
import { CopyButton } from "./CopyButton";
import { ZapIcon, CompassIcon, WorkflowIcon, WandIcon } from "@/components/icons";

export function PrototypePhase() {
  const { data } = useWorkspace();
  const phase = getPhase("prototype")!;
  const progress = getPhaseProgress(phase, data);

  const quickActions = buildPrototypePrompts(data);

  return (
    <>
      <PhaseHeader title="Prototype" status="in-progress" phaseId="prototype" />

      {/* Strategy / Planning */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Strategy
            </span>
            <ZapIcon className="h-4 w-4 text-primary" />
          </div>
          <h3 className="mt-3 text-lg font-semibold">Current Focus</h3>
          <p className="text-sm text-muted-foreground">Review generated user flow</p>
          <div className="mt-4 flex h-32 items-center justify-center rounded-lg border border-border bg-secondary/40 text-muted-foreground">
            <WorkflowIcon className="h-8 w-8 opacity-60" />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Planning
            </span>
            <CompassIcon className="h-4 w-4 text-primary" />
          </div>
          <h3 className="mt-3 text-lg font-semibold">Actionable Steps</h3>
          <p className="text-sm text-muted-foreground">
            Copy prompts to a design tool and generate screens
          </p>
          <div className="mt-4 h-32 rounded-lg bg-gradient-to-br from-white/90 to-primary" />
        </div>
      </div>

      {/* User flow explainer */}
      <div className="mt-6 rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">User Flow: Registration to Upload</h3>
          <span className="text-sm font-medium text-primary">{progress.percent}% Complete</span>
        </div>
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary" style={{ width: `${progress.percent}%` }} />
        </div>

        <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Why this flow works
        </p>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          This flow minimizes friction by deferring account-creation details until after the first
          successful action. This &ldquo;lazy registration&rdquo; pattern has been shown to increase
          conversion in similar products.
        </p>

        <div className="mt-5 flex gap-3">
          <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            View Diagram
          </button>
          <button className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/70">
            Edit Flow
          </button>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <div className="mt-4 space-y-3">
          {quickActions.map((a) => (
            <div
              key={a.title}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                <WandIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium">{a.title}</div>
                <div className="truncate text-sm text-muted-foreground">{a.subtitle}</div>
              </div>
              <CopyButton value={a.prompt} label="Copy" variant="solid" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
