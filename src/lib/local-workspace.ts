/**
 * Local Filesystem Workspace Adapter for Nx Studio.
 *
 * Allows Nx Studio and its MCP server to run 100% offline with zero cloud/Supabase dependencies.
 * Reads and writes directly to the local .nx/ directory in the target project.
 */

import fs from "fs";
import path from "path";
import { WorkspaceData, AgentProgressReport } from "./types";
import { parseNx, mergeNxIntoWorkspace, compileNxFiles } from "./nx-compiler";
import { newWorkspaceData } from "./projects";

export const LOCAL_PROGRESS_FILE = ".nx/agent-progress.jsonl";

/**
 * Returns canonical product context when no local .nx/ directory exists yet.
 */
export function getCanonicalWorkspace(name = "Nx Studio Product OS"): WorkspaceData {
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

/**
 * Loads the workspace by scanning `.nx/` in `projectRoot` (defaults to current working directory).
 */
export function loadLocalWorkspace(projectRoot = process.cwd()): WorkspaceData {
  const nxDir = path.join(projectRoot, ".nx");
  const projectName = path.basename(path.resolve(projectRoot)) || "Product";
  const defaultWs = getCanonicalWorkspace(projectName);

  if (!fs.existsSync(nxDir)) {
    return defaultWs;
  }

  const files: Record<string, string> = {};
  function walk(currentDir: string) {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(currentDir, entry.name);
        const rel = path.relative(projectRoot, full);
        if (entry.isDirectory()) {
          walk(full);
        } else if (entry.isFile()) {
          files[rel] = fs.readFileSync(full, "utf-8");
        }
      }
    } catch {
      // ignore read error
    }
  }

  walk(nxDir);

  if (Object.keys(files).length === 0) {
    return defaultWs;
  }

  const parsed = parseNx(files);
  const resolvedProjectName = parsed.memory?.project || projectName;
  const baseWs = getCanonicalWorkspace(resolvedProjectName);
  const merged = mergeNxIntoWorkspace(parsed, baseWs);
  return { ...baseWs, ...merged, productName: resolvedProjectName };
}

/**
 * Persists compiled `.nx/` files directly to the local filesystem.
 */
export function saveLocalWorkspace(
  workspace: WorkspaceData,
  projectRoot = process.cwd()
): { written: string[]; total: number } {
  const files = compileNxFiles(workspace);
  const written: string[] = [];

  for (const f of files) {
    const fullPath = path.join(projectRoot, f.path);
    try {
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, f.content, "utf-8");
      written.push(f.path);
    } catch (err) {
      console.warn(`[LocalWorkspace] Failed to write ${f.path}:`, err);
    }
  }

  return { written, total: files.length };
}

/**
 * Persists an agent's task execution progress to `.nx/agent-progress.jsonl`.
 */
export function recordLocalProgress(
  report: AgentProgressReport,
  projectRoot = process.cwd()
): void {
  const progressPath = path.join(projectRoot, LOCAL_PROGRESS_FILE);
  const line = JSON.stringify({ ...report, timestamp: report.timestamp || new Date().toISOString() }) + "\n";
  try {
    fs.mkdirSync(path.dirname(progressPath), { recursive: true });
    fs.appendFileSync(progressPath, line, "utf-8");
  } catch (err) {
    console.warn("[LocalWorkspace] Failed to write local progress:", err);
  }
}

/**
 * Reads all recorded agent progress reports from `.nx/agent-progress.jsonl`.
 */
export function getLocalProgress(projectRoot = process.cwd()): AgentProgressReport[] {
  const progressPath = path.join(projectRoot, LOCAL_PROGRESS_FILE);
  if (!fs.existsSync(progressPath)) return [];

  try {
    const content = fs.readFileSync(progressPath, "utf-8");
    return content
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as AgentProgressReport);
  } catch {
    return [];
  }
}

