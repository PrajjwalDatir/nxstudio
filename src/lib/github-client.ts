/**
 * Client-side wrappers around /api/github/*. No token ever touches the client
 * beyond the one-time paste into connect().
 */

import type { ParsedNx } from "./nx-compiler";

export interface GitHubStatus {
  connected: boolean;
  login?: string;
  avatar?: string;
  name?: string | null;
}

export interface SyncResult {
  repo: string;
  branch: string;
  context: ParsedNx;
  commits: { sha: string; message: string; author: string; avatar: string | null; date: string }[];
  issues: { number: number; title: string; state: string; url: string; labels: string[] }[];
  contributors: { login: string; avatar: string; commits: number }[];
  syncedAt: string;
}

export async function connectGitHub(token: string): Promise<GitHubStatus> {
  const res = await fetch("/api/github/connect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) {
    const { error } = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(error || "Failed to connect.");
  }
  return (await res.json()) as GitHubStatus;
}

export async function getGitHubStatus(): Promise<GitHubStatus> {
  const res = await fetch("/api/github/status", { cache: "no-store" });
  if (!res.ok) return { connected: false };
  return (await res.json()) as GitHubStatus;
}

export async function disconnectGitHub(): Promise<void> {
  await fetch("/api/github/disconnect", { method: "POST" });
}

export async function syncRepo(repo: string, branch = "main"): Promise<SyncResult> {
  const res = await fetch(
    `/api/github/sync?repo=${encodeURIComponent(repo)}&branch=${encodeURIComponent(branch)}`,
    { cache: "no-store" }
  );
  if (!res.ok) {
    const { error } = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(error || "Sync failed.");
  }
  return (await res.json()) as SyncResult;
}
