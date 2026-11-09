/**
 * Deterministic Offline AI Agent Simulation Test Suite
 *
 * Simulates an AI Agent (Claude Code / Cursor) interacting with Nx Studio's local MCP server.
 * Verifies:
 *   1. Full MCP JSON-RPC protocol compliance (initialize, tools/list, tools/call)
 *   2. Software development cycle progression guided by Topological DAG
 *   3. AST / Relational Graph Cycle Detection
 *   4. Blast Radius calculation (direct and transitive dependents)
 *   5. Nx Studio acting as Architect Assistant gating and authorizing actions
 *
 * Runs 100% offline with ZERO network sockets, ZERO external APIs, and ZERO Supabase dependencies.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import jitiFactory from "jiti";

const jiti = jitiFactory(process.cwd());
const { handleMcpRpc } = jiti("./src/lib/mcp/core-engine.ts");
const { getCanonicalWorkspace } = jiti("./src/lib/local-workspace.ts");

describe("Autonomous Agent + Nx Studio Architect MCP Simulation", () => {
  it("executes conversational product development cycle with cycle detection and gatekeeping", async () => {
    // 1. Initialize local offline workspace fixture
    const workspace = getCanonicalWorkspace("Nx Studio Autonomous Simulation");
    const progressLog = [];

    const callMcp = async (method, params = {}) => {
      const response = await handleMcpRpc(
        {
          jsonrpc: "2.0",
          id: Math.floor(Math.random() * 100000),
          method,
          params,
        },
        workspace,
        {
          progressReports: progressLog,
          onProgressReport: (report) => {
            progressLog.push(report);
          },
        }
      );

      assert.equal(response.jsonrpc, "2.0");
      assert.ok(!response.error, `Unexpected MCP error: ${response.error?.message}`);
      return response.result;
    };

    // =========================================================================
    // STEP 1: Handshake & Discovery
    // Agent boots in sandbox, discovers available MCP capabilities
    // =========================================================================
    const initRes = await callMcp("initialize");
    assert.equal(initRes.serverInfo.name, "nxstudio-product-os");
    assert.equal(initRes.protocolVersion, "2024-11-05");

    const toolsRes = await callMcp("tools/list");
    assert.ok(Array.isArray(toolsRes.tools));
    const toolNames = toolsRes.tools.map((t) => t.name);
    assert.ok(toolNames.includes("nx_get_context"));
    assert.ok(toolNames.includes("nx_get_dag"));
    assert.ok(toolNames.includes("nx_get_schema"));
    assert.ok(toolNames.includes("nx_report_progress"));
    assert.ok(toolNames.includes("nx_analyze_blast_radius"));
    assert.ok(toolNames.includes("nx_get_next_action"));
    assert.ok(toolNames.includes("nx_authorize_action"));

    // =========================================================================
    // STEP 2: Product Development Cycle - Initial Stage Query
    // Agent asks: "What is my first architectural task?"
    // =========================================================================
    const firstActionCall = await callMcp("tools/call", {
      name: "nx_get_next_action",
      arguments: {},
    });
    const firstAction = JSON.parse(firstActionCall.content[0].text);
    assert.equal(firstAction.completed, false);
    assert.equal(firstAction.nodeId, "task-0-scaffold");
    assert.equal(firstAction.currentStage, 0);
    assert.equal(firstAction.specialistRole, "devops-engineer");

    // Agent completes Stage 0 (Scaffolding) and reports progress
    await callMcp("tools/call", {
      name: "nx_report_progress",
      arguments: {
        nodeId: "task-0-scaffold",
        status: "completed",
        agentId: "claude-code-devops",
        notes: "Repository tooling, package.json, and verification scripts initialized.",
        commitHash: "0a1b2c3d",
      },
    });

    // =========================================================================
    // STEP 3: Progress to Stage 1 (Data Modeling & Storage Contracts)
    // =========================================================================
    const nextActionCall = await callMcp("tools/call", {
      name: "nx_get_next_action",
      arguments: {},
    });
    const nextAction = JSON.parse(nextActionCall.content[0].text);
    assert.equal(nextAction.nodeId, "task-1-data-model");
    assert.equal(nextAction.currentStage, 1);
    assert.equal(nextAction.specialistRole, "database-architect");
    assert.ok(nextAction.contracts.includes(".nx/db/schema.sql"));

    // =========================================================================
    // STEP 4: Architect Gatekeeping - Circular Dependency Refusal
    // The Agent attempts to modify the schema, introducing a cyclic dependency:
    // users -> workspaces -> tasks -> users
    // =========================================================================
    const cyclicProposal = await callMcp("tools/call", {
      name: "nx_authorize_action",
      arguments: {
        nodeId: "task-1-data-model",
        modifiedFiles: [".nx/db/schema.sql"],
        symbols: ["users", "workspaces", "tasks"],
        proposedRelations: [
          { source: "workspaces", target: "users" },
          { source: "tasks", target: "workspaces" },
          { source: "users", target: "tasks" }, // Creates cycle: users -> tasks -> workspaces -> users
        ],
      },
    });
    const cyclicAuth = JSON.parse(cyclicProposal.content[0].text);

    // MCP acts as Architect Gatekeeper: Refuses authorization
    assert.equal(cyclicAuth.authorized, false);
    assert.equal(cyclicAuth.hasCycle, true);
    assert.equal(cyclicAuth.riskLevel, "CRITICAL");
    assert.ok(cyclicAuth.cyclePaths.length > 0);
    assert.ok(cyclicAuth.reason.includes("cycle"));

    // =========================================================================
    // STEP 5: Blast Radius & AST Dependency Analysis
    // Agent requests blast radius report for a planned modification to `users`
    // =========================================================================
    const blastRadiusCall = await callMcp("tools/call", {
      name: "nx_analyze_blast_radius",
      arguments: {
        target: "users",
        codeEdges: [
          { from: "src/lib/auth.ts", to: "users" },
          { from: "src/app/api/auth/route.ts", to: "src/lib/auth.ts" },
          { from: "src/components/UserAvatar.tsx", to: "src/lib/auth.ts" },
        ],
      },
    });
    const blastReport = JSON.parse(blastRadiusCall.content[0].text);
    assert.equal(blastReport.hasCycle, false);
    assert.ok(blastReport.directDependents.includes("src/lib/auth.ts"));
    assert.ok(blastReport.transitiveDependents.includes("src/app/api/auth/route.ts"));
    assert.ok(blastReport.transitiveDependents.includes("src/components/UserAvatar.tsx"));
    assert.ok(blastReport.totalAffected >= 3);
    assert.ok(blastReport.suggestedVerification.length > 0);

    // =========================================================================
    // STEP 6: Agent Submits Corrected Acyclic Architecture
    // Agent removes the circular reference (users <- workspaces, tasks <- workspaces)
    // =========================================================================
    const validProposal = await callMcp("tools/call", {
      name: "nx_authorize_action",
      arguments: {
        nodeId: "task-1-data-model",
        modifiedFiles: [".nx/db/schema.sql", ".nx/db/schema.prisma"],
        symbols: ["users", "workspaces", "tasks"],
        proposedRelations: [
          { source: "workspaces", target: "users" }, // workspaces references users
          { source: "tasks", target: "workspaces" }, // tasks references workspaces (acyclic DAG)
        ],
      },
    });
    const validAuth = JSON.parse(validProposal.content[0].text);

    // MCP approves the action
    assert.equal(validAuth.authorized, true);
    assert.equal(validAuth.stage, 1);
    assert.ok(validAuth.verificationCommand);

    // Agent completes Stage 1 tasks
    await callMcp("tools/call", {
      name: "nx_report_progress",
      arguments: {
        nodeId: "task-1-data-model",
        status: "completed",
        agentId: "claude-code-db",
        notes: "Relational tables and foreign keys committed without cycles.",
      },
    });
    await callMcp("tools/call", {
      name: "nx_report_progress",
      arguments: {
        nodeId: "task-2-design-system",
        status: "completed",
        agentId: "claude-code-design",
        notes: "Design tokens generated.",
      },
    });

    // =========================================================================
    // STEP 7: Lifecycle Advances to Stage 2 (Service Layer / Auth)
    // =========================================================================
    const stage2ActionCall = await callMcp("tools/call", {
      name: "nx_get_next_action",
      arguments: {},
    });
    const stage2Action = JSON.parse(stage2ActionCall.content[0].text);
    assert.equal(stage2Action.completed, false);
    assert.equal(stage2Action.currentStage, 2);
    assert.equal(stage2Action.specialistRole, "backend-engineer");
    assert.ok(stage2Action.dependencies.includes("task-1-data-model"));
  });
});
