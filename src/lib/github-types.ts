/**
 * Canonical GitHub sync contract — the single source of truth for the shape
 * that crosses the server↔client boundary. The server (github-server.ts)
 * produces it and the client (github.ts, workspace-store) consumes it; neither
 * side redeclares it. Client-safe: type-only, no server-only or runtime deps.
 */
import type { ParsedNx } from "./nx-compiler";

export interface GitHubStatus {
  connected: boolean;
  login?: string;
  avatar?: string;
  name?: string | null;
}

export interface GhUser {
  login: string;
  avatar_url: string;
  name: string | null;
}

export interface GhCommit {
  sha: string;
  message: string;
  author: string;
  avatar: string | null;
  date: string;
}

export interface GhIssue {
  number: number;
  title: string;
  state: string;
  url: string;
  labels: string[];
}

export interface GhContributor {
  login: string;
  avatar: string;
  commits: number;
}

/** The full result of syncing a repo — returned by /api/github/sync. */
export interface RepoSync {
  repo: string;
  branch: string;
  context: ParsedNx;
  commits: GhCommit[];
  issues: GhIssue[];
  contributors: GhContributor[];
  syncedAt: string;
}

/** Client-facing alias for the same wire shape. */
export type SyncResult = RepoSync;
