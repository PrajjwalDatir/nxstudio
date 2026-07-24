"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useProjects } from "@/lib/workspace-store";
import {
  ScaffoldIcon,
  FolderIcon,
  UsersIcon,
  CalendarIcon,
  ListChecksIcon,
  SettingsIcon,
  PlusIcon,
  NxLogo,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Canvas", icon: ScaffoldIcon, match: (p: string) => p === "/" || p.startsWith("/phase") },
  { href: "/projects", label: "Projects", icon: FolderIcon },
  { href: "/team", label: "Team", icon: UsersIcon },
  { href: "/calendar", label: "Calendar", icon: CalendarIcon },
  { href: "/tasks", label: "Tasks", icon: ListChecksIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { createProject } = useProjects();

  const handleNew = () => {
    const name = prompt("New project name:");
    if (name && name.trim()) {
      createProject(name.trim());
      router.push("/");
    }
  };

  return (
    <aside className="hidden md:flex w-[212px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2 px-5 border-b border-sidebar-border">
        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-sidebar-border">
          <NxLogo className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="font-semibold tracking-tight">nxstudio</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5">
        <p className="px-2 pb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Main Menu
        </p>
        <ul className="space-y-1">
          {NAV.map((item) => {
            const active = item.match ? item.match(pathname) : pathname === item.href;
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* New Project */}
      <div className="p-3 border-t border-sidebar-border">
        <Button onClick={handleNew} variant="outline" className="w-full gap-2 border-sidebar-border">
          <PlusIcon className="h-4 w-4" />
          New Project
        </Button>
      </div>
    </aside>
  );
}
