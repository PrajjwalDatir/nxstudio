#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Nx Studio MCP Server Executable (stdio transport)
 *
 * Runs 100% offline with zero network ports and zero cloud dependencies.
 * Designed to be invoked directly by AI IDEs (Cursor, Claude Code, Windsurf)
 * and autonomous agent test runners.
 */

const path = require("path");

// Use jiti (bundled with Next.js) to load TypeScript source files cleanly
const projectRoot = path.resolve(__dirname, "..");
const jiti = require("jiti")(projectRoot);

const { startMcpStdioServer } = jiti(path.join(projectRoot, "src/lib/mcp/stdio-runner.ts"));

// Start stdio listener scoped to current user workspace
const userWorkspaceRoot = process.cwd();
startMcpStdioServer(userWorkspaceRoot);
