"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useWorkspace } from "@/lib/workspace-store";
import { CompiledPrompts } from "@/lib/prompts-server";

interface State {
  prompts: CompiledPrompts | null;
  /** True when the master (build) prompt is withheld — user isn't premium.
   *  Idea + depth prompts still populate for everyone. */
  locked: boolean;
  loading: boolean;
  error: string | null;
}

/** How long after the last edit before we recompile the preview. */
const RECOMPILE_DEBOUNCE_MS = 800;

/**
 * Fetch the active project's server-compiled prompts. Prose is assembled
 * server-side; the idea + depth prompts return for everyone, while the master
 * build prompt is premium-only — the server sets `locked` when it withholds it,
 * and that drives the upsell UI. Recompiles (debounced) as the founder edits so
 * previews stay live.
 */
export function useCompiledPrompts() {
  const { activeId, data } = useWorkspace();
  const [state, setState] = useState<State>({
    prompts: null,
    locked: false,
    loading: true,
    error: null,
  });

  // Serialize just the fields that affect compilation so we don't refetch on
  // unrelated store changes (e.g. switching the active tab).
  const signature = JSON.stringify({
    id: activeId,
    productName: data.productName,
    idea: data.idea,
    brand: data.brand,
    tech: data.tech,
    designNotes: data.designNotes,
  });

  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const compile = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch("/api/prompts/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: dataRef.current }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to load prompts.");
      const { locked = false, support: _support, ...prompts } = body;
      setState({ prompts: prompts as CompiledPrompts, locked, loading: false, error: null });
    } catch (e) {
      setState({
        prompts: null,
        locked: false,
        loading: false,
        error: e instanceof Error ? e.message : "Failed to load prompts.",
      });
    }
  }, []);

  useEffect(() => {
    // Recompile whenever the compilation-relevant signature changes.
    const t = setTimeout(compile, RECOMPILE_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [signature, compile]);

  return { ...state, refresh: compile };
}
