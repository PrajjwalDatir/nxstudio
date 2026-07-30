import { NextResponse } from "next/server";
import { withAuthApiHandler } from "@/lib/api-handler";
import { getAccessForUser } from "@/lib/billing-server";
import { compilePromptsForProject } from "@/lib/prompts-server";
import { hydrateData } from "@/lib/projects";
import { AgentTarget, WorkspaceData } from "@/lib/types";

export const runtime = "nodejs";
const SUPPORT_EMAIL = "support@nxstudio.dev";

export const POST = withAuthApiHandler<{ data?: Partial<WorkspaceData>; agentTarget?: AgentTarget }>(
  async (_req, user, body) => {
    if (!body.data) {
      return NextResponse.json({ error: "Missing workspace data." }, { status: 400 });
    }

    try {
      const access = await getAccessForUser(user.id);
      const workspace = hydrateData(body.data, body.data.productName || "Product");
      const agentTarget = body.agentTarget ?? "generic";
      const prompts = await compilePromptsForProject(workspace, agentTarget);

      // ALL USERS (Free, Pro, Master) get ALL ACCESS for prompt compilation on their active workspace!
      return NextResponse.json({
        ...prompts,
        tier: access.tier,
        tierName: access.tierName,
        locked: false,
        support: SUPPORT_EMAIL,
      });
    } catch (err) {
      console.error("Database or prompt compilation error:", err);
      return NextResponse.json(
        { error: "Server is busy, please try in a while." },
        { status: 503 }
      );
    }
  }
);
