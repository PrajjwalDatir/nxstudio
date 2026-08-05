import { NextResponse } from "next/server";
import { withAuthApiHandler } from "@/lib/api-handler";
import { generateMachineWorkflows } from "@/lib/machine-workflows";
import { hydrateData } from "@/lib/projects";
import { WorkspaceData } from "@/lib/types";

export const runtime = "nodejs";

export const POST = withAuthApiHandler<{ data?: Partial<WorkspaceData> }>(
  async (_req, _user, body) => {
    if (!body.data) {
      return NextResponse.json({ error: "Missing workspace data." }, { status: 400 });
    }

    try {
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
