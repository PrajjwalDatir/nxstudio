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
    },
    phases: {
      idea: "done",
      tech_stack: stack ? "done" : "pending",
      build: "pending",
    },
  };

  return [
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

These values are NON-NEGOTIABLE for visual consistency. Every component
must use the primary color for primary actions and the defined radius.
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
  ];
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
];

/**
 * Reconstruct project context from the files fetched from the repo.
 * `files` maps repo path → file content (only paths that exist).
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

  return {
    presentPaths,
    memory,
    exists: presentPaths.length > 0,
  };
}
