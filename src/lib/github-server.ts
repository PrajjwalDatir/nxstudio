/**
 * Server-only GitHub REST helpers. The token lives in an httpOnly cookie and
 * never reaches the client. Used exclusively by /api/github/* route handlers.
 */

// Server-only module: imported exclusively by /api/github/* route handlers.
import { NXHUMAN_ROOT, parseNxHuman, ParsedNxHuman } from "./nxhuman-compiler";

const API = "https://api.github.com";

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

export interface RepoSync {
  repo: string;
  branch: string;
  context: ParsedNxHuman;
  commits: GhCommit[];
  issues: GhIssue[];
  contributors: { login: string; avatar: string; commits: number }[];
  syncedAt: string;
}

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

/** Read the .nxhuman/ tree + recent commits + open issues for a repo. */
export async function syncRepo(
  token: string,
  repo: string,
  branch: string
): Promise<RepoSync | { error: string; status: number }> {
  const [owner, name] = repo.split("/");
  if (!owner || !name) return { error: "Invalid repo. Use owner/name.", status: 400 };

  // 1. Recursive tree to discover which .nxhuman files exist.
  const treeRes = await gh(token, `/repos/${owner}/${name}/git/trees/${branch}?recursive=1`);
  if (treeRes.status === 404) return { error: "Repo or branch not found.", status: 404 };
  if (treeRes.status === 401) return { error: "Invalid or expired token.", status: 401 };
  if (!treeRes.ok) return { error: `GitHub error (${treeRes.status}).`, status: treeRes.status };

  const tree = (await treeRes.json()) as { tree?: { path: string; type: string }[] };
  const nxPaths = (tree.tree ?? [])
    .filter((n) => n.type === "blob" && n.path.startsWith(NXHUMAN_ROOT))
    .map((n) => n.path);

  // 2. Fetch memory.json content (the only file we parse) if present.
  const files: Record<string, string> = {};
  for (const p of nxPaths) files[p] = ""; // mark presence
  const memPath = `${NXHUMAN_ROOT}/memory.json`;
  if (nxPaths.includes(memPath)) {
    const c = await gh(token, `/repos/${owner}/${name}/contents/${memPath}?ref=${branch}`);
    if (c.ok) {
      const blob = (await c.json()) as { content?: string; encoding?: string };
      if (blob.content) {
        files[memPath] = Buffer.from(blob.content, "base64").toString("utf-8");
      }
    }
  }
  const context = parseNxHuman(files);

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
