/**
 * Lifecycle phases — the top-level structure of the app.
 * The Canvas board renders these as cards; each has its own workspace.
 *
 * nx-studio is a build tool: the founder fills a Brief (idea + brand + stack),
 * gets one build prompt, then ships. Progress is computed two ways:
 *   - the Brief is data-driven: done/total derives from the model (idea
 *     fields + tech stack selection, both live on the one Brief page)
 *   - the checklist phase (Build) reads the explicit checklist map
 */

import { compileStack } from "./platform-engine";
import { PhaseProgress, WorkspaceData } from "./types";

export type PhaseId = "idea" | "build";

export interface PhaseDef {
  id: PhaseId;
  label: string;
  /** Title shown inside the phase workspace header. */
  workspaceTitle: string;
  description: string;
  icon: string; // lucide icon name key (see icons map in components)
  /** Total number of steps/deliverables for the progress bar. */
  total: number;
  /** Ordered checklist step ids for checklist-style phases. */
  steps?: { id: string; label: string; description: string }[];
}

export interface ChecklistStep {
  id: string;
  label: string;
  description: string;
}

/**
 * The three fixed foundation steps every build starts with. Shared between
 * BuildPhase.tsx (the UI checklist) and nx-compiler.ts (checklist.md
 * emission + reverse-parsing) so the two can't silently diverge — previously
 * BuildPhase hardcoded its own copy that compileChecklistDoc had no
 * knowledge of, so checking these off in the UI never showed up in the
 * committed checklist.md.
 */
export const BUILD_STEPS: ChecklistStep[] = [
  { id: "foundation", label: "Project Foundation & Setup", description: "Environment, workspace, shared utilities." },
  { id: "core", label: "Core Features Implementation", description: "Data models, auth, main modules." },
  { id: "polish", label: "Polish & Deployment", description: "Optimization and production pipeline." },
];

export const PHASES: PhaseDef[] = [
  {
    id: "idea",
    label: "Brief",
    workspaceTitle: "Brief",
    description: "Idea, brand, and stack — the source of truth for the build.",
    icon: "lightbulb",
    total: 9,
  },
  {
    id: "build",
    label: "Build",
    workspaceTitle: "Build Phase",
    description: "Core development prompts and architecture context.",
    icon: "play",
    // Was hardcoded to 1 while BUILD_STEPS has 3 — checking a single box
    // clamped `done` to 1 and immediately read as 100%/"complete" on the
    // Canvas board. Matches BUILD_STEPS now so the bar is honest, though
    // finishing it still isn't the end of anything (see IterateSection /
    // the lifecycle card in BuildPhase.tsx) — just the foundation.
    total: BUILD_STEPS.length,
  },
];

export function getPhase(id: string): PhaseDef | undefined {
  return PHASES.find((p) => p.id === id);
}

/** Adapt a founder-defined custom stage to the PhaseDef shape the UI expects. */
export function customStageToPhase(stage: {
  id: string;
  label: string;
  description: string;
  icon: string;
  steps: { id: string; label: string }[];
}): PhaseDef {
  return {
    id: stage.id as PhaseId,
    label: stage.label,
    workspaceTitle: stage.label,
    description: stage.description,
    icon: stage.icon,
    total: stage.steps.length,
    steps: stage.steps.map((s) => ({ id: s.id, label: s.label, description: "" })),
  };
}

/* ------------------------------------------------------------------ */
/* Progress                                                           */
/* ------------------------------------------------------------------ */

export function getPhaseProgress(
  phase: PhaseDef,
  data: WorkspaceData
): PhaseProgress {
  let done = 0;

  if (phase.id === "idea") {
    const { problem, targetUsers, currentSolutions, differentiation } = data.idea;
    const ideaDone = [problem, targetUsers, currentSolutions, differentiation].filter(
      (v) => v.trim().length > 0
    ).length;
    // Tech stack counts for up to 5 of the Brief's 9 steps — full 5 only once
    // the founder commits the stack, partial once surfaces are picked.
    const committed = (data.checklist["tech-stack"] ?? []).includes("configured");
    const stack = compileStack(data.tech);
    const stackDone = committed && stack ? 5 : data.tech.surfaces.length > 0 ? 2 : 0;
    done = ideaDone + stackDone;
  } else {
    done = (data.checklist[phase.id] ?? []).length;
  }

  const total = phase.total;
  const clamped = Math.min(done, total);
  return {
    done: clamped,
    total,
    percent: total === 0 ? 0 : Math.round((clamped / total) * 100),
  };
}

export function getPhaseStatus(progress: PhaseProgress): "not-started" | "in-progress" | "complete" {
  if (progress.done === 0) return "not-started";
  if (progress.done >= progress.total) return "complete";
  return "in-progress";
}
