/**
 * Prompt builders — the ONLY thing nx-studio hands to the user.
 *
 * Every phase compiles founder input into a prompt to paste into an AI IDE.
 * The IDE is what creates files, folders, and code. nx-studio never writes
 * to a project itself.
 */

import { compileStack } from "./platform-engine";
import { compileNxHumanFiles, NXHUMAN_ROOT } from "./nxhuman-compiler";
import { WorkspaceData } from "./types";

export interface BuildPrompt {
  id: string;
  order: number;
  title: string;
  description: string;
  includes: string[];
  references: string[];
  prompt: string;
}

/* ------------------------------------------------------------------ */
/* Scaffold prompt — tells the IDE to CREATE the .nxhuman/ context     */
/* ------------------------------------------------------------------ */

export function buildScaffoldPrompt(data: WorkspaceData): string {
  const files = compileNxHumanFiles(data);
  const name = data.productName || "the product";

  const fileBlocks = files
    .map((f) => {
      const lang = f.path.endsWith(".json") ? "json" : "markdown";
      return `### \`${f.path}\`\n\`\`\`${lang}\n${f.content}\`\`\``;
    })
    .join("\n\n");

  return `You are setting up the project context for "${name}".

Create a \`${NXHUMAN_ROOT}/\` directory at the repo root containing the files
below, verbatim. This directory is the single source of truth every later
build prompt reads before writing code. Commit it to the repository.

${fileBlocks}

After creating these files, commit them with the message:
"chore: initialize .nxhuman context"`;
}

/* ------------------------------------------------------------------ */
/* Per-phase prompts                                                  */
/* ------------------------------------------------------------------ */

export function buildIdeaPrompt(data: WorkspaceData): string {
  return `Act as a startup strategist. Pressure-test this idea for "${data.productName}".

Problem: ${data.idea.problem || "(not provided)"}
Target users: ${data.idea.targetUsers || "(not provided)"}
How they solve it today: ${data.idea.currentSolutions || "(not provided)"}
Our differentiation: ${data.idea.differentiation || "(not provided)"}

Return: the 3 riskiest assumptions, who to interview first, and a one-line
sharpened problem statement.`;
}

export function buildValidationPrompt(data: WorkspaceData): string {
  return `Act as a user researcher for "${data.productName}".

Problem: ${data.idea.problem || "(define the problem first)"}
Target users: ${data.idea.targetUsers || "(define users first)"}

Produce: (1) 2–3 user personas, (2) a 6-question interview script that avoids
leading questions, (3) a competitor matrix template, and (4) the signal that
would tell us to proceed vs. pivot.`;
}

export function buildPrototypePrompts(data: WorkspaceData): {
  title: string;
  subtitle: string;
  prompt: string;
}[] {
  const problem = data.idea.problem || "the core problem";
  const users = data.idea.targetUsers || "your target users";
  return [
    {
      title: "Prototype the core user flow",
      subtitle: "Registration → first value, as clickable screens",
      prompt: `Design a low-fidelity, clickable prototype for "${data.productName}".
Users: ${users}
Problem solved: ${problem}
Vibe: ${data.brand.vibe}. Primary color: ${data.brand.primaryColor}. Radius: ${data.brand.radius}.
Produce the core screens for the primary flow (registration → first value),
each described well enough to hand to a design/codegen tool.`,
    },
    {
      title: "Landing page",
      subtitle: "High-conversion first impression",
      prompt: `Write a high-conversion landing page for "${data.productName}".
Headline should speak to: ${problem}
Audience: ${users}
Sections: hero, problem, solution, social proof, pricing, CTA.
Brand vibe: ${data.brand.vibe}.`,
    },
  ];
}

export function buildLaunchPrompt(data: WorkspaceData): string {
  const stack = compileStack(data.tech);
  return `Act as a launch engineer for "${data.productName}".
Stack: ${stack ? `${stack.frontend} · ${stack.hosting}` : "(configure Tech Stack first)"}.

Produce a launch checklist prompt-by-prompt: production deploy to ${stack?.hosting ?? "the host"},
domain + DNS, analytics wiring, a waitlist/signup capture, and a Product Hunt
launch post draft.`;
}

/* ------------------------------------------------------------------ */
/* Build phase — the sequenced master prompts                         */
/* ------------------------------------------------------------------ */

export function buildBuildPrompts(data: WorkspaceData): BuildPrompt[] {
  const stack = compileStack(data.tech);
  const name = data.productName || "the product";
  const lang = stack?.language ?? "the chosen language";
  const fe = stack?.frontend ?? "the chosen framework";

  const preamble = `You are the Lead Engineer for "${name}".
Before writing any code you MUST read the referenced ${NXHUMAN_ROOT}/ files to load
the architecture, brand, and constraints. Do not restate them — follow them.
Stack: ${fe} (${lang}).`;

  return [
    {
      id: "foundation",
      order: 1,
      title: "Project Foundation & Setup",
      description: "Establish environment, workspace structure, and core shared utilities.",
      includes: [
        "Project scaffolding & config",
        "Theme & design-token integration",
        "Base UI components (Atomic)",
      ],
      references: [`${NXHUMAN_ROOT}/decisions/tech-stack.md`, `${NXHUMAN_ROOT}/ui/brand-guide.md`],
      prompt: `${preamble}

## Phase 1 — Project Foundation & Setup
1. Scaffold the project per ${NXHUMAN_ROOT}/decisions/tech-stack.md.
2. Integrate the theme from ${NXHUMAN_ROOT}/ui/brand-guide.md (primary color, radius, font).
3. Build the atomic base UI components (Button, Card, Input) using those tokens.
4. Set up the folder structure and shared utilities.

Propose the file structure first and wait for confirmation before generating files.`,
    },
    {
      id: "core",
      order: 2,
      title: "Core Features Implementation",
      description: "Develop logic, data models, and the main interactive modules.",
      includes: [
        `Database schema & migrations${data.tech.needsDatabase ? "" : " (skipped — no DB)"}`,
        `Authentication & RBAC${data.tech.needsAuth ? "" : " (skipped — no auth)"}`,
        "Main application logic",
      ],
      references: [`${NXHUMAN_ROOT}/specs/api-routes.md`, `${NXHUMAN_ROOT}/decisions/db-schema.md`],
      prompt: `${preamble}

## Phase 2 — Core Features Implementation
${data.tech.needsDatabase ? "1. Implement the schema & migrations from " + NXHUMAN_ROOT + "/decisions/db-schema.md.\n" : ""}${data.tech.needsAuth ? "2. Implement authentication & role-based access control.\n" : ""}3. Build the API surface from ${NXHUMAN_ROOT}/specs/api-routes.md.
4. Implement the main interactive modules and wire them to the data layer.

Build feature by feature. Run local checks after each feature before moving on.`,
    },
    {
      id: "polish",
      order: 3,
      title: "Polish & Deployment",
      description: "Final styling, optimization, and production pipeline setup.",
      includes: ["Performance optimization", "SEO & meta tags", "CI/CD & deployment config"],
      references: [`${NXHUMAN_ROOT}/hosting.md`],
      prompt: `${preamble}

## Phase 3 — Polish & Deployment
1. Optimize performance (bundle size, lazy-loading, images).
2. Add SEO & meta tags where applicable.
3. Configure CI/CD and deployment per ${NXHUMAN_ROOT}/hosting.md (target: ${stack?.hosting ?? "TBD"}).
4. Verify a clean production build and ship.`,
    },
  ];
}
