import { NextResponse } from "next/server";
import { withAuthApiHandler } from "@/lib/api-handler";
import { getAccessForUser } from "@/lib/billing-server";
import { generateMachineWorkflows } from "@/lib/machine-workflows";
import { hydrateData } from "@/lib/projects";
import { WorkspaceData } from "@/lib/types";

export const runtime = "nodejs";

export const POST = withAuthApiHandler<{ data?: Partial<WorkspaceData> }>(
  async (_req, user, body) => {
    if (!body.data) {
      return NextResponse.json({ error: "Missing workspace data." }, { status: 400 });
    }

    try {
      const access = await getAccessForUser(user.id);
      if (!access.canUseMachineWorkflows) {
        return NextResponse.json(
          {
            error: "Autonomous Machine Workflows require the Master tier (50 USDT).",
            locked: true,
            tier: access.tier,
          },
          { status: 403 }
        );
      }

      const workspace = hydrateData(body.data, body.data.productName || "Product");
      const workflows = generateMachineWorkflows(workspace);

      return NextResponse.json({
        ...workflows,
        locked: false,
      });
    } catch (err) {
      console.error("Machine workflows generation error:", err);
      return NextResponse.json({ error: "Failed to compile machine workflows." }, { status: 500 });
    }
  }
);
