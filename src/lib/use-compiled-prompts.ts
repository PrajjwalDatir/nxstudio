"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useWorkspace } from "@/lib/workspace-store";
import { CompiledPrompts } from "@/lib/prompts";

interface State {
  prompts: CompiledPrompts | null;
  /** True when the server returned 402 — user isn't premium. */
  locked: boolean;
  loading: boolean;
  error: string | null;
}

/** How long after the last edit before we recompile the preview. */
const RECOMPILE_DEBOUNCE_MS = 800;

/**
 * Fetch the active project's server-compiled prompts. The prompt prose is only
 * ever assembled server-side and only for premium users, so a 402 here IS the
 * paywall: `locked` drives the upsell UI. Recompiles (debounced) as the founder
 * edits so premium previews stay live.
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
  });

  const dataRef = useRef(data);
  dataRef.current = data;

  const compile = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch("/api/prompts/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: dataRef.current }),
      });
      if (res.status === 402) {
        setState({ prompts: null, locked: true, loading: false, error: null });
        return;
      }
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to load prompts.");
      setState({ prompts: body as CompiledPrompts, locked: false, loading: false, error: null });
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
