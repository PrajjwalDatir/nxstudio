import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createMcpToken,
  listMcpTokens,
  revokeMcpToken,
} from "@/lib/mcp-server";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET: List all MCP personal access tokens for the signed-in user
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
    }

    const tokens = await listMcpTokens(user.id);
    return NextResponse.json({ tokens }, { headers: CORS_HEADERS });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch tokens";
    return NextResponse.json({ error: message }, { status: 500, headers: CORS_HEADERS });
  }
}

/**
 * POST: Generate a new MCP personal access token
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
    }

    const body = await request.json().catch(() => ({}));
    const name = String(body.name || "Agent Client").trim();
    const expiresIn = String(body.expiresIn || "90 days").trim();

    const { fullToken, record } = await createMcpToken(user.id, name, expiresIn);

    return NextResponse.json(
      {
        token: fullToken,
        tokenInfo: record,
      },
      { status: 201, headers: CORS_HEADERS }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create token";
    return NextResponse.json({ error: message }, { status: 500, headers: CORS_HEADERS });
  }
}

/**
 * DELETE: Revoke an MCP personal access token
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const idFromQuery = url.searchParams.get("id");
    const body = await request.json().catch(() => ({}));
    const id = idFromQuery || body.id;

    if (!id) {
      return NextResponse.json({ error: "Missing token id parameter" }, { status: 400, headers: CORS_HEADERS });
    }

    const ok = await revokeMcpToken(user.id, id);
    if (!ok) {
      return NextResponse.json({ error: "Failed to revoke token" }, { status: 500, headers: CORS_HEADERS });
    }

    return NextResponse.json({ success: true }, { headers: CORS_HEADERS });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to revoke token";
    return NextResponse.json({ error: message }, { status: 500, headers: CORS_HEADERS });
  }
}
