"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useProjects } from "@/lib/workspace-store";
import { useProductLimit } from "@/lib/use-product-limit";
import { PremiumDialog } from "@/components/billing/PremiumDialog";
import { useSidebar } from "@/components/shell/sidebar-context";
import { motion } from "framer-motion";
import { MAIN_NAV_ITEMS } from "@/lib/navigation";
import {
  PlusIcon,
  PanelLeftIcon,
  LogOutIcon,
  NxLogo,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { createProject } = useProjects();
  const { atLimit } = useProductLimit();
  const { collapsed, toggle } = useSidebar();
  const [open, setOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [name, setName] = useState("");

  const handleNew = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createProject(trimmed);
    setName("");
    setOpen(false);
    router.push("/canvas");
  };

  return (
    <aside
      className={cn(
        "relative z-30 pointer-events-auto hidden md:flex shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ease-out",
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
          {MAIN_NAV_ITEMS.map((item) => {
            const active = item.match ? item.match(pathname) : pathname === item.href;
            const Icon = item.icon;
            return (
              <li key={item.href} className="relative">
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "relative flex items-center rounded-lg text-sm transition-colors z-10 pointer-events-auto",
                    collapsed ? "h-9 w-9 justify-center" : "gap-3 px-3 py-2",
                    active
                      ? "text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && item.label}
                </Link>
                {active && (
                  <motion.div
                    layoutId="sidebar-active-pill"
                    className="absolute inset-0 rounded-lg bg-sidebar-accent z-0 pointer-events-none"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* New Project */}
      <div className={cn("border-t border-sidebar-border", collapsed ? "p-2" : "p-3")}>
        {atLimit ? (
          collapsed ? (
            <Button
              variant="outline"
              size="icon"
              title="New Project — upgrade to build more"
              className="w-full border-sidebar-border"
              onClick={() => setPayOpen(true)}
            >
              <PlusIcon className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="outline"
              className="w-full gap-2 border-sidebar-border"
              onClick={() => setPayOpen(true)}
            >
              <PlusIcon className="h-4 w-4" />
              New Project
            </Button>
          )
        ) : (
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
              <label htmlFor="new-project-name" className="text-xs font-medium text-muted-foreground">Project name</label>
              <Input
                id="new-project-name"
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
        )}
        <PremiumDialog open={payOpen} onClose={() => setPayOpen(false)} onActivated={() => setPayOpen(false)} />
      </div>

      {/* Account + sign out */}
      <div className={cn("border-t border-sidebar-border", collapsed ? "p-2" : "p-3")}>
        <form action="/auth/signout" method="post">
          {collapsed ? (
            <button
              type="submit"
              title={`Sign out (${userEmail})`}
              aria-label="Sign out"
              className="flex h-9 w-full items-center justify-center rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            >
              <LogOutIcon className="h-4 w-4" />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold uppercase text-sidebar-accent-foreground">
                {userEmail.charAt(0) || "?"}
              </div>
              <span className="min-w-0 flex-1 truncate text-xs text-sidebar-foreground/70" title={userEmail}>
                {userEmail || "Signed in"}
              </span>
              <button
                type="submit"
                title="Sign out"
                aria-label="Sign out"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              >
                <LogOutIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </form>
      </div>
    </aside>
  );
}
