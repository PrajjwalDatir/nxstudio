/**
 * Verification of the Stdio MCP Binary Executable (bin/mcp.js)
 *
 * Confirms that a child process running `bin/mcp.js` communicates over stdio
 * pipes with zero network sockets or network activity.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import readline from "node:readline";

describe("Stdio MCP Binary Runner (bin/mcp.js)", () => {
  it("processes JSON-RPC over stdin/stdout pipes without network activity", async () => {
    const binPath = path.resolve(process.cwd(), "bin/mcp.js");
    const child = spawn(process.execPath, [binPath], {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, NX_LOCAL_MODE: "1" },
    });

    const rl = readline.createInterface({
      input: child.stdout,
      terminal: false,
    });

    const receivedLines = [];
    const twoLinesReceived = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Timeout waiting for stdio responses")), 5000);
      rl.on("line", (line) => {
        if (line.trim()) {
          receivedLines.push(JSON.parse(line.trim()));
          if (receivedLines.length >= 2) {
            clearTimeout(timeout);
            resolve();
          }
        }
      });
    });

    // Send Initialize Request
    child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 101, method: "initialize" }) + "\n");

    // Send Blast Radius analysis request with cyclic schema relations
    child.stdin.write(
      JSON.stringify({
        jsonrpc: "2.0",
        id: 102,
        method: "tools/call",
        params: {
          name: "nx_analyze_blast_radius",
          arguments: {
            proposedRelations: [
              { source: "A", target: "B" },
              { source: "B", target: "C" },
              { source: "C", target: "A" },
            ],
          },
        },
      }) + "\n"
    );

    // Wait for both lines to be received
    await twoLinesReceived;

    child.kill();

    assert.equal(receivedLines.length, 2);

    // Assert Initialize Response
    const initResponse = receivedLines.find((r) => r.id === 101);
    assert.ok(initResponse);
    assert.equal(initResponse.result.serverInfo.name, "nxstudio-product-os");

    // Assert Blast Radius Cycle Response
    const blastResponse = receivedLines.find((r) => r.id === 102);
    assert.ok(blastResponse);
    const parsedBlast = JSON.parse(blastResponse.result.content[0].text);
    assert.equal(parsedBlast.hasCycle, true);
    assert.equal(parsedBlast.authorized, false);
    assert.equal(parsedBlast.riskLevel, "CRITICAL");
  });
});

