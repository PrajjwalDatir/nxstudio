import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { compileStack } from "./platform-engine";
import { compileNxFiles, NX_ROOT } from "./nx-compiler";
import { WorkspaceData } from "./types";

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

async function loadTemplates(): Promise<Map<string, TemplateRow>> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("prompt_templates")
    .select("id, title, description, body, sort")
    .order("sort", { ascending: true });
  if (error || !data) throw new Error(`Failed to load prompt templates: ${error?.message ?? "no rows"}`);
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
 */
export async function compilePromptsForProject(data: WorkspaceData): Promise<CompiledPrompts> {
  const t = await loadTemplates();
  const stack = compileStack(data.tech);
  const name = data.productName || "the product";
  const host = stack?.hosting ?? "the chosen host";
  const ctx = `Read \`${NX_ROOT}/\` first to load the architecture, brand, and constraints.`;

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
  const backendLine =
    !stack || stack.backend.startsWith("None")
      ? "5. No backend — keep everything client-side and persist locally."
      : `5. Stand up ${stack.backend} and wire the capabilities in \`${NX_ROOT}/memory.json\` (auth, database, realtime as listed).`;
  const libsLine = stack && stack.libraries.length ? `\n6. Integrate: ${stack.libraries.join(", ")}.` : "";

  const masterTpl = t.get("master");
  const master =
    masterTpl &&
    toCompiled(masterTpl, {
      name,
      fe,
      lang,
      nxRoot: NX_ROOT,
      nxFileBlocks: renderNxFileBlocks(data),
      backendLine,
      problem,
      libsLine,
    });

  // Depth — every template that isn't idea/master, in sort order.
  const depth = [...t.values()]
    .filter((row) => row.id !== "idea" && row.id !== "master")
    .sort((a, b) => a.sort - b.sort)
    .map((row) => toCompiled(row, { ctx, name, host, nxRoot: NX_ROOT }));

  if (!idea || !master) throw new Error("Prompt templates are missing 'idea' or 'master'. Run migration 0003.");

  return { idea, master, depth };
}
