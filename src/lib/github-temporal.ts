/**
 * GitHub Temporal Commit Engine for .nx/ Files
 * Fetches real commit history and historical file content revisions from GitHub
 */

export interface TemporalCommit {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
  content?: string;
}

const REPO_OWNER = process.env.GITHUB_REPO_OWNER || "";
const REPO_NAME = process.env.GITHUB_REPO_NAME || "";

/**
 * Fetch commit history for a specific file in the repository.
 */
export async function fetchFileCommits(path: string): Promise<TemporalCommit[]> {
  // Security: Prevent path traversal
  if (!REPO_OWNER || !REPO_NAME || path.includes("..")) return [];

  try {
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?path=${encodeURIComponent(cleanPath)}&per_page=10`;

    const res = await fetch(url, {
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!res.ok) {
      console.warn(`GitHub API commits returned status ${res.status}`);
      return [];
    }

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    interface RawGitHubCommitItem {
      sha?: string;
      commit?: {
        message?: string;
        author?: {
          name?: string;
          date?: string;
        };
      };
      author?: {
        login?: string;
      };
      html_url?: string;
    }

    return (data as RawGitHubCommitItem[]).map((item) => ({
      sha: item.sha?.slice(0, 7) || "unknown",
      message: item.commit?.message?.split("\n")[0] || "Update file",
      author: item.commit?.author?.name || item.author?.login || "AI Agent",
      date: item.commit?.author?.date ? new Date(item.commit.author.date).toLocaleString() : "Recently",
      url: item.html_url || "",
    }));
  } catch (err) {
    console.error("Failed to fetch file commits from GitHub:", err);
    return [];
  }
}

/**
 * Fetch historical file content at a specific commit SHA from raw.githubusercontent.com.
 */
export async function fetchFileContentAtSha(sha: string, path: string): Promise<string | null> {
  // Security: Prevent path traversal and properly URL-encode segments
  if (!REPO_OWNER || !REPO_NAME || sha.includes("..") || path.includes("..")) return null;

  try {
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    const encSha = encodeURIComponent(sha);
    const encPath = cleanPath.split("/").map(encodeURIComponent).join("/");
    const rawUrl = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${encSha}/${encPath}`;

    const res = await fetch(rawUrl);
    if (!res.ok) return null;
    return await res.text();
  } catch (err) {
    console.error(`Failed to fetch file content at ${sha}:`, err);
    return null;
  }
}
