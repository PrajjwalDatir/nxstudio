"use client";

import Link from "next/link";
import { useSync } from "@/lib/workspace-store";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BellIcon, GithubIcon, CircleIcon, ExternalLinkIcon } from "@/components/icons";

function relTime(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

/**
 * Notification bell backed by the GitHub sync feed: recent commits and open
 * issues for the active project's linked repo. The badge counts open issues
 * (the actionable items); the panel lists both.
 */
export function Notifications() {
  const { status, result } = useSync();
  const commits = result?.commits ?? [];
  const issues = result?.issues ?? [];
  const badge = issues.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label={`Notifications${badge ? ` (${badge} open issues)` : ""}`}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <BellIcon className="h-4 w-4" />
          {badge > 0 && (
            <span className="absolute right-1.5 top-1.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-semibold leading-none text-primary-foreground">
              {badge > 9 ? "9+" : badge}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-semibold">Notifications</span>
          {result?.repo && (
            <span className="truncate font-mono text-[11px] text-muted-foreground">
              {result.repo}
            </span>
          )}
        </div>

        {status === "disconnected" ? (
          <EmptyState>
            Connect GitHub in{" "}
            <Link href="/settings" className="text-primary hover:underline">
              Settings
            </Link>{" "}
            to see activity.
          </EmptyState>
        ) : status === "no-repo" ? (
          <EmptyState>
            Link a repository in{" "}
            <Link href="/settings" className="text-primary hover:underline">
              Settings
            </Link>{" "}
            to see activity.
          </EmptyState>
        ) : commits.length === 0 && issues.length === 0 ? (
          <EmptyState>You&apos;re all caught up.</EmptyState>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto py-1">
            {issues.length > 0 && (
              <Section label="Open issues">
                {issues.slice(0, 5).map((i) => (
                  <a
                    key={i.number}
                    href={i.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-start gap-2.5 px-4 py-2 hover:bg-secondary/60"
                  >
                    <CircleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    <span className="min-w-0 flex-1 truncate text-sm">{i.title}</span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">#{i.number}</span>
                    <ExternalLinkIcon className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                  </a>
                ))}
              </Section>
            )}
            {commits.length > 0 && (
              <Section label="Recent commits">
                {commits.slice(0, 6).map((c) => (
                  <div key={c.sha} className="flex items-start gap-2.5 px-4 py-2">
                    <GithubIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate text-sm">{c.message}</span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{relTime(c.date)}</span>
                  </div>
                ))}
              </Section>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-1">
      <div className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="px-4 py-8 text-center text-sm text-muted-foreground">{children}</div>;
}
