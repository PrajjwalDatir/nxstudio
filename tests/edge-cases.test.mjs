/**
 * Edge Case & Boundary Verification Test Suite
 *
 * Verifies robust error handling, invalid inputs, edge-case cycle patterns,
 * and boundary conditions for the offline MCP Architect Engine.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import jitiFactory from "jiti";

const jiti = jitiFactory(process.cwd());
const { handleMcpRpc } = jiti("./src/lib/mcp/core-engine.ts");
const { getCanonicalWorkspace, saveLocalWorkspace, loadLocalWorkspace } = jiti("./src/lib/local-workspace.ts");
const { detectGraphCycles, buildDependencyGraph } = jiti("./src/lib/mcp/ast-graph.ts");

describe("MCP Engine Edge Cases & Boundary Conditions", () => {
  it("handles unknown JSON-RPC methods with -32601 Method Not Found", async () => {
    const ws = getCanonicalWorkspace();
    const res = await handleMcpRpc({ jsonrpc: "2.0", id: 999, method: "non_existent_method" }, ws);
    assert.equal(res.jsonrpc, "2.0");
    assert.equal(res.id, 999);
    assert.equal(res.error?.code, -32601);
    assert.ok(res.error?.message.includes("Method not found"));
  });

  it("handles unknown MCP tool execution gracefully with -32000", async () => {
    const ws = getCanonicalWorkspace();
    const res = await handleMcpRpc(
      { jsonrpc: "2.0", id: 998, method: "tools/call", params: { name: "fake_tool", arguments: {} } },
      ws
    );
    assert.equal(res.id, 998);
    assert.equal(res.error?.code, -32000);
    assert.ok(res.error?.message.includes("Unknown MCP tool"));
  });

  it("rejects authorization when prerequisite DAG dependencies are unfulfilled", async () => {
    const ws = getCanonicalWorkspace();
    // Try to authorize task-3-auth without completing task-1-data-model
    const res = await handleMcpRpc(
      {
        jsonrpc: "2.0",
        id: 997,
        method: "tools/call",
        params: {
          name: "nx_authorize_action",
          arguments: { nodeId: "task-3-auth" },
        },
      },
      ws,
      { progressReports: [] } // No completed tasks
    );

    const body = JSON.parse(res.result.content[0].text);
    assert.equal(body.authorized, false);
    assert.ok(body.missingDependencies.includes("task-1-data-model"));
    assert.ok(body.reason.includes("Prerequisite tasks not yet completed"));
  });

  it("returns completed: true when all DAG stages are finished", async () => {
    const ws = getCanonicalWorkspace();
    // All 7 DAG nodes marked as completed
    const allCompleted = [
      { nodeId: "task-0-scaffold", status: "completed" },
      { nodeId: "task-1-data-model", status: "completed" },
      { nodeId: "task-2-design-system", status: "completed" },
      { nodeId: "task-3-auth", status: "completed" },
      { nodeId: "task-3-api", status: "completed" },
      { nodeId: "task-4-views", status: "completed" },
      { nodeId: "task-5-verification", status: "completed" },
    ];

    const res = await handleMcpRpc(
      {
        jsonrpc: "2.0",
        id: 996,
        method: "tools/call",
        params: { name: "nx_get_next_action", arguments: {} },
      },
      ws,
      { progressReports: allCompleted }
    );

    const body = JSON.parse(res.result.content[0].text);
    assert.equal(body.completed, true);
    assert.ok(body.message.includes("cycle complete"));
  });

  it("detects complex multiple cycles in disconnected graph components", () => {
    // Component 1 cycle: A -> B -> A
    // Component 2 cycle: X -> Y -> Z -> X
    // Disconnected standalone node: M
    const edges = [
      { from: "A", to: "B" },
      { from: "B", to: "A" },
      { from: "X", to: "Y" },
      { from: "Y", to: "Z" },
      { from: "Z", to: "X" },
    ];
    const graph = buildDependencyGraph(["A", "B", "X", "Y", "Z", "M"], edges);
    const cycles = detectGraphCycles(graph);

    assert.equal(cycles.length, 2);
    const cycle1 = cycles.find((c) => c.includes("A"));
    const cycle2 = cycles.find((c) => c.includes("X"));
    assert.ok(cycle1);
    assert.ok(cycle2);
  });

  it("persists and reloads .nx/ files cleanly on local filesystem", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "nx-test-"));
    try {
      const ws = getCanonicalWorkspace("Temp Test Product");
      ws.brand.primaryColor = "#00FF00";

      // Save to temporary .nx/ directory
      const { written, total } = saveLocalWorkspace(ws, tempDir);
      assert.ok(written.length > 0);
      assert.ok(total > 0);

      // Verify files were actually written to disk
      assert.ok(fs.existsSync(path.join(tempDir, ".nx/memory.json")));
      assert.ok(fs.existsSync(path.join(tempDir, ".nx/ui/design-tokens.json")));

      // Load back from disk
      const reloaded = loadLocalWorkspace(tempDir);
      assert.equal(reloaded.productName, "Temp Test Product");
      assert.equal(reloaded.brand.primaryColor, "#00FF00");
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
