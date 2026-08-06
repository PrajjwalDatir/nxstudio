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

/** Module-level in-memory cache to prevent repeated re-fetching & loading flashes */
const promptCache = new Map<string, { prompts: CompiledPrompts; locked: boolean }>();

/**
 * Fetch the active project's server-compiled prompts with smart in-memory
 * caching and Stale-While-Revalidate (SWR) hydration. Previews load instantly
 * from cache when switching tabs, and recompile silently in the background when
 * context changes.
 */
export function useCompiledPrompts() {
  const { activeId, data } = useWorkspace();

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

  const cached = promptCache.get(signature);

  const [state, setState] = useState<State>(() => ({
    prompts: cached?.prompts ?? null,
    locked: cached?.locked ?? false,
    loading: !cached,
    error: null,
  }));

  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Synchronize state from cache immediately if signature matches and cache hit exists
  useEffect(() => {
    const hit = promptCache.get(signature);
    if (hit) {
      setState({
        prompts: hit.prompts,
        locked: hit.locked,
        loading: false,
        error: null,
      });
    }
  }, [signature]);

  const compile = useCallback(async () => {
    // Keep existing prompts while re-fetching in background (stale-while-revalidate)
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
      const compiled = prompts as CompiledPrompts;

      // Save to module cache with LRU eviction (cap size to 50 entries)
      if (promptCache.size >= 50) {
        const firstKey = promptCache.keys().next().value;
        if (firstKey) promptCache.delete(firstKey);
      }
      promptCache.set(signature, { prompts: compiled, locked });

      setState({ prompts: compiled, locked, loading: false, error: null });
    } catch (e) {
      setState((s) => ({
        ...s,
        loading: false,
        error: e instanceof Error ? e.message : "Failed to load prompts.",
      }));
    }
  }, [signature]);

  useEffect(() => {
    // Recompile (debounced) whenever signature changes, or immediately if uncached
    const isUncached = !promptCache.has(signature);
    const delay = isUncached ? 0 : RECOMPILE_DEBOUNCE_MS;
    const t = setTimeout(compile, delay);
    return () => clearTimeout(t);
  }, [signature, compile]);

  return { ...state, refresh: compile };
}
