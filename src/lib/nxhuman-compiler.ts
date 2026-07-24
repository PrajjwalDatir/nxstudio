/**
 * .nxhuman/ standard — spec, content builders, and PARSER.
 *
 * nx-studio never writes files. It does two things with .nxhuman/:
 *   1. WRITE side: describe the directory + file contents *inside a prompt*
 *      (see prompts.ts::buildScaffoldPrompt) so the AI IDE creates it.
 *   2. READ side: parseNxHuman() reconstructs project context from the files
 *      the IDE committed to GitHub (see the sync store).
 */

import { compileStack } from "./platform-engine";
import { CompiledStack, WorkspaceData } from "./types";

export const NXHUMAN_ROOT = ".nxhuman";

export interface NxHumanFile {
  path: string; // ".nxhuman/decisions/tech-stack.md"
  content: string;
}

/* ------------------------------------------------------------------ */
/* WRITE side — content the scaffold prompt tells the IDE to create   */
/* ------------------------------------------------------------------ */

export function compileNxHumanFiles(data: WorkspaceData): NxHumanFile[] {
  const stack = compileStack(data.tech);
  const name = data.productName || "Untitled Product";

  const memory = {
    project: name,
    problem: data.idea.problem || "TBD",
    target_users: data.idea.targetUsers || "TBD",
    stack: stack
      ? {
          platform: stack.platform,
          frontend: stack.frontend,
          backend: stack.backend,
          database: stack.database,
          hosting: stack.hosting,
          language: stack.language,
        }
      : "Not yet configured",
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
    { path: `${NXHUMAN_ROOT}/memory.json`, content: JSON.stringify(memory, null, 2) },
    {
      path: `${NXHUMAN_ROOT}/idea.md`,
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
      path: `${NXHUMAN_ROOT}/decisions/tech-stack.md`,
      content: stack
        ? techStackDoc(stack)
        : "# Tech Stack\n\n_Complete the Tech Stack phase to generate this file._\n",
    },
    {
      path: `${NXHUMAN_ROOT}/ui/brand-guide.md`,
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
      path: `${NXHUMAN_ROOT}/decisions/db-schema.md`,
      content: `# Data Model

Database: **${stack?.database ?? "TBD"}**

Define tables/collections here as features are built. Keep migrations in
version control. ${data.tech.needsAuth ? "Include a users table with auth provider IDs." : ""}
`,
    },
    {
      path: `${NXHUMAN_ROOT}/specs/api-routes.md`,
      content: `# API Surface

Backend: **${stack?.backend ?? "TBD"}**

Document each endpoint (method, path, auth, request, response) as it is built.
`,
    },
    {
      path: `${NXHUMAN_ROOT}/hosting.md`,
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
| Platform | ${stack.platform} |
| Frontend | ${stack.frontend} |
| Backend | ${stack.backend} |
| Database | ${stack.database} |
| Hosting | ${stack.hosting} |
| Language | ${stack.language} |

## Rationale
${stack.rationale}
`;
}

/* ------------------------------------------------------------------ */
/* READ side — parse .nxhuman/ back from the connected repo           */
/* ------------------------------------------------------------------ */

export interface NxHumanMemory {
  project?: string;
  problem?: string;
  target_users?: string;
  stack?: Record<string, string> | string;
  brand?: Record<string, string>;
  phases?: Record<string, string>;
}

export interface ParsedNxHuman {
  /** Which of the standard files are present in the repo. */
  presentPaths: string[];
  /** Parsed memory.json, if present and valid. */
  memory: NxHumanMemory | null;
  /** True if the .nxhuman/ context directory exists at all. */
  exists: boolean;
}

/** The standard paths we look for when syncing a repo. */
export const NXHUMAN_STANDARD_PATHS = [
  `${NXHUMAN_ROOT}/memory.json`,
  `${NXHUMAN_ROOT}/idea.md`,
  `${NXHUMAN_ROOT}/decisions/tech-stack.md`,
  `${NXHUMAN_ROOT}/ui/brand-guide.md`,
  `${NXHUMAN_ROOT}/decisions/db-schema.md`,
  `${NXHUMAN_ROOT}/specs/api-routes.md`,
  `${NXHUMAN_ROOT}/hosting.md`,
];

/**
 * Reconstruct project context from the files fetched from the repo.
 * `files` maps repo path → file content (only paths that exist).
 */
export function parseNxHuman(files: Record<string, string>): ParsedNxHuman {
  const presentPaths = Object.keys(files).filter((p) => p.startsWith(NXHUMAN_ROOT));
  let memory: NxHumanMemory | null = null;

  const memRaw = files[`${NXHUMAN_ROOT}/memory.json`];
  if (memRaw) {
    try {
      memory = JSON.parse(memRaw) as NxHumanMemory;
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
