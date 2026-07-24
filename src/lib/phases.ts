/**
 * Lifecycle phases — the top-level structure of the app.
 * The Canvas board renders these as cards; each has its own workspace.
 *
 * Progress is computed two ways:
 *   - data-driven phases (Idea, Tech Stack) derive done/total from the model
 *   - checklist phases (Validation, Prototype, Build, Launch) read the
 *     explicit checklist map on the workspace
 */

import { compileStack } from "./platform-engine";
import { PhaseProgress, WorkspaceData } from "./types";

export type PhaseId =
  | "idea"
  | "validation"
  | "prototype"
  | "tech-stack"
  | "build"
  | "launch";

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
    label: "Idea",
    workspaceTitle: "Ideation",
    description: "Conceptualization and initial brainstorming sessions.",
    icon: "lightbulb",
    total: 4,
  },
  {
    id: "validation",
    label: "Validation",
    workspaceTitle: "Validation Phase",
    description: "Market research and user interviews.",
    icon: "check",
    total: 5,
    steps: [
      { id: "personas", label: "Define User Personas", description: "Who feels this pain most acutely." },
      { id: "interviews", label: "Conduct User Interviews", description: "Talk to real potential users." },
      { id: "competitors", label: "Competitor Analysis", description: "Map the existing alternatives." },
      { id: "problem", label: "Draft Problem Statement", description: "Sharpen the core problem." },
      { id: "fit", label: "Assess Market Fit", description: "Decide if this is worth building." },
    ],
  },
  {
    id: "prototype",
    label: "Prototype",
    workspaceTitle: "Prototype",
    description: "Wireframing and low-fidelity mockups.",
    icon: "box",
    total: 4,
    steps: [
      { id: "userflow", label: "Map the core user flow", description: "Registration → first value." },
      { id: "screens", label: "Generate screens", description: "Hand prompts to a design tool." },
      { id: "landing", label: "Draft the landing page", description: "High-conversion first impression." },
      { id: "review", label: "Review & iterate", description: "Tighten the flow before building." },
    ],
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
    description: "Core development sprints and feature implementation.",
    icon: "play",
    total: 3,
    steps: [
      { id: "foundation", label: "Project Foundation & Setup", description: "Environment, workspace, shared utilities." },
      { id: "core", label: "Core Features Implementation", description: "Data models, auth, main modules." },
      { id: "polish", label: "Polish & Deployment", description: "Optimization and production pipeline." },
    ],
  },
  {
    id: "launch",
    label: "Launch",
    workspaceTitle: "Launch",
    description: "Deployment, marketing, and public release.",
    icon: "rocket",
    total: 5,
    steps: [
      { id: "deploy", label: "Deploy to production", description: "Ship the first public build." },
      { id: "domain", label: "Connect a domain", description: "Point your custom domain." },
      { id: "analytics", label: "Wire up analytics", description: "Measure activation & retention." },
      { id: "waitlist", label: "Open the waitlist / signups", description: "Start collecting users." },
      { id: "announce", label: "Announce the launch", description: "Product Hunt, socials, press." },
    ],
  },
];

export function getPhase(id: string): PhaseDef | undefined {
  return PHASES.find((p) => p.id === id);
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
    // Full 5/5 only once the founder commits the stack in the wizard.
    const committed = (data.checklist["tech-stack"] ?? []).includes("configured");
    const stack = compileStack(data.tech);
    done = committed && stack ? 5 : data.tech.target ? 2 : 0;
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
