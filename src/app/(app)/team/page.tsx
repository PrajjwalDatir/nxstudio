"use client";

import Link from "next/link";
import { useSync } from "@/lib/sync-store";
import { GithubIcon } from "@/components/icons";

export default function TeamPage() {
  const { github, result, status } = useSync();
  const contributors = result?.contributors ?? [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="text-3xl font-bold tracking-tight">Team</h1>
      <p className="mt-1 text-muted-foreground">
        The people shipping this product, from real repository history.
      </p>

      {/* Owner */}
      {github.connected && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Connected Account
          </h2>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
            {github.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={github.avatar} alt={github.login} className="h-10 w-10 rounded-full" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                <GithubIcon className="h-5 w-5" />
              </div>
            )}
            <div>
              <div className="font-medium">{github.name || github.login}</div>
              <div className="text-sm text-muted-foreground">@{github.login} · owner</div>
            </div>
          </div>
        </section>
      )}

      {/* Contributors */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Contributors {contributors.length > 0 && `(${contributors.length})`}
        </h2>
        {contributors.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {contributors.map((c) => (
              <div key={c.login} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                {c.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.avatar} alt={c.login} className="h-10 w-10 rounded-full" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-medium uppercase">
                    {c.login.slice(0, 2)}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="truncate font-medium">{c.login}</div>
                  <div className="text-sm text-muted-foreground">
                    {c.commits} recent commit{c.commits === 1 ? "" : "s"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            {status === "disconnected" ? (
              <>
                Connect GitHub in{" "}
                <Link href="/settings" className="text-primary hover:underline">
                  Settings
                </Link>{" "}
                to see your team.
              </>
            ) : status === "no-repo" ? (
              <>
                Link a repository in{" "}
                <Link href="/settings" className="text-primary hover:underline">
                  Settings
                </Link>{" "}
                to load contributors.
              </>
            ) : (
              "No commits yet — contributors will appear as work lands."
            )}
          </div>
        )}
      </section>
    </div>
  );
}
