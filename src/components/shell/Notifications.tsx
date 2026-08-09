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
          className="relative flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
        >
          <BellIcon className="h-[18px] w-[18px]" />
          {badge > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-semibold leading-none text-white shadow-[0_0_0_2px_var(--sidebar)]">
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
            <Link href="/settings" className="text-accent-foreground hover:underline">
              Settings
            </Link>{" "}
            to see activity.
          </EmptyState>
        ) : status === "no-repo" ? (
          <EmptyState>
            Link a repository in{" "}
            <Link href="/settings" className="text-accent-foreground hover:underline">
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
                    className="group flex items-start gap-2.5 px-4 py-2.5 transition-colors hover:bg-primary/5 border-l-2 border-transparent hover:border-primary"
                  >
                    <CircleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="truncate text-[13px] font-medium text-foreground group-hover:text-accent-foreground transition-colors">{i.title}</span>
                      <span className="text-[11px] text-muted-foreground">#{i.number} — Action required</span>
                    </div>
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

        {result?.repo && (
          <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-2.5">
            <a 
              href={`https://github.com/${result.repo}`} 
              target="_blank" 
              rel="noreferrer"
              className="text-xs font-medium text-accent-foreground hover:underline flex items-center gap-1.5"
            >
              View Repository <ExternalLinkIcon className="h-3 w-3" />
            </a>
            {badge > 0 && (
              <a 
                href={`https://github.com/${result.repo}/issues`} 
                target="_blank" 
                rel="noreferrer"
                className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Action Items ({badge})
              </a>
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
