"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useProjects } from "@/lib/workspace-store";
import { PHASES } from "@/lib/phases";
import { SearchIcon, FolderIcon, LayersIcon } from "@/components/icons";
import { PhaseIcon } from "@/components/phase-icon";

interface CommandContextType {
  open: () => void;
}
const Ctx = createContext<CommandContextType | null>(null);
export function useCommand() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCommand must be used within CommandProvider");
  return c;
}

interface Item {
  id: string;
  group: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  run: () => void;
}

export function CommandProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { projects, switchProject } = useProjects();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const open = useCallback(() => {
    setQuery("");
    setActive(0);
    setIsOpen(true);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);

  // Global Cmd/Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((v) => !v);
        setQuery("");
        setActive(0);
      }
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const items = useMemo<Item[]>(() => {
    const go = (href: string) => () => {
      router.push(href);
      setIsOpen(false);
    };
    const pages: Item[] = [
      { id: "p-canvas", group: "Pages", label: "Canvas", icon: <LayersIcon className="h-4 w-4" />, run: go("/canvas") },
      { id: "p-projects", group: "Pages", label: "Projects", icon: <FolderIcon className="h-4 w-4" />, run: go("/projects") },
      { id: "p-team", group: "Pages", label: "Team", icon: <FolderIcon className="h-4 w-4" />, run: go("/team") },
      { id: "p-calendar", group: "Pages", label: "Calendar", icon: <FolderIcon className="h-4 w-4" />, run: go("/calendar") },
      { id: "p-tasks", group: "Pages", label: "Tasks", icon: <FolderIcon className="h-4 w-4" />, run: go("/tasks") },
      { id: "p-settings", group: "Pages", label: "Settings", icon: <FolderIcon className="h-4 w-4" />, run: go("/settings") },
    ];
    const phases: Item[] = PHASES.map((ph) => ({
      id: `ph-${ph.id}`,
      group: "Phases",
      label: ph.label,
      hint: ph.description,
      icon: <PhaseIcon name={ph.icon} className="h-4 w-4" />,
      run: go(`/canvas/${ph.id}`),
    }));
    const projectItems: Item[] = projects.map((pr) => ({
      id: `pr-${pr.id}`,
      group: "Projects",
      label: pr.data.productName,
      hint: "Switch project",
      icon: <FolderIcon className="h-4 w-4" />,
      run: () => {
        switchProject(pr.id);
        router.push("/canvas");
        setIsOpen(false);
      },
    }));
    return [...pages, ...phases, ...projectItems];
  }, [projects, router, switchProject]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (it) => it.label.toLowerCase().includes(q) || it.hint?.toLowerCase().includes(q)
    );
  }, [items, query]);

  // Group in stable order
  const groups = useMemo(() => {
    const order = ["Phases", "Pages", "Projects"];
    const map = new Map<string, Item[]>();
    for (const it of filtered) {
      map.set(it.group, [...(map.get(it.group) ?? []), it]);
    }
    return order.filter((g) => map.has(g)).map((g) => ({ group: g, items: map.get(g)! }));
  }, [filtered]);

  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      flat[active]?.run();
    }
  };

  return (
    <Ctx.Provider value={{ open }}>
      {children}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 pt-[12vh]"
          onClick={close}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-popover shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={onKeyDown}
          >
            <div className="flex items-center gap-3 border-b border-border px-4">
              <SearchIcon className="h-4 w-4 text-muted-foreground" />
              <input
                autoFocus
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                placeholder="Search phases, pages, projects…"
                className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                ESC
              </kbd>
            </div>

            <div className="max-h-[50vh] overflow-y-auto p-2">
              {flat.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-muted-foreground">No results.</div>
              ) : (
                groups.map((g) => (
                  <div key={g.group} className="mb-2">
                    <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {g.group}
                    </div>
                    {g.items.map((it) => {
                      const idx = flat.indexOf(it);
                      return (
                        <button
                          key={it.id}
                          onMouseEnter={() => setActive(idx)}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            it.run();
                          }}
                          className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm ${
                            idx === active ? "bg-accent text-accent-foreground" : "hover:bg-secondary"
                          }`}
                        >
                          <span className="text-muted-foreground">{it.icon}</span>
                          <span className="flex-1 truncate">{it.label}</span>
                          {it.hint && (
                            <span className="truncate text-xs text-muted-foreground">{it.hint}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
