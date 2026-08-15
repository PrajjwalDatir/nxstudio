"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useProjects, type Project } from "@/lib/workspace-store";
import { useProductLimit } from "@/lib/use-product-limit";
import { useSubscription } from "@/lib/use-subscription";
import { PHASES, getPhaseProgress } from "@/lib/phases";
import { WorkspaceData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PremiumDialog } from "@/components/billing/PremiumDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PlusIcon,
  FolderIcon,
  GithubIcon,
  TrashIcon,
  CheckIcon,
  MoreIcon,
} from "@/components/icons";

function overall(data: WorkspaceData): number {
  const totals = PHASES.reduce(
    (acc, p) => {
      const pr = getPhaseProgress(p, data);
      acc.done += pr.done;
      acc.total += pr.total;
      return acc;
    },
    { done: 0, total: 0 }
  );
  return totals.total === 0 ? 0 : Math.round((totals.done / totals.total) * 100);
}

export default function ProjectsPage() {
  const router = useRouter();
  const {
    projects,
    activeId,
    createProject,
    switchProject,
    deleteProject,
    collections,
    createCollection,
    renameCollection,
    deleteCollection,
    assignToCollection,
  } = useProjects();

  const { atLimit, limit } = useProductLimit();
  const { canUseCollections } = useSubscription();

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [payOpen, setPayOpen] = useState(false);
  const [payTitle, setPayTitle] = useState("Scale Your Studio");
  const [payDesc, setPayDesc] = useState("Upgrade your tier to build more projects or organize workspaces.");
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [collectionName, setCollectionName] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const startCreate = () => {
    if (atLimit) {
      setPayTitle("Workspace Limit Reached");
      setPayDesc(`Free is capped at ${limit} active project workspace. Upgrade to Pro (10 USDT) for unlimited workspaces and no gates.`);
      setPayOpen(true);
      return;
    }
    setCreating(true);
  };

  const startCreateCollection = () => {
    if (!canUseCollections) {
      setPayTitle("Unlock Project Collections");
      setPayDesc("Project Collections allow you to organize, categorize, and group side projects, client work, and experiments. Upgrade to Pro (10 USDT).");
      setPayOpen(true);
      return;
    }
    setCreatingCollection(true);
  };

  const create = () => {
    if (atLimit) {
      setPayOpen(true);
      return;
    }
    const n = name.trim();
    if (!n) return;
    createProject(n);
    setName("");
    setCreating(false);
    router.push("/canvas");
  };

  const addCollection = () => {
    const n = collectionName.trim();
    if (!n) return;
    createCollection(n);
    setCollectionName("");
    setCreatingCollection(false);
  };

  const open = (id: string) => {
    switchProject(id);
    router.push("/canvas");
  };

  const openStudio = (id: string) => {
    switchProject(id);
    router.push("/studio");
  };

  // Group projects by collection; anything without a (known) collection is "Ungrouped".
  const sortedCollections = useMemo(
    () => [...collections].sort((a, b) => a.sort - b.sort),
    [collections]
  );
  const known = useMemo(() => new Set(collections.map((c) => c.id)), [collections]);

  const { itemsByCollection, ungrouped } = useMemo(() => {
    const byCollection = new Map<string, typeof projects>();
    const ungroupedList: typeof projects = [];

    for (const p of projects) {
      if (p.collectionId && known.has(p.collectionId)) {
        let list = byCollection.get(p.collectionId);
        if (!list) {
          list = [];
          byCollection.set(p.collectionId, list);
        }
        list.push(p);
      } else {
        ungroupedList.push(p);
      }
    }
    return { itemsByCollection: byCollection, ungrouped: ungroupedList };
  }, [projects, known]);

  const ProjectCard = ({ p }: { p: Project }) => {
    const pct = overall(p.data);
    const isActive = p.id === activeId;
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-start justify-between">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-accent-foreground">
            <FolderIcon className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-1.5">
            {isActive && (
              <span className="flex items-center gap-1 rounded-md bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
                <CheckIcon className="h-3 w-3" /> ACTIVE
              </span>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-secondary hover:text-foreground"
                aria-label="Move to collection"
              >
                <MoreIcon className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Move to collection</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => assignToCollection(p.id, null)}>
                  <CheckIcon
                    className={`h-4 w-4 ${!p.collectionId || !known.has(p.collectionId) ? "opacity-100" : "opacity-0"}`}
                  />
                  Ungrouped
                </DropdownMenuItem>
                {sortedCollections.map((c) => (
                  <DropdownMenuItem key={c.id} onClick={() => assignToCollection(p.id, c.id)}>
                    <CheckIcon
                      className={`h-4 w-4 ${p.collectionId === c.id ? "opacity-100" : "opacity-0"}`}
                    />
                    <span className="truncate">{c.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <h3 className="mt-4 font-semibold">{p.data.productName}</h3>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          {p.github.repo ? (
            <>
              <GithubIcon className="h-3.5 w-3.5" />
              {p.github.repo}
            </>
          ) : (
            <span>No repo linked</span>
          )}
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Overall progress</span>
            <span className="font-medium">{pct}%</span>
          </div>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <Button size="sm" onClick={() => open(p.id)}>
            Open Canvas
          </Button>
          <Button size="sm" variant="outline" onClick={() => openStudio(p.id)}>
            Studio
          </Button>
          <button
            onClick={() => {
              if (confirm(`Delete "${p.data.productName}"? This cannot be undone.`)) {
                deleteProject(p.id);
              }
            }}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-red-400"
            aria-label="Delete project"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="mt-1 text-muted-foreground">
            Every product you&apos;re building — grouped into collections.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={startCreateCollection} className="gap-2">
            <FolderIcon className="h-4 w-4" />
            New Collection
          </Button>
          <Button onClick={startCreate} className="gap-2">
            <PlusIcon className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      {atLimit && (
        <button
          onClick={() => {
            setPayTitle("Workspace Limit Reached");
            setPayDesc("Free is limited to 1 active workspace. Upgrade to Pro (10 USDT) for unlimited workspaces and no gates.");
            setPayOpen(true);
          }}
          className="mt-4 flex w-full items-center justify-between rounded-xl border border-primary/30 bg-accent/20 px-4 py-3 text-left text-sm"
        >
          <span className="text-muted-foreground">
            Free accounts are limited to {limit} product.{" "}
            <span className="font-medium text-foreground">Upgrade to build multi-product workspaces.</span>
          </span>
          <span className="shrink-0 font-semibold text-accent-foreground">Upgrade →</span>
        </button>
      )}

      <PremiumDialog
        open={payOpen}
        title={payTitle}
        description={payDesc}
        onClose={() => setPayOpen(false)}
        onActivated={() => setPayOpen(false)}
      />

      {creating && (
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-border bg-card p-4">
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
            placeholder="Project name…"
            className="h-10 flex-1"
          />
          <Button onClick={create}>Create</Button>
          <Button variant="ghost" onClick={() => setCreating(false)}>
            Cancel
          </Button>
        </div>
      )}

      {creatingCollection && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-card p-4">
          <Input
            autoFocus
            value={collectionName}
            onChange={(e) => setCollectionName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCollection()}
            placeholder="Collection name… (e.g. Client work, Side projects)"
            className="h-10 flex-1"
          />
          <Button onClick={addCollection}>Create</Button>
          <Button variant="ghost" onClick={() => setCreatingCollection(false)}>
            Cancel
          </Button>
        </div>
      )}

      {/* Collection groups */}
      {sortedCollections.map((c) => {
        const items = itemsByCollection.get(c.id) || [];
        return (
          <section key={c.id} className="mt-10">
            <div className="flex items-center gap-2">
              {renaming === c.id ? (
                <Input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      renameCollection(c.id, renameValue.trim() || c.name);
                      setRenaming(null);
                    }
                    if (e.key === "Escape") setRenaming(null);
                  }}
                  onBlur={() => {
                    renameCollection(c.id, renameValue.trim() || c.name);
                    setRenaming(null);
                  }}
                  className="h-8 w-56"
                />
              ) : (
                <button
                  onClick={() => {
                    setRenaming(c.id);
                    setRenameValue(c.name);
                  }}
                  className="text-lg font-semibold tracking-tight hover:text-accent-foreground"
                  title="Rename collection"
                >
                  {c.name}
                </button>
              )}
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                {items.length}
              </span>
              <button
                onClick={() => {
                  if (
                    confirm(
                      `Delete the "${c.name}" collection? Its ${items.length} product(s) will move to Ungrouped.`
                    )
                  ) {
                    deleteCollection(c.id);
                  }
                }}
                className="ml-1 flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-red-400"
                aria-label="Delete collection"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>

            {items.length > 0 ? (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((p) => (
                  <ProjectCard key={p.id} p={p} />
                ))}
              </div>
            ) : (
              <p className="mt-3 rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                No products yet — use the ⋯ menu on any product to move it here.
              </p>
            )}
          </section>
        );
      })}

      {/* Ungrouped */}
      <section className="mt-10">
        {sortedCollections.length > 0 && (
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight text-muted-foreground">Ungrouped</h2>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
              {ungrouped.length}
            </span>
          </div>
        )}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ungrouped.map((p) => (
            <ProjectCard key={p.id} p={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
