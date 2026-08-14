"use client";

import { usePathname } from "next/navigation";
import { useWorkspace, useSync } from "@/lib/workspace-store";
import { resolveAppSection } from "@/lib/app-context";
import { useCommand } from "@/components/shell/CommandPalette";
import { useSidebar } from "@/components/shell/sidebar-context";
import { ProductNameCrumb } from "@/components/shell/ProductNameCrumb";
import { Notifications } from "@/components/shell/Notifications";
import { WorkspacesMenu } from "@/components/shell/WorkspacesMenu";
import { SearchIcon, GithubIcon, MenuIcon } from "@/components/icons";
import { ThemeToggle } from "@/components/landing/LandingNav";
import Link from "next/link";

export function Topbar() {
  const pathname = usePathname();
  const { customStages } = useWorkspace();
  const { status: syncStatus } = useSync();
  const { open } = useCommand();
  const { openMobile } = useSidebar();

  // Breadcrumb: Workspaces › [editable product name] › [Phase]
  // "Workspaces" points at the board, not "/" — "/" is the marketing page now.
  const crumbs: { label: string; href?: string }[] = [
    { label: "Workspaces", href: "/canvas" },
  ];

  // Bare "/canvas" gets no extra crumb — "Workspaces" already implies it.
  const section = resolveAppSection(pathname, customStages);
  if (section.phaseId || section.key !== "/canvas") {
    crumbs.push({ label: section.label });
  }

  return (
    <header className="relative z-30 pointer-events-auto flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-sidebar px-4 sm:px-5">
      {/* Breadcrumbs. The project name sits between "Workspaces" and the
          optional phase crumb, and renames in place rather than navigating. */}
      <nav className="flex min-w-0 items-center gap-2.5 text-sm">
        <button
          onClick={openMobile}
          aria-label="Open menu"
          className="-ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground md:hidden"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        <WorkspacesMenu />

        <span className="text-muted-foreground/40 font-light select-none">/</span>
        <ProductNameCrumb isLast={crumbs.length === 1} />

        {crumbs.slice(1).map((c) => (
          // shrink-0: the current-page crumb is the most useful piece of context
          // on a narrow screen — it should be the last thing to give up space,
          // not the first. The product name crumb (default shrink) absorbs the
          // squeeze instead; max-w/truncate here is just a safety net for an
          // unusually long custom-stage label.
          <span key={c.label} className="flex min-w-0 shrink-0 items-center gap-2.5">
            <span className="text-muted-foreground/40 font-light select-none">/</span>
            <span className="max-w-[140px] truncate font-medium text-foreground sm:max-w-none">
              {c.label}
            </span>
          </span>
        ))}
      </nav>

      {/* Right controls */}
      <div className="flex shrink-0 items-center gap-3 pr-1">
        <ThemeToggle />

        <button
          onClick={open}
          aria-label="Search (⌘K)"
          className="group flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
        >
          <SearchIcon className="h-[18px] w-[18px]" />
        </button>

        <Link
          href="/settings"
          aria-label={syncStatus === "ok" ? "GitHub Connected" : "GitHub Not Connected"}
          className={`group relative flex items-center justify-center transition-colors ${
            syncStatus === "ok" 
              ? "text-foreground" 
              : "text-muted-foreground opacity-60 hover:opacity-100 hover:text-foreground"
          }`}
        >
          <GithubIcon className="h-[18px] w-[18px]" />
        </Link>

        <Notifications />
      </div>
    </header>
  );
}
