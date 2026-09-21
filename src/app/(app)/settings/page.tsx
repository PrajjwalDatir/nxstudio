"use client";

import { useState, useId } from "react";
import Link from "next/link";
import { useWorkspace, useSync } from "@/lib/workspace-store";
import { useSubscription } from "@/lib/use-subscription";
import { Button } from "@/components/ui/button";
import { BillingSection } from "@/components/billing/BillingSection";
import { ReferralPanel } from "@/components/referral/ReferralPanel";
import { AdminPromptsPanel } from "@/components/admin/AdminPromptsPanel";
import { McpTokensSection } from "@/components/settings/McpTokensSection";
import { GithubIcon, CheckCircleIcon, LoaderIcon, ExternalLinkIcon, SettingsIcon, ScaffoldIcon } from "@/components/icons";

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <label htmlFor={id} className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 h-10 w-full rounded-lg border border-border bg-secondary/40 px-3 text-sm outline-none focus:border-ring"
      />
    </label>
  );
}

export default function SettingsPage() {
  const { data, github, setProductName, setRepo, resetActive } = useWorkspace();
  const sync = useSync();
  const { isAnonymous } = useSubscription();

  const [token, setToken] = useState("");
  const [connectErr, setConnectErr] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [repo, setRepoInput] = useState(github.repo ?? "");
  const [branch, setBranch] = useState(github.branch ?? "main");

  if (isAnonymous) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <div className="mt-8 rounded-xl border border-border bg-card p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
            <SettingsIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">Sign up to access Settings</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            Guest accounts can&apos;t configure API keys, billing, or GitHub sync. Link your account to unlock settings.
          </p>
          <div className="mt-6">
            <Link href="/login" className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors">
              Link account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const connect = async () => {
    setConnectErr(null);
    setConnecting(true);
    try {
      await sync.connect(token.trim());
      setToken("");
    } catch (e) {
      setConnectErr(e instanceof Error ? e.message : "Failed to connect.");
    } finally {
      setConnecting(false);
    }
  };

  const saveRepo = () => {
    setRepo(repo.trim() || null, branch.trim() || "main");
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="mt-1 text-muted-foreground">Configuration for {data.productName}.</p>
        </div>
        <Link
          href="/canvas"
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:border-primary/40 transition-colors"
        >
          <ScaffoldIcon className="h-4 w-4" />
          Back to Canvas
        </Link>
      </div>

      {/* Product */}
      <section className="mt-8 rounded-xl border border-border bg-card p-6">
        <h2 className="font-semibold">Product</h2>
        <div className="mt-4">
          <Field label="Product name" value={data.productName} onChange={setProductName} />
        </div>
      </section>

      {/* GitHub */}
      <section className="mt-6 rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <GithubIcon className="h-5 w-5" />
          <h2 className="font-semibold">GitHub Sync</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect a repo so nxstudio reads your <span className="font-mono text-accent-foreground">.nx/</span>{" "}
          context and build activity back from GitHub.
        </p>

        {!sync.github.connected ? (
          <div className="mt-4 space-y-3">
            <label htmlFor="github-pat-input" className="block">
              <span className="text-sm font-medium">Personal Access Token</span>
              <input
                id="github-pat-input"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_…"
                className="mt-1.5 h-10 w-full rounded-lg border border-border bg-secondary/40 px-3 font-mono text-sm outline-none focus:border-ring"
              />
            </label>
            <div className="flex items-center gap-3">
              <Button onClick={connect} disabled={!token.trim() || connecting} className="gap-2">
                {connecting && <LoaderIcon className="h-4 w-4 animate-spin" />}
                Connect
              </Button>
              <a
                href="https://github.com/settings/tokens/new?scopes=repo&description=nxstudio"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                Create a token <ExternalLinkIcon className="h-3.5 w-3.5" />
              </a>
            </div>
            {connectErr && <p className="text-sm text-red-400">{connectErr}</p>}
            <p className="text-xs text-muted-foreground">
              A classic token with <span className="font-mono">repo</span> scope is stored in an
              httpOnly cookie — never exposed to the browser.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
              <CheckCircleIcon className="h-4 w-4" />
              Connected as <span className="font-medium">{sync.github.login}</span>
              <button
                onClick={() => sync.disconnect()}
                className="ml-auto text-muted-foreground hover:text-foreground"
              >
                Disconnect
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
              <Field
                label="Repository"
                value={repo}
                onChange={setRepoInput}
                placeholder="owner/repo"
              />
              <div className="w-full sm:w-32">
                <Field label="Branch" value={branch} onChange={setBranch} placeholder="main" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={saveRepo}>Save repository</Button>
              <Button variant="outline" onClick={() => sync.sync()} disabled={sync.status === "syncing"}>
                {sync.status === "syncing" ? "Syncing…" : "Sync now"}
              </Button>
              <span className="text-sm text-muted-foreground">
                {sync.status === "ok" && sync.result
                  ? `${sync.result.context?.exists ? ".nx found" : ".nx not found"} · ${sync.result.commits?.length ?? 0} commits`
                  : sync.status === "no-repo"
                    ? "No repo linked"
                    : sync.status === "error"
                      ? sync.error
                      : ""}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Model Context Protocol (MCP) Tokens */}
      <McpTokensSection />

      {/* Subscription */}
      <BillingSection />

      {/* Admin Pipeline */}
      <AdminPromptsPanel />

      {/* Referrals */}
      <ReferralPanel />

      {/* Danger */}
      <section className="mt-6 rounded-xl border border-red-500/30 bg-red-500/5 p-6">
        <h2 className="font-semibold text-red-400">Danger Zone</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Reset this project&apos;s idea, tech, brand, and repo link. Cannot be undone.
        </p>
        <Button
          variant="outline"
          className="mt-4 border-red-500/40 text-red-400 hover:bg-red-500/10"
          onClick={() => {
            if (confirm("Reset this project to defaults?")) {
              resetActive();
              setRepoInput("");
            }
          }}
        >
          Reset project
        </Button>
      </section>
    </div>
  );
}
