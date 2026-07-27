import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAccessForUser } from "@/lib/billing-server";
import { compilePromptsForProject } from "@/lib/prompts-server";
import { hydrateData } from "@/lib/projects";
import { WorkspaceData } from "@/lib/types";

// Compilation reads prompt_templates via the service role; keep on Node runtime.
export const runtime = "nodejs";

const SUPPORT_EMAIL = "support@nxstudio.dev";

/**
 * Compiles a project's prompts server-side. The idea (pressure-test) prompt is
 * FREE — it compiles and returns for any signed-in user. The master build prompt
 * and the depth (refine) prompts are the paid unlock: for non-premium users
 * their prose is stripped before serialization (never leaves the server, titles
 * and descriptions stay so the UI can preview them) and `locked: true` drives the
 * upsell. The derived stack is non-secret and already available client-side.
 *
 * The founder's workspace data is sent in the body — it's their own input, and
 * the value we protect is the TEMPLATE prose, not the data. This avoids any
 * save/refetch race.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const access = await getAccessForUser(user.id);

  const body = (await request.json().catch(() => ({}))) as { data?: Partial<WorkspaceData> };
  if (!body.data) return NextResponse.json({ error: "Missing workspace data." }, { status: 400 });

  // Defensive: merge onto defaults so a partial payload can't throw during compile.
  const workspace = hydrateData(body.data, body.data.productName || "Product");

  try {
    const prompts = await compilePromptsForProject(workspace);
    // Strip the master build prompt and depth prompt prose for non-premium
    // users — they stay server-side. Only the idea prompt ships to everyone.
    if (!access.isPremium) {
      prompts.master = { ...prompts.master, prompt: "" };
      prompts.depth = prompts.depth.map((d) => ({ ...d, prompt: "" }));
    }
    return NextResponse.json({ ...prompts, locked: !access.isPremium, support: SUPPORT_EMAIL });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to compile prompts.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
