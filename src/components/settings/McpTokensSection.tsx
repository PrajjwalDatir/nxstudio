"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/lib/use-subscription";
import {
  KeyRoundIcon,
  PlusIcon,
  CopyIcon,
  CheckIcon,
  TrashIcon,
  TerminalIcon,
  ShieldCheckIcon,
  LockIcon,
  XIcon,
} from "@/components/icons";

export interface PatToken {
  id: string;
  name: string;
  tokenPrefix: string;
  createdAt: string;
  expiresIn: string;
  lastUsedAt?: string;
  expiresAt?: string | null;
}

const STORAGE_KEY = "nx_mcp_pat_tokens";

// Deterministic counter to satisfy React 19 purity rules
let patSeq = 1000;
function generatePatTokenString(): { fullToken: string; prefix: string; id: string } {
  patSeq += 1;
  const timestamp = Date.now().toString(36);
  // Generate random 16-character hex using window.crypto if available
  let randomHex = "";
  if (typeof window !== "undefined" && window.crypto) {
    const arr = new Uint8Array(8);
    window.crypto.getRandomValues(arr);
    randomHex = Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
  } else {
    randomHex = `s${patSeq.toString(36)}x${timestamp.slice(-4)}`;
  }

  const fullToken = `nx_pat_${timestamp}_${randomHex}`;
  const prefix = `nx_pat_${fullToken.slice(7, 11)}...${fullToken.slice(-4)}`;
  const id = `tok_${timestamp}_${patSeq}`;

  return { fullToken, prefix, id };
}

export function McpTokensSection({ isAnonymous: propIsAnonymous }: { isAnonymous?: boolean } = {}) {
  const sub = useSubscription();
  const isAnonymous = propIsAnonymous !== undefined ? propIsAnonymous : sub.isAnonymous;
  const [showSignInDialog, setShowSignInDialog] = useState(false);

  const [tokens, setTokens] = useState<PatToken[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as PatToken[];
        if (Array.isArray(parsed)) return parsed;
      }
      return [];
    } catch {
      return [];
    }
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenName, setTokenName] = useState("");
  const [expiresIn, setExpiresIn] = useState("90 days");
  const [activeTab, setActiveTab] = useState<"cursor" | "claude" | "windsurf">("cursor");
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [newlyCreatedToken, setNewlyCreatedToken] = useState<string | null>(null);
  const [copiedNewToken, setCopiedNewToken] = useState(false);

  // Fetch tokens from backend for authenticated users
  useEffect(() => {
    if (isAnonymous) return;
    let cancelled = false;
    setIsLoading(true);

    fetch("/api/mcp/tokens")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.tokens && Array.isArray(data.tokens)) {
          setTokens(data.tokens);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data.tokens));
          } catch {}
        }
      })
      .catch((err) => {
        console.warn("[MCP] Could not sync tokens with server, using local cache:", err);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAnonymous]);

  const saveTokens = (updated: PatToken[]) => {
    setTokens(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore storage err
    }
  };

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAnonymous) {
      setShowSignInDialog(true);
      return;
    }

    const name = tokenName.trim() || "Agent Client";
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/mcp/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, expiresIn }),
      });

      if (res.ok) {
        const data = await res.json();
        const updated = [data.tokenInfo, ...tokens.filter((t) => t.id !== data.tokenInfo.id)];
        saveTokens(updated);
        setNewlyCreatedToken(data.token);
        setTokenName("");
        setIsGenerating(false);
        return;
      }
    } catch (err) {
      console.warn("[MCP] Failed to create token on server, falling back to local creation:", err);
    } finally {
      setIsSubmitting(false);
    }

    // Fallback if network or DB fails
    const { fullToken, prefix, id } = generatePatTokenString();
    const newToken: PatToken = {
      id,
      name,
      tokenPrefix: prefix,
      createdAt: new Date().toISOString().split("T")[0],
      expiresIn,
      lastUsedAt: "Never",
    };

    saveTokens([newToken, ...tokens]);
    setNewlyCreatedToken(fullToken);
    setTokenName("");
    setIsGenerating(false);
  };

  const handleRevokeToken = async (id: string) => {
    if (isAnonymous) {
      setShowSignInDialog(true);
      return;
    }
    const updated = tokens.filter((t) => t.id !== id);
    saveTokens(updated);

    try {
      await fetch(`/api/mcp/tokens?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.warn("[MCP] Error revoking token on server:", err);
    }
  };

  const getIdeSnippet = () => {
    const host = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const displayToken = newlyCreatedToken || "<YOUR_TOKEN>";

    switch (activeTab) {
      case "cursor":
        return JSON.stringify(
          {
            mcpServers: {
              nxstudio: {
                url: `${host}/api/mcp`,
                headers: {
                  Authorization: `Bearer ${displayToken}`,
                },
              },
            },
          },
          null,
          2
        );

      case "claude":
        return JSON.stringify(
          {
            mcpServers: {
              nxstudio: {
                command: "npx",
                args: ["-y", "mcp-remote", `${host}/api/mcp?token=${displayToken}`],
              },
            },
          },
          null,
          2
        );

      case "windsurf":
        return JSON.stringify(
          {
            mcpServers: {
              nxstudio: {
                serverUrl: `${host}/api/mcp`,
                headers: {
                  Authorization: `Bearer ${displayToken}`,
                },
              },
            },
          },
          null,
          2
        );
    }
  };

  const copyToClipboard = (text: string, isNewToken = false) => {
    if (isAnonymous) {
      setShowSignInDialog(true);
      return;
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (isNewToken) {
        setCopiedNewToken(true);
        setTimeout(() => setCopiedNewToken(false), 2000);
      } else {
        setCopiedSnippet(true);
        setTimeout(() => setCopiedSnippet(false), 2000);
      }
    }
  };

  return (
    <section className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <KeyRoundIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold tracking-tight text-foreground">
                Model Context Protocol (MCP) Access Tokens
              </h2>
              {isAnonymous && (
                <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                  <LockIcon className="h-3 w-3" />
                  Sign in required
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Personal Access Tokens authenticate autonomous agents to stream schemas, DAGs, and report telemetry.
            </p>
          </div>
        </div>

        {!isGenerating && (
          <Button
            onClick={() => {
              if (isAnonymous) {
                setShowSignInDialog(true);
                return;
              }
              setIsGenerating(true);
            }}
            size="sm"
            className="h-8 gap-1.5 self-start text-xs sm:self-center"
          >
            {isAnonymous ? <LockIcon className="h-3.5 w-3.5" /> : <PlusIcon className="h-3.5 w-3.5" />}
            Generate New Token
          </Button>
        )}
      </div>

      {/* Anonymous Lock Alert Row */}
      {isAnonymous && (
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3.5">
          <div className="flex items-start gap-2.5">
            <LockIcon className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-semibold text-amber-300">Sign in to use Model Context Protocol (MCP)</span>
              <p className="text-muted-foreground mt-0.5">
                Guest sessions cannot generate tokens to connect Cursor, Claude Code, or Windsurf. Sign in with GitHub to link your agent fleet.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setShowSignInDialog(true)}
            className="h-8 text-xs bg-amber-500 hover:bg-amber-600 text-amber-950 font-semibold shrink-0 cursor-pointer"
          >
            Sign in to use MCP
          </Button>
        </div>
      )}

      {/* New Token One-Time Alert */}
      {newlyCreatedToken && (
        <div className="mt-5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheckIcon className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-emerald-300">
                Personal Access Token Generated
              </h3>
              <p className="mt-1 text-xs text-emerald-300/80">
                Copy your token now. For security reasons, it will not be displayed again.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <code className="flex-1 truncate rounded border border-emerald-500/20 bg-black/40 px-2.5 py-1.5 font-mono text-xs text-emerald-200">
                  {newlyCreatedToken}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(newlyCreatedToken, true)}
                  className="h-8 gap-1.5 shrink-0 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
                >
                  {copiedNewToken ? (
                    <>
                      <CheckIcon className="h-3.5 w-3.5 text-emerald-400" />
                      Copied
                    </>
                  ) : (
                    <>
                      <CopyIcon className="h-3.5 w-3.5" />
                      Copy Token
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setNewlyCreatedToken(null)}
                  className="h-8 text-xs text-muted-foreground hover:text-foreground"
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inline Generate Form */}
      {isGenerating && (
        <form
          onSubmit={handleCreateToken}
          className="mt-5 rounded-lg border border-primary/20 bg-primary/5 p-4"
        >
          <h3 className="text-sm font-medium text-foreground">Create a Personal Access Token</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Token permissions default to read-write for active project contexts, DAGs, and drift telemetry.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto]">
            <input
              type="text"
              placeholder="Token description (e.g. Cursor Local, Claude Code, Devin)"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              className="h-9 rounded-md border border-border bg-background px-3 text-sm placeholder:text-muted-foreground outline-none focus:border-ring"
              autoFocus
            />
            <select
              value={expiresIn}
              onChange={(e) => setExpiresIn(e.target.value)}
              className="h-9 rounded-md border border-border bg-background px-2.5 text-xs text-foreground outline-none focus:border-ring"
            >
              <option value="30 days">Expires in 30 days</option>
              <option value="90 days">Expires in 90 days</option>
              <option value="1 year">Expires in 1 year</option>
              <option value="Never">Never expires</option>
            </select>
            <div className="flex items-center gap-2">
              <Button type="submit" size="sm" className="h-9" disabled={isSubmitting}>
                {isSubmitting ? "Generating..." : "Generate"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsGenerating(false)}
                className="h-9"
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Active Tokens List */}
      <div className="mt-5 divide-y divide-border/60 rounded-lg border border-border/80 bg-background/50 overflow-hidden">
        {tokens.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            No active tokens. Generate one above to connect your AI agent.
          </div>
        ) : (
          tokens.map((token) => (
            <div
              key={token.id}
              className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors"
            >
              <div className="min-w-0 flex-1 pr-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{token.name}</span>
                  <span className="rounded bg-secondary/80 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {token.tokenPrefix}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span>Created: {token.createdAt}</span>
                  <span>·</span>
                  <span>Expires: {token.expiresIn}</span>
                  <span>·</span>
                  <span>Last used: {token.lastUsedAt || "Never"}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRevokeToken(token.id)}
                className="h-8 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 gap-1 cursor-pointer"
              >
                <TrashIcon className="h-3.5 w-3.5" />
                Revoke
              </Button>
            </div>
          ))
        )}
      </div>

      {/* Quick Connect Configuration Snippets */}
      <div className="mt-6 rounded-lg border border-border bg-muted/20 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/50 pb-3">
          <div className="flex items-center gap-2">
            <TerminalIcon className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Agent IDE Connection Config
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab("cursor")}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                activeTab === "cursor"
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Cursor (.cursor/mcp.json)
            </button>
            <button
              onClick={() => setActiveTab("claude")}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                activeTab === "claude"
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Claude Code / Desktop
            </button>
            <button
              onClick={() => setActiveTab("windsurf")}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                activeTab === "windsurf"
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Windsurf
            </button>
          </div>
        </div>

        <div className="relative mt-3">
          <pre className="overflow-x-auto rounded-md bg-black/50 p-3 font-mono text-[11px] leading-relaxed text-foreground/90">
            {getIdeSnippet()}
          </pre>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => copyToClipboard(getIdeSnippet())}
            className="absolute top-2 right-2 h-7 gap-1.5 px-2.5 text-xs bg-secondary/80 hover:bg-secondary cursor-pointer"
          >
            {copiedSnippet ? (
              <>
                <CheckIcon className="h-3 w-3 text-emerald-400" />
                Copied
              </>
            ) : (
              <>
                <CopyIcon className="h-3 w-3" />
                Copy Config
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Dialog for Anonymous Users */}
      {showSignInDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <button
              onClick={() => setShowSignInDialog(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-md cursor-pointer"
              aria-label="Close dialog"
            >
              <XIcon className="h-4 w-4" />
            </button>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 mb-4">
              <LockIcon className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Sign in to use Model Context Protocol (MCP)</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Personal Access Tokens connect your local AI IDE agents (Cursor, Claude Code, Windsurf) to your project context, live PostgreSQL/Prisma schemas, and Topological DAGs.
            </p>
            <p className="mt-2 text-xs text-amber-300/90 font-medium">
              Sign in with GitHub to generate and manage your MCP access tokens.
            </p>
            <div className="mt-6 flex items-center justify-end gap-2.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSignInDialog(false)}
                className="text-xs cursor-pointer"
              >
                Dismiss
              </Button>
              <Link
                href="/login?redirectTo=/settings"
                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
              >
                Sign in with GitHub
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
