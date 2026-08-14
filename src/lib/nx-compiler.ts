/**
 * .nx/ standard — spec, content builders, and PARSER.
 *
 * nx-studio never writes files. It does two things with .nx/:
 *   1. WRITE side: describe the directory + file contents *inside a prompt*
 *      (see prompts.ts::buildMasterPrompt) so the AI IDE creates it.
 *   2. READ side: parseNx() reconstructs project context from the files
 *      the IDE committed to GitHub (see the sync store).
 */

import { compileStack, CAPABILITY_OPTIONS, SURFACE_OPTIONS } from "./platform-engine";
import { BUILD_STEPS, ChecklistStep } from "./phases";
import { BrandDNA, Capability, CompiledStack, IdeaData, Surface, WorkspaceData } from "./types";

export const NX_ROOT = ".nx";

export interface NxFile {
  path: string; // ".nx/decisions/tech-stack.md"
  content: string;
}

/* ------------------------------------------------------------------ */
/* WRITE side — content the scaffold prompt tells the IDE to create   */
/* ------------------------------------------------------------------ */

export function compileNxFiles(data: WorkspaceData): NxFile[] {
  const stack = compileStack(data.tech);
  const name = data.productName || "Untitled Product";

  const memory = {
    project: name,
    problem: data.idea.problem || "TBD",
    target_users: data.idea.targetUsers || "TBD",
    solutions: data.idea.currentSolutions || "TBD",
    differentiation: data.idea.differentiation || "TBD",
    stack: stack
      ? {
          surfaces: stack.platform,
          frontend: stack.frontend,
          language: stack.language,
          backend: stack.backend,
          database: stack.database,
          hosting: stack.hosting,
          libraries: stack.libraries,
        }
      : "Not yet configured",
    capabilities: data.tech.capabilities,
    brand: {
      vibe: data.brand.vibe,
      primary_color: data.brand.primaryColor,
      radius: data.brand.radius,
      font: data.brand.font,
    },
    design_notes: data.designNotes || null,
    custom_stages: data.customStages?.length
      ? data.customStages.map((s) => ({ id: s.id, label: s.label, steps: s.steps.map((st) => st.label) }))
      : [],
    phases: {
      idea: data.idea.problem ? "done" : "pending",
      tech_stack: stack ? "done" : "pending",
      build: "pending",
    },
  };

  const files: NxFile[] = [
    { path: `${NX_ROOT}/memory.json`, content: JSON.stringify(memory, null, 2) },
    {
      path: `${NX_ROOT}/idea.md`,
      content: `# Product Idea — ${name}

## Problem
${data.idea.problem || "_Not yet defined._"}

## Target Users
${data.idea.targetUsers || "_Not yet defined._"}

## How they solve it today
${data.idea.currentSolutions || "_Not yet defined._"}

## Our differentiation
${data.idea.differentiation || "_Not yet defined._"}
`,
    },
    {
      path: `${NX_ROOT}/decisions/tech-stack.md`,
      content: stack
        ? techStackDoc(stack)
        : "# Tech Stack\n\n_Complete the Tech Stack phase to generate this file._\n",
    },
    {
      path: `${NX_ROOT}/ui/brand-guide.md`,
      content: `# Brand Guide — ${name}

- **Vibe:** ${data.brand.vibe}
- **Primary Color:** ${data.brand.primaryColor}
- **Border Radius:** ${data.brand.radius}
- **Font:** ${data.brand.font}

${
  data.designNotes
    ? `## Studio Design Notes & Canvas Annotations\n${data.designNotes}\n`
    : ""
}
These values are NON-NEGOTIABLE for visual consistency. Every component
must use the primary color for primary actions and the defined radius and font.
`,
    },
    {
      path: `${NX_ROOT}/decisions/db-schema.md`,
      content: data.schemaDraft?.dbSchema
        ? `# Data Model

Database: **${stack?.database ?? "TBD"}**

${data.schemaDraft.dbSchema}

This is a starting design, not final DDL — adjust it as real features demand.
`
        : `# Data Model

Database: **${stack?.database ?? "TBD"}**

Define tables/collections here as features are built. Keep migrations in
version control. ${data.tech.capabilities.includes("auth") ? "Include a users table with auth provider IDs." : ""}
`,
    },
    {
      path: `${NX_ROOT}/specs/api-routes.md`,
      content: data.schemaDraft?.apiRoutes
        ? `# API Surface

Backend: **${stack?.backend ?? "TBD"}**

${data.schemaDraft.apiRoutes}

This is a starting design, not a final contract — adjust it as real features demand.
`
        : `# API Surface

Backend: **${stack?.backend ?? "TBD"}**

Document each endpoint (method, path, auth, request, response) as it is built.
`,
    },
    {
      path: `${NX_ROOT}/hosting.md`,
      content: `# Hosting & Deployment

Target: **${stack?.hosting ?? "TBD"}**

Configure CI/CD to deploy on push to \`main\`. Add preview deployments for PRs.
`,
    },
    { path: `${NX_ROOT}/checklist.md`, content: compileChecklistDoc(data) },
  ];

  if (data.briefInsights) {
    const { sharpenedProblem, riskiestAssumptions, stackConcerns } = data.briefInsights;
    files.push({
      path: `${NX_ROOT}/risks.md`,
      content: `# Risks & Assumptions — ${name}

An AI pressure-test of this brief, accepted by the founder. Defend against these
while building — don't just implement the happy path.

## Sharpened problem
${sharpenedProblem}

## Riskiest assumptions
${riskiestAssumptions.map((a) => `- ${a}`).join("\n")}
${
  stackConcerns.length
    ? `\n## Stack concerns\n${stackConcerns.map((c) => `- ${c}`).join("\n")}\n`
    : ""
}`,
    });
  }

  if (data.customStages && data.customStages.length > 0) {
    files.push({
      path: `${NX_ROOT}/custom-workflow.md`,
      content: `# Custom Product Workflow Stages

${data.customStages
  .map(
    (stage) =>
      `## ${stage.label}\n${stage.description}\n\n### Checklist Steps\n${stage.steps
        .map((step) => `- [ ] ${step.label}`)
        .join("\n")}`
  )
  .join("\n\n")}
`,
    });
  }

  // AGENTS.md — the open cross-tool standard (Linux Foundation; read natively
  // by Cursor, Windsurf/Devin Desktop, Zed, Aider, Antigravity, GitHub
  // Copilot, and most other agentic coding tools as of 2026) replaces what
  // used to be five separate, near-duplicate proprietary rule files.
  //
  // Each tool below still gets its own native file, but as a one-line pointer
  // rather than duplicated instructions. Claude Code's `@AGENTS.md` is an
  // officially documented import; Cursor has no such import *syntax*, but its
  // .mdc files are just prose an LLM agent reads and acts on — "read
  // AGENTS.md first" works as a plain instruction whether or not the tool
  // has a formal import mechanism for it. Only emitted for the founder's
  // selected agentTarget (see renderNxFileBlocks in prompts-server.ts) — no
  // point shipping five near-empty pointer files either.
  files.push(
    {
      path: "AGENTS.md",
      content: `# Agent Instructions — ${name}

When the user says "Start" or initiates a build:
1. Read \`.nx/memory.json\` and the rest of \`.nx/\` (idea, tech stack, brand guide, data model, API surface, risks) to load the full architecture and constraints.
2. Scaffold the project and build the foundation in one continuous agent run.
`,
    },
    { path: ".claude/CLAUDE.md", content: `@AGENTS.md\n` },
    {
      path: ".cursor/rules/nx.mdc",
      content: `---
alwaysApply: true
---
Read \`AGENTS.md\` at the repo root first — it has the full architecture, brand, and build instructions.
`,
    },
    {
      // Legacy root file — still read by both Windsurf and its Devin Desktop
      // successor (Cognition's rebrand, June 2026); .devin/rules/ and
      // .windsurf/rules/ take precedence if the founder's own setup has them,
      // this is just the reliable fallback.
      path: ".windsurfrules",
      content: `Read AGENTS.md at the repo root first — it has the full architecture, brand, and build instructions.\n`,
    }
  );

  return files;
}

/**
 * Renders the deliverables checklist as markdown checkboxes — the exact same
 * text both lands in the .nx/ bundle and is what "Copy checklist" copies, so
 * a straight content diff (see diffNx) is enough to tell whether the studio's
 * checklist has moved ahead of what's committed to the repo.
 */
/** Every fixed/custom checklist step that can render as a checkbox in checklist.md. */
function allChecklistSteps(data: WorkspaceData): ChecklistStep[] {
  const customSteps = data.customStages.find((s) => s.id === "checklist")?.steps ?? [];
  return [...BUILD_STEPS, ...(customSteps as ChecklistStep[])];
}

export function compileChecklistDoc(data: WorkspaceData): string {
  const steps = allChecklistSteps(data);
  const done = (id: string) =>
    (data.checklist["checklist"] ?? []).includes(id) || (data.checklist["build"] ?? []).includes(id);

  const lines = steps.map((s) => `- [${done(s.id) ? "x" : " "}] ${s.label}`);
  // Iterations are the post-launch changelog (see IterationEntry in types.ts) —
  // each feature/fix requested after the initial build gets its own line here,
  // so the checklist keeps growing instead of staying fixed at the 3 build steps.
  const iterationLines = data.iterations.map(
    (it) => `- [${it.status === "shipped" ? "x" : " "}] ${it.title}`
  );
  const allLines = [...lines, ...iterationLines];

  return `# Deliverables Checklist

${allLines.length ? allLines.join("\n") : "_No deliverables yet._"}

Keep this in sync as work lands — check items off, or add new ones, as you go.
`;
}

function techStackDoc(stack: CompiledStack): string {
  return `# Tech Stack Decision

| Slot | Choice |
| --- | --- |
| Surfaces | ${stack.platform} |
| Frontend | ${stack.frontend} |
| Language | ${stack.language} |
| Backend | ${stack.backend} |
| Database | ${stack.database} |
| Hosting | ${stack.hosting} |
| Libraries | ${stack.libraries.length ? stack.libraries.join(", ") : "—"} |

## Rationale
${stack.rationale}
`;
}

/* ------------------------------------------------------------------ */
/* READ side — parse .nx/ back from the connected repo           */
/* ------------------------------------------------------------------ */

export interface NxMemory {
  project?: string;
  problem?: string;
  target_users?: string;
  solutions?: string;
  differentiation?: string;
  stack?: { surfaces?: string; [key: string]: unknown } | string;
  capabilities?: string[];
  brand?: Record<string, string>;
  phases?: Record<string, string>;
}

export interface ParsedNx {
  /** Which of the standard files are present in the repo. */
  presentPaths: string[];
  /** Parsed memory.json, if present and valid. */
  memory: NxMemory | null;
  /** Raw contents of the .nx/ files we fetched from the repo (path → content). */
  docs: Record<string, string>;
  /** Standard paths nxstudio expects but the repo doesn't have yet. */
  missingPaths: string[];
  /** True if the .nx/ context directory exists at all. */
  exists: boolean;
}

/** The standard paths we look for when syncing a repo. */
export const NX_STANDARD_PATHS = [
  `${NX_ROOT}/memory.json`,
  `${NX_ROOT}/idea.md`,
  `${NX_ROOT}/decisions/tech-stack.md`,
  `${NX_ROOT}/ui/brand-guide.md`,
  `${NX_ROOT}/decisions/db-schema.md`,
  `${NX_ROOT}/specs/api-routes.md`,
  `${NX_ROOT}/hosting.md`,
  `${NX_ROOT}/checklist.md`,
];

/**
 * Reconstruct project context from the files fetched from the repo.
 * `files` maps repo path → file content. Presence-only entries (marked with an
 * empty string by the sync layer) count toward `presentPaths` but not `docs`.
 */
export function parseNx(files: Record<string, string>): ParsedNx {
  const presentPaths = Object.keys(files).filter((p) => p.startsWith(NX_ROOT));
  let memory: NxMemory | null = null;

  const memRaw = files[`${NX_ROOT}/memory.json`];
  if (memRaw) {
    try {
      memory = JSON.parse(memRaw) as NxMemory;
    } catch {
      memory = null;
    }
  }

  // Keep only the files we actually fetched content for (non-empty).
  const docs: Record<string, string> = {};
  for (const [p, content] of Object.entries(files)) {
    if (p.startsWith(NX_ROOT) && content) docs[p] = content;
  }

  const missingPaths = NX_STANDARD_PATHS.filter((p) => !presentPaths.includes(p));

  return {
    presentPaths,
    memory,
    docs,
    missingPaths,
    exists: presentPaths.length > 0,
  };
}

/* ------------------------------------------------------------------ */
/* DRIFT — how the loop "grows": compare committed .nx/ to fresh emit  */
/* ------------------------------------------------------------------ */

export type NxDriftStatus =
  | "unchanged" // repo file matches what we'd emit now
  | "drifted" // exists in both, but the agent changed it in the repo
  | "missing" // we'd emit it, repo doesn't have it yet
  | "extra"; // repo has an .nx/ file we don't emit (agent added context)

export interface NxDrift {
  path: string;
  status: NxDriftStatus;
}

function normalizeContent(s: string): string {
  return s.replace(/\r\n/g, "\n").trimEnd();
}

/**
 * Diff the .nx/ docs committed in the repo against what nxstudio would emit from
 * the current workspace. This is the read side of the loop: after a build, the
 * AI edits the .nx/ files, and this surfaces where the repo has moved past — or
 * away from — the studio's last-known intent, so the next compile can reconcile.
 */
export function diffNx(repoDocs: Record<string, string>, data: WorkspaceData): NxDrift[] {
  const emitted = compileNxFiles(data);
  const seen = new Set<string>();
  const out: NxDrift[] = [];

  for (const f of emitted) {
    seen.add(f.path);
    const repo = repoDocs[f.path];
    if (repo == null) out.push({ path: f.path, status: "missing" });
    else if (normalizeContent(repo) !== normalizeContent(f.content))
      out.push({ path: f.path, status: "drifted" });
    else out.push({ path: f.path, status: "unchanged" });
  }
  for (const path of Object.keys(repoDocs)) {
    if (!seen.has(path)) out.push({ path, status: "extra" });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* MERGE — reconcile repo-authored .nx/ content back into WorkspaceData */
/*                                                                      */
/* The read side above (parseNx/diffNx) only ever fed a diff display —  */
/* sync was one-directional. These reverse-parsers are the other half:  */
/* each is the inverse of one compileNxFiles() template, best-effort   */
/* (a doc that doesn't parse is left alone, never guessed at).          */
/* ------------------------------------------------------------------ */

/** Extract one `## Heading` section's body from a doc built by compileNxFiles. */
function mdSection(content: string, heading: string): string | null {
  const m = content.match(new RegExp(`## ${heading}\\n([\\s\\S]*?)(?:\\n## |$)`));
  if (!m) return null;
  const text = m[1].trim();
  return text && text !== "_Not yet defined._" ? text : "";
}

/** Bullet list items (`- item`) inside one already-extracted section body. */
function mdBullets(section: string): string[] {
  return section
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- "))
    .map((l) => l.slice(2).trim());
}

function parseIdeaMd(content: string): Partial<IdeaData> | null {
  const problem = mdSection(content, "Problem");
  const targetUsers = mdSection(content, "Target Users");
  const currentSolutions = mdSection(content, "How they solve it today");
  const differentiation = mdSection(content, "Our differentiation");
  if (problem === null && targetUsers === null && currentSolutions === null && differentiation === null) {
    return null;
  }
  const out: Partial<IdeaData> = {};
  if (problem !== null) out.problem = problem;
  if (targetUsers !== null) out.targetUsers = targetUsers;
  if (currentSolutions !== null) out.currentSolutions = currentSolutions;
  if (differentiation !== null) out.differentiation = differentiation;
  return out;
}

interface ParsedRisks {
  sharpenedProblem: string;
  riskiestAssumptions: string[];
  stackConcerns: string[];
}

function parseRisksMd(content: string): ParsedRisks | null {
  const sharpenedProblem = mdSection(content, "Sharpened problem");
  const riskSection = mdSection(content, "Riskiest assumptions");
  if (!sharpenedProblem || riskSection === null) return null;
  const riskiestAssumptions = mdBullets(riskSection);
  if (riskiestAssumptions.length === 0) return null;
  const concernSection = mdSection(content, "Stack concerns");
  const stackConcerns = concernSection ? mdBullets(concernSection) : [];
  return { sharpenedProblem, riskiestAssumptions, stackConcerns };
}

function parseBrandGuideMd(content: string): Partial<BrandDNA> | null {
  const field = (label: string) => {
    const m = content.match(new RegExp(`\\*\\*${label}:\\*\\* (.+)`));
    return m ? m[1].trim() : null;
  };
  const vibe = field("Vibe");
  const primaryColor = field("Primary Color");
  const radius = field("Border Radius");
  const font = field("Font");
  if (!vibe && !primaryColor && !radius && !font) return null;
  const out: Partial<BrandDNA> = {};
  if (vibe) out.vibe = vibe;
  if (primaryColor) out.primaryColor = primaryColor;
  if (radius) out.radius = radius;
  if (font) out.font = font;
  return out;
}

const SURFACE_NAME_TO_ID: Record<string, Surface> = Object.fromEntries(
  SURFACE_OPTIONS.map((o) => [o.label, o.id])
);

/** Reverse of surfaceLabel() in platform-engine.ts — "Web + iOS" back to ["web","ios"]. */
function parseTechStackSurfaces(content: string): Surface[] | null {
  const m = content.match(/\|\s*Surfaces\s*\|\s*(.+?)\s*\|/);
  if (!m || m[1].trim() === "—") return null;
  const surfaces = m[1]
    .split("+")
    .map((s) => SURFACE_NAME_TO_ID[s.trim()])
    .filter((s): s is Surface => !!s);
  return surfaces.length ? surfaces : null;
}

/**
 * Unwrap the free-text body compileNxFiles wraps db-schema.md/api-routes.md
 * content in. Only the header line (title + Database/Backend label) is
 * required to match — the trailing auto-generated sentence is stripped if
 * still present, but isn't required, since a build agent told to "keep this
 * doc updated as the schema evolves" will often rewrite or drop it. Requiring
 * that exact sentence would silently lose real edits instead of just losing
 * the boilerplate.
 */
function unwrapDoc(content: string, header: RegExp, footers: RegExp[]): string | null {
  const m = content.match(header);
  if (!m) return null;
  let body = m[1];
  for (const footer of footers) body = body.replace(footer, "");
  body = body.trim();
  return body || null;
}

function parseDbSchemaMd(content: string): string | null {
  return unwrapDoc(content, /# Data Model\n\nDatabase: \*\*.*?\*\*\n\n([\s\S]*)$/, [
    /\n*This is a starting design,[^\n]*$/i,
    /\n*Define tables\/collections here[\s\S]*$/i,
  ]);
}

function parseApiRoutesMd(content: string): string | null {
  return unwrapDoc(content, /# API Surface\n\nBackend: \*\*.*?\*\*\n\n([\s\S]*)$/, [
    /\n*This is a starting design,[^\n]*$/i,
    /\n*Document each endpoint[\s\S]*$/i,
  ]);
}

function parseChecklistDone(content: string): Set<string> {
  const done = new Set<string>();
  for (const line of content.split("\n")) {
    const m = line.match(/^- \[x\] (.+)$/i);
    if (m) done.add(m[1].trim());
  }
  return done;
}

const CAPABILITY_IDS = new Set(CAPABILITY_OPTIONS.map((o) => o.id));

/**
 * Full auto-merge: reconcile repo-authored `.nx/` content back into
 * WorkspaceData. Only acts on files diffNx marks "drifted" — "missing"
 * (studio has more than the repo) and "unchanged"/"extra" need no
 * reconciliation. Repo wins on drift: whatever the agent committed is
 * treated as the founder's current intent. Returns only the fields that
 * actually changed, ready to pass straight to patchData/applyWorkspacePatch.
 */
export function mergeNxIntoWorkspace(parsed: ParsedNx, data: WorkspaceData): Partial<WorkspaceData> {
  const drift = diffNx(parsed.docs, data);
  const drifted = new Set(drift.filter((d) => d.status === "drifted").map((d) => d.path));

  const memoryPath = `${NX_ROOT}/memory.json`;
  const ideaPath = `${NX_ROOT}/idea.md`;
  const risksPath = `${NX_ROOT}/risks.md`;
  const checklistPath = `${NX_ROOT}/checklist.md`;
  const brandPath = `${NX_ROOT}/ui/brand-guide.md`;
  const techStackPath = `${NX_ROOT}/decisions/tech-stack.md`;
  const dbSchemaPath = `${NX_ROOT}/decisions/db-schema.md`;
  const apiRoutesPath = `${NX_ROOT}/specs/api-routes.md`;

  let idea = data.idea;
  let brand = data.brand;
  let tech = data.tech;

  if (drifted.has(memoryPath) && parsed.memory) {
    const m = parsed.memory;
    const fromMemory: Partial<IdeaData> = {};
    if (typeof m.problem === "string") fromMemory.problem = m.problem;
    if (typeof m.target_users === "string") fromMemory.targetUsers = m.target_users;
    if (typeof m.solutions === "string") fromMemory.currentSolutions = m.solutions;
    if (typeof m.differentiation === "string") fromMemory.differentiation = m.differentiation;
    if (Object.keys(fromMemory).length) idea = { ...idea, ...fromMemory };
    if (m.brand) {
      const b: Partial<BrandDNA> = {};
      if (m.brand.vibe) b.vibe = m.brand.vibe;
      if (m.brand.primary_color) b.primaryColor = m.brand.primary_color;
      if (m.brand.radius) b.radius = m.brand.radius;
      if (m.brand.font) b.font = m.brand.font;
      if (Object.keys(b).length) brand = { ...brand, ...b };
    }
    if (Array.isArray(m.capabilities)) {
      const caps = m.capabilities.filter((c): c is Capability => CAPABILITY_IDS.has(c as Capability));
      if (caps.length) tech = { ...tech, capabilities: caps };
    }
  }

  if (drifted.has(ideaPath)) {
    const doc = parsed.docs[ideaPath];
    const parsedIdea = doc ? parseIdeaMd(doc) : null;
    if (parsedIdea) idea = { ...idea, ...parsedIdea };
  }

  if (drifted.has(brandPath)) {
    const doc = parsed.docs[brandPath];
    const parsedBrand = doc ? parseBrandGuideMd(doc) : null;
    if (parsedBrand) brand = { ...brand, ...parsedBrand };
  }

  if (drifted.has(techStackPath)) {
    const doc = parsed.docs[techStackPath];
    const surfaces = doc ? parseTechStackSurfaces(doc) : null;
    if (surfaces) tech = { ...tech, surfaces };
  }

  const patch: Partial<WorkspaceData> = {};
  if (idea !== data.idea) patch.idea = idea;
  if (brand !== data.brand) patch.brand = brand;
  if (tech !== data.tech) patch.tech = tech;

  if (drifted.has(risksPath)) {
    const doc = parsed.docs[risksPath];
    const parsedRisks = doc ? parseRisksMd(doc) : null;
    if (parsedRisks) {
      patch.briefInsights = {
        ...parsedRisks,
        sourceIdea: patch.idea ?? data.idea,
        sourceCapabilities: (patch.tech ?? data.tech).capabilities,
        sourceSurfaces: (patch.tech ?? data.tech).surfaces,
      };
    }
  }

  if (drifted.has(dbSchemaPath) || drifted.has(apiRoutesPath)) {
    const dbDoc = parsed.docs[dbSchemaPath];
    const apiDoc = parsed.docs[apiRoutesPath];
    const dbSchema = drifted.has(dbSchemaPath) && dbDoc ? parseDbSchemaMd(dbDoc) : null;
    const apiRoutes = drifted.has(apiRoutesPath) && apiDoc ? parseApiRoutesMd(apiDoc) : null;
    if (dbSchema || apiRoutes) {
      patch.schemaDraft = {
        dbSchema: dbSchema ?? data.schemaDraft?.dbSchema ?? "",
        apiRoutes: apiRoutes ?? data.schemaDraft?.apiRoutes ?? "",
      };
    }
  }

  if (drifted.has(checklistPath)) {
    const doc = parsed.docs[checklistPath];
    if (doc) {
      const doneLabels = parseChecklistDone(doc);
      const steps = allChecklistSteps(data);
      const nextDone = new Set(data.checklist["checklist"] ?? []);
      let changed = false;
      for (const step of steps) {
        if (doneLabels.has(step.label) && !nextDone.has(step.id)) {
          nextDone.add(step.id);
          changed = true;
        }
      }
      const nextIterations = data.iterations.map((it) => {
        if (it.status === "shipped" || !doneLabels.has(it.title)) return it;
        changed = true;
        return { ...it, status: "shipped" as const };
      });
      if (changed) {
        patch.checklist = { ...data.checklist, checklist: [...nextDone] };
        patch.iterations = nextIterations;
      }
    }
  }

  return patch;
}
