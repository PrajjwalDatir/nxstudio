/**
 * Server-only GitHub REST helpers. The token lives in an httpOnly cookie and
 * never reaches the client. Used exclusively by /api/github/* route handlers.
 */

// Server-only module: imported exclusively by /api/github/* route handlers.
import { NX_ROOT, NX_STANDARD_PATHS, parseNx } from "./nx-compiler";
// Wire types live in one place (client-safe); the server just produces them.
import type { GhUser, GhCommit, GhIssue, GhContributor, RepoSync } from "./github-types";

export type { GhUser, GhCommit, GhIssue, GhContributor, RepoSync };

const API = "https://api.github.com";

async function gh(token: string, path: string) {
  const res = await fetch(`${API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });
  return res;
}

export async function getUser(token: string): Promise<GhUser | null> {
  const res = await gh(token, "/user");
  if (!res.ok) return null;
  return (await res.json()) as GhUser;
}

/** Read the .nx/ tree + recent commits + open issues for a repo. */
export async function syncRepo(
  token: string,
  repo: string,
  branch: string
): Promise<RepoSync | { error: string; status: number }> {
  const [owner, name] = repo.split("/");
  if (!owner || !name) return { error: "Invalid repo. Use owner/name.", status: 400 };

  // 1. Recursive tree to discover which .nx files exist.
  const treeRes = await gh(token, `/repos/${owner}/${name}/git/trees/${branch}?recursive=1`);
  if (treeRes.status === 404) return { error: "Repo or branch not found.", status: 404 };
  if (treeRes.status === 401) return { error: "Invalid or expired token.", status: 401 };
  if (!treeRes.ok) return { error: `GitHub error (${treeRes.status}).`, status: treeRes.status };

  const tree = (await treeRes.json()) as { tree?: { path: string; type: string }[] };
  const nxPaths = (tree.tree ?? [])
    .filter((n) => n.type === "blob" && n.path.startsWith(NX_ROOT))
    .map((n) => n.path);

  // 2. Fetch the content of the .nx/ files so the studio re-ingests what the
  //    agent changed OR added (not just memory.json). Standard files first, then
  //    any agent-added .nx/ files, bounded so a pathological repo can't make us
  //    pull thousands of blobs. Files >1MB come back without `content` and are
  //    skipped automatically.
  const files: Record<string, string> = {};
  for (const p of nxPaths) files[p] = ""; // mark presence
  const MAX_NX_FILES = 50;
  const toFetch = [
    ...NX_STANDARD_PATHS.filter((p) => nxPaths.includes(p)),
    ...nxPaths.filter((p) => !NX_STANDARD_PATHS.includes(p)),
  ].slice(0, MAX_NX_FILES);
  await Promise.all(
    toFetch.map(async (p) => {
      const c = await gh(token, `/repos/${owner}/${name}/contents/${p}?ref=${branch}`);
      if (!c.ok) return;
      const blob = (await c.json()) as { content?: string; encoding?: string };
      if (blob.content) {
        files[p] = Buffer.from(blob.content, "base64").toString("utf-8");
      }
    })
  );
  const context = parseNx(files);

  // 3. Recent commits.
  let commits: GhCommit[] = [];
  const commitsRes = await gh(token, `/repos/${owner}/${name}/commits?sha=${branch}&per_page=15`);
  if (commitsRes.ok) {
    const raw = (await commitsRes.json()) as Array<{
      sha: string;
      commit: { message: string; author: { name: string; date: string } };
      author: { login: string; avatar_url: string } | null;
    }>;
    commits = raw.map((r) => ({
      sha: r.sha.slice(0, 7),
      message: r.commit.message.split("\n")[0],
      author: r.author?.login ?? r.commit.author.name,
      avatar: r.author?.avatar_url ?? null,
      date: r.commit.author.date,
    }));
  }

  // 4. Open issues (exclude PRs).
  let issues: GhIssue[] = [];
  const issuesRes = await gh(token, `/repos/${owner}/${name}/issues?state=open&per_page=30`);
  if (issuesRes.ok) {
    const raw = (await issuesRes.json()) as Array<{
      number: number;
      title: string;
      state: string;
      html_url: string;
      pull_request?: unknown;
      labels: { name: string }[];
    }>;
    issues = raw
      .filter((i) => !i.pull_request)
      .map((i) => ({
        number: i.number,
        title: i.title,
        state: i.state,
        url: i.html_url,
        labels: i.labels.map((l) => l.name),
      }));
  }

  // Derive contributors from commit authors.
  const contribMap = new Map<string, { login: string; avatar: string; commits: number }>();
  for (const c of commits) {
    const key = c.author;
    const existing = contribMap.get(key);
    if (existing) existing.commits += 1;
    else contribMap.set(key, { login: key, avatar: c.avatar ?? "", commits: 1 });
  }

  return {
    repo,
    branch,
    context,
    commits,
    issues,
    contributors: [...contribMap.values()].sort((a, b) => b.commits - a.commits),
    syncedAt: new Date().toISOString(),
  };
}
