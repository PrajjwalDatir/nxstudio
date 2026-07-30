"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyIcon, CheckIcon, LoaderIcon } from "@/components/icons";

interface Stats {
  code: string;
  pending: number;
  converted: number;
}

/**
 * Affiliate panel for Settings: shows the user's share link and how many people
 * they've referred / converted. The 20–30% payout terms live in the partnership
 * agreement; this surface is attribution, not accounting.
 */
export function ReferralPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  // Client-only component, so window is available at first render.
  const [origin] = useState(() => (typeof window !== "undefined" ? window.location.origin : ""));

  useEffect(() => {
    let alive = true;
    fetch("/api/referrals/me")
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Failed to load.");
        return r.json() as Promise<Stats>;
      })
      .then((s) => alive && setStats(s))
      .catch((e) => alive && setError(e instanceof Error ? e.message : "Failed to load."))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const link = stats ? `${origin}/?ref=${stats.code}` : "";

  const copy = useCallback(async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked — user can select the text manually.
    }
  }, [link]);

  return (
    <section className="mt-6 rounded-xl border border-border bg-card p-6">
      <h2 className="font-semibold">Refer &amp; earn</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Share your link. When someone you refer upgrades to Pro, you earn a share of their
        subscription.
      </p>

      {loading ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderIcon className="h-4 w-4 animate-spin" /> Loading your link…
        </div>
      ) : error ? (
        <p className="mt-4 text-sm text-red-400">{error}</p>
      ) : stats ? (
        <>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex-1 truncate rounded-lg border border-border bg-secondary/40 px-3 py-2.5 font-mono text-sm">
              {link}
            </div>
            <Button onClick={copy} className="gap-2 sm:w-32">
              {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
              {copied ? "Copied" : "Copy link"}
            </Button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-secondary/30 px-4 py-3">
              <div className="text-2xl font-bold tracking-tight">{stats.converted}</div>
              <div className="text-xs text-muted-foreground">Upgraded to Pro</div>
            </div>
            <div className="rounded-lg border border-border bg-secondary/30 px-4 py-3">
              <div className="text-2xl font-bold tracking-tight">{stats.pending}</div>
              <div className="text-xs text-muted-foreground">Signed up (not yet Pro)</div>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
