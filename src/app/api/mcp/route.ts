import { NextRequest, NextResponse } from "next/server";
import {
  compileNxFiles,
  compileDag,
  compileSqlSchema,
  compilePrismaSchema,
  diffNx,
} from "@/lib/nx-compiler";
import { newWorkspaceData } from "@/lib/projects";
import { WorkspaceData, WorkflowDag } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * In-memory telemetry and progress store for agents reporting back
 * to the Product OS canvas.
 */
interface AgentProgressReport {
  nodeId: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  agentId?: string;
  notes?: string;
  commitHash?: string;
  timestamp: string;
}

const progressReports: AgentProgressReport[] = [];

/**
 * Canonical fallback workspace data for unauthenticated queries or demo projects.
 * Guaranteed to have rich relational schema, brand DNA, tech stack, and Topological DAG.
 */
function getCanonicalProductOsWorkspace(name = "Nx Studio Product OS"): WorkspaceData {
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

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, mcp-session-id",
};

/**
 * Handle CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET handler: Model Context Protocol SSE (Server-Sent Events) Stream
 */
export async function GET(request: NextRequest) {
  const acceptHeader = request.headers.get("accept") || "";
  const authHeader = request.headers.get("authorization");
  const url = new URL(request.url);
  const queryToken = url.searchParams.get("token");

  // Validate token if supplied
  const token = authHeader?.replace(/^Bearer\s+/i, "") || queryToken;
  if (token && !token.startsWith("nx_pat_") && token !== "nx_demo_pat" && token !== "test_pat") {
    return NextResponse.json(
      { error: "Invalid Personal Access Token format. Expected 'nx_pat_...'" },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  // If client wants SSE stream
  if (acceptHeader.includes("text/event-stream") || url.searchParams.has("sse")) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            `event: endpoint\ndata: /api/mcp\n\n`
          )
        );
      },
    });

    return new Response(stream, {
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  // Otherwise return server metadata JSON
  return NextResponse.json(
    {
      name: "nxstudio-product-os",
      version: "1.0.0",
      protocol: "model-context-protocol",
      transport: "http-sse",
      endpoints: {
        sse: "/api/mcp",
        rpc: "/api/mcp",
      },
      tools: [
        "nx_get_context",
        "nx_get_dag",
        "nx_get_schema",
        "nx_report_progress",
        "nx_check_drift",
      ],
      description: "Nx Studio Product OS MCP Server - Serving structured context, DAGs, and DDLs to autonomous agents.",
    },
    { headers: CORS_HEADERS }
  );
}

/**
 * Available MCP Tools declarations conforming to Model Context Protocol specification
 */
const MCP_TOOLS = [
  {
    name: "nx_get_context",
    description:
      "Retrieve the complete compiled .nx/ Product OS bundle including W3C DTCG design tokens, kinematic motion specifications, Topological DAG, PostgreSQL/Prisma DDL schemas, and AGENTS.md execution protocol.",
    inputSchema: {
      type: "object",
      properties: {
        projectId: {
          type: "string",
          description: "Optional project identifier. If omitted, uses active/default project context.",
        },
        format: {
          type: "string",
          enum: ["bundle", "summary", "json"],
          description:
            "Output format: 'bundle' (all .nx files formatted with path headers), 'summary' (condensed architecture overview), or 'json' (structured map of path to content). Defaults to 'bundle'.",
        },
      },
    },
  },
  {
    name: "nx_get_dag",
    description:
      "Retrieve the Topological Dependency DAG (workflow.dag.json) containing nodes, execution phases, specialist agent roles, dependency edges, and parallel execution levels.",
    inputSchema: {
      type: "object",
      properties: {
        projectId: {
          type: "string",
          description: "Optional project identifier.",
        },
        phase: {
          type: "string",
          description: "Optional filter by phase (e.g. 'foundation', 'features', 'hardening').",
        },
      },
    },
  },
  {
    name: "nx_get_schema",
    description:
      "Retrieve the universal relational data schema compiled directly into PostgreSQL/SQLite DDL (schema.sql) and Prisma schema (schema.prisma).",
    inputSchema: {
      type: "object",
      properties: {
        projectId: {
          type: "string",
          description: "Optional project identifier.",
        },
        format: {
          type: "string",
          enum: ["sql", "prisma", "both", "json"],
          description: "Schema format to return: 'sql', 'prisma', 'both', or 'json'. Defaults to 'both'.",
        },
      },
    },
  },
  {
    name: "nx_report_progress",
    description:
      "Report execution progress and task status back to the Product OS canvas for a specific DAG node or milestone.",
    inputSchema: {
      type: "object",
      required: ["nodeId", "status"],
      properties: {
        nodeId: {
          type: "string",
          description: "ID of the DAG node being updated (e.g. 'init_schema', 'core_auth').",
        },
        status: {
          type: "string",
          enum: ["pending", "in_progress", "completed", "failed"],
          description: "Execution status of the task.",
        },
        agentId: {
          type: "string",
          description: "Agent or specialist role reporting (e.g. 'cursor', 'claude-code', 'database-architect').",
        },
        notes: {
          type: "string",
          description: "Optional notes or summary of changes implemented.",
        },
        commitHash: {
          type: "string",
          description: "Optional git commit SHA representing the deliverable.",
        },
      },
    },
  },
  {
    name: "nx_check_drift",
    description:
      "Verify architectural alignment and detect drift by comparing agent-generated files or proposed repo changes against the canonical .nx/ Product OS specification.",
    inputSchema: {
      type: "object",
      required: ["files"],
      properties: {
        files: {
          type: "array",
          description: "Array of files from the repository to check for architectural drift.",
          items: {
            type: "object",
            required: ["path"],
            properties: {
              path: {
                type: "string",
                description: "File path (e.g. '.nx/decisions/tech-stack.md', '.nx/db/schema.sql', etc.)",
              },
              content: {
                type: "string",
                description: "Current content of the file.",
              },
            },
          },
        },
      },
    },
  },
];

/**
 * Handle execution of specific tools
 */
function handleToolCall(
  name: string,
  args: Record<string, unknown> = {},
  workspace: WorkspaceData
) {
  switch (name) {
    case "nx_get_context": {
      const format = (args.format as string) || "bundle";
      const files = compileNxFiles(workspace);

      if (format === "json") {
        const fileMap: Record<string, string> = {};
        for (const f of files) {
          fileMap[f.path] = f.content;
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  productName: workspace.productName,
                  fileCount: files.length,
                  files: fileMap,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      if (format === "summary") {
        const dag = compileDag(workspace);
        const tables = workspace.schema?.tables?.map((t) => t.name).join(", ") || "None";
        const maxStage = Math.max(...dag.nodes.map((n) => n.stage), 0);
        const summary = [
          `# ${workspace.productName} — Product OS Context Summary`,
          `## Problem: ${workspace.idea.problem || "Not specified"}`,
          `## Brand DNA: Vibe="${workspace.brand.vibe}", Accent="${workspace.brand.primaryColor}", Font="${workspace.brand.font}"`,
          `## Tech Capabilities: ${workspace.tech.capabilities.join(", ") || "None"}`,
          `## Relational Schema Entities: ${tables}`,
          `## DAG Nodes: ${dag.nodes.length} nodes across ${maxStage + 1} execution stages`,
          `## Active MCP Servers: ${(workspace.selectedMcpServers || []).join(", ")}`,
        ].join("\n");

        return {
          content: [{ type: "text", text: summary }],
        };
      }

      // Default: 'bundle' format
      const formattedBundle = files
        .map(
          (f) =>
            `/* ========================================================================= */\n/* FILE: ${f.path}\n/* ========================================================================= */\n${f.content}`
        )
        .join("\n\n");

      return {
        content: [
          {
            type: "text",
            text: formattedBundle,
          },
        ],
      };
    }

    case "nx_get_dag": {
      const stageFilter = args.stage !== undefined ? Number(args.stage) : undefined;
      const roleFilter = args.role as string | undefined;
      const dag = compileDag(workspace);

      let filteredNodes = dag.nodes;
      if (stageFilter !== undefined && !isNaN(stageFilter)) {
        filteredNodes = filteredNodes.filter((n) => n.stage === stageFilter);
      }
      if (roleFilter) {
        filteredNodes = filteredNodes.filter(
          (n) => n.role && n.role.toLowerCase().includes(roleFilter.toLowerCase())
        );
      }

      const resultDag: WorkflowDag = {
        ...dag,
        nodes: filteredNodes,
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(resultDag, null, 2),
          },
        ],
      };
    }

    case "nx_get_schema": {
      const format = (args.format as string) || "both";
      const sql = compileSqlSchema(workspace);
      const prisma = compilePrismaSchema(workspace);

      if (format === "sql") {
        return {
          content: [{ type: "text", text: sql }],
        };
      }

      if (format === "prisma") {
        return {
          content: [{ type: "text", text: prisma }],
        };
      }

      if (format === "json") {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(workspace.schema || { tables: [], relations: [] }, null, 2),
            },
          ],
        };
      }

      // Default: 'both'
      const combined = [
        "-- .nx/db/schema.sql (PostgreSQL / SQLite DDL)",
        sql,
        "",
        "// .nx/db/schema.prisma (Prisma Schema)",
        prisma,
      ].join("\n");

      return {
        content: [{ type: "text", text: combined }],
      };
    }

    case "nx_report_progress": {
      const nodeId = String(args.nodeId || "");
      const status = args.status as AgentProgressReport["status"];
      const agentId = args.agentId ? String(args.agentId) : "unknown-agent";
      const notes = args.notes ? String(args.notes) : "";
      const commitHash = args.commitHash ? String(args.commitHash) : undefined;

      if (!nodeId || !status) {
        throw new Error("Missing required parameters: nodeId and status");
      }

      const report: AgentProgressReport = {
        nodeId,
        status,
        agentId,
        notes,
        commitHash,
        timestamp: new Date().toISOString(),
      };

      progressReports.push(report);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                message: `Progress reported for DAG node '${nodeId}': ${status}`,
                report,
                totalReports: progressReports.length,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    case "nx_check_drift": {
      const inputFiles = Array.isArray(args.files)
        ? (args.files as Array<{ path: string; content?: string }>)
        : [];

      const repoDocs: Record<string, string> = {};
      for (const item of inputFiles) {
        if (item.path) {
          repoDocs[item.path] = item.content || "";
        }
      }

      const driftResults = diffNx(repoDocs, workspace);

      const missing = driftResults.filter((d) => d.status === "missing");
      const drifted = driftResults.filter((d) => d.status === "drifted");
      const unchanged = driftResults.filter((d) => d.status === "unchanged");
      const extra = driftResults.filter((d) => d.status === "extra");

      const summary = {
        isClean: drifted.length === 0 && missing.length === 0,
        stats: {
          totalEmitted: driftResults.length - extra.length,
          unchanged: unchanged.length,
          drifted: drifted.length,
          missing: missing.length,
          extra: extra.length,
        },
        drift: driftResults,
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(summary, null, 2),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

/**
 * POST handler: JSON-RPC 2.0 Model Context Protocol endpoint
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error: Invalid JSON" } },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  // Token validation
  const authHeader = request.headers.get("authorization");
  const url = new URL(request.url);
  const queryToken = url.searchParams.get("token");
  const token = authHeader?.replace(/^Bearer\s+/i, "") || queryToken;

  if (token && !token.startsWith("nx_pat_") && token !== "nx_demo_pat" && token !== "test_pat") {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: (body as { id?: string | number })?.id ?? null,
        error: {
          code: -32000,
          message: "Unauthorized: Invalid Personal Access Token format. Generate an 'nx_pat_...' token in Settings.",
        },
      },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  // Process single or batch JSON-RPC request
  const isBatch = Array.isArray(body);
  const requests = isBatch ? (body as Array<Record<string, unknown>>) : [body as Record<string, unknown>];

  const defaultWorkspace = getCanonicalProductOsWorkspace();

  const responses = requests.map((req) => {
    const id = req.id ?? null;
    const method = req.method;
    const params = (req.params as Record<string, unknown>) || {};

    try {
      switch (method) {
        case "initialize": {
          return {
            jsonrpc: "2.0",
            id,
            result: {
              protocolVersion: "2024-11-05",
              capabilities: {
                tools: {
                  listChanged: false,
                },
              },
              serverInfo: {
                name: "nxstudio-product-os",
                version: "1.0.0",
              },
              instructions:
                "Nx Studio Product OS MCP Server provides real-time architectural context, Topological DAGs, relational DDL schemas, and bidirectional drift tracking for autonomous agents.",
            },
          };
        }

        case "notifications/initialized": {
          return null; // Notifications produce no JSON-RPC response
        }

        case "ping": {
          return {
            jsonrpc: "2.0",
            id,
            result: {},
          };
        }

        case "tools/list": {
          return {
            jsonrpc: "2.0",
            id,
            result: {
              tools: MCP_TOOLS,
            },
          };
        }

        case "tools/call": {
          const toolName = String(params.name || "");
          const toolArgs = (params.arguments as Record<string, unknown>) || {};
          const toolResult = handleToolCall(toolName, toolArgs, defaultWorkspace);

          return {
            jsonrpc: "2.0",
            id,
            result: {
              ...toolResult,
              isError: false,
            },
          };
        }

        default: {
          return {
            jsonrpc: "2.0",
            id,
            error: {
              code: -32601,
              message: `Method not found: ${method}`,
            },
          };
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32000,
          message,
        },
      };
    }
  });

  // Filter out null responses from notifications
  const nonNullResponses = responses.filter(Boolean);

  if (isBatch) {
    return NextResponse.json(nonNullResponses, { headers: CORS_HEADERS });
  }

  if (nonNullResponses.length === 0) {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
  }

  return NextResponse.json(nonNullResponses[0], { headers: CORS_HEADERS });
}
