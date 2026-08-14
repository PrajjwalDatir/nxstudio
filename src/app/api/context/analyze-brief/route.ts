import { NextResponse } from "next/server";
import { withAuthApiHandler } from "@/lib/api-handler";
import { createClient } from "@/lib/supabase/server";
import { generateStructured, DEFAULT_MODEL } from "@/lib/ai/gemini";
import { consumeAiBudget } from "@/lib/ai/budget";
import { compileStack } from "@/lib/platform-engine";
import { IdeaData, TechStackInput, CompiledStack } from "@/lib/types";

export const runtime = "nodejs";

export interface SchemaTable {
  name: string;
  purpose: string;
  keyColumns: string[];
  relationships: string[];
}

export interface SchemaEndpoint {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  purpose: string;
  authRequired: boolean;
}

export interface BriefAnalysisResult {
  verdict: "promising" | "needs-work" | "unclear";
  sharpenedProblem: string;
  riskiestAssumptions: string[];
  whoToInterview: string[];
  /** Empty when the capability set actually matches what the idea implies. */
  stackConcerns: string[];
  schema: {
    tables: SchemaTable[];
    endpoints: SchemaEndpoint[];
  };
}

// One combined call for the whole Brief page (idea + tech stack), not two —
// the two calls previously planned separately share almost all their input
// and reasoning benefits from seeing both at once (e.g. flagging a capability
// the idea implies but the founder didn't select). Every array is bounded so
// this stays a *first draft* the coding agent builds from and refines, not a
// spec the founder is meant to audit line by line.
const RESULT_SCHEMA = {
  type: "object",
  properties: {
    verdict: { type: "string", enum: ["promising", "needs-work", "unclear"] },
    sharpenedProblem: { type: "string" },
    riskiestAssumptions: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 3 },
    whoToInterview: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 3 },
    stackConcerns: { type: "array", items: { type: "string" }, minItems: 0, maxItems: 2 },
    schema: {
      type: "object",
      properties: {
        tables: {
          type: "array",
          minItems: 1,
          maxItems: 6,
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              purpose: { type: "string" },
              keyColumns: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 8 },
              relationships: { type: "array", items: { type: "string" }, minItems: 0, maxItems: 4 },
            },
            required: ["name", "purpose", "keyColumns", "relationships"],
          },
        },
        endpoints: {
          type: "array",
          minItems: 1,
          maxItems: 8,
          items: {
            type: "object",
            properties: {
              method: { type: "string", enum: ["GET", "POST", "PUT", "PATCH", "DELETE"] },
              path: { type: "string" },
              purpose: { type: "string" },
              authRequired: { type: "boolean" },
            },
            required: ["method", "path", "purpose", "authRequired"],
          },
        },
      },
      required: ["tables", "endpoints"],
    },
  },
  required: [
    "verdict",
    "sharpenedProblem",
    "riskiestAssumptions",
    "whoToInterview",
    "stackConcerns",
    "schema",
  ],
} as const;

function buildPrompt(idea: IdeaData, stack: CompiledStack | null, capabilities: string[]): string {
  return `Act as a skeptical startup strategist and a pragmatic staff engineer reviewing a product brief together, in one pass. Be concrete and specific to what's described below, not generic advice.

## The idea
Problem: ${idea.problem}
Target users: ${idea.targetUsers || "(not provided)"}
How they solve it today: ${idea.currentSolutions || "(not provided)"}
Claimed differentiation: ${idea.differentiation || "(not provided)"}

## The chosen stack
Surfaces: ${stack?.platform ?? "(not chosen)"}
Capabilities requested: ${capabilities.length ? capabilities.join(", ") : "none selected"}
Backend: ${stack?.backend ?? "(not chosen)"}
Database: ${stack?.database ?? "(not chosen)"}

## What to return
1. A pressure-test of the idea: the riskiest assumptions, who to interview first to test them, a one-line sharpened problem statement, and an overall verdict.
2. Stack concerns: does the capability list actually support what the idea and differentiation imply? Flag anything obviously missing or unnecessary. Return an empty list if the stack genuinely matches.
3. A STARTING data model — only the core tables needed for the primary user flow, not a full future feature set. For each: name, one-line purpose, key column names (not full DDL types), and relationships to other tables.
4. A STARTING API surface — only the endpoints needed to implement the primary user flow end to end. For each: method, path, one-line purpose, whether auth is required.

The schema and endpoints are a first draft for a coding agent to build from and refine, not a final spec — keep both scoped tightly to the core flow.`;
}

export const POST = withAuthApiHandler<{
  projectId?: string;
  idea?: IdeaData;
  tech?: TechStackInput;
}>(async (_req, user, body) => {
  if (!body.projectId || !body.idea?.problem?.trim()) {
    return NextResponse.json(
      { error: "Describe the problem before running the analysis." },
      { status: 400 }
    );
  }
  if (!body.tech?.surfaces?.length) {
    return NextResponse.json(
      { error: "Pick at least one surface in Tech Stack before running the analysis." },
      { status: 400 }
    );
  }

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

  const stack = compileStack(body.tech);

  let result: BriefAnalysisResult;
  try {
    result = await generateStructured<BriefAnalysisResult>({
      prompt: buildPrompt(body.idea, stack, body.tech.capabilities),
      schema: RESULT_SCHEMA,
    });
  } catch (err) {
    console.error("Gemini brief-analysis error:", err);
    return NextResponse.json({ error: "AI analysis failed, try again." }, { status: 502 });
  }

  // Best-effort: the analysis still returns to the client even if the log write fails.
  const supabase = await createClient();
  const { error: insertError } = await supabase.from("context_entries").insert({
    project_id: body.projectId,
    user_id: user.id,
    kind: "ai_extract",
    field: "brief",
    source: "ai_generated",
    title: "Brief analysis",
    content: JSON.stringify(result),
    metadata: { model: DEFAULT_MODEL },
  });
  if (insertError) console.error("context_entries insert error:", insertError);

  return NextResponse.json({ result });
});
