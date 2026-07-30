import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { compileStack } from "./platform-engine";
import { compileNxFiles, NX_ROOT } from "./nx-compiler";
import { AgentTarget, WorkspaceData } from "./types";

/**
 * Server-only prompt compiler. The valuable prose lives in the `prompt_templates`
 * table (RLS-hidden from clients); this reads it with the service-role key and
 * fills in {{placeholders}} from the founder's own workspace data. The final
 * prompt is assembled here and returned ONLY to premium users by the API route —
 * it never ships in the client bundle. Derivation of the stack + .nx/ blocks is
 * non-secret (it's the user's input), so those helpers stay shared.
 */

export interface CompiledPrompt {
  id: string;
  title: string;
  description: string;
  prompt: string;
}

export interface CompiledPrompts {
  idea: CompiledPrompt;
  master: CompiledPrompt;
  depth: CompiledPrompt[];
}

interface TemplateRow {
  id: string;
  title: string;
  description: string;
  body: string;
  sort: number;
}

const DEFAULT_TEMPLATES: TemplateRow[] = [
  {
    id: "idea",
    title: "Idea pressure-test",
    description: "Stress-test the problem, users, and differentiation before you build.",
    body: `Act as a startup strategist. Pressure-test this idea for "{{productName}}".

Problem: {{problem}}
Target users: {{targetUsers}}
How they solve it today: {{currentSolutions}}
Our differentiation: {{differentiation}}

Return: the 3 riskiest assumptions, who to interview first, and a one-line sharpened problem statement.`,
    sort: -1,
  },
  {
    id: "master",
    title: "Your build prompt",
    description: "One prompt that creates your .nx/ context and builds the foundation in a single run.",
    body: `You are the lead engineer building "{{name}}" in one continuous agentic run.
Stack: {{fe}} ({{lang}}). Research any API or library you're unsure about before you use it.

## Step 0 — Establish the context
Create a \`{{nxRoot}}/\` directory at the repo root with these files, verbatim.
This is your single source of truth — re-read it before each step and follow it exactly.

{{nxFileBlocks}}

## Step 1 — Build the foundation, end to end
Do NOT stop between steps. Work through them in order, verifying as you go:

{{buildSteps}}

After each feature, run the project's checks before moving on. When the foundation
is complete, commit it and summarise what was built and what remains.`,
    sort: 0,
  },
  {
    id: "qa",
    title: "QA & test coverage",
    description: "Find broken states and cover the core flows with tests.",
    body: `{{ctx}}

Act as the QA engineer for "{{name}}". Exercise the core user flows, enumerate the
edge cases and broken/empty/error states, and write automated tests that cover
them. Fix the bugs you surface. Report a short coverage summary and any risks left.`,
    sort: 1,
  },
  {
    id: "security",
    title: "Security review",
    description: "Audit auth, input handling, secrets, and dependencies.",
    body: `{{ctx}}

Act as an application security reviewer for "{{name}}". Audit: authentication and
session handling, authorization / object-level access, input validation and
injection, secrets or keys exposed to the client, and dependency CVEs. Fix what is
safe to fix and produce a prioritised list of what needs human review.`,
    sort: 2,
  },
  {
    id: "performance",
    title: "Performance pass",
    description: "Profile and fix slow renders, bundles, and queries.",
    body: `{{ctx}}

Profile "{{name}}" and improve performance: slow renders and re-renders, oversized
bundles, unoptimised images/assets, and N+1 or slow queries. Apply the fixes and
report before/after numbers for the metrics you moved.`,
    sort: 3,
  },
  {
    id: "accessibility",
    title: "Accessibility audit",
    description: "Get the UI to WCAG AA.",
    body: `{{ctx}}

Audit "{{name}}" against WCAG 2.2 AA: keyboard navigation and focus order, colour
contrast, form labels and error messaging, and screen-reader semantics. Fix the
issues directly in the components and note anything that needs design input.`,
    sort: 4,
  },
  {
    id: "deploy",
    title: "Ship to production",
    description: "Set up CI/CD and deploy to your host.",
    body: `{{ctx}}

Set up production deployment for "{{name}}" to {{host}}: CI/CD on push to \`main\`,
environment variables and secrets, preview builds for pull requests, framework-native
analytics/telemetry (structured logging + page/event tracking), and a post-deploy
smoke test. Write the runbook into \`{{nxRoot}}/hosting.md\`.`,
    sort: 5,
  },
];

async function loadTemplates(): Promise<Map<string, TemplateRow>> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("prompt_templates")
    .select("id, title, description, body, sort")
    .order("sort", { ascending: true });

  if (error) {
    console.error("Database error loading prompt templates:", error);
    throw new Error("Server is busy, please try in a while.");
  }

  if (!data || data.length === 0) {
    return new Map(DEFAULT_TEMPLATES.map((t) => [t.id, t]));
  }

  return new Map((data as TemplateRow[]).map((t) => [t.id, t]));
}

/** Replace {{key}} tokens; unknown keys collapse to empty (matches the old inline logic). */
function fill(body: string, vars: Record<string, string>): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_, key: string) => (key in vars ? vars[key] : ""));
}

/** Render the .nx/ files as fenced blocks — identical to the old prompts.ts helper. */
function renderNxFileBlocks(data: WorkspaceData): string {
  return compileNxFiles(data)
    .map((f) => {
      const lang = f.path.endsWith(".json") ? "json" : "markdown";
      return `### \`${f.path}\`\n\`\`\`${lang}\n${f.content}\`\`\``;
    })
    .join("\n\n");
}

function toCompiled(t: TemplateRow, vars: Record<string, string>): CompiledPrompt {
  return { id: t.id, title: t.title, description: t.description, prompt: fill(t.body, vars) };
}

/**
 * Compile every prompt for a project. Mirrors the previous client-side builders
 * (buildIdeaPrompt / buildMasterPrompt / buildDepthPrompts) exactly.
 * Supports target agent optimizations (Claude Code, Cursor, Windsurf, v0).
 */
export async function compilePromptsForProject(
  data: WorkspaceData,
  agentTarget: AgentTarget = "generic"
): Promise<CompiledPrompts> {
  const t = await loadTemplates();
  const stack = compileStack(data.tech);
  const name = data.productName || "the product";
  const host = stack?.hosting ?? "the chosen host";

  let ctxPrefix = "";
  if (agentTarget === "claude") {
    ctxPrefix = "[Agent Target: Claude Code]\nWrite project guidelines to `.claude/CLAUDE.md`. ";
  } else if (agentTarget === "cursor") {
    ctxPrefix = "[Agent Target: Cursor]\nCreate `.cursor/rules/nx.mdc` for context rules and use `@` file references. ";
  } else if (agentTarget === "windsurf") {
    ctxPrefix = "[Agent Target: Windsurf Cascade]\nWrite rules into `.windsurfrules`. ";
  } else if (agentTarget === "antigravity") {
    ctxPrefix = "[Agent Target: Google Antigravity]\nRead `.antigravity/instructions.md` for execution rules. ";
  } else if (agentTarget === "zed") {
    ctxPrefix = "[Agent Target: Zed AI]\nRead `.zed/prompts/build.md` for workspace context. ";
  } else if (agentTarget === "aider") {
    ctxPrefix = "[Agent Target: Aider]\nFollow conventions in `CONVENTIONS.md`. ";
  } else if (agentTarget === "v0") {
    ctxPrefix = "[Agent Target: v0]\nBuild responsive React + Tailwind components. ";
  }

  const ctx = `${ctxPrefix}Read \`${NX_ROOT}/\` first to load the architecture, brand, and constraints.`;

  // Idea
  const ideaTpl = t.get("idea");
  const idea =
    ideaTpl &&
    toCompiled(ideaTpl, {
      productName: data.productName,
      problem: data.idea.problem || "(not provided)",
      targetUsers: data.idea.targetUsers || "(not provided)",
      currentSolutions: data.idea.currentSolutions || "(not provided)",
      differentiation: data.idea.differentiation || "(not provided)",
    });

  // Master
  const fe = stack?.frontend ?? "the chosen framework";
  const lang = stack?.language ?? "the chosen language";
  const problem = data.idea.problem || "the core product experience";
  const steps: string[] = [
    `1. Scaffold ${fe} per \`${NX_ROOT}/decisions/tech-stack.md\`.`,
    `2. Apply the brand tokens from \`${NX_ROOT}/ui/brand-guide.md\` (color, radius, font) as the theme.`,
    `3. Build the atomic UI components (Button, Card, Input, etc.) on those tokens.`,
    `4. Lay out the folder structure and shared utilities; propose it, then proceed.`,
  ];

  let stepIdx = 5;
  if (!stack || stack.backend.startsWith("None")) {
    steps.push(`${stepIdx++}. No backend — keep everything client-side and persist locally.`);
  } else {
    steps.push(
      `${stepIdx++}. Stand up ${stack.backend} and wire the capabilities in \`${NX_ROOT}/memory.json\` (auth, database, realtime as listed).`
    );
  }

  if (stack && stack.libraries.length) {
    steps.push(`${stepIdx++}. Integrate required libraries: ${stack.libraries.join(", ")}.`);
  }

  if (data.designNotes && data.designNotes.trim()) {
    steps.push(`${stepIdx++}. Apply Studio Design Directives: ${data.designNotes.trim()}`);
  }

  if (data.customStages && data.customStages.length > 0) {
    steps.push(
      `${stepIdx++}. Follow custom product workflow stages defined in \`${NX_ROOT}/custom-workflow.md\`.`
    );
  }

  steps.push(`${stepIdx++}. Implement the core product flow that solves: ${problem}.`);

  const buildSteps = steps.join("\n");

  const vars = {
    name,
    fe,
    lang,
    problem,
    targetUsers: data.idea.targetUsers || "(not provided)",
    currentSolutions: data.idea.currentSolutions || "(not provided)",
    differentiation: data.idea.differentiation || "(not provided)",
    brandVibe: data.brand?.vibe || "Modern",
    brandColor: data.brand?.primaryColor || "#6366f1",
    brandRadius: data.brand?.radius || "8px",
    brandFont: data.brand?.font || "Instrument Sans",
    designNotes: data.designNotes || "",
    buildSteps,
    nxRoot: NX_ROOT,
    nxFileBlocks: renderNxFileBlocks(data),
    host,
    ctx,
  };

  const masterTpl = t.get("master");
  const master = masterTpl && toCompiled(masterTpl, vars);

  // Depth — every template that isn't idea/master, in sort order.
  const depth = [...t.values()]
    .filter((row) => row.id !== "idea" && row.id !== "master")
    .sort((a, b) => a.sort - b.sort)
    .map((row) => toCompiled(row, vars));

  if (!idea || !master) throw new Error("Prompt templates are missing 'idea' or 'master'. Run migration 0003.");

  return { idea, master, depth };
}
