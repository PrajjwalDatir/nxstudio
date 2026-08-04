/**
 * .nx/ standard — spec, content builders, and PARSER.
 *
 * nx-studio never writes files. It does two things with .nx/:
 *   1. WRITE side: describe the directory + file contents *inside a prompt*
 *      (see prompts.ts::buildMasterPrompt) so the AI IDE creates it.
 *   2. READ side: parseNx() reconstructs project context from the files
 *      the IDE committed to GitHub (see the sync store).
 */

import { compileStack } from "./platform-engine";
import { getPhase } from "./phases";
import { CompiledStack, WorkspaceData } from "./types";

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
      content: `# Data Model

Database: **${stack?.database ?? "TBD"}**

Define tables/collections here as features are built. Keep migrations in
version control. ${data.tech.capabilities.includes("auth") ? "Include a users table with auth provider IDs." : ""}
`,
    },
    {
      path: `${NX_ROOT}/specs/api-routes.md`,
      content: `# API Surface

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

  // Pre-configured IDE agent rule files — unzipping configures Claude Code, Cursor, & Windsurf automatically
  files.push(
    {
      path: ".claude/CLAUDE.md",
      content: `# Claude Code Instructions — ${name}

When the user says "Start" or initiates a build:
1. Read \`.nx/memory.json\` and \`.nx/ui/brand-guide.md\` to load the stack, brand tokens, and architecture specs.
2. Scaffold the project and build the foundation in one continuous agent run.
`,
    },
    {
      path: ".cursor/rules/nx.mdc",
      content: `---
description: Read .nx/ architecture memory on build start
globs: *
---
# Cursor Agent Rule — ${name}

When the user says "Start" or initiates a build:
- Read \`.nx/memory.json\` and \`.nx/\` files for tech stack, brand tokens, and architecture specs.
- Scaffold the project and build the foundation end-to-end.
`,
    },
    {
      path: ".windsurfrules",
      content: `# Windsurf Cascade Rule — ${name}

When the user says "Start" or initiates a build:
- Read \`.nx/\` directory files to load architecture memory, brand tokens, and build order.
- Scaffold the project and build the foundation end-to-end.
`,
    },
    {
      path: ".antigravity/instructions.md",
      content: `# Google Antigravity Instructions — ${name}

When the user says "Start" or initiates a build:
1. Read \`.nx/memory.json\` and \`.nx/ui/brand-guide.md\` to load the stack, brand tokens, and architecture specs.
2. Scaffold the project and build the foundation in one continuous run.
`,
    },
    {
      path: ".zed/prompts/build.md",
      content: `# Zed AI Instructions — ${name}

When the user says "Start" or initiates a build:
- Read \`.nx/memory.json\` and \`.nx/\` files for tech stack, brand tokens, and architecture specs.
- Scaffold the project and build the foundation end-to-end.
`,
    },
    {
      path: "CONVENTIONS.md",
      content: `# Aider & Universal Conventions — ${name}

When starting a build:
- Read \`.nx/\` directory files for tech stack, brand tokens, and architecture specs.
- Scaffold the project and build the foundation end-to-end.
`,
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
export function compileChecklistDoc(data: WorkspaceData): string {
  const defaultSteps = getPhase("checklist")?.steps ?? [];
  const customSteps = data.customStages.find((s) => s.id === "checklist")?.steps ?? [];
  const steps = [...defaultSteps, ...customSteps];
  const done = (id: string) =>
    (data.checklist["checklist"] ?? []).includes(id) || (data.checklist["build"] ?? []).includes(id);

  const lines = steps.map((s) => `- [${done(s.id) ? "x" : " "}] ${s.label}`);

  return `# Deliverables Checklist

${lines.length ? lines.join("\n") : "_No deliverables yet._"}

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
  stack?: Record<string, string> | string;
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
