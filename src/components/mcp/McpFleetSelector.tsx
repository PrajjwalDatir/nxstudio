"use client";

import { useState, useMemo } from "react";
import { useWorkspace } from "@/lib/workspace-store";
import {
  CheckIcon,
  CopyIcon,
  BoxIcon,
  LayersIcon,
  GithubIcon,
  ExternalLinkIcon,
} from "@/components/icons";

interface McpServerDef {
  id: string;
  name: string;
  category: "product-os" | "developer" | "data" | "search" | "ops";
  tagline: string;
  docsUrl: string;
  badge?: string;
  cursorConfig: (projectName: string) => Record<string, unknown>;
  claudeConfig: (projectName: string) => Record<string, unknown>;
  icon: React.ComponentType<{ className?: string }>;
}

// Brand SVG Icons for MCPs
function NxStudioMcpIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#7C3AED" fillOpacity="0.2" stroke="#7C3AED" strokeWidth="1.5" />
      <path d="M7 17L12 7L17 17M9.5 13H14.5" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PostgresMcpIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#336791" fillOpacity="0.2" stroke="#336791" strokeWidth="1.5" />
      <ellipse cx="12" cy="7" rx="6" ry="2.5" stroke="#38BDF8" strokeWidth="1.5" />
      <path d="M6 7V12C6 13.38 8.69 14.5 12 14.5C15.31 14.5 18 13.38 18 12V7" stroke="#38BDF8" strokeWidth="1.5" />
      <path d="M6 12V17C6 18.38 8.69 19.5 12 19.5C15.31 19.5 18 18.38 18 17V12" stroke="#38BDF8" strokeWidth="1.5" />
    </svg>
  );
}

function FilesystemMcpIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#F59E0B" fillOpacity="0.15" stroke="#F59E0B" strokeWidth="1.5" />
      <path d="M5 8C5 6.89543 5.89543 6 7 6H10L12 8H17C18.1046 8 19 8.89543 19 10V16C19 17.1046 18.1046 18 17 18H7C5.89543 18 5 17.1046 5 16V8Z" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LinearMcpIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#5E6AD2" fillOpacity="0.2" stroke="#5E6AD2" strokeWidth="1.5" />
      <path d="M6.5 17.5L17.5 6.5M6.5 13L13 6.5M11 17.5L17.5 11" stroke="#818CF8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SentryMcpIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#E11D48" fillOpacity="0.2" stroke="#E11D48" strokeWidth="1.5" />
      <path d="M12 7V13M12 17H12.01M6.5 19H17.5C18.6 19 19.3 17.8 18.75 16.85L13.25 7.35C12.7 6.4 11.3 6.4 10.75 7.35L5.25 16.85C4.7 17.8 5.4 19 6.5 19Z" stroke="#FB7185" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BraveMcpIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#FB542B" fillOpacity="0.2" stroke="#FB542B" strokeWidth="1.5" />
      <circle cx="11" cy="11" r="5" stroke="#FB923C" strokeWidth="1.5" />
      <path d="M15 15L19 19" stroke="#FB923C" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function FetchMcpIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#10B981" fillOpacity="0.2" stroke="#10B981" strokeWidth="1.5" />
      <path d="M8 12H16M16 12L13 9M16 12L13 15M6 6H18C19.1 6 20 6.9 20 8V16C20 17.1 19.1 18 18 18H6C4.9 18 4 17.1 4 16V8C4 6.9 4.9 6 6 6Z" stroke="#34D399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const MCP_REGISTRY: McpServerDef[] = [
  {
    id: "nxstudio",
    name: "nxstudio Product OS",
    category: "product-os",
    tagline: "Topological DAG, W3C Design Tokens, Kinematics & Drift Synchronization",
    badge: "Core OS",
    docsUrl: "https://nxstudio.app",
    icon: NxStudioMcpIcon,
    cursorConfig: () => ({
      command: "npx",
      args: ["-y", "mcp-remote", "https://nxstudio.dev/api/mcp"],
      env: {
        NX_API_KEY: "${NX_API_KEY}",
      },
    }),
    claudeConfig: () => ({
      command: "npx",
      args: ["-y", "mcp-remote", "https://nxstudio.dev/api/mcp"],
      env: {
        NX_API_KEY: "${NX_API_KEY}",
      },
    }),
  },
  {
    id: "github",
    name: "GitHub MCP",
    category: "developer",
    tagline: "Pull requests, branch commits, and issue lifecycle orchestration",
    docsUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/github",
    icon: GithubIcon,
    cursorConfig: () => ({
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-github"],
      env: {
        GITHUB_PERSONAL_ACCESS_TOKEN: "${GITHUB_TOKEN}",
      },
    }),
    claudeConfig: () => ({
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-github"],
      env: {
        GITHUB_PERSONAL_ACCESS_TOKEN: "${GITHUB_TOKEN}",
      },
    }),
  },
  {
    id: "postgres",
    name: "PostgreSQL & Supabase",
    category: "data",
    tagline: "Live database schema inspection, DDL migrations, and query execution",
    docsUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/postgres",
    icon: PostgresMcpIcon,
    cursorConfig: () => ({
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-postgres", "${DATABASE_URL}"],
    }),
    claudeConfig: () => ({
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-postgres", "${DATABASE_URL}"],
    }),
  },
  {
    id: "filesystem",
    name: "Filesystem MCP",
    category: "developer",
    tagline: "Secure local repo read/write access and workspace directory navigation",
    docsUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem",
    icon: FilesystemMcpIcon,
    cursorConfig: () => ({
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", "."],
    }),
    claudeConfig: () => ({
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", "."],
    }),
  },
  {
    id: "linear",
    name: "Linear MCP",
    category: "developer",
    tagline: "Sync product issues, team sprints, and roadmap milestones",
    docsUrl: "https://github.com/jerhadf/linear-mcp-server",
    icon: LinearMcpIcon,
    cursorConfig: () => ({
      command: "npx",
      args: ["-y", "linear-mcp"],
      env: {
        LINEAR_API_KEY: "${LINEAR_API_KEY}",
      },
    }),
    claudeConfig: () => ({
      command: "npx",
      args: ["-y", "linear-mcp"],
      env: {
        LINEAR_API_KEY: "${LINEAR_API_KEY}",
      },
    }),
  },
  {
    id: "sentry",
    name: "Sentry MCP",
    category: "ops",
    tagline: "Inspect real-time crash reports, stack traces, and runtime performance",
    docsUrl: "https://github.com/getsentry/sentry-mcp",
    icon: SentryMcpIcon,
    cursorConfig: () => ({
      command: "npx",
      args: ["-y", "@sentry/mcp-server"],
      env: {
        SENTRY_AUTH_TOKEN: "${SENTRY_AUTH_TOKEN}",
      },
    }),
    claudeConfig: () => ({
      command: "npx",
      args: ["-y", "@sentry/mcp-server"],
      env: {
        SENTRY_AUTH_TOKEN: "${SENTRY_AUTH_TOKEN}",
      },
    }),
  },
  {
    id: "brave-search",
    name: "Brave Search MCP",
    category: "search",
    tagline: "Real-time web search and documentation lookups for coding agents",
    docsUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search",
    icon: BraveMcpIcon,
    cursorConfig: () => ({
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-brave-search"],
      env: {
        BRAVE_API_KEY: "${BRAVE_API_KEY}",
      },
    }),
    claudeConfig: () => ({
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-brave-search"],
      env: {
        BRAVE_API_KEY: "${BRAVE_API_KEY}",
      },
    }),
  },
  {
    id: "fetch",
    name: "Fetch MCP",
    category: "developer",
    tagline: "HTTP REST testing, external endpoint inspection, and curl queries",
    docsUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/fetch",
    icon: FetchMcpIcon,
    cursorConfig: () => ({
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-fetch"],
    }),
    claudeConfig: () => ({
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-fetch"],
    }),
  },
];

export function McpFleetSelector() {
  const { data, updateMcpServers } = useWorkspace();
  const selectedIds = useMemo(() => {
    return new Set(data.selectedMcpServers ?? ["nxstudio", "github", "postgres"]);
  }, [data.selectedMcpServers]);

  const [activeFormat, setActiveFormat] = useState<"cursor" | "claude" | "windsurf">("cursor");
  const [copied, setCopied] = useState(false);

  const toggleServer = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      if (id !== "nxstudio") next.delete(id); // Keep nxstudio as core
    } else {
      next.add(id);
    }
    updateMcpServers([...next]);
  };

  const activeServers = useMemo(() => {
    return MCP_REGISTRY.filter((s) => selectedIds.has(s.id));
  }, [selectedIds]);

  const generatedConfig = useMemo(() => {
    const pName = data.productName || "nx-product";
    const serversMap: Record<string, unknown> = {};

    for (const s of activeServers) {
      if (activeFormat === "cursor" || activeFormat === "windsurf") {
        serversMap[s.id] = s.cursorConfig(pName);
      } else {
        serversMap[s.id] = s.claudeConfig(pName);
      }
    }

    return JSON.stringify({ mcpServers: serversMap }, null, 2);
  }, [activeServers, activeFormat, data.productName]);

  const copyConfig = () => {
    navigator.clipboard?.writeText(generatedConfig);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const downloadConfig = () => {
    const filename =
      activeFormat === "cursor"
        ? "mcp.json"
        : activeFormat === "claude"
        ? "claude_desktop_config.json"
        : "mcp_config.json";

    const blob = new Blob([generatedConfig], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-8 rounded-2xl border border-border bg-card/40 p-5 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <LayersIcon className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold tracking-tight text-foreground">MCP Fleet Configuration</h3>
            <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-mono text-accent-foreground">
              Model Context Protocol
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Select the MCP servers for your coding agents. Connects your Product OS, repository, database, and telemetry in one config.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={downloadConfig}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
          >
            <BoxIcon className="h-3.5 w-3.5" />
            <span>Download Config</span>
          </button>
          <button
            onClick={copyConfig}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-all shadow-sm"
          >
            {copied ? <CheckIcon className="h-3.5 w-3.5 text-emerald-400" /> : <CopyIcon className="h-3.5 w-3.5" />}
            <span>{copied ? "Copied" : "Copy Config"}</span>
          </button>
        </div>
      </div>

      {/* Grid of MCP Servers with Icons */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {MCP_REGISTRY.map((srv) => {
          const isSelected = selectedIds.has(srv.id);
          const Icon = srv.icon;

          return (
            <div
              key={srv.id}
              onClick={() => toggleServer(srv.id)}
              className={`group relative flex cursor-pointer flex-col justify-between rounded-xl border p-4 transition-all ${
                isSelected
                  ? "border-primary/50 bg-primary/5 shadow-sm"
                  : "border-border bg-card/60 hover:border-border hover:bg-secondary/20"
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-7 w-7 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                        {srv.name}
                      </h4>
                      {srv.badge && (
                        <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[9px] font-mono font-semibold text-accent-foreground">
                          {srv.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                      isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"
                    }`}
                  >
                    {isSelected && <CheckIcon className="h-3 w-3" />}
                  </div>
                </div>

                <p className="mt-2.5 text-[11px] leading-relaxed text-muted-foreground">
                  {srv.tagline}
                </p>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-[10px] text-muted-foreground">
                <span className="font-mono uppercase">{srv.category}</span>
                <a
                  href={srv.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  <span>Docs</span>
                  <ExternalLinkIcon className="h-2.5 w-2.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Target Config Format Tabs & Live Preview */}
      <div className="mt-6 rounded-xl border border-border bg-background/60 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-4 py-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveFormat("cursor")}
              className={`rounded px-2.5 py-1 text-xs font-mono font-medium transition-colors ${
                activeFormat === "cursor" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              .cursor/mcp.json
            </button>
            <button
              onClick={() => setActiveFormat("claude")}
              className={`rounded px-2.5 py-1 text-xs font-mono font-medium transition-colors ${
                activeFormat === "claude" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              claude_desktop_config.json
            </button>
            <button
              onClick={() => setActiveFormat("windsurf")}
              className={`rounded px-2.5 py-1 text-xs font-mono font-medium transition-colors ${
                activeFormat === "windsurf" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              .windsurf/mcp.json
            </button>
          </div>

          <span className="text-[11px] font-mono text-muted-foreground">
            {activeServers.length} active server{activeServers.length === 1 ? "" : "s"}
          </span>
        </div>

        <pre className="p-4 font-mono text-xs text-foreground/90 overflow-x-auto leading-relaxed max-h-64">
          {generatedConfig}
        </pre>
      </div>
    </div>
  );
}
