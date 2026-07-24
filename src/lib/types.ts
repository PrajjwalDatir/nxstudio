/**
 * Shared TypeScript interfaces for Nx Studio
 * The workspace model: a product moves through lifecycle phases,
 * and the (invisible) Staff Engineer compiles founder input into a stack.
 */

/* ------------------------------------------------------------------ */
/* Idea / Ideation                                                    */
/* ------------------------------------------------------------------ */

export interface IdeaData {
  problem: string;
  targetUsers: string;
  currentSolutions: string;
  differentiation: string;
}

/* ------------------------------------------------------------------ */
/* Brand DNA — prevents style drift across generated code             */
/* ------------------------------------------------------------------ */

export interface BrandDNA {
  vibe: string;
  primaryColor: string;
  radius: string;
  font: string;
}

/* ------------------------------------------------------------------ */
/* Tech Stack — founder input (the wizard collects this)              */
/* ------------------------------------------------------------------ */

export type PlatformTargetId =
  | "web-app"
  | "web-landing"
  | "ios"
  | "android"
  | "mobile-both"
  | "apple-ecosystem";

export type BuildStrategyId = "native" | "cross-platform";

/** Raw founder selections. The engine turns these into a CompiledStack. */
export interface TechStackInput {
  target: PlatformTargetId | "";
  /** Only meaningful when multiple platforms are in play. */
  strategy: BuildStrategyId | "";
  needsAuth: boolean;
  needsDatabase: boolean;
  needsRealtime: boolean;
  /** Rich/3D marketing surfaces → pulls in Three.js. */
  richGraphics: boolean;
}

/* ------------------------------------------------------------------ */
/* Compiled Stack — the Staff Engineer's hardcoded decision           */
/* ------------------------------------------------------------------ */

export interface StackSlot {
  label: string; // e.g. "Frontend"
  value: string; // e.g. "Next.js"
}

export interface SetupPrompt {
  id: string;
  title: string;
  description: string;
  command: string;
}

export interface CompiledStack {
  platform: string; // "WebApp (PWA)"
  frontend: string; // "Next.js"
  backend: string; // "Next.js API Routes"
  database: string; // "PostgreSQL"
  hosting: string; // "Vercel"
  language: string; // "TypeScript"
  /** Human-readable reason the engine chose this framework. */
  rationale: string;
  setupPrompts: SetupPrompt[];
}

/* ------------------------------------------------------------------ */
/* Custom stages — founder-defined phases beyond the six built-ins    */
/* ------------------------------------------------------------------ */

export interface CustomStageStep {
  id: string;
  label: string;
}

export interface CustomStage {
  id: string; // "custom_xxxx"
  label: string;
  description: string;
  icon: string; // PhaseIcon key
  steps: CustomStageStep[];
}

/* ------------------------------------------------------------------ */
/* Workspace — the whole product's state                              */
/* ------------------------------------------------------------------ */

export interface WorkspaceData {
  productName: string;
  idea: IdeaData;
  brand: BrandDNA;
  tech: TechStackInput;
  /**
   * Explicit checklist completion per phase (for checklist-style phases
   * like Validation). Data-driven phases compute progress from their data.
   */
  checklist: Record<string, string[]>;
  /** Founder-defined stages that render on the Canvas after the built-ins. */
  customStages: CustomStage[];
}

export interface PhaseProgress {
  done: number;
  total: number;
  percent: number;
}
