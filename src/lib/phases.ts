/**
 * Lifecycle phases — the top-level structure of the app.
 * The Canvas board renders these as cards; each has its own workspace.
 *
 * nx-studio is a build tool: the founder fills a Brief (idea + brand),
 * derives a stack, gets one build prompt, then ships. Progress is computed
 * two ways:
 *   - data-driven phases (Brief, Tech Stack) derive done/total from the model
 *   - the checklist phase (Build) reads the explicit checklist map
 */

import { compileStack } from "./platform-engine";
import { PhaseProgress, WorkspaceData } from "./types";

export type PhaseId = "idea" | "tech-stack" | "build" | "checklist";

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

export const PHASES: PhaseDef[] = [
  {
    id: "idea",
    label: "Brief",
    workspaceTitle: "Brief",
    description: "Idea, audience, and brand — the source of truth for the build.",
    icon: "lightbulb",
    total: 4,
  },
  {
    id: "tech-stack",
    label: "Tech Stack",
    workspaceTitle: "Tech Stack",
    description: "Platform, framework, and architecture decisions.",
    icon: "layers",
    total: 5,
  },
  {
    id: "build",
    label: "Build",
    workspaceTitle: "Build Phase",
    description: "Core development prompts and architecture context.",
    icon: "play",
    total: 1,
  },
  {
    id: "checklist",
    label: "Checklist",
    workspaceTitle: "Project Checklist",
    description: "Interactive project deliverables and task checklist.",
    icon: "check-square",
    total: 3,
    steps: [
      { id: "foundation", label: "Project Foundation & Setup", description: "Environment, workspace, shared utilities." },
      { id: "core", label: "Core Features Implementation", description: "Data models, auth, main modules." },
      { id: "polish", label: "Polish & Deployment", description: "Optimization and production pipeline." },
    ],
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
    done = [problem, targetUsers, currentSolutions, differentiation].filter(
      (v) => v.trim().length > 0
    ).length;
  } else if (phase.id === "tech-stack") {
    // Full 5/5 only once the founder commits the stack; partial once surfaces picked.
    const committed = (data.checklist["tech-stack"] ?? []).includes("configured");
    const stack = compileStack(data.tech);
    done = committed && stack ? 5 : data.tech.surfaces.length > 0 ? 2 : 0;
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
