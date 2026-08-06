/**
 * Line-by-line diff engine for Nx Studio Context Drift.
 * Calculates LCS (Longest Common Subsequence) diffs between original studio emit
 * and current repo state, supporting temporal step-through.
 */

export interface DiffLine {
  type: "add" | "delete" | "normal";
  text: string;
  oldLine?: number;
  newLine?: number;
}

export interface FileDiffResult {
  lines: DiffLine[];
  additions: number;
  deletions: number;
  unchanged: number;
}

export function computeLineDiff(oldText: string, newText: string): FileDiffResult {
  const oldLines = oldText ? oldText.split(/\r?\n/) : [];
  const newLines = newText ? newText.split(/\r?\n/) : [];

  const n = oldLines.length;
  const m = newLines.length;

  // DP table for LCS
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to build diff
  const rawDiff: { type: "add" | "delete" | "normal"; oldIdx?: number; newIdx?: number; text: string }[] = [];
  let i = n;
  let j = m;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      rawDiff.push({ type: "normal", oldIdx: i, newIdx: j, text: oldLines[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      rawDiff.push({ type: "add", newIdx: j, text: newLines[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      rawDiff.push({ type: "delete", oldIdx: i, text: oldLines[i - 1] });
      i--;
    }
  }

  rawDiff.reverse();

  let additions = 0;
  let deletions = 0;
  let unchanged = 0;

  const lines: DiffLine[] = rawDiff.map((item) => {
    if (item.type === "add") additions++;
    else if (item.type === "delete") deletions++;
    else unchanged++;

    return {
      type: item.type,
      text: item.text,
      oldLine: item.oldIdx,
      newLine: item.newIdx,
    };
  });

  return {
    lines,
    additions,
    deletions,
    unchanged,
  };
}
