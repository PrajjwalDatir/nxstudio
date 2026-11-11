import "server-only";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { WorkspaceData } from "@/lib/types";
import { hydrateData, newWorkspaceData } from "@/lib/projects";

export interface McpTokenRecord {
  id: string;
  name: string;
  tokenPrefix: string;
  createdAt: string;
  expiresIn: string;
  lastUsedAt?: string;
  expiresAt?: string | null;
}

export interface AgentProgressReport {
  nodeId: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  agentId?: string;
  notes?: string;
  commitHash?: string;
  timestamp?: string;
}

/**
 * SHA-256 hash helper for secure token storage and comparison
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token.trim()).digest("hex");
}

/**
 * Generate a cryptographically secure Personal Access Token string
 */
export function generateTokenValue(): { fullToken: string; prefix: string; id: string } {
  const timestamp = Date.now().toString(36);
  const randomHex = crypto.randomBytes(16).toString("hex");
  const fullToken = `nx_pat_${timestamp}_${randomHex}`;
  const prefix = `nx_pat_${fullToken.slice(7, 11)}...${fullToken.slice(-4)}`;
  const id = `tok_${timestamp}_${randomHex.slice(0, 8)}`;
  return { fullToken, prefix, id };
}

/**
 * Parse human readable expiresIn duration (e.g. "30 days", "90 days", "Never")
 */
function parseExpiryDuration(expiresIn: string): Date | null {
  const trimmed = expiresIn.trim().toLowerCase();
  if (trimmed === "never" || !trimmed) return null;

  const match = trimmed.match(/^(\d+)\s*(day|days|month|months|year|years)?$/);
  if (!match) return null;

  const count = parseInt(match[1], 10);
  const unit = match[2] || "days";
  const now = new Date();

  if (unit.startsWith("day")) {
    now.setDate(now.getDate() + count);
  } else if (unit.startsWith("month")) {
    now.setMonth(now.getMonth() + count);
  } else if (unit.startsWith("year")) {
    now.setFullYear(now.getFullYear() + count);
  }
  return now;
}

/**
 * Create and persist a new MCP token for an authenticated user
 */
export async function createMcpToken(
  userId: string,
  name: string,
  expiresIn = "90 days"
): Promise<{ fullToken: string; record: McpTokenRecord }> {
  const { fullToken, prefix, id } = generateTokenValue();
  const tokenHash = hashToken(fullToken);
  const expiryDate = parseExpiryDuration(expiresIn);
  const createdAt = new Date().toISOString();

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("mcp_tokens").insert({
      id,
      user_id: userId,
      name: name.trim() || "Agent Client",
      token_hash: tokenHash,
      token_prefix: prefix,
      expires_at: expiryDate ? expiryDate.toISOString() : null,
      created_at: createdAt,
      updated_at: createdAt,
    });

    if (error) {
      console.error("[MCP] Error inserting token into DB:", error);
      throw new Error(error.message);
    }
  } catch (err) {
    console.error("[MCP] Failed to persist token via admin client:", err);
    throw err;
  }

  const record: McpTokenRecord = {
    id,
    name: name.trim() || "Agent Client",
    tokenPrefix: prefix,
    createdAt: createdAt.split("T")[0],
    expiresIn,
    lastUsedAt: "Never",
    expiresAt: expiryDate ? expiryDate.toISOString() : null,
  };

  return { fullToken, record };
}

/**
 * List active MCP tokens for a user
 */
export async function listMcpTokens(userId: string): Promise<McpTokenRecord[]> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("mcp_tokens")
      .select("id, name, token_prefix, expires_at, last_used_at, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[MCP] Error fetching tokens:", error);
      return [];
    }

    return (data || []).map((row: any) => {
      let expiresInLabel = "Never";
      if (row.expires_at) {
        const diffMs = new Date(row.expires_at).getTime() - Date.now();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        expiresInLabel = diffDays > 0 ? `${diffDays} days` : "Expired";
      }

      let lastUsedLabel = "Never";
      if (row.last_used_at) {
        const diffMs = Date.now() - new Date(row.last_used_at).getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHours < 1) lastUsedLabel = "Just now";
        else if (diffHours < 24) lastUsedLabel = `${diffHours}h ago`;
        else lastUsedLabel = `${Math.floor(diffHours / 24)}d ago`;
      }

      return {
        id: row.id,
        name: row.name,
        tokenPrefix: row.token_prefix,
        createdAt: (row.created_at || "").split("T")[0] || new Date().toISOString().split("T")[0],
        expiresIn: expiresInLabel,
        lastUsedAt: lastUsedLabel,
        expiresAt: row.expires_at,
      };
    });
  } catch (err) {
    console.warn("[MCP] Failed to list tokens:", err);
    return [];
  }
}

/**
 * Revoke/delete an MCP token
 */
export async function revokeMcpToken(userId: string, tokenId: string): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("mcp_tokens")
      .delete()
      .eq("user_id", userId)
      .eq("id", tokenId);

    if (error) {
      console.error("[MCP] Error revoking token:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[MCP] Failed to revoke token:", err);
    return false;
  }
}

/**
 * Validate an incoming MCP bearer/query token against Supabase DB
 */
export async function validateMcpToken(
  token: string | null | undefined
): Promise<{ valid: boolean; userId: string | null; isDemo: boolean; error?: string }> {
  if (!token) {
    return { valid: false, userId: null, isDemo: false, error: "Missing authorization token" };
  }

  const cleanToken = token.trim().replace(/^Bearer\s+/i, "");

  if (!cleanToken.startsWith("nx_pat_")) {
    return { valid: false, userId: null, isDemo: false, error: "Invalid token format. Expected 'nx_pat_...'" };
  }

  try {
    const admin = createAdminClient();
    const tokenHash = hashToken(cleanToken);

    const { data, error } = await admin
      .from("mcp_tokens")
      .select("id, user_id, expires_at")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (error) {
      console.warn("[MCP] Database error while validating token:", error);
      return { valid: false, userId: null, isDemo: false, error: "Unauthorized: Token validation failed" };
    }

    if (!data) {
      return { valid: false, userId: null, isDemo: false, error: "Unauthorized: Invalid or revoked access token" };
    }

    if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
      return { valid: false, userId: null, isDemo: false, error: "Unauthorized: Personal Access Token has expired" };
    }

    // Update last_used_at asynchronously
    void Promise.resolve(
      admin
        .from("mcp_tokens")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", data.id)
    ).catch((err: unknown) => console.warn("[MCP] Failed to update last_used_at:", err));

    return { valid: true, userId: data.user_id, isDemo: false };
  } catch (err) {
    console.warn("[MCP] Exception while validating token:", err);
    return { valid: false, userId: null, isDemo: false, error: "Unauthorized: Token validation failed" };
  }
}

/**
 * Fetch the user's live workspace data for MCP compilation
 */
export async function fetchUserWorkspaceForMcp(
  userId: string | null,
  projectId?: string
): Promise<WorkspaceData> {
  if (!userId) {
    return getCanonicalProductOsWorkspace();
  }

  try {
    const admin = createAdminClient();
    let query = admin.from("projects").select("*").eq("user_id", userId);

    if (projectId) {
      query = query.eq("id", projectId);
    } else {
      query = query.order("updated_at", { ascending: false }).limit(1);
    }

    const { data, error } = await query.maybeSingle();
    if (error || !data) {
      return getCanonicalProductOsWorkspace();
    }

    const name = data.name || data.data?.productName || "Product";
    return hydrateData(data.data, name);
  } catch (err) {
    console.warn("[MCP] Failed to load user workspace from DB:", err);
    return getCanonicalProductOsWorkspace();
  }
}

/**
 * Persist an agent's DAG node execution progress report
 */
export async function recordAgentProgress(
  userId: string | null,
  projectId: string | undefined,
  report: AgentProgressReport
): Promise<void> {
  if (!userId) return;

  try {
    const admin = createAdminClient();
    await admin.from("mcp_agent_progress").insert({
      user_id: userId,
      project_id: projectId || null,
      node_id: report.nodeId,
      status: report.status,
      agent_id: report.agentId || null,
      notes: report.notes || null,
      commit_hash: report.commitHash || null,
      created_at: report.timestamp || new Date().toISOString(),
    });
  } catch (err) {
    console.warn("[MCP] Failed to record agent progress in DB:", err);
  }
}

/**
 * Canonical fallback workspace data for unauthenticated queries or demo projects.
 */
export function getCanonicalProductOsWorkspace(name = "Nx Studio Product OS"): WorkspaceData {
  const base = newWorkspaceData(name);
  base.idea = {
    problem: "Autonomous AI agents drift and hallucinate without structured, language-independent product context.",
    targetUsers: "Engineers and founders building full-stack products with AI IDEs and autonomous agent fleets.",
    currentSolutions: "Fragile freeform markdown prompts, un-versioned chat snippets, manual copy-pasting.",
    differentiation: "A dedicated Product OS compiling W3C DTCG tokens, Topological DAGs, and DDL schemas served natively over MCP.",
  };
  base.brand = {
    vibe: "Cyber-Physical, Architectural, High-Precision",
    primaryColor: "#A855F7",
    radius: "0.5rem (rounded-lg)",
    font: "Geist Sans / Geist Mono",
  };
  base.tech = {
    surfaces: ["web", "ios"],
    capabilities: ["auth", "database", "ai"],
  };
  base.schema = {
    tables: [
      {
        id: "tbl_users",
        name: "users",
        fields: [
          { id: "f_id", name: "id", type: "uuid", isPrimary: true, isNullable: false },
          { id: "f_email", name: "email", type: "string", isUnique: true, isNullable: false },
          { id: "f_name", name: "name", type: "string", isNullable: true },
          { id: "f_created_at", name: "created_at", type: "datetime", isNullable: false, defaultValue: "now()" },
        ],
      },
      {
        id: "tbl_workspaces",
        name: "workspaces",
        fields: [
          { id: "f_ws_id", name: "id", type: "uuid", isPrimary: true, isNullable: false },
          { id: "f_ws_name", name: "name", type: "string", isNullable: false },
          { id: "f_ws_owner", name: "owner_id", type: "uuid", isNullable: false },
          { id: "f_ws_created_at", name: "created_at", type: "datetime", isNullable: false, defaultValue: "now()" },
        ],
      },
      {
        id: "tbl_tasks",
        name: "tasks",
        fields: [
          { id: "f_task_id", name: "id", type: "uuid", isPrimary: true, isNullable: false },
          { id: "f_task_ws", name: "workspace_id", type: "uuid", isNullable: false },
          { id: "f_task_title", name: "title", type: "string", isNullable: false },
          { id: "f_task_status", name: "status", type: "string", isNullable: false, defaultValue: "'pending'" },
          { id: "f_task_assigned", name: "assigned_agent", type: "string", isNullable: true },
        ],
      },
    ],
    relations: [
      {
        id: "rel_user_workspaces",
        sourceTableId: "tbl_workspaces",
        sourceFieldId: "f_ws_owner",
        targetTableId: "tbl_users",
        targetFieldId: "f_id",
        type: "1:N",
      },
      {
        id: "rel_ws_tasks",
        sourceTableId: "tbl_tasks",
        sourceFieldId: "f_task_ws",
        targetTableId: "tbl_workspaces",
        targetFieldId: "f_ws_id",
        type: "1:N",
      },
    ],
  };
  base.selectedMcpServers = ["nxstudio", "github", "postgres", "linear"];
  return base;
}
