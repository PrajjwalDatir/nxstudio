"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useProjects } from "@/lib/workspace-store";
import { useProductLimit } from "@/lib/use-product-limit";
import { useSubscription } from "@/lib/use-subscription";
import { PremiumDialog } from "@/components/billing/PremiumDialog";
import { RazorpayCheckout } from "@/components/billing/RazorpayCheckout";
import { useSidebar } from "@/components/shell/sidebar-context";
import { motion } from "framer-motion";
import { MAIN_NAV_ITEMS } from "@/lib/navigation";
import {
  PlusIcon,
  PanelLeftIcon,
  LogOutIcon,
  NxLogo,
  UserIcon,
  SaveIcon,
  ZapIcon,
  SunIcon,
  MoonIcon,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function Sidebar({ userEmail, isAnonymous = false }: { userEmail: string; isAnonymous?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { createProject } = useProjects();
  const { atLimit } = useProductLimit();
  const { state, refresh } = useSubscription();
  const { collapsed, toggle } = useSidebar();
  const [open, setOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [name, setName] = useState("");
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("light") ? "light" : "dark";
    }
    return "dark";
  });

  const handleThemeToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const next = theme === "dark" ? "light" : "dark";
    const root = document.documentElement;

    const applyThemeClass = () => {
      setTheme(next);
      localStorage.setItem("theme", next);
      if (next === "light") {
        root.classList.add("light");
      } else {
        root.classList.remove("light");
      }
    };

    const origin = { x: e.clientX, y: e.clientY };
    import("@/components/landing/theme-transition").then(({ runRadialThemeTransition }) => {
      runRadialThemeTransition(origin, applyThemeClass);
    });
  };

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
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={handleThemeToggle}
                title="Toggle Theme"
                aria-label="Toggle Theme"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
              >
                {theme === "dark" ? (
                  <SunIcon className="h-4 w-4 text-amber-300" />
                ) : (
                  <MoonIcon className="h-4 w-4 text-indigo-500" />
                )}
              </button>
              <button
                onClick={toggle}
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
              >
                <PanelLeftIcon className="h-4 w-4" />
              </button>
            </div>
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
        <PremiumDialog open={payOpen} onClose={() => setPayOpen(false)} onActivated={() => { setPayOpen(false); refresh(); }} />
        {state !== "active" && (
          <div className="mt-4">
            {isAnonymous ? (
              <Button
                variant="default"
                className={cn(
                  "w-full font-bold text-[11px] uppercase tracking-wider bg-[#8B5CF6] hover:bg-[#7C3AED] text-white transition-all shadow-[0_0_15px_-3px_rgba(139,92,246,0.3)]",
                  collapsed ? "justify-center px-0 h-10" : "gap-2 h-10"
                )}
                onClick={() => router.push("/login")}
              >
                <ZapIcon className={collapsed ? "h-4 w-4 fill-current" : "h-3.5 w-3.5 fill-current"} />
                {!collapsed && "Upgrade to Pro"}
              </Button>
            ) : (
              <RazorpayCheckout 
                buttonText={collapsed ? undefined : "Upgrade to Pro"}
                icon={<ZapIcon className={collapsed ? "h-4 w-4 fill-current" : "h-3.5 w-3.5 fill-current"} />}
                variant="default"
                className={cn(
                  "w-full font-bold text-[11px] uppercase tracking-wider bg-[#8B5CF6] hover:bg-[#7C3AED] text-white transition-all shadow-[0_0_15px_-3px_rgba(139,92,246,0.3)]",
                  collapsed ? "justify-center px-0 h-10" : "gap-2 h-10"
                )}
                onActivated={refresh}
              />
            )}
          </div>
        )}
      </div>

      {/* Account + sign out */}
      <div className={cn("border-t border-sidebar-border", collapsed ? "p-2" : "p-3")}>
        {isAnonymous ? (
          <Link href="/login" className="block w-full">
            {collapsed ? (
              <div
                title="Guest User (Sign up to save)"
                aria-label="Sign up to save"
                className="flex h-9 w-full items-center justify-center rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground cursor-pointer"
              >
                <SaveIcon className="h-4 w-4" />
              </div>
            ) : (
              <div className="flex items-center gap-2 p-1 -m-1 rounded-lg hover:bg-sidebar-accent/30 transition-colors cursor-pointer group">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold uppercase text-sidebar-accent-foreground">
                  <UserIcon className="h-4 w-4" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="truncate text-xs font-medium text-sidebar-foreground">Guest User</span>
                  <span className="truncate text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">Sign up to save</span>
                </div>
                <div
                  title="Save progress"
                  aria-label="Save progress"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/60 transition-colors group-hover:bg-sidebar-accent/50 group-hover:text-sidebar-foreground"
                >
                  <SaveIcon className="h-4 w-4" />
                </div>
              </div>
            )}
          </Link>
        ) : (
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
        )}
      </div>
    </aside>
  );
}
