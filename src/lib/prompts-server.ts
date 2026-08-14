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

export type PromptCategory =
  | "visual"
  | "security"
  | "qa"
  | "performance"
  | "deploy"
  | "growth"
  | "general";

export interface CompiledPrompt {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category: PromptCategory;
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
  category?: PromptCategory;
  sort: number;
}

const DEFAULT_TEMPLATES: TemplateRow[] = [
  {
    id: "idea",
    title: "Idea pressure-test",
    description: "Stress-test the problem, users, and differentiation before you build.",
    category: "general",
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
    category: "general",
    body: `You are the lead engineer building "{{name}}" in one continuous agentic run.
Stack: {{fe}} ({{lang}}). Research any API or library you're unsure about before you use it.

## Step 0 — Establish the context
Create a \`{{nxRoot}}/\` directory at the repo root with these files, verbatim.
This is your single source of truth — re-read it before each step and follow it exactly.

{{nxFileBlocks}}

## Step 1 — Build as a dependency graph, not a checklist
The branches below don't depend on each other — run them in parallel (as
concurrent tool calls, if you're able to) rather than working strictly
top-to-bottom. The join step waits on both branches finishing.

{{buildSteps}}

## Step 2 — Verify against the risks, not just the happy path
Re-read \`{{nxRoot}}/risks.md\` if it exists and check what you built against
every riskiest assumption listed there — don't stop at the happy path.

## Step 3 — Mark it complete
Check off what you built in \`{{nxRoot}}/checklist.md\` (add a line for
anything you built that isn't already listed there). Commit, then summarise
what was built, what you verified against risks.md, and what remains.`,
    sort: 0,
  },
  {
    id: "apple_hig",
    title: "Apple HIG Compliance Audit",
    description: "Audit typography, touch targets, haptics, motion, and contrast against Apple HIG.",
    category: "visual",
    body: `{{ctx}}

Act as a Principal Human Interface Guidelines (HIG) Designer for Apple platforms.
Audit "{{name}}" against Apple's HIG principles:
1. Typography & Hierarchy: System font scaling, dynamic type readability, and contrast ratios.
2. Touch & Click Targets: Minimum 44x44pt interactive bounds, clear focus indicators, keyboard shortcuts.
3. Motion & Transitions: Fluid micro-animations with spring physics and zero layout shifts.
4. Dark / Light Adaptability: Seamless color token usage, elevation shadows, and backdrop blurs.
Enforce HIG guidelines directly on the UI components and list any structural design recommendations.`,
    sort: 1,
  },
  {
    id: "qa",
    title: "QA & edge case coverage",
    description: "Find broken states and cover the core flows with tests.",
    category: "qa",
    body: `{{ctx}}

Act as the QA engineer for "{{name}}". Exercise the core user flows, enumerate the
edge cases and broken/empty/error states, and write automated tests that cover
them. Fix the bugs you surface. Report a short coverage summary and any risks left.`,
    sort: 2,
  },
  {
    id: "security",
    title: "Security & OWASP audit",
    description: "Audit auth, input handling, RLS, secrets, and dependencies.",
    category: "security",
    body: `{{ctx}}

Act as an application security reviewer for "{{name}}". Audit: authentication and
session handling, authorization / object-level access, input validation and
injection, secrets or keys exposed to the client, and dependency CVEs. Fix what is
safe to fix and produce a prioritised list of what needs human review.`,
    sort: 3,
  },
  {
    id: "performance",
    title: "Performance & Web Vitals pass",
    description: "Profile and fix slow renders, bundles, and queries.",
    category: "performance",
    body: `{{ctx}}

Profile "{{name}}" and improve performance: slow renders and re-renders, oversized
bundles, unoptimised images/assets, and N+1 or slow queries. Apply the fixes and
report before/after numbers for the metrics you moved.`,
    sort: 4,
  },
  {
    id: "accessibility",
    title: "Accessibility & WCAG 2.2 audit",
    description: "Get the UI to WCAG AA with proper ARIA and focus states.",
    category: "visual",
    body: `{{ctx}}

Audit "{{name}}" against WCAG 2.2 AA: keyboard navigation and focus order, colour
contrast, form labels and error messaging, and screen-reader semantics. Fix the
issues directly in the components and note anything that needs design input.`,
    sort: 5,
  },
  {
    id: "deploy",
    title: "Ship to production & CI/CD",
    description: "Set up CI/CD pipeline, hosting secrets, and deployment runbook.",
    category: "deploy",
    body: `{{ctx}}

Set up production deployment for "{{name}}" to {{host}}: CI/CD on push to \`main\`,
environment variables and secrets, preview builds for pull requests, framework-native
analytics/telemetry (structured logging + page/event tracking), and a post-deploy
smoke test. Write the runbook into \`{{nxRoot}}/hosting.md\`.`,
    sort: 6,
  },
  {
    id: "payments",
    title: "Payments & billing",
    description: "Subscription billing, checkout, webhooks, and a billing portal.",
    category: "growth",
    body: `{{ctx}}

Act as a payments engineer for "{{name}}". Integrate subscription billing end
to end: pricing/plan selection, checkout, webhooks for payment success,
failure, and cancellation, a customer billing portal, and dunning for failed
renewals. Match the provider to the stack already chosen in
\`{{nxRoot}}/decisions/tech-stack.md\`. Store only what you must — tokenize
card data via the provider, never handle raw card numbers yourself.`,
    sort: 8,
  },
  {
    id: "telemetry",
    title: "Product analytics & telemetry",
    description: "Instrument the events that matter and build one dashboard.",
    category: "growth",
    body: `{{ctx}}

Act as a growth engineer for "{{name}}". Instrument the events that actually
matter: signup, activation (first real use of the core flow), the core action
itself, and return visits. Wire them to a product analytics tool, add
structured error logging, and build one dashboard answering: how many people
signed up, how many activated, and how many came back. Respect whatever
privacy/consent requirements apply — don't track before consent if the
product has EU/UK users.`,
    sort: 9,
  },
  {
    id: "onboarding",
    title: "Onboarding & activation",
    description: "Get a new user to their first real \"aha moment\" fast.",
    category: "growth",
    body: `{{ctx}}

Act as a growth PM for "{{name}}". Design and build the first-run experience:
get a brand-new user from signup to their first real "aha moment" in the core
flow as fast as possible. Add a lightweight progress checklist or empty-state
guidance, and a welcome email that reinforces what to do next. Cut anything
in the current signup flow that delays that first moment without earning its
keep.`,
    sort: 10,
  },
  {
    id: "marketing-site",
    title: "Marketing site & SEO",
    description: "Tighten the public site: hero, pricing, and SEO basics.",
    category: "growth",
    body: `{{ctx}}

Act as a growth marketer for "{{name}}". Build or tighten the public
marketing site: a hero that states the problem/solution in one line, social
proof once there is any, a pricing page if payments are wired up, and the SEO
basics — meta tags, OG images, sitemap, semantic headings. Keep it fast: this
page is the first thing a cold visitor sees.`,
    sort: 11,
  },
  {
    id: "support",
    title: "Customer support setup",
    description: "A real way for users to reach you, plus a starter FAQ.",
    category: "growth",
    body: `{{ctx}}

Act as a support-ops engineer for "{{name}}". Add a way for users to actually
reach you — a support widget, help email, or in-app feedback form — and a
starter FAQ/help doc covering the core flow's most likely points of
confusion. Route incoming messages somewhere you'll actually see them.`,
    sort: 12,
  },
  {
    id: "referrals",
    title: "Referral & growth loops",
    description: "One sharing loop that fits the product, instrumented.",
    category: "growth",
    body: `{{ctx}}

Act as a growth engineer for "{{name}}". Design one referral or sharing loop
that fits the product naturally — invite links, shareable output, or a
waitlist-skip mechanic — instrumented so you can measure who invited whom and
whether it actually drives signups. Don't bolt on generic "refer a friend"
mechanics if nothing in the product is inherently shareable; say so instead.`,
    sort: 13,
  },
  {
    id: "legal",
    title: "Legal & compliance basics",
    description: "ToS, privacy policy, consent, and data-deletion — real pages.",
    category: "growth",
    body: `{{ctx}}

Act as a legal-ops-minded engineer for "{{name}}" — flag anything that needs
a real lawyer rather than guessing. Draft a Terms of Service and Privacy
Policy that actually match what the product does (check
\`{{nxRoot}}/memory.json\` for capabilities — payments, storage, and AI
features each need their own disclosures), add a cookie/consent banner if
there's tracking, and a data-deletion request flow if there's stored
personal data. Ship these as real pages, not placeholders.`,
    sort: 14,
  },
  {
    id: "pitch",
    title: "Investor pitch narrative",
    description: "A 10-12 slide outline drawn from what's actually true so far.",
    category: "growth",
    body: `{{ctx}}

Act as a seed-stage startup advisor for "{{name}}", not an engineer — this
output is prose and slide structure, not code. Draft a 10-12 slide pitch deck
outline: problem, solution, why now, market size, product (leave room for
screenshots), traction so far, business model, competition/differentiation,
team, and the ask. Keep every claim traceable to what's actually in
\`{{nxRoot}}/\` — don't invent traction numbers that aren't there. Flag which
slides need a human to fill in real data (metrics, funding ask, team bios).`,
    sort: 15,
  },
  {
    id: "consistency",
    title: "Data consistency & sync audit",
    description: "Find derived or cached state that can silently go stale, and fix it.",
    category: "qa",
    body: `{{ctx}}

Act as a systems reviewer for "{{name}}". Find every place this app derives, caches,
or mirrors data from another source — AI-generated output, data synced from an
external service, computed summaries, a local draft of something remote. For each
one: does editing the source invalidate or flag the derived copy? Does any "sync"
actually flow both ways, or does it only render a diff? Fix what's cheap to fix
directly in the code; for anything structural, write up the risk and a recommended
fix instead of a partial patch.`,
    sort: 7,
  },
  {
    // Compiled by compileIteratePrompt(), never surfaced in the generic depth
    // gallery (see the id !== "iterate" filter below) — {{changeDescription}}
    // and {{nxFileBlocks}} are only ever filled in there, from a real change
    // request and a scoped subset of .nx/, not the full bundle.
    id: "iterate",
    title: "Scoped change prompt",
    description: "A small, targeted prompt for one feature or fix.",
    category: "general",
    body: `You are continuing work on "{{name}}", an existing product — not scaffolding from scratch.

## The change requested
{{changeDescription}}

## Relevant context (scoped to what this change touches)
Re-read these before you start — verify against what's actually there, don't assume:

{{nxFileBlocks}}

## What to do
1. Implement the change against the current codebase, matching its existing patterns and the brand/stack decisions above.
2. Update whichever of the files above changed as a result (e.g. a new table in \`{{nxRoot}}/decisions/db-schema.md\`, a new route in \`{{nxRoot}}/specs/api-routes.md\`) so \`.nx/\` keeps describing the real system.
3. Check off or add a line in \`{{nxRoot}}/checklist.md\` for this change.
4. Commit with a message describing what shipped.`,
    sort: 100,
  },
];

async function loadTemplates(): Promise<Map<string, TemplateRow>> {
  const templateMap = new Map(DEFAULT_TEMPLATES.map((t) => [t.id, t]));
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("prompt_templates")
      .select("id, title, description, body, category, sort")
      .eq("is_public", true)
      .eq("status", "approved")
      .order("sort", { ascending: true });

    if (!error && data && data.length > 0) {
      for (const row of data as TemplateRow[]) {
        const existing = templateMap.get(row.id);
        templateMap.set(row.id, { ...existing, ...row });
      }
    }
  } catch {
    // If DB is offline or table hasn't migrated, fallback gracefully to DEFAULT_TEMPLATES
  }
  return templateMap;
}

/** Replace {{key}} tokens; unknown keys collapse to empty (matches the old inline logic). */
function fill(body: string, vars: Record<string, string>): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_, key: string) => (key in vars ? vars[key] : ""));
}

/** Which one-line pointer file (all always emitted by compileNxFiles, so
 *  `.nx Context` drift-tracking sees all of them regardless of target)
 *  actually matches the founder's chosen agent — everyone else already reads
 *  AGENTS.md natively with no pointer needed. */
const AGENT_POINTER_FILE: Partial<Record<AgentTarget, string>> = {
  claude: ".claude/CLAUDE.md",
  cursor: ".cursor/rules/nx.mdc",
  windsurf: ".windsurfrules",
};

/**
 * Embeds every `.nx/` file. AGENTS.md (the cross-tool standard) is always
 * included — it's read natively by Cursor, Windsurf, Zed, Aider, Antigravity,
 * and most other agentic tools, so it costs nothing to include even when the
 * founder hasn't picked a target. Each tool's one-line pointer file is only
 * worth its few tokens when that tool is the actual target.
 */
function renderNxFileBlocks(data: WorkspaceData, agentTarget: AgentTarget): string {
  const keepPointer = AGENT_POINTER_FILE[agentTarget];
  const pointerFiles = new Set(Object.values(AGENT_POINTER_FILE));

  return compileNxFiles(data)
    .filter((f) => !pointerFiles.has(f.path) || f.path === keepPointer)
    .map((f) => {
      const lang = f.path.endsWith(".json") ? "json" : "markdown";
      return `### \`${f.path}\`\n\`\`\`${lang}\n${f.content}\`\`\``;
    })
    .join("\n\n");
}

function toCompiled(t: TemplateRow, vars: Record<string, string>): CompiledPrompt {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    category: t.category ?? "general",
    prompt: fill(t.body, vars),
  };
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

  // AGENTS.md is read natively by Zed, Aider, Antigravity, and generic/other
  // tools with no pointer file needed. Claude/Cursor/Windsurf each get a
  // one-line pointer file (see AGENT_POINTER_FILE in renderNxFileBlocks) and
  // a matching mention here; v0 doesn't read repo rule files at all.
  let ctxPrefix = "";
  if (agentTarget === "claude") {
    ctxPrefix = "[Agent Target: Claude Code]\n`.claude/CLAUDE.md` imports `AGENTS.md` — read both. ";
  } else if (agentTarget === "cursor") {
    ctxPrefix = "[Agent Target: Cursor]\n`.cursor/rules/nx.mdc` points to `AGENTS.md` — read both. ";
  } else if (agentTarget === "windsurf") {
    ctxPrefix = "[Agent Target: Windsurf / Devin Desktop]\n`.windsurfrules` points to `AGENTS.md` — read both. ";
  } else if (agentTarget === "v0") {
    ctxPrefix = "[Agent Target: v0]\nBuild responsive React + Tailwind components. ";
  }

  const ctx = `${ctxPrefix}Read \`${NX_ROOT}/\` first to load the architecture, brand, and constraints.`;

  // Idea
  const ideaTpl = t.get("idea") ?? DEFAULT_TEMPLATES[0];
  const idea = toCompiled(ideaTpl, {
    productName: data.productName,
    problem: data.idea.problem || "(not provided)",
    targetUsers: data.idea.targetUsers || "(not provided)",
    currentSolutions: data.idea.currentSolutions || "(not provided)",
    differentiation: data.idea.differentiation || "(not provided)",
  });

  // Master — expressed as a small dependency graph (scaffold → two parallel
  // branches → join), not one strict numbered list, so an agent capable of
  // concurrent tool calls can actually build the independent parts at once.
  const fe = stack?.frontend ?? "the chosen framework";
  const lang = stack?.language ?? "the chosen language";
  const problem = data.idea.problem || "the core product experience";

  const numbered = (items: string[]) => items.map((s, i) => `${i + 1}. ${s}`).join("\n");

  const frontendBranch: string[] = [
    `Apply the brand tokens from \`${NX_ROOT}/ui/brand-guide.md\` (color, radius, font) as the theme.`,
    `Build the atomic UI components (Button, Card, Input, etc.) on those tokens.`,
  ];
  if (data.designNotes && data.designNotes.trim()) {
    frontendBranch.push(`Apply Studio Design Directives: ${data.designNotes.trim()}`);
  }

  const backendBranch: string[] = [];
  if (!stack || stack.backend.startsWith("None")) {
    backendBranch.push(`No backend — keep everything client-side and persist locally.`);
  } else {
    backendBranch.push(
      `Stand up ${stack.backend} and wire the capabilities in \`${NX_ROOT}/memory.json\` (auth, database, realtime as listed).`
    );
  }
  if (stack && stack.libraries.length) {
    backendBranch.push(`Integrate required libraries: ${stack.libraries.join(", ")}.`);
  }

  const joinSteps: string[] = [];
  if (data.customStages && data.customStages.length > 0) {
    joinSteps.push(`Follow custom product workflow stages defined in \`${NX_ROOT}/custom-workflow.md\`.`);
  }
  joinSteps.push(`Implement the core product flow that solves: ${problem}.`);

  const buildSteps = [
    `0. Scaffold ${fe} per \`${NX_ROOT}/decisions/tech-stack.md\` and lay out the folder structure and shared utilities.`,
    ``,
    `**Branch A — frontend** (parallel with Branch B):`,
    numbered(frontendBranch),
    ``,
    `**Branch B — backend** (parallel with Branch A):`,
    numbered(backendBranch),
    ``,
    `**Join** — after both branches finish:`,
    numbered(joinSteps),
  ].join("\n");

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
    nxFileBlocks: renderNxFileBlocks(data, agentTarget),
    host,
    ctx,
  };

  const masterTpl = t.get("master") ?? DEFAULT_TEMPLATES[1];
  const master = toCompiled(masterTpl, vars);

  // Depth — every template that isn't idea/master/iterate, in sort order.
  // "iterate" is excluded here because it needs a real change description +
  // scoped file blocks filled in by compileIteratePrompt(), not the generic
  // `vars` every other depth prompt shares — showing it in this gallery
  // would render with those placeholders empty.
  const depth = [...t.values()]
    .filter((row) => row.id !== "idea" && row.id !== "master" && row.id !== "iterate")
    .sort((a, b) => a.sort - b.sort)
    .map((row) => toCompiled(row, vars));

  return { idea, master, depth };
}

/**
 * Compile a scoped change prompt for the post-launch iteration loop — only
 * the `.nx/` files a change request was scoped to, plus the request itself.
 * Deliberately not the master template: re-sending the whole `.nx/` bundle
 * for a one-line fix is exactly the token-bloat the affected-files scoping
 * exists to avoid (see /api/context/scope-change).
 */
export async function compileIteratePrompt(
  data: WorkspaceData,
  changeDescription: string,
  affectedPaths: string[]
): Promise<CompiledPrompt> {
  const t = await loadTemplates();
  const name = data.productName || "the product";

  const scoped = compileNxFiles(data).filter((f) => affectedPaths.includes(f.path));
  const nxFileBlocks = scoped.length
    ? scoped
        .map((f) => {
          const lang = f.path.endsWith(".json") ? "json" : "markdown";
          return `### \`${f.path}\`\n\`\`\`${lang}\n${f.content}\`\`\``;
        })
        .join("\n\n")
    : "_No scoped `.nx/` context matched this change — work from the request and the existing codebase._";

  const iterateTpl = t.get("iterate") ?? DEFAULT_TEMPLATES.find((d) => d.id === "iterate")!;
  return toCompiled(iterateTpl, { name, nxRoot: NX_ROOT, changeDescription, nxFileBlocks });
}
