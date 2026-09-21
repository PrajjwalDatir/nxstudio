"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  KeyRoundIcon,
  PlusIcon,
  CopyIcon,
  CheckIcon,
  TrashIcon,
  TerminalIcon,
  ShieldCheckIcon,
  AlertTriangleIcon,
} from "@/components/icons";

export interface PatToken {
  id: string;
  name: string;
  tokenPrefix: string;
  createdAt: string;
  expiresIn: string;
  lastUsedAt?: string;
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

export function McpTokensSection() {
  const [tokens, setTokens] = useState<PatToken[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [tokenName, setTokenName] = useState("");
  const [expiresIn, setExpiresIn] = useState("90 days");
  const [activeTab, setActiveTab] = useState<"cursor" | "claude" | "windsurf">("cursor");
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [newlyCreatedToken, setNewlyCreatedToken] = useState<string | null>(null);
  const [copiedNewToken, setCopiedNewToken] = useState(false);

  // Hydrate tokens from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as PatToken[];
        if (Array.isArray(parsed)) {
          setTokens(parsed);
          return;
        }
      }
      // Default demo token if none exists
      const demoToken: PatToken = {
        id: "tok_demo_primary",
        name: "Cursor IDE Agent",
        tokenPrefix: "nx_pat_7a2f...9c4b",
        createdAt: new Date().toISOString().split("T")[0],
        expiresIn: "Never",
        lastUsedAt: "Just now",
      };
      setTokens([demoToken]);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([demoToken]));
    } catch {
      // Fallback in case of storage restriction
    }
  }, []);

  const saveTokens = (updated: PatToken[]) => {
    setTokens(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore storage err
    }
  };

  const handleCreateToken = (e: React.FormEvent) => {
    e.preventDefault();
    const name = tokenName.trim() || "Agent Client";
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

  const handleRevokeToken = (id: string) => {
    const updated = tokens.filter((t) => t.id !== id);
    saveTokens(updated);
  };

  const activeTokenSample = newlyCreatedToken || (tokens[0] ? `${tokens[0].tokenPrefix}` : "nx_pat_YOUR_TOKEN");

  const getIdeSnippet = () => {
    const host = typeof window !== "undefined" ? window.location.origin : "https://nxstudio.dev";
    const displayToken = newlyCreatedToken || "nx_pat_YOUR_TOKEN";

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
                url: `${host}/api/mcp?token=${displayToken}`,
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
            <h2 className="font-semibold tracking-tight text-foreground">
              Model Context Protocol (MCP) Access Tokens
            </h2>
            <p className="text-xs text-muted-foreground">
              Personal Access Tokens authenticate autonomous agents to stream schemas, DAGs, and report telemetry.
            </p>
          </div>
        </div>

        {!isGenerating && (
          <Button
            onClick={() => setIsGenerating(true)}
            size="sm"
            className="h-8 gap-1.5 self-start text-xs sm:self-center"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Generate New Token
          </Button>
        )}
      </div>

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
              <Button type="submit" size="sm" className="h-9">
                Generate
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
                className="h-8 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 gap-1"
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
                  ? "bg-primary/20 text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Cursor (.cursor/mcp.json)
            </button>
            <button
              onClick={() => setActiveTab("claude")}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                activeTab === "claude"
                  ? "bg-primary/20 text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Claude Code / Desktop
            </button>
            <button
              onClick={() => setActiveTab("windsurf")}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                activeTab === "windsurf"
                  ? "bg-primary/20 text-primary font-semibold"
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
            className="absolute top-2 right-2 h-7 gap-1.5 px-2.5 text-xs bg-secondary/80 hover:bg-secondary"
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
    </section>
  );
}
