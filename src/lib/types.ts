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
  motionPreset?: string;
  motionSpeed?: string;
  textColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  palette?: string[];
  logo?: string;
  logoName?: string;
  wordmark?: string;
  wordmarkName?: string;
}

/* ------------------------------------------------------------------ */
/* Tech Stack — founder input (the wizard collects this)              */
/* ------------------------------------------------------------------ */

/** Target AI coding agent for prompt compilation optimization. */
export type AgentTarget =
  | "generic"
  | "claude"
  | "cursor"
  | "windsurf"
  | "antigravity"
  | "zed"
  | "aider"
  | "v0";

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
  /**
   * Free-form notes the founder sketched in Studio (annotation text) to steer
   * the AI — "special notes" attached to the build context.
   */
  designNotes?: string;
  /**
   * AI-drafted data model + API surface, accepted by the founder from the
   * Brief's analysis panel. Rendered verbatim into db-schema.md/api-routes.md
   * (see nx-compiler.ts) in place of the empty placeholder text — still just
   * a design for the build agent to implement, not compiled DDL.
   */
  schemaDraft?: { dbSchema: string; apiRoutes: string };
  /**
   * AI-identified risks, accepted by the founder from the Brief's analysis
   * panel — the other half of that analysis's output (see schemaDraft for
   * the first half). Rendered into risks.md (see nx-compiler.ts) so the
   * build agent inherits what to defend against, not just what to build.
   * `sourceIdea`/`sourceCapabilities`/`sourceSurfaces` snapshot what the
   * analysis actually ran against, so staleness.ts can tell when the founder
   * has since changed the idea or stack out from under an accepted analysis.
   */
  briefInsights?: {
    sharpenedProblem: string;
    riskiestAssumptions: string[];
    stackConcerns: string[];
    sourceIdea: IdeaData;
    sourceCapabilities: Capability[];
    sourceSurfaces: Surface[];
  };
  /**
   * Post-launch changelog — one entry per feature/fix requested after the
   * initial build, each scoped to the .nx/ files it touches (see
   * /api/context/scope-change and prompts-server.ts::compileIteratePrompt).
   * Rendered as extra checkboxes in checklist.md (see compileChecklistDoc)
   * so the deliverables list keeps growing instead of staying fixed at the
   * three initial build steps.
   */
  iterations: IterationEntry[];
  /** Structured visual data schema (tables, fields, relations) */
  schema?: ProductSchema;
  /** Active MCP server ids selected in the MCP Fleet */
  selectedMcpServers?: string[];
}

/* ------------------------------------------------------------------ */
/* Visual Data Modeling & Schema                                      */
/* ------------------------------------------------------------------ */

export type SchemaColumnType =
  | "uuid"
  | "string"
  | "int"
  | "float"
  | "boolean"
  | "datetime"
  | "json"
  | "text";

export interface SchemaField {
  id: string;
  name: string;
  type: SchemaColumnType;
  isPrimary?: boolean;
  isNullable?: boolean;
  isUnique?: boolean;
  defaultValue?: string;
}

export type RelationType = "1:1" | "1:N" | "N:N";

export interface SchemaRelation {
  id: string;
  sourceTableId: string;
  sourceFieldId: string;
  targetTableId: string;
  targetFieldId: string;
  type: RelationType;
}

export interface SchemaTable {
  id: string;
  name: string;
  description?: string;
  fields: SchemaField[];
  position?: { x: number; y: number };
}

export interface ProductSchema {
  tables: SchemaTable[];
  relations: SchemaRelation[];
  customSql?: string;
  customPrisma?: string;
}

/* ------------------------------------------------------------------ */
/* Iterations — the post-launch loop (feature/fix requests over time) */
/* ------------------------------------------------------------------ */

export interface IterationEntry {
  id: string;
  title: string;
  /** Founder's or GitHub issue's description of the requested change. */
  description: string;
  /** .nx/ paths this iteration was scoped to (see nx-compiler.ts::NX_STANDARD_PATHS). */
  affectedPaths: string[];
  /** Present when the iteration originated from an open GitHub issue. */
  sourceIssue?: { number: number; url: string; title: string };
  status: "planned" | "shipped";
  createdAt: string;
}

export interface PhaseProgress {
  done: number;
  total: number;
  percent: number;
}

/* ------------------------------------------------------------------ */
/* Topological DAG & Drift Categorization                            */
/* ------------------------------------------------------------------ */

export interface DagNode {
  id: string;
  name: string;
  description: string;
  stage: number;
  role?: string;
  deps: string[];
  contracts?: string[];
  verification?: string;
}

export interface WorkflowDag {
  version: string;
  project: string;
  nodes: DagNode[];
}

export type NxDriftKind =
  | "unchanged"
  | "missing"
  | "extra"
  | "progress"
  | "refinement"
  | "divergence"
  | "content";

export interface AgentProgressReport {
  nodeId: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  agentId?: string;
  notes?: string;
  commitHash?: string;
  timestamp?: string;
}


