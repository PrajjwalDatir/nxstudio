"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProjects } from "@/lib/workspace-store";
import { PHASES, getPhaseProgress } from "@/lib/phases";
import { WorkspaceData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PlusIcon, FolderIcon, GithubIcon, TrashIcon, CheckIcon } from "@/components/icons";

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
  const { projects, activeId, createProject, switchProject, deleteProject } = useProjects();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  const create = () => {
    const n = name.trim();
    if (!n) return;
    createProject(n);
    setName("");
    setCreating(false);
    router.push("/");
  };

  const open = (id: string) => {
    switchProject(id);
    router.push("/");
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="mt-1 text-muted-foreground">Every product you&apos;re building in nxstudio.</p>
        </div>
        <Button onClick={() => setCreating(true)} className="gap-2">
          <PlusIcon className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {creating && (
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-border bg-card p-4">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
            placeholder="Project name…"
            className="h-10 flex-1 rounded-lg border border-border bg-secondary/40 px-3 text-sm outline-none focus:border-ring"
          />
          <Button onClick={create}>Create</Button>
          <Button variant="ghost" onClick={() => setCreating(false)}>
            Cancel
          </Button>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => {
          const pct = overall(p.data);
          const isActive = p.id === activeId;
          return (
            <div key={p.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary">
                  <FolderIcon className="h-4 w-4" />
                </div>
                {isActive && (
                  <span className="flex items-center gap-1 rounded-md bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    <CheckIcon className="h-3 w-3" /> ACTIVE
                  </span>
                )}
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
                  Open
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
        })}
      </div>
    </div>
  );
}
