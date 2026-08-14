"use client";

import { useEffect, useRef, useState } from "react";
import { useWorkspace } from "@/lib/workspace-store";
import { cn } from "@/lib/utils";

/**
 * The product name in the breadcrumb, renamed in place.
 *
 * It used to be a link to "/" — which, now that the marketing page lives at the
 * root, dropped you out of the app entirely. Clicking the title is a rename
 * gesture instead: the thing you're most likely to want from a project title,
 * and the only place in the shell it's editable.
 *
 * Enter commits, Escape reverts, blur commits. An empty value is rejected so a
 * project can't end up nameless.
 */
export function ProductNameCrumb({ isLast }: { isLast: boolean }) {
  const { data, setProductName } = useWorkspace();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data.productName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== data.productName) setProductName(trimmed);
    else setDraft(data.productName);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(data.productName);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            cancel();
          }
        }}
        aria-label="Project name"
        className="min-w-0 max-w-[220px] rounded-md border border-primary/40 bg-background px-1.5 py-0.5 text-sm font-medium text-foreground outline-none ring-2 ring-primary/20"
      />
    );
  }

  return (
    <button
      type="button"
      // Seed the draft at the moment editing starts, so it always reflects the
      // current project without an effect syncing two sources of truth.
      onClick={() => {
        setDraft(data.productName);
        setEditing(true);
      }}
      title="Rename project"
      className={cn(
        "min-w-0 max-w-[90px] truncate rounded-md px-1.5 py-0.5 text-sm transition-colors hover:bg-secondary hover:text-foreground sm:max-w-[220px]",
        isLast ? "font-medium text-foreground" : "text-muted-foreground"
      )}
    >
      {data.productName}
    </button>
  );
}
