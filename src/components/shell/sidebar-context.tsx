"use client";

import { createContext, useCallback, useContext, useState, useSyncExternalStore } from "react";

interface SidebarCtx {
  collapsed: boolean;
  toggle: () => void;
  /** Mobile off-canvas drawer — separate from `collapsed`, which is a desktop-only rail width. */
  mobileOpen: boolean;
  openMobile: () => void;
  closeMobile: () => void;
  toggleMobile: () => void;
}

const Ctx = createContext<SidebarCtx | null>(null);

export function useSidebar() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSidebar must be used within SidebarProvider");
  return c;
}

const KEY = "nx-studio:sidebar-collapsed";

// Read the persisted preference through useSyncExternalStore: React uses the
// server snapshot (expanded) for SSR + hydration, then swaps to the real
// localStorage value on the client — no set-state-in-effect, no mismatch.
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function getSnapshot() {
  return localStorage.getItem(KEY) === "1";
}

function getServerSnapshot() {
  return false;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const collapsed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // Device-local, not persisted — always starts closed, including after reload.
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggle = useCallback(() => {
    try {
      localStorage.setItem(KEY, collapsed ? "0" : "1");
    } catch {}
    listeners.forEach((l) => l());
  }, [collapsed]);

  const openMobile = useCallback(() => setMobileOpen(true), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const toggleMobile = useCallback(() => setMobileOpen((v) => !v), []);

  return (
    <Ctx.Provider value={{ collapsed, toggle, mobileOpen, openMobile, closeMobile, toggleMobile }}>
      {children}
    </Ctx.Provider>
  );
}
