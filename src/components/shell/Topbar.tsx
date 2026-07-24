"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWorkspace } from "@/lib/workspace-store";
import { getPhase } from "@/lib/phases";
import { useCommand } from "@/components/shell/CommandPalette";
import { ChevronRightIcon, SearchIcon, BellIcon } from "@/components/icons";

export function Topbar() {
  const pathname = usePathname();
  const { data, customStages } = useWorkspace();
  const { open } = useCommand();

  // Breadcrumb: Workspaces › Product 1 › [Phase]
  const crumbs: { label: string; href?: string }[] = [
    { label: "Workspaces" },
    { label: data.productName, href: "/" },
  ];

  const phaseMatch = pathname.match(/^\/phase\/([^/]+)/);
  const SECTION: Record<string, string> = {
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
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-sidebar px-5">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm min-w-0">
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-2 min-w-0">
            {i > 0 && <ChevronRightIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
            {c.href && i < crumbs.length - 1 ? (
              <Link
                href={c.href}
                className="text-muted-foreground hover:text-foreground transition-colors truncate"
              >
                {c.label}
              </Link>
            ) : (
              <span
                className={
                  i === crumbs.length - 1
                    ? "font-medium text-foreground truncate"
                    : "text-muted-foreground truncate"
                }
              >
                {c.label}
              </span>
            )}
          </span>
        ))}
      </nav>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={open}
          className="relative hidden h-9 w-56 items-center rounded-lg border border-border bg-secondary/40 pl-9 pr-3 text-left text-sm text-muted-foreground hover:border-ring sm:flex"
        >
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          Search tasks, phases...
          <kbd className="ml-auto rounded border border-border px-1.5 py-0.5 text-[10px]">⌘K</kbd>
        </button>
        <button className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
          <BellIcon className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
