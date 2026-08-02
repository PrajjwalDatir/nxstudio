"use client";

import { usePathname } from "next/navigation";
import { useWorkspace } from "@/lib/workspace-store";
import { getPhase } from "@/lib/phases";
import { useCommand } from "@/components/shell/CommandPalette";
import { ProductNameCrumb } from "@/components/shell/ProductNameCrumb";
import { Notifications } from "@/components/shell/Notifications";
import { WorkspacesMenu } from "@/components/shell/WorkspacesMenu";
import { ChevronRightIcon, SearchIcon } from "@/components/icons";

export function Topbar() {
  const pathname = usePathname();
  const { customStages } = useWorkspace();
  const { open } = useCommand();

  // Breadcrumb: Workspaces › [editable product name] › [Phase]
  // "Workspaces" points at the board, not "/" — "/" is the marketing page now.
  const crumbs: { label: string; href?: string }[] = [
    { label: "Workspaces", href: "/canvas" },
  ];

  const phaseMatch = pathname.match(/^\/canvas\/([^/]+)/);
  const SECTION: Record<string, string> = {
    "/studio": "Studio",
    "/projects": "Projects",
    "/team": "Team",
    "/calendar": "Calendar",
    "/tasks": "Tasks",
    "/settings": "Settings",
  };
  if (phaseMatch) {
    const phase = getPhase(phaseMatch[1]);
    const custom = customStages.find((s) => s.id === phaseMatch[1]);
    if (phase) crumbs.push({ label: phase.label });
    else if (custom) crumbs.push({ label: custom.label });
  } else if (SECTION[pathname]) {
    crumbs.push({ label: SECTION[pathname] });
  }

  return (
    <header className="relative z-30 pointer-events-auto flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-sidebar px-5">
      {/* Breadcrumbs. The project name sits between "Workspaces" and the
          optional phase crumb, and renames in place rather than navigating. */}
      <nav className="flex items-center gap-2 text-sm min-w-0">
        <WorkspacesMenu />

        <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <ProductNameCrumb isLast={crumbs.length === 1} />

        {crumbs.slice(1).map((c) => (
          <span key={c.label} className="flex min-w-0 items-center gap-2">
            <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate font-medium text-foreground">
              {c.label}
            </span>
          </span>
        ))}
      </nav>

      {/* Right controls */}
      <div className="flex shrink-0 items-center gap-3">
        <button
          onClick={open}
          aria-label="Search tasks, phases (⌘K)"
          className="relative hidden h-9 w-56 items-center rounded-lg border border-border bg-secondary/40 pl-9 pr-3 text-left text-sm text-muted-foreground hover:border-ring sm:flex gap-2"
        >
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <span className="flex-1 truncate">Search tasks, phases...</span>
          <kbd className="ml-auto shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px]">
            ⌘K
          </kbd>
        </button>
        <Notifications />
      </div>
    </header>
  );
}
