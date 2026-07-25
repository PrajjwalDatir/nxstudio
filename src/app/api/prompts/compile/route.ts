import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAccessForUser } from "@/lib/billing-server";
import { compilePromptsForProject } from "@/lib/prompts-server";
import { hydrateData } from "@/lib/projects";
import { WorkspaceData } from "@/lib/types";

// Compilation reads prompt_templates via the service role; keep on Node runtime.
export const runtime = "nodejs";

const SUPPORT_EMAIL = "in.prajj@gmail.com";

/**
 * The paywall. Compiles a project's prompts server-side and returns them ONLY to
 * premium users; free users get 402 with an upsell payload and the prompt text
 * never leaves the server for them.
 *
 * The founder's workspace data is sent in the body — it's their own input, and
 * the value we protect is the TEMPLATE prose (which stays server-side and is
 * never returned raw), not the data. This avoids any save/refetch race.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  // Gate first — do not compile (or reveal) anything for non-premium users.
  const access = await getAccessForUser(user.id);
  if (!access.isPremium) {
    return NextResponse.json(
      { error: "premium_required", state: access.state, support: SUPPORT_EMAIL },
      { status: 402 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as { data?: Partial<WorkspaceData> };
  if (!body.data) return NextResponse.json({ error: "Missing workspace data." }, { status: 400 });

  // Defensive: merge onto defaults so a partial payload can't throw during compile.
  const workspace = hydrateData(body.data, body.data.productName || "Product");

  try {
    const prompts = await compilePromptsForProject(workspace);
    return NextResponse.json(prompts);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to compile prompts.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
