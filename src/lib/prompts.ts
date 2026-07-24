/**
 * Prompt builders — the ONLY thing nx-studio hands to the user.
 *
 * Every phase compiles founder input into a prompt to paste into an AI IDE.
 * The IDE is what creates files, folders, and code. nx-studio never writes
 * to a project itself.
 */

import { compileStack } from "./platform-engine";
import { compileNxFiles, NX_ROOT } from "./nx-compiler";
import { WorkspaceData } from "./types";

export interface DepthPrompt {
  id: string;
  title: string;
  description: string;
  prompt: string;
}

/** Render the .nx/ files as fenced blocks for embedding in a prompt. */
function renderNxFileBlocks(data: WorkspaceData): string {
  return compileNxFiles(data)
    .map((f) => {
      const lang = f.path.endsWith(".json") ? "json" : "markdown";
      return `### \`${f.path}\`\n\`\`\`${lang}\n${f.content}\`\`\``;
    })
    .join("\n\n");
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

/* ------------------------------------------------------------------ */
/* Master build prompt — the ONE prompt that builds the foundation     */
/* ------------------------------------------------------------------ */

/**
 * The single hero deliverable. It embeds the entire .nx/ context and
 * instructs one continuous agentic run to scaffold and build the foundation —
 * the founder pastes it once, no "come back for step 2".
 */
export function buildMasterPrompt(data: WorkspaceData): string {
  const stack = compileStack(data.tech);
  const name = data.productName || "the product";
  const problem = data.idea.problem || "the core product experience";
  const fe = stack?.frontend ?? "the chosen framework";
  const lang = stack?.language ?? "the chosen language";
  const backendLine =
    !stack || stack.backend.startsWith("None")
      ? "5. No backend — keep everything client-side and persist locally."
      : `5. Stand up ${stack.backend} and wire the capabilities in \`${NX_ROOT}/memory.json\` (auth, database, realtime as listed).`;
  const libsLine = stack && stack.libraries.length
    ? `\n6. Integrate: ${stack.libraries.join(", ")}.`
    : "";

  return `You are the lead engineer building "${name}" in one continuous agentic run.
Stack: ${fe} (${lang}). Research any API or library you're unsure about before you use it.

## Step 0 — Establish the context
Create a \`${NX_ROOT}/\` directory at the repo root with these files, verbatim.
This is your single source of truth — re-read it before each step and follow it exactly.

${renderNxFileBlocks(data)}

## Step 1 — Build the foundation, end to end
Do NOT stop between steps. Work through them in order, verifying as you go:

1. Scaffold ${fe} per \`${NX_ROOT}/decisions/tech-stack.md\`.
2. Apply the brand tokens from \`${NX_ROOT}/ui/brand-guide.md\` (color, radius, font) as the theme.
3. Build the atomic UI components (Button, Card, Input, etc.) on those tokens.
4. Lay out the folder structure and shared utilities; propose it, then proceed.
${backendLine}
7. Implement the core product flow that solves: ${problem}.${libsLine}

After each feature, run the project's checks before moving on. When the foundation
is complete, commit it and summarise what was built and what remains.`;
}

/* ------------------------------------------------------------------ */
/* Depth prompts — optional, paste into a project that ALREADY has     */
/* .nx/. Meta-cognitive reviews, not part of the initial build.   */
/* ------------------------------------------------------------------ */

export function buildDepthPrompts(data: WorkspaceData): DepthPrompt[] {
  const stack = compileStack(data.tech);
  const name = data.productName || "the product";
  const host = stack?.hosting ?? "the chosen host";
  const ctx = `Read \`${NX_ROOT}/\` first to load the architecture, brand, and constraints.`;

  return [
    {
      id: "qa",
      title: "QA & test coverage",
      description: "Find broken states and cover the core flows with tests.",
      prompt: `${ctx}

Act as the QA engineer for "${name}". Exercise the core user flows, enumerate the
edge cases and broken/empty/error states, and write automated tests that cover
them. Fix the bugs you surface. Report a short coverage summary and any risks left.`,
    },
    {
      id: "security",
      title: "Security review",
      description: "Audit auth, input handling, secrets, and dependencies.",
      prompt: `${ctx}

Act as an application security reviewer for "${name}". Audit: authentication and
session handling, authorization / object-level access, input validation and
injection, secrets or keys exposed to the client, and dependency CVEs. Fix what is
safe to fix and produce a prioritised list of what needs human review.`,
    },
    {
      id: "performance",
      title: "Performance pass",
      description: "Profile and fix slow renders, bundles, and queries.",
      prompt: `${ctx}

Profile "${name}" and improve performance: slow renders and re-renders, oversized
bundles, unoptimised images/assets, and N+1 or slow queries. Apply the fixes and
report before/after numbers for the metrics you moved.`,
    },
    {
      id: "accessibility",
      title: "Accessibility audit",
      description: "Get the UI to WCAG AA.",
      prompt: `${ctx}

Audit "${name}" against WCAG 2.2 AA: keyboard navigation and focus order, colour
contrast, form labels and error messaging, and screen-reader semantics. Fix the
issues directly in the components and note anything that needs design input.`,
    },
    {
      id: "deploy",
      title: "Ship to production",
      description: `Set up CI/CD and deploy to ${host}.`,
      prompt: `${ctx}

Set up production deployment for "${name}" to ${host}: CI/CD on push to \`main\`,
environment variables and secrets, preview builds for pull requests, framework-native
analytics/telemetry (structured logging + page/event tracking), and a post-deploy
smoke test. Write the runbook into \`${NX_ROOT}/hosting.md\`.`,
    },
  ];
}
