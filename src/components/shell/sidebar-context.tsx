"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

interface SidebarCtx {
  collapsed: boolean;
  toggle: () => void;
}

const Ctx = createContext<SidebarCtx | null>(null);

export function useSidebar() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSidebar must be used within SidebarProvider");
  return c;
}

const KEY = "nx-studio:sidebar-collapsed";

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // Start expanded on both server and first client render (avoids hydration
  // mismatch); load the persisted preference after mount.
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setCollapsed(localStorage.getItem(KEY) === "1");
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(KEY, next ? "1" : "0");
      } catch {}
      return next;
    });
  }, []);

  return <Ctx.Provider value={{ collapsed, toggle }}>{children}</Ctx.Provider>;
}
