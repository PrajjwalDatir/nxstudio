/**
 * Pure, environment-agnostic Model Context Protocol (MCP) Core Engine for Nx Studio.
 *
 * Runs 100% offline with zero dependencies on Supabase or Next.js server runtime.
 * Used by:
 * 1. Local stdio CLI (bin/mcp.js) for Cursor, Claude Code, and autonomous agents.
 * 2. Next.js App Route (src/app/api/mcp/route.ts) for web/SSE connections.
 * 3. Offline automated agent test suite (tests/agent-mcp-simulation.test.mjs).
 */

import { WorkspaceData, WorkflowDag, DagNode, AgentProgressReport } from "../types";
import {
  compileNxFiles,
  compileDag,
  compileSqlSchema,
  compilePrismaSchema,
  diffNx,
} from "../nx-compiler";
import {
  buildDependencyGraph,
  computeBlastRadius,
  GraphEdge,
} from "./ast-graph";
import {
  loadLocalWorkspace,
  recordLocalProgress,
  getLocalProgress,
} from "../local-workspace";

export interface McpRpcRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

export interface McpRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: Record<string, unknown>;
  error?: { code: number; message: string; data?: unknown };
}

export interface CoreEngineOptions {
  projectRoot?: string;
  progressReports?: AgentProgressReport[];
  onProgressReport?: (report: AgentProgressReport) => void | Promise<void>;
}

/**
 * Universal MCP Tool Declarations conforming to Model Context Protocol specification
 */
export const MCP_TOOLS = [
  {
    name: "nx_get_context",
    description:
      "Retrieve the complete compiled .nx/ Product OS bundle including W3C DTCG design tokens, kinematic motion specifications, Topological DAG, PostgreSQL/Prisma DDL schemas, and AGENTS.md execution protocol.",
    inputSchema: {
      type: "object",
      properties: {
        projectId: {
          type: "string",
          description: "Optional project identifier. If omitted, uses active workspace.",
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
        stage: {
          type: "number",
          description: "Optional filter by stage index (e.g. 0 for Foundation, 1 for Data/Design, 2 for Services).",
        },
        role: {
          type: "string",
          description: "Optional filter by specialist role (e.g. 'devops-engineer', 'database-architect').",
        },
      },
    },
  },
  {
    name: "nx_get_schema",
    description:
      "Retrieve the relational data schema compiled directly into PostgreSQL/SQLite DDL (schema.sql) and Prisma schema (schema.prisma).",
    inputSchema: {
      type: "object",
      properties: {
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
          description: "ID of the DAG node being updated (e.g. 'task-0-scaffold', 'task-1-data-model').",
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
          description: "Optional summary of changes implemented or verification results.",
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
  {
    name: "nx_analyze_blast_radius",
    description:
      "Analyze AST / module blast radius and verify graph cycles for a proposed change before executing. Returns direct/transitive downstream dependents, risk level, cycle paths, and required verification commands.",
    inputSchema: {
      type: "object",
      properties: {
        target: {
          type: "string",
          description: "Primary target symbol, file path, or table name being modified.",
        },
        modifiedFiles: {
          type: "array",
          items: { type: "string" },
          description: "List of modified files or module paths.",
        },
        proposedRelations: {
          type: "array",
          items: {
            type: "object",
            required: ["source", "target"],
            properties: {
              source: { type: "string" },
              target: { type: "string" },
            },
          },
          description: "Proposed schema relations or module import dependencies to validate for cycles.",
        },
        codeEdges: {
          type: "array",
          items: {
            type: "object",
            required: ["from", "to"],
            properties: {
              from: { type: "string" },
              to: { type: "string" },
            },
          },
          description: "Additional AST or dependency graph edges.",
        },
      },
    },
  },
  {
    name: "nx_get_next_action",
    description:
      "Retrieve the next topologically required development action, agent role, and contract specifications from the Product OS software development cycle.",
    inputSchema: {
      type: "object",
      properties: {
        completedNodeIds: {
          type: "array",
          items: { type: "string" },
          description: "Optional list of node IDs already completed. If omitted, uses recorded progress.",
        },
      },
    },
  },
  {
    name: "nx_authorize_action",
    description:
      "Architect Gatekeeper: Authorize or reject an agent's proposed action based on topological DAG stage ordering, AST blast radius, and graph cycle prevention.",
    inputSchema: {
      type: "object",
      required: ["nodeId"],
      properties: {
        nodeId: {
          type: "string",
          description: "The DAG task ID the agent intends to execute or complete.",
        },
        modifiedFiles: {
          type: "array",
          items: { type: "string" },
          description: "Files touched or proposed to be touched by the agent.",
        },
        symbols: {
          type: "array",
          items: { type: "string" },
          description: "AST symbols or schema entities touched.",
        },
        proposedRelations: {
          type: "array",
          items: {
            type: "object",
            required: ["source", "target"],
            properties: {
              source: { type: "string" },
              target: { type: "string" },
            },
          },
          description: "Any new module dependencies or foreign key relations.",
        },
      },
    },
  },
];

/**
 * Builds a unified graph combining DAG nodes, schema tables/relations, and any agent-provided edges.
 */
function buildCombinedProjectGraph(
  workspace: WorkspaceData,
  extraEdges: GraphEdge[] = []
) {
  const dag = compileDag(workspace);
  const nodes = new Set<string>();
  const edges: GraphEdge[] = [];
  const contractMapping: Record<string, string[]> = {};

  // 1. Add DAG nodes
  for (const n of dag.nodes) {
    nodes.add(n.id);
    if (n.contracts) {
      contractMapping[n.id] = n.contracts;
    }
    for (const d of n.deps) {
      nodes.add(d);
      // n depends on d: n -> d
      edges.push({ from: n.id, to: d, kind: "dag_dep" });
    }
  }

  // 2. Add Schema tables & relations
  if (workspace.schema?.tables) {
    for (const t of workspace.schema.tables) {
      nodes.add(t.name);
      nodes.add(`table:${t.name}`);
      contractMapping[t.name] = [".nx/db/schema.sql", ".nx/db/schema.prisma"];
    }
  }
  if (workspace.schema?.relations && workspace.schema?.tables) {
    const tableIdToName: Record<string, string> = {};
    for (const t of workspace.schema.tables) {
      tableIdToName[t.id] = t.name;
    }
    for (const r of workspace.schema.relations) {
      const srcName = tableIdToName[r.sourceTableId];
      const tgtName = tableIdToName[r.targetTableId];
      if (srcName && tgtName) {
        // srcName references tgtName: srcName -> tgtName
        edges.push({ from: srcName, to: tgtName, kind: "relation" });
      }
    }
  }

  // 3. Add extra edges from agent call
  for (const e of extraEdges) {
    nodes.add(e.from);
    nodes.add(e.to);
    edges.push(e);
  }

  return {
    graph: buildDependencyGraph(Array.from(nodes), edges),
    contractMapping,
    dag,
  };
}

/**
 * Handles individual tool execution logic
 */
export async function executeTool(
  name: string,
  args: Record<string, unknown> = {},
  workspace: WorkspaceData,
  options: CoreEngineOptions = {}
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  switch (name) {
    case "nx_get_context": {
      const format = (args.format as string) || "bundle";
      const files = compileNxFiles(workspace);

      if (format === "json") {
        const fileMap: Record<string, string> = {};
        for (const f of files) fileMap[f.path] = f.content;
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

        return { content: [{ type: "text", text: summary }] };
      }

      // Default: 'bundle' format
      const bundle = files
        .map(
          (f) =>
            `/* ========================================================================= */\n/* FILE: ${f.path}\n/* ========================================================================= */\n${f.content}`
        )
        .join("\n\n");

      return { content: [{ type: "text", text: bundle }] };
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

      const resultDag: WorkflowDag = { ...dag, nodes: filteredNodes };
      return { content: [{ type: "text", text: JSON.stringify(resultDag, null, 2) }] };
    }

    case "nx_get_schema": {
      const format = (args.format as string) || "both";
      const sql = compileSqlSchema(workspace);
      const prisma = compilePrismaSchema(workspace);

      if (format === "sql") return { content: [{ type: "text", text: sql }] };
      if (format === "prisma") return { content: [{ type: "text", text: prisma }] };
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

      const combined = [
        "-- .nx/db/schema.sql (PostgreSQL / SQLite DDL)",
        sql,
        "",
        "// .nx/db/schema.prisma (Prisma Schema)",
        prisma,
      ].join("\n");

      return { content: [{ type: "text", text: combined }] };
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

      if (options.onProgressReport) {
        await options.onProgressReport(report);
      } else {
        recordLocalProgress(report, options.projectRoot);
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                message: `Progress reported for DAG node '${nodeId}': ${status}`,
                report,
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
        if (item.path) repoDocs[item.path] = item.content || "";
      }

      const driftResults = diffNx(repoDocs, workspace);
      const missing = driftResults.filter((d) => d.status === "missing");
      const drifted = driftResults.filter((d) => d.status === "drifted");
      const unchanged = driftResults.filter((d) => d.status === "unchanged");
      const extra = driftResults.filter((d) => d.status === "extra");

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                isClean: drifted.length === 0 && missing.length === 0,
                stats: {
                  totalEmitted: driftResults.length - extra.length,
                  unchanged: unchanged.length,
                  drifted: drifted.length,
                  missing: missing.length,
                  extra: extra.length,
                },
                drift: driftResults,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    case "nx_analyze_blast_radius": {
      const target = (args.target as string) || "";
      const modifiedFiles = Array.isArray(args.modifiedFiles) ? (args.modifiedFiles as string[]) : [];
      const proposedRelations = Array.isArray(args.proposedRelations)
        ? (args.proposedRelations as Array<{ source: string; target: string }>)
        : [];
      const codeEdges = Array.isArray(args.codeEdges)
        ? (args.codeEdges as Array<{ from: string; to: string }>)
        : [];

      const extraEdges: GraphEdge[] = [];
      for (const r of proposedRelations) {
        extraEdges.push({ from: r.source, to: r.target, kind: "relation" });
      }
      for (const e of codeEdges) {
        extraEdges.push({ from: e.from, to: e.to, kind: "import" });
      }

      const { graph, contractMapping } = buildCombinedProjectGraph(workspace, extraEdges);
      const targets = [target, ...modifiedFiles].filter(Boolean);
      if (targets.length === 0 && extraEdges.length > 0) {
        targets.push(extraEdges[0].from);
      }

      const blastRadius = computeBlastRadius(targets, graph, contractMapping);

      const responsePayload = {
        authorized: !blastRadius.hasCycle,
        target: blastRadius.target,
        riskLevel: blastRadius.riskLevel,
        hasCycle: blastRadius.hasCycle,
        cyclePaths: blastRadius.cyclePaths,
        directDependents: blastRadius.directDependents,
        transitiveDependents: blastRadius.transitiveDependents,
        totalAffected: blastRadius.totalAffected,
        affectedContracts: blastRadius.affectedContracts,
        suggestedVerification: blastRadius.suggestedVerification,
      };

      return {
        content: [{ type: "text", text: JSON.stringify(responsePayload, null, 2) }],
      };
    }

    case "nx_get_next_action": {
      const dag = compileDag(workspace);
      const completedIds = new Set<string>();

      if (Array.isArray(args.completedNodeIds)) {
        for (const id of args.completedNodeIds) completedIds.add(String(id));
      } else {
        const progressList = options.progressReports || getLocalProgress(options.projectRoot);
        for (const p of progressList) {
          if (p.status === "completed") completedIds.add(p.nodeId);
        }
      }

      // Find the first node whose dependencies are all completed
      let nextNode: DagNode | null = null;
      for (const node of dag.nodes) {
        if (completedIds.has(node.id)) continue;
        const allDepsSatisfied = node.deps.every((depId) => completedIds.has(depId));
        if (allDepsSatisfied) {
          nextNode = node;
          break;
        }
      }

      if (!nextNode) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  completed: true,
                  message: "All Topological DAG stages have been satisfied. Product development cycle complete.",
                },
                null,
                2
              ),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                completed: false,
                currentStage: nextNode.stage,
                nodeId: nextNode.id,
                name: nextNode.name,
                description: nextNode.description,
                specialistRole: nextNode.role,
                contracts: nextNode.contracts || [],
                verification: nextNode.verification || "npm test",
                dependencies: nextNode.deps,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    case "nx_authorize_action": {
      const nodeId = String(args.nodeId || "");
      const modifiedFiles = Array.isArray(args.modifiedFiles) ? (args.modifiedFiles as string[]) : [];
      const symbols = Array.isArray(args.symbols) ? (args.symbols as string[]) : [];
      const proposedRelations = Array.isArray(args.proposedRelations)
        ? (args.proposedRelations as Array<{ source: string; target: string }>)
        : [];

      const dag = compileDag(workspace);
      const targetNode = dag.nodes.find((n) => n.id === nodeId);

      if (!targetNode) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  authorized: false,
                  reason: `Unknown DAG node '${nodeId}'. Use 'nx_get_dag' to inspect valid nodes.`,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // Check prerequisite DAG dependencies
      const progressList = options.progressReports || getLocalProgress(options.projectRoot);
      const completedIds = new Set(
        progressList.filter((p) => p.status === "completed").map((p) => p.nodeId)
      );

      const missingDeps = targetNode.deps.filter((depId) => !completedIds.has(depId));
      if (missingDeps.length > 0) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  authorized: false,
                  reason: `Prerequisite tasks not yet completed: ${missingDeps.join(", ")}`,
                  missingDependencies: missingDeps,
                  requiredStage: targetNode.stage,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // Check for cycles in proposed relations / AST changes
      const extraEdges: GraphEdge[] = proposedRelations.map((r) => ({
        from: r.source,
        to: r.target,
        kind: "relation",
      }));
      const { graph, contractMapping } = buildCombinedProjectGraph(workspace, extraEdges);
      const targets = [nodeId, ...modifiedFiles, ...symbols].filter(Boolean);
      const blastRadius = computeBlastRadius(targets, graph, contractMapping);

      if (blastRadius.hasCycle) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  authorized: false,
                  reason: "Architectural cycle detected in proposed relations/imports. Must break cycle before proceeding.",
                  hasCycle: true,
                  cyclePaths: blastRadius.cyclePaths,
                  riskLevel: "CRITICAL",
                },
                null,
                2
              ),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                authorized: true,
                message: `Action authorized for task '${targetNode.id}' (${targetNode.name}).`,
                stage: targetNode.stage,
                specialistRole: targetNode.role,
                contracts: targetNode.contracts || [],
                verificationCommand: targetNode.verification || "npm test",
                blastRadius: {
                  level: blastRadius.riskLevel,
                  totalAffected: blastRadius.totalAffected,
                  directDependents: blastRadius.directDependents,
                  affectedContracts: blastRadius.affectedContracts,
                },
              },
              null,
              2
            ),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown MCP tool: ${name}`);
  }
}

/**
 * Handles incoming JSON-RPC 2.0 messages from any transport (stdio, HTTP, test runner).
 */
export async function handleMcpRpc(
  payload: Record<string, unknown>,
  workspace?: WorkspaceData,
  options: CoreEngineOptions = {}
): Promise<McpRpcResponse> {
  const id = payload.id !== undefined ? (payload.id as string | number | null) : null;
  const method = String(payload.method || "");
  const params = (payload.params as Record<string, unknown>) || {};

  const activeWorkspace = workspace || loadLocalWorkspace(options.projectRoot);

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
              title: "Nx Studio Product OS Architect Assistant",
            },
          },
        };
      }

      case "ping": {
        return { jsonrpc: "2.0", id, result: {} };
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
        const toolResult = await executeTool(toolName, toolArgs, activeWorkspace, options);

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
  } catch (err) {
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
}
