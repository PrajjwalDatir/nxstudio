import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { withAuthApiHandler } from "@/lib/api-handler";
import { createClient } from "@/lib/supabase/server";
import { generateStructured, DEFAULT_MODEL } from "@/lib/ai/gemini";
import { consumeAiBudget } from "@/lib/ai/budget";
import { compileStack } from "@/lib/platform-engine";
import { NX_ROOT, mergeNxIntoWorkspace, parseNx } from "@/lib/nx-compiler";
import { compileIteratePrompt } from "@/lib/prompts-server";
import { fetchNxPaths } from "@/lib/github-server";
import { hydrateData } from "@/lib/projects";
import { IterationEntry, WorkspaceData } from "@/lib/types";

export const runtime = "nodejs";

/**
 * The post-launch iteration loop: turn a plain-language change request (or a
 * GitHub issue) into a small, targeted build prompt instead of re-sending the
 * whole `.nx/` bundle. Classifies which context files the change actually
 * touches, pulls live repo state for just those, reconciles it into the
 * workspace (the JIT, scoped sibling of nx-compiler.ts's full auto-merge),
 * and compiles a scoped prompt from the result.
 */

const SCOPABLE_PATHS = [
  `${NX_ROOT}/idea.md`,
  `${NX_ROOT}/decisions/tech-stack.md`,
  `${NX_ROOT}/ui/brand-guide.md`,
  `${NX_ROOT}/decisions/db-schema.md`,
  `${NX_ROOT}/specs/api-routes.md`,
  `${NX_ROOT}/hosting.md`,
  `${NX_ROOT}/risks.md`,
] as const;

/** Always read regardless of what the change touches — small and central. */
const ALWAYS_INCLUDED = [`${NX_ROOT}/memory.json`, `${NX_ROOT}/checklist.md`];

interface ScopeResult {
  affectedPaths: string[];
  plan: string;
}

const RESULT_SCHEMA = {
  type: "object",
  properties: {
    affectedPaths: {
      type: "array",
      items: { type: "string", enum: [...SCOPABLE_PATHS] },
      minItems: 1,
      maxItems: 5,
    },
    plan: { type: "string" },
  },
  required: ["affectedPaths", "plan"],
} as const;

function buildScopePrompt(data: WorkspaceData, changeDescription: string, stackLabel: string): string {
  return `A founder is asking for a change to a product already in development.

## Product context
Problem: ${data.idea.problem || "(not provided)"}
Stack: ${stackLabel}
Existing risks tracked: ${data.briefInsights?.riskiestAssumptions.join("; ") || "none yet"}

## Requested change
${changeDescription}

Decide which of these context files a coding agent would actually need to
re-read to implement this change well — pick only what's relevant, not
everything: ${SCOPABLE_PATHS.join(", ")}

Also write a 1-2 sentence implementation plan scoped tightly to this one change.`;
}

export const POST = withAuthApiHandler<{
  projectId?: string;
  changeDescription?: string;
  data?: Partial<WorkspaceData>;
  repo?: string | null;
  branch?: string;
  sourceIssue?: { number: number; url: string; title: string };
}>(async (_req, user, body) => {
  if (!body.projectId || !body.changeDescription?.trim() || !body.data) {
    return NextResponse.json(
      { error: "Missing project, change description, or workspace data." },
      { status: 400 }
    );
  }

  const workspace = hydrateData(body.data, body.data.productName || "Product");
  const stack = compileStack(workspace.tech);
  const stackLabel = stack ? `${stack.platform} — ${stack.frontend} / ${stack.backend}` : "not yet configured";

  const budget = await consumeAiBudget();
  if (budget !== "ok") {
    return NextResponse.json(
      {
        error:
          budget === "daily_cap"
            ? "Daily AI limit reached — try again after midnight PT."
            : "AI is busy right now — try again in a few seconds.",
      },
      { status: 429 }
    );
  }

  let scope: ScopeResult;
  try {
    scope = await generateStructured<ScopeResult>({
      prompt: buildScopePrompt(workspace, body.changeDescription, stackLabel),
      schema: RESULT_SCHEMA,
    });
  } catch (err) {
    console.error("Gemini scope-change error:", err);
    return NextResponse.json({ error: "Scoping failed, try again." }, { status: 502 });
  }

  const affectedPaths = [...new Set([...ALWAYS_INCLUDED, ...scope.affectedPaths])];

  // Pull live repo state for just the affected files and reconcile it into the
  // workspace before compiling — the JIT, scoped sibling of the ambient full
  // auto-merge (see workspace-store.tsx). Doing it here means the prompt
  // reflects what's actually committed, not the studio's last-known state,
  // right when accuracy matters most.
  let mergedWorkspace = workspace;
  let mergePatch: Partial<WorkspaceData> = {};
  if (body.repo) {
    const token = (await cookies()).get("gh_token")?.value;
    if (token) {
      const files = await fetchNxPaths(token, body.repo, body.branch || "main", affectedPaths);
      if (Object.keys(files).length) {
        const parsed = parseNx(files);
        mergePatch = mergeNxIntoWorkspace(parsed, workspace);
        mergedWorkspace = {
          ...workspace,
          ...mergePatch,
          idea: mergePatch.idea ?? workspace.idea,
          brand: mergePatch.brand ?? workspace.brand,
          tech: mergePatch.tech ?? workspace.tech,
        };
      }
    }
  }

  const iteration: IterationEntry = {
    id: `it_${Math.random().toString(36).slice(2, 10)}`,
    title:
      body.changeDescription.length > 80
        ? `${body.changeDescription.slice(0, 77)}...`
        : body.changeDescription,
    description: scope.plan,
    affectedPaths,
    sourceIssue: body.sourceIssue,
    status: "planned",
    createdAt: new Date().toISOString(),
  };

  const prompt = await compileIteratePrompt(
    mergedWorkspace,
    `${body.changeDescription}\n\nPlan: ${scope.plan}`,
    affectedPaths
  );

  // Best-effort: the prompt still returns to the client even if the log write fails.
  const supabase = await createClient();
  const { error: insertError } = await supabase.from("context_entries").insert({
    project_id: body.projectId,
    user_id: user.id,
    kind: "ai_extract",
    field: "iteration",
    source: "ai_generated",
    title: iteration.title,
    content: JSON.stringify({ scope, iteration }),
    metadata: { model: DEFAULT_MODEL },
  });
  if (insertError) console.error("context_entries insert error:", insertError);

  return NextResponse.json({ prompt, affectedPaths, iteration, mergePatch });
});
