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

/** The surfaces a product can ship to. The engine derives a stack from the set. */
export type Surface = "web" | "ios" | "android" | "desktop";

/** What the product must do. Drives the backend + libraries, not the frontend. */
export type Capability =
  | "auth"
  | "database"
  | "realtime"
  | "multiplayer"
  | "payments"
  | "storage"
  | "push"
  | "ai"
  | "graphics";

/**
 * Raw founder intent. The founder never picks a framework — they pick the
 * surfaces they want and what the product must do, and the engine derives the
 * concrete stack (see platform-engine.ts::compileStack).
 */
export interface TechStackInput {
  surfaces: Surface[];
  capabilities: Capability[];
}

/* ------------------------------------------------------------------ */
/* Compiled Stack — the Staff Engineer's hardcoded decision           */
/* ------------------------------------------------------------------ */

export interface StackSlot {
  label: string; // e.g. "Frontend"
  value: string; // e.g. "Next.js"
}

export interface CompiledStack {
  platform: string; // human label of the surface set, e.g. "Web + iOS + Android"
  frontend: string; // "Flutter"
  backend: string; // "Supabase" | "SpacetimeDB" | "None (client-only)"
  database: string; // "PostgreSQL (Supabase)"
  hosting: string; // "Vercel"
  language: string; // "Dart"
  /** Extra libraries pulled in by capabilities (payments, AI, 3D…). */
  libraries: string[];
  /** Human-readable reason the engine chose this framework. */
  rationale: string;
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
