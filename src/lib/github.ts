// One contract for the sync boundary — declared in github-types, re-exported
// here so existing importers of "@/lib/github" keep working.
export type { GitHubStatus, SyncResult, GhUser } from "./github-types";
import type { GitHubStatus, SyncResult, GhUser } from "./github-types";

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

export async function getGhUser(token: string): Promise<GhUser | null> {
  const res = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as GhUser;
}
