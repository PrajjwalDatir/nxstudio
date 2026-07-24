"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useProjects } from "@/lib/workspace-store";
import { useSidebar } from "@/components/shell/sidebar-context";
import {
  ScaffoldIcon,
  FolderIcon,
  UsersIcon,
  CalendarIcon,
  ListChecksIcon,
  SettingsIcon,
  PlusIcon,
  PanelLeftIcon,
  NxLogo,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  const { collapsed, toggle } = useSidebar();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const handleNew = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createProject(trimmed);
    setName("");
    setOpen(false);
    router.push("/");
  };

  return (
    <aside
      className={cn(
        "hidden md:flex shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ease-out",
        collapsed ? "w-16" : "w-[212px]"
      )}
    >
      {/* Brand + collapse toggle */}
      <div className={cn("flex h-14 items-center border-b border-sidebar-border", collapsed ? "justify-center px-0" : "gap-2 px-4")}>
        {collapsed ? (
          <button
            onClick={toggle}
            title="Expand sidebar"
            aria-label="Expand sidebar"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <PanelLeftIcon className="h-4 w-4" />
          </button>
        ) : (
          <>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-sidebar-border">
              <NxLogo className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="font-semibold tracking-tight">nxstudio</span>
            <button
              onClick={toggle}
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
              className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <PanelLeftIcon className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className={cn("flex-1 py-5", collapsed ? "px-2" : "px-3")}>
        {!collapsed && (
          <p className="px-2 pb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Main Menu
          </p>
        )}
        <ul className="space-y-1">
          {NAV.map((item) => {
            const active = item.match ? item.match(pathname) : pathname === item.href;
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center rounded-lg text-sm transition-colors",
                    collapsed ? "h-9 w-9 justify-center" : "gap-3 px-3 py-2",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* New Project */}
      <div className={cn("border-t border-sidebar-border", collapsed ? "p-2" : "p-3")}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            {collapsed ? (
              <Button
                variant="outline"
                size="icon"
                title="New Project"
                className="w-full border-sidebar-border"
              >
                <PlusIcon className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="outline" className="w-full gap-2 border-sidebar-border">
                <PlusIcon className="h-4 w-4" />
                New Project
              </Button>
            )}
          </PopoverTrigger>
          <PopoverContent side="top" align="start" className="w-56 p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleNew();
              }}
            >
              <label className="text-xs font-medium text-muted-foreground">Project name</label>
              <Input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Acme Reader"
                className="mt-1.5 h-9"
              />
              <div className="mt-3 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setName("");
                    setOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={!name.trim()}>
                  Create
                </Button>
              </div>
            </form>
          </PopoverContent>
        </Popover>
      </div>
    </aside>
  );
}
