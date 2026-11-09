/**
 * Standard I/O (stdio) Model Context Protocol runner.
 *
 * Communicates directly with AI agents (Cursor, Claude Code, Windsurf) over standard input/output pipes.
 * Zero network ports opened, zero external dependencies, 100% offline.
 */

import readline from "readline";
import { handleMcpRpc } from "./core-engine";
import { loadLocalWorkspace } from "../local-workspace";

export function startMcpStdioServer(projectRoot = process.cwd()) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  const workspace = loadLocalWorkspace(projectRoot);

  rl.on("line", async (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    try {
      const parsed = JSON.parse(trimmed);
      const response = await handleMcpRpc(parsed, workspace, { projectRoot });

      // In JSON-RPC, notifications (no id) do not produce a response
      if (parsed.id !== undefined) {
        process.stdout.write(JSON.stringify(response) + "\n");
      }
    } catch (err) {
      const errResponse = {
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32700,
          message: `Parse error: ${err instanceof Error ? err.message : String(err)}`,
        },
      };
      process.stdout.write(JSON.stringify(errResponse) + "\n");
    }
  });

  process.on("SIGINT", () => {
    rl.close();
    process.exit(0);
  });
}

