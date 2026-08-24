"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/lib/workspace-store";
import type { Project } from "@/lib/workspace-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CheckIcon,
  FolderIcon,
  ProjectIcon,
} from "@/components/icons";
import { cn } from "@/lib/utils";

/**
 * The "Workspaces" breadcrumb, upgraded to a switcher. Clicking it opens a
 * dropdown of every product grouped by its collection, so founders can hop
 * between projects without a trip through /projects. Switching also routes to
 * /canvas so the newly-active product's board is what you land on.
 */
export function WorkspacesMenu() {
  const router = useRouter();
  const { projects, activeId, switchProject, collections } = useWorkspace();
  const [open, setOpen] = useState(false);

  const { groups, ungrouped } = useMemo(() => {
    const sortedCollections = [...collections].sort((a, b) => a.sort - b.sort);
    const known = new Set(collections.map((c) => c.id));

    // Optimization: Grouping projects using a Map inside a single O(N) pass,
    // rather than running an O(N) `.filter()` inside an O(M) `.map()` loop (O(N*M)).
    const groupedMap = new Map<string, Project[]>();
    const ungroupedList: Project[] = [];

    for (const p of projects) {
      if (!p.collectionId || !known.has(p.collectionId)) {
        ungroupedList.push(p);
      } else {
        let list = groupedMap.get(p.collectionId);
        if (!list) {
          list = [];
          groupedMap.set(p.collectionId, list);
        }
        list.push(p);
      }
    }

    const groups = sortedCollections.map((c) => ({
      collection: c,
      items: groupedMap.get(c.id) || [],
    }));

    return { groups, ungrouped: ungroupedList };
  }, [projects, collections]);

  const select = (id: string) => {
    if (id !== activeId) {
      switchProject(id);
      router.push("/canvas");
    }
    setOpen(false);
  };

  const ProjectRow = ({ p }: { p: Project }) => {
    const isActive = p.id === activeId;
    return (
      <DropdownMenuItem
        key={p.id}
        onSelect={() => select(p.id)}
        className={cn("gap-2", isActive && "text-foreground")}
      >
        <ProjectIcon className="h-4 w-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate">
          {p.data.productName || "Untitled Project"}
        </span>
        {isActive && <CheckIcon className="h-4 w-4 shrink-0 text-foreground" />}
      </DropdownMenuItem>
    );
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        title="Switch workspace"
        className={cn(
          "group flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:text-foreground sm:h-auto sm:w-auto sm:gap-1 sm:px-1.5 sm:py-1",
        )}
        aria-label="Switch workspace"
      >
        {/* Icon-only below sm — "Workspaces" is the least essential breadcrumb
            segment on a phone, and the fixed-width label was starving the
            product name and phase crumb of the space they actually need. */}
        <FolderIcon className="h-4 w-4 shrink-0 sm:hidden" />
        <span className="hidden sm:inline">Workspaces</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="max-h-[70vh] w-64 overflow-y-auto">
        {groups.map((g) => (
          <DropdownMenuGroup key={g.collection.id}>
            <DropdownMenuLabel className="flex items-center gap-2 text-muted-foreground">
              <FolderIcon className="h-3.5 w-3.5" />
              {g.collection.name}
            </DropdownMenuLabel>
            {g.items.length ? (
              g.items.map((p) => <ProjectRow key={p.id} p={p} />)
            ) : (
              <div className="px-2 py-1.5 text-xs text-muted-foreground/70">
                No products
              </div>
            )}
          </DropdownMenuGroup>
        ))}

        {ungrouped.length > 0 && (
          <>
            {groups.length > 0 && (
              <DropdownMenuLabel className="text-muted-foreground">
                Ungrouped
              </DropdownMenuLabel>
            )}
            {ungrouped.map((p) => (
              <ProjectRow key={p.id} p={p} />
            ))}
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            router.push("/projects");
            setOpen(false);
          }}
          className="gap-2 text-muted-foreground"
        >
          <FolderIcon className="h-4 w-4 shrink-0" />
          Manage all projects
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
