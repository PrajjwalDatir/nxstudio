#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Nx Studio CLI
 *
 * Unified CLI runner for distributing Nx Studio as an open-source, local-first package.
 * Commands:
 *   nx-studio mcp     - Starts the zero-network stdio Model Context Protocol server
 *   nx-studio web     - Starts the local web UI (Next.js server)
 *   nx-studio help    - Displays command options
 */

const path = require("path");
const { spawn } = require("child_process");

const args = process.argv.slice(2);
const command = args[0] || "web";

if (command === "mcp") {
  // Delegate to standalone stdio MCP server
  require("./mcp.js");
} else if (command === "web" || command === "start" || command === "dev") {
  process.env.NX_LOCAL_MODE = "1";
  const port = process.env.PORT || "3000";
  console.log(`\n=================================================`);
  console.log(`  Nx Studio — Local Product OS & Architect Engine`);
  console.log(`  Local UI: http://localhost:${port}`);
  console.log(`  Mode: 100% Offline / Local Filesystem (.nx/)`);
  console.log(`=================================================\n`);

  const nextBin = path.join(__dirname, "../node_modules/.bin/next");
  const subcmd = command === "dev" ? "dev" : "start";
  const child = spawn(nextBin, [subcmd, "-p", port], {
    stdio: "inherit",
    env: { ...process.env, NX_LOCAL_MODE: "1" },
  });

  child.on("exit", (code) => {
    process.exit(code || 0);
  });
} else if (command === "help" || command === "--help" || command === "-h") {
  console.log(`
Usage: nx-studio [command]

Commands:
  mcp      Start the stdio Model Context Protocol (MCP) server for Cursor / Claude Code
  web      Start the local web UI on http://localhost:3000 (default)
  dev      Start the local Next.js development server
  help     Show this help message
`);
} else {
  console.error(`Unknown command: ${command}. Run 'nx-studio help' for usage.`);
  process.exit(1);
}
