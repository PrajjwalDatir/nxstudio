"use client";

import { useState } from "react";
import { SchemaVisualizer } from "@/components/schema/SchemaVisualizer";
import { McpFleetSelector } from "@/components/mcp/McpFleetSelector";
import { ImportProjectDialog } from "@/components/canvas/ImportProjectDialog";
import { WorkspaceData, ProductSchema } from "@/lib/types";
import { newWorkspaceData, newProject } from "@/lib/projects";
import { WorkspaceProvider } from "@/lib/workspace-store";

function WorkbenchContent() {
  const [data, setData] = useState<WorkspaceData>(() => ({
    ...newWorkspaceData("nxstudio Product OS"),
    productName: "nxstudio Product OS",
    schema: {
      tables: [
        {
          id: "t_users",
          name: "users",
          description: "Registered platform users",
          position: { x: 40, y: 40 },
          fields: [
            { id: "f_u1", name: "id", type: "uuid", isPrimary: true },
            { id: "f_u2", name: "email", type: "string", isUnique: true },
            { id: "f_u3", name: "full_name", type: "string", isNullable: true },
            { id: "f_u4", name: "created_at", type: "datetime" },
          ],
        },
        {
          id: "t_workspaces",
          name: "workspaces",
          description: "Teams and projects",
          position: { x: 380, y: 40 },
          fields: [
            { id: "f_w1", name: "id", type: "uuid", isPrimary: true },
            { id: "f_w2", name: "name", type: "string" },
            { id: "f_w3", name: "owner_id", type: "uuid" },
            { id: "f_w4", name: "created_at", type: "datetime" },
          ],
        },
        {
          id: "t_tasks",
          name: "tasks",
          description: "Sprint tasks and DAG nodes",
          position: { x: 720, y: 40 },
          fields: [
            { id: "f_t1", name: "id", type: "uuid", isPrimary: true },
            { id: "f_t2", name: "workspace_id", type: "uuid" },
            { id: "f_t3", name: "title", type: "string" },
            { id: "f_t4", name: "stage", type: "int" },
            { id: "f_t5", name: "status", type: "string" },
          ],
        },
      ],
      relations: [
        {
          id: "r_user_workspaces",
          sourceTableId: "t_workspaces",
          sourceFieldId: "f_w3",
          targetTableId: "t_users",
          targetFieldId: "f_u1",
          type: "1:N",
        },
        {
          id: "r_workspace_tasks",
          sourceTableId: "t_tasks",
          sourceFieldId: "f_t2",
          targetTableId: "t_workspaces",
          targetFieldId: "f_w1",
          type: "1:N",
        },
      ],
    },
  }));

  const handleUpdateSchema = (newSchema: ProductSchema) => {
    setData((prev) => ({ ...prev, schema: newSchema }));
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 sm:p-10 space-y-12 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6 gap-4">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-primary font-semibold">
            Product OS Workbench · Live Preview
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">
            Part 1 & Part 2 Feature Suite
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Interactive test workbench for Schema Visualizer (CRUD + Arrows), Codebase Importer, and MCP Fleet Selector.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ImportProjectDialog />
        </div>
      </div>

      {/* ── PART 1: SCHEMA VISUALIZER (CRUD + ARROWS) ────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">1. Visual ERD & Relational Schemas</h2>
            <p className="text-xs text-muted-foreground">
              Add/delete tables, edit columns, draw relationships with Bézier arrows, and compile to DDL & Prisma.
            </p>
          </div>
        </div>

        <SchemaVisualizer data={data} onUpdateSchema={handleUpdateSchema} />
      </section>

      {/* ── PART 2: MCP FLEET SELECTOR ───────────────────────────────── */}
      <section className="space-y-4 pt-8 border-t border-border">
        <div>
          <h2 className="text-xl font-bold tracking-tight">2. MCP Fleet Selector & IDE Configuration</h2>
          <p className="text-xs text-muted-foreground">
            Select popular MCP servers (Postgres, Linear, Sentry, Brave, etc.) and generate unified configs for Cursor and Claude Code.
          </p>
        </div>

        <McpFleetSelector />
      </section>
    </div>
  );
}

export default function WorkbenchPage() {
  const [project] = useState(() => newProject("nxstudio Product OS"));

  return (
    <WorkspaceProvider initialProjects={[project]} userId="workbench-demo-user">
      <WorkbenchContent />
    </WorkspaceProvider>
  );
}
