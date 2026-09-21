/**
 * Isomorphic project model + Supabase row mappers. No "use client" / no
 * server-only imports here, so both the server loader and the client store can
 * share the same shapes and conversions.
 *
 * Storage model: one `projects` row per project, with the document-shaped
 * WorkspaceData kept in a single `data` jsonb column. The workspace is edited
 * and saved as a whole, so a jsonb blob means one row read/write per project
 * instead of a join fan-out across many normalized tables.
 */

import { WorkspaceData } from "./types";

export interface GitHubConnection {
  /** "owner/name" of the connected repo, or null if not yet chosen. */
  repo: string | null;
  branch: string;
}

export interface Project {
  id: string;
  createdAt: string;
  data: WorkspaceData;
  github: GitHubConnection;
  /** Per-phase due dates, keyed by phaseId. Value is yyyy-mm-dd ("" clears). */
  dueDates: Record<string, string>;
  /** Collection (group) this product belongs to, or null when ungrouped. */
  collectionId: string | null;
}

/** Shape of a row in public.projects. `data`/`due_dates` are jsonb. */
export interface ProjectRow {
  id: string;
  user_id: string;
  name: string;
  data: WorkspaceData;
  github_repo: string | null;
  github_branch: string;
  due_dates: Record<string, string>;
  collection_id: string | null;
  created_at: string;
  updated_at?: string;
}

/** A named group that holds products (projects). See 0004_collections.sql. */
export interface Collection {
  id: string;
  name: string;
  sort: number;
  createdAt: string;
}

export interface CollectionRow {
  id: string;
  user_id: string;
  name: string;
  sort: number;
  created_at: string;
  updated_at?: string;
}

export function newCollection(name: string, sort: number): Collection {
  return {
    id: `c_${Math.random().toString(36).slice(2, 10)}`,
    name: name || "Untitled",
    sort,
    createdAt: new Date().toISOString(),
  };
}

export function rowToCollection(row: CollectionRow): Collection {
  return { id: row.id, name: row.name || "Untitled", sort: row.sort ?? 0, createdAt: row.created_at };
}

export function collectionToRow(c: Collection, userId: string) {
  return { id: c.id, user_id: userId, name: c.name, sort: c.sort };
}

export function serializeCollection(c: Collection): string {
  return JSON.stringify({ name: c.name, sort: c.sort });
}

export function newWorkspaceData(name: string): WorkspaceData {
  return {
    productName: name,
    idea: { problem: "", targetUsers: "", currentSolutions: "", differentiation: "" },
    brand: {
      vibe: "Cyber-Physical, Clean, Architectural",
      primaryColor: "Lilac-500 (#A855F7)",
      radius: "0.5rem (rounded-lg)",
      font: "Geist Sans / Geist Mono",
    },
    tech: {
      surfaces: [],
      capabilities: [],
    },
    checklist: {},
    customStages: [],
    iterations: [],
    schema: { tables: [], relations: [] },
    selectedMcpServers: ["nxstudio", "github", "postgres"],
  };
}

export function newProject(name: string): Project {
  return {
    id: `p_${Math.random().toString(36).slice(2, 10)}`,
    createdAt: new Date().toISOString(),
    data: newWorkspaceData(name),
    github: { repo: null, branch: "main" },
    dueDates: {},
    collectionId: null,
  };
}

/** Merge a possibly-partial stored WorkspaceData onto fresh defaults. */
export function hydrateData(
  stored: Partial<WorkspaceData> | undefined,
  name: string
): WorkspaceData {
  const base = newWorkspaceData(name);
  if (!stored) return base;
  return {
    ...base,
    ...stored,
    idea: { ...base.idea, ...stored.idea },
    brand: { ...base.brand, ...stored.brand },
    tech: {
      surfaces: stored.tech?.surfaces ?? [],
      capabilities: stored.tech?.capabilities ?? [],
    },
    checklist: stored.checklist ?? {},
    customStages: stored.customStages ?? [],
    iterations: stored.iterations ?? [],
    schema: stored.schema ?? { tables: [], relations: [] },
    selectedMcpServers: stored.selectedMcpServers ?? ["nxstudio", "github", "postgres"],
  };
}

export function rowToProject(row: ProjectRow): Project {
  const name = row.name || row.data?.productName || "Product";
  return {
    id: row.id,
    createdAt: row.created_at,
    data: hydrateData(row.data, name),
    github: { repo: row.github_repo ?? null, branch: row.github_branch ?? "main" },
    dueDates: row.due_dates ?? {},
    collectionId: row.collection_id ?? null,
  };
}

/** Columns to write on upsert. `updated_at` is set by a DB trigger. */
export function projectToRow(p: Project, userId: string) {
  return {
    id: p.id,
    user_id: userId,
    name: p.data.productName,
    data: p.data,
    github_repo: p.github.repo,
    github_branch: p.github.branch,
    due_dates: p.dueDates,
    collection_id: p.collectionId,
  };
}

/** Stable serialization of the persisted fields — used to detect dirty projects. */
export function serializeProject(p: Project): string {
  return JSON.stringify([p.id, p.data, p.github, p.dueDates, p.collectionId]);
}
