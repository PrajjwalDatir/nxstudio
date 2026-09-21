"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getStoredValue, setStoredValue } from "./storage";
import { createClient } from "@/lib/supabase/client";
import { CustomStage, IdeaData, IterationEntry, ProductSchema, TechStackInput, WorkspaceData } from "./types";
import { mergeNxIntoWorkspace } from "./nx-compiler";
import { isBriefInsightsStale } from "./staleness";
import {
  Collection,
  GitHubConnection,
  Project,
  collectionToRow,
  hydrateData,
  newCollection,
  newProject,
  newWorkspaceData,
  projectToRow,
  serializeCollection,
  serializeProject,
} from "./projects";
import {
  GitHubStatus,
  SyncResult,
  connectGitHub,
  disconnectGitHub,
  syncRepo,
} from "./github";

// Re-export the model types so existing importers keep working.
export type { Collection, GitHubConnection, Project } from "./projects";
export type { SyncResult } from "./github";

interface Store {
  projects: Project[];
  collections: Collection[];
  activeId: string;
}

function initStore(initial: Project[], collections: Collection[]): Store {
  if (initial.length > 0) return { projects: initial, collections, activeId: initial[0].id };
  // Brand-new user: start with one project in memory; the reconciler inserts it.
  const p = newProject("Product 1");
  return { projects: [p], collections, activeId: p.id };
}

/** How long we wait after the last edit before writing to Supabase. */
const SAVE_DEBOUNCE_MS = 700;

/* ------------------------------------------------------------------ */
/* Context                                                            */
/* ------------------------------------------------------------------ */

interface WorkspaceContextType {
  isHydrated: boolean;

  // Projects
  projects: Project[];
  activeProject: Project;
  activeId: string;
  createProject: (name: string) => string;
  switchProject: (id: string) => void;
  renameProject: (id: string, name: string) => void;
  deleteProject: (id: string) => void;

  // Collections (product groups)
  collections: Collection[];
  createCollection: (name: string) => string;
  renameCollection: (id: string, name: string) => void;
  deleteCollection: (id: string) => void;
  /** Move a product into a collection, or pass null to ungroup it. */
  assignToCollection: (projectId: string, collectionId: string | null) => void;

  // Active project data (stable API used by every phase)
  data: WorkspaceData;
  setProductName: (name: string) => void;
  updateIdea: <K extends keyof IdeaData>(field: K, value: IdeaData[K]) => void;
  updateBrand: (field: keyof WorkspaceData["brand"], value: string) => void;
  updateDesignNotes: (text: string) => void;
  updateSchemaDraft: (draft: WorkspaceData["schemaDraft"]) => void;
  updateBriefInsights: (insights: WorkspaceData["briefInsights"]) => void;
  /** True when the idea or capabilities have changed since briefInsights was accepted. */
  briefInsightsStale: boolean;
  addIteration: (entry: IterationEntry) => void;
  markIterationShipped: (id: string) => void;
  /**
   * Apply a server-computed reconciliation patch (see /api/context/scope-change).
   * `base` is the workspace snapshot the patch was computed against — when given,
   * a field is only overwritten if it still matches `base`, so an edit the founder
   * made locally while the request was in flight doesn't get silently reverted.
   */
  applyWorkspacePatch: (patch: Partial<WorkspaceData>, base?: WorkspaceData) => void;
  updateSchema: (schema: ProductSchema) => void;
  updateMcpServers: (servers: string[]) => void;
  updateTech: <K extends keyof TechStackInput>(field: K, value: TechStackInput[K]) => void;
  toggleChecklist: (phaseId: string, stepId: string) => void;
  isStepDone: (phaseId: string, stepId: string) => boolean;
  resetPhase: (phaseId: string) => void;

  // Custom stages (founder-defined phases)
  customStages: CustomStage[];
  addCustomStage: (label: string) => string;
  removeCustomStage: (id: string) => void;
  addCustomStep: (stageId: string, label: string) => void;
  removeCustomStep: (stageId: string, stepId: string) => void;

  // GitHub connection (per project)
  github: GitHubConnection;
  setRepo: (repo: string | null, branch?: string) => void;
  /** Shared GitHub sync engine (status, result, connect/disconnect/sync). */
  sync: SyncApi;

  // Due dates — value is a yyyy-mm-dd string (date-only), "" clears it.
  setDueDate: (phaseId: string, date: string) => void;

  resetActive: () => void;
}

const Ctx = createContext<WorkspaceContextType | null>(null);

export function useWorkspace() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return c;
}

// Aliases for backwards compatibility & clean call sites.
export const useProjects = useWorkspace;
export type SyncStatus = "checking" | "disconnected" | "no-repo" | "syncing" | "ok" | "error";

export interface SyncApi {
  github: GitHubStatus;
  status: SyncStatus;
  result: SyncResult | null;
  lastSyncedAt: string | null;
  error: string | null;
  connect: (token: string) => Promise<void>;
  disconnect: () => Promise<void>;
  sync: () => Promise<void>;
}

/** Shared GitHub sync state, owned by WorkspaceProvider. */
export const useSync = (): SyncApi => useWorkspace().sync;

export function WorkspaceProvider({
  children,
  initialProjects,
  initialCollections = [],
  userId,
  initialGitHubStatus = { connected: false },
}: {
  children: React.ReactNode;
  /** Projects loaded on the server (source of truth on first paint). */
  initialProjects: Project[];
  /** Collections loaded on the server. */
  initialCollections?: Collection[];
  userId: string;
  /** GitHub connection status loaded on the server. */
  initialGitHubStatus?: GitHubStatus;
}) {
  const [store, setStore] = useState<Store>(() => initStore(initialProjects, initialCollections));
  const [isHydrated, setIsHydrated] = useState(false);

  // --- persistence bookkeeping ---
  const storeRef = useRef(store);
  useEffect(() => {
    storeRef.current = store;
  }, [store]);

  // What Supabase already holds, keyed by id → serialized snapshot. Seeded from
  // the server data so we only write projects that actually changed.
  const savedRef = useRef<Map<string, string>>(new Map());
  const savedCollectionsRef = useRef<Map<string, string>>(new Map());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Reconcile in-memory state with Supabase: upsert changed, delete removed.
   * Order matters for the projects.collection_id foreign key — new collections
   * are written before projects that reference them, and deleted only after the
   * referencing projects have been updated (or removed).
   */
  const flush = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const supabase = createClient();
    const { projects, collections } = storeRef.current;
    const currentIds = new Set(projects.map((p) => p.id));
    const currentCollectionIds = new Set(collections.map((c) => c.id));

    const changed = projects.filter((p) => savedRef.current.get(p.id) !== serializeProject(p));
    const removed = [...savedRef.current.keys()].filter((id) => !currentIds.has(id));
    const changedCollections = collections.filter(
      (c) => savedCollectionsRef.current.get(c.id) !== serializeCollection(c)
    );
    const removedCollections = [...savedCollectionsRef.current.keys()].filter(
      (id) => !currentCollectionIds.has(id)
    );

    try {
      if (changedCollections.length > 0) {
        const { error } = await supabase
          .from("collections")
          .upsert(changedCollections.map((c) => collectionToRow(c, userId)));
        if (!error)
          changedCollections.forEach((c) =>
            savedCollectionsRef.current.set(c.id, serializeCollection(c))
          );
      }
      if (changed.length > 0) {
        const { error } = await supabase
          .from("projects")
          .upsert(changed.map((p) => projectToRow(p, userId)));
        if (!error) changed.forEach((p) => savedRef.current.set(p.id, serializeProject(p)));
      }
      if (removed.length > 0) {
        const { error } = await supabase.from("projects").delete().in("id", removed);
        if (!error) removed.forEach((id) => savedRef.current.delete(id));
      }
      if (removedCollections.length > 0) {
        const { error } = await supabase.from("collections").delete().in("id", removedCollections);
        if (!error) removedCollections.forEach((id) => savedCollectionsRef.current.delete(id));
      }
    } catch {
      // Leave the saved refs untouched so the next edit retries these writes.
    }
  }, [userId]);

  const initialProjectsRef = useRef(initialProjects);
  const initialCollectionsRef = useRef(initialCollections);
  useEffect(() => {
    initialProjectsRef.current = initialProjects;
    initialCollectionsRef.current = initialCollections;
  }, [initialProjects, initialCollections]);

  // Hydrate device-local bits (active project, legacy migration) once on mount.
  useEffect(() => {
    // Seed savedRef with what the server already persisted.
    const saved = new Map<string, string>();
    for (const p of initialProjectsRef.current) saved.set(p.id, serializeProject(p));
    savedRef.current = saved;

    const savedCollections = new Map<string, string>();
    for (const c of initialCollectionsRef.current) savedCollections.set(c.id, serializeCollection(c));
    savedCollectionsRef.current = savedCollections;

    // One-time migration: if the account has no projects yet but this browser
    // has a legacy localStorage workspace, import it (the reconciler uploads it).
    if (initialProjectsRef.current.length === 0) {
      const legacy = getStoredValue<{ projects?: Project[] } | null>("projects", null);
      if (legacy?.projects?.length) {
        const migrated = legacy.projects.map((p) => ({
          ...newProject(p.data?.productName || "Product"),
          ...p,
          data: hydrateData(p.data, p.data?.productName || "Product"),
          github: { repo: p.github?.repo ?? null, branch: p.github?.branch ?? "main" },
          dueDates: p.dueDates ?? {},
        }));
        setTimeout(() => setStore((s) => ({ ...s, projects: migrated, activeId: migrated[0].id })), 0);
      }
    }

    // Restore the active-project preference (kept per-device, not in Supabase).
    const storedActive = getStoredValue<string | null>("activeProject", null);
    if (storedActive) {
      setTimeout(() => setStore((s) =>
        s.projects.some((p) => p.id === storedActive) ? { ...s, activeId: storedActive } : s
      ), 0);
    }

    setTimeout(() => setIsHydrated(true), 0);
  }, []);

  // Debounced autosave: collapse bursts of edits into a single write per project.
  useEffect(() => {
    if (!isHydrated) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void flush();
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [store, isHydrated, flush]);

  // Best-effort flush when the tab is hidden or closed so nothing in the debounce
  // window is lost.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [flush]);

  // Persist the active-project preference locally (cheap, no round-trip).
  useEffect(() => {
    if (isHydrated) setStoredValue("activeProject", store.activeId);
  }, [store.activeId, isHydrated]);

  /* --- helpers to mutate the active project's data --- */
  const patchActive = useCallback((fn: (p: Project) => Project) => {
    setStore((s) => ({
      ...s,
      projects: s.projects.map((p) => (p.id === s.activeId ? fn(p) : p)),
    }));
  }, []);

  const patchData = useCallback(
    (fn: (d: WorkspaceData) => WorkspaceData) => {
      patchActive((p) => ({ ...p, data: fn(p.data) }));
    },
    [patchActive]
  );

  const activeProject = useMemo(
    () => store.projects.find((p) => p.id === store.activeId) ?? store.projects[0],
    [store]
  );

  /* --- projects --- */
  const createProject = useCallback((name: string) => {
    const p = newProject(name || "Untitled");
    setStore((s) => ({ ...s, projects: [...s.projects, p], activeId: p.id }));
    return p.id;
  }, []);

  const switchProject = useCallback((id: string) => {
    setStore((s) => (s.projects.some((p) => p.id === id) ? { ...s, activeId: id } : s));
  }, []);

  const renameProject = useCallback((id: string, name: string) => {
    setStore((s) => ({
      ...s,
      projects: s.projects.map((p) =>
        p.id === id ? { ...p, data: { ...p.data, productName: name } } : p
      ),
    }));
  }, []);

  const deleteProject = useCallback((id: string) => {
    setStore((s) => {
      const remaining = s.projects.filter((p) => p.id !== id);
      if (remaining.length === 0) {
        const p = newProject("Product 1");
        return { ...s, projects: [p], activeId: p.id };
      }
      const activeId = s.activeId === id ? remaining[0].id : s.activeId;
      return { ...s, projects: remaining, activeId };
    });
  }, []);

  /* --- collections (product groups) --- */
  const createCollection = useCallback((name: string) => {
    const c = newCollection(name, 0);
    // sort = append to the end (kept small to fit the integer column).
    setStore((s) => ({
      ...s,
      collections: [...s.collections, { ...c, sort: s.collections.length }],
    }));
    return c.id;
  }, []);

  const renameCollection = useCallback((id: string, name: string) => {
    setStore((s) => ({
      ...s,
      collections: s.collections.map((c) => (c.id === id ? { ...c, name: name || "Untitled" } : c)),
    }));
  }, []);

  const deleteCollection = useCallback((id: string) => {
    // Remove the group; its products stay, just ungrouped (mirrors on-delete-set-null).
    setStore((s) => ({
      ...s,
      collections: s.collections.filter((c) => c.id !== id),
      projects: s.projects.map((p) => (p.collectionId === id ? { ...p, collectionId: null } : p)),
    }));
  }, []);

  const assignToCollection = useCallback((projectId: string, collectionId: string | null) => {
    setStore((s) => ({
      ...s,
      projects: s.projects.map((p) => (p.id === projectId ? { ...p, collectionId } : p)),
    }));
  }, []);

  /* --- active data updaters (stable API) --- */
  const setProductName = useCallback(
    (name: string) => patchData((d) => ({ ...d, productName: name })),
    [patchData]
  );

  const updateIdea = useCallback(
    <K extends keyof IdeaData>(field: K, value: IdeaData[K]) =>
      patchData((d) => ({ ...d, idea: { ...d.idea, [field]: value } })),
    [patchData]
  );

  const updateBrand = useCallback(
    (field: keyof WorkspaceData["brand"], value: string) =>
      patchData((d) => ({ ...d, brand: { ...d.brand, [field]: value } })),
    [patchData]
  );

  const updateDesignNotes = useCallback(
    (text: string) => patchData((d) => ({ ...d, designNotes: text })),
    [patchData]
  );

  const updateSchemaDraft = useCallback(
    (draft: WorkspaceData["schemaDraft"]) => patchData((d) => ({ ...d, schemaDraft: draft })),
    [patchData]
  );

  const updateBriefInsights = useCallback(
    (insights: WorkspaceData["briefInsights"]) => patchData((d) => ({ ...d, briefInsights: insights })),
    [patchData]
  );

  const briefInsightsStale = useMemo(
    () => isBriefInsightsStale(activeProject.data),
    [activeProject]
  );

  const addIteration = useCallback(
    (entry: IterationEntry) => patchData((d) => ({ ...d, iterations: [...d.iterations, entry] })),
    [patchData]
  );

  const markIterationShipped = useCallback(
    (id: string) =>
      patchData((d) => ({
        ...d,
        iterations: d.iterations.map((it) => (it.id === id ? { ...it, status: "shipped" as const } : it)),
      })),
    [patchData]
  );

  const applyWorkspacePatch = useCallback(
    (patch: Partial<WorkspaceData>, base?: WorkspaceData) => {
      if (Object.keys(patch).length === 0) return;
      patchData((d) => {
        if (!base) return { ...d, ...patch };
        const safePatch: Partial<WorkspaceData> = {};
        for (const key of Object.keys(patch) as (keyof WorkspaceData)[]) {
          // Only take the server's value for a field the founder hasn't edited
          // locally since the request that computed this patch was sent.
          if (JSON.stringify(d[key]) === JSON.stringify(base[key])) {
            (safePatch as Record<string, unknown>)[key] = patch[key];
          }
        }
        return Object.keys(safePatch).length ? { ...d, ...safePatch } : d;
      });
    },
    [patchData]
  );

  const updateSchema = useCallback(
    (schema: ProductSchema) => patchData((d) => ({ ...d, schema })),
    [patchData]
  );

  const updateMcpServers = useCallback(
    (servers: string[]) => patchData((d) => ({ ...d, selectedMcpServers: servers })),
    [patchData]
  );

  const updateTech = useCallback(
    <K extends keyof TechStackInput>(field: K, value: TechStackInput[K]) =>
      patchData((d) => ({ ...d, tech: { ...d.tech, [field]: value } })),
    [patchData]
  );

  const toggleChecklist = useCallback(
    (phaseId: string, stepId: string) =>
      patchData((d) => {
        const cur = d.checklist[phaseId] ?? [];
        const next = cur.includes(stepId) ? cur.filter((s) => s !== stepId) : [...cur, stepId];
        return { ...d, checklist: { ...d.checklist, [phaseId]: next } };
      }),
    [patchData]
  );

  const isStepDone = useCallback(
    (phaseId: string, stepId: string) =>
      (activeProject.data.checklist[phaseId] ?? []).includes(stepId),
    [activeProject]
  );

  const resetPhase = useCallback(
    (phaseId: string) =>
      patchData((d) => ({ ...d, checklist: { ...d.checklist, [phaseId]: [] } })),
    [patchData]
  );

  /* --- custom stages --- */
  const addCustomStage = useCallback(
    (label: string) => {
      const id = `custom_${Math.random().toString(36).slice(2, 10)}`;
      patchData((d) => ({
        ...d,
        customStages: [
          ...d.customStages,
          { id, label: label || "Untitled Stage", description: "Custom stage.", icon: "sparkles", steps: [] },
        ],
      }));
      return id;
    },
    [patchData]
  );

  const removeCustomStage = useCallback(
    (id: string) =>
      patchData((d) => {
        const { [id]: _removed, ...checklist } = d.checklist;
        return { ...d, customStages: d.customStages.filter((s) => s.id !== id), checklist };
      }),
    [patchData]
  );

  const addCustomStep = useCallback(
    (stageId: string, label: string) =>
      patchData((d) => ({
        ...d,
        customStages: d.customStages.map((s) =>
          s.id === stageId
            ? { ...s, steps: [...s.steps, { id: `step_${Math.random().toString(36).slice(2, 8)}`, label }] }
            : s
        ),
      })),
    [patchData]
  );

  const removeCustomStep = useCallback(
    (stageId: string, stepId: string) =>
      patchData((d) => ({
        ...d,
        customStages: d.customStages.map((s) =>
          s.id === stageId ? { ...s, steps: s.steps.filter((st) => st.id !== stepId) } : s
        ),
        checklist: { ...d.checklist, [stageId]: (d.checklist[stageId] ?? []).filter((x) => x !== stepId) },
      })),
    [patchData]
  );

  const setRepo = useCallback(
    (repo: string | null, branch = "main") => patchActive((p) => ({ ...p, github: { repo, branch } })),
    [patchActive]
  );

  const setDueDate = useCallback(
    // `date` is a yyyy-mm-dd string (date-only, no timezone), or "" to clear.
    (phaseId: string, date: string) =>
      patchActive((p) => ({ ...p, dueDates: { ...p.dueDates, [phaseId]: date } })),
    [patchActive]
  );

  const resetActive = useCallback(
    () =>
      patchActive((p) => ({
        ...p,
        data: newWorkspaceData(p.data.productName),
        github: { repo: null, branch: "main" },
        dueDates: {},
      })),
    [patchActive]
  );

  /* GitHub sync — single shared engine for every consumer of useSync ---- */
  const repo = activeProject.github.repo;
  const branch = activeProject.github.branch;
  // Cache key must include the branch (and implicitly the project's repo config),
  // otherwise two projects pointed at the same repo on different branches — or a
  // project switch that lands mid-request — would read/write each other's result.
  const repoKey = repo ? `${repo}@${branch}` : null;
  const [ghStatus, setGhStatus] = useState<GitHubStatus>(initialGitHubStatus);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(
    initialGitHubStatus.connected ? (repo ? "syncing" : "no-repo") : "disconnected"
  );
  const [resultByRepo, setResultByRepo] = useState<Record<string, SyncResult>>({});
  const [syncError, setSyncError] = useState<string | null>(null);
  const syncInFlightKey = useRef<string | null>(null);

  const syncResult = repoKey ? resultByRepo[repoKey] ?? null : null;

  // Ambient full auto-merge: reconcile repo-authored .nx/ content back into
  // WorkspaceData whenever a sync lands. Computed against a ref (not
  // activeProject.data directly) so this doesn't re-run on every keystroke —
  // only when a new sync result actually arrives — and skipped entirely when
  // there's nothing to merge, so it doesn't trigger a save every poll.
  const activeDataRef = useRef(activeProject.data);
  useEffect(() => {
    activeDataRef.current = activeProject.data;
  }, [activeProject.data]);

  // The 60s poll (see runSync below) writes a fresh SyncResult object every
  // tick even when nothing changed upstream, so gate the (relatively
  // expensive) diffNx/mergeNxIntoWorkspace rebuild on the fetched .nx/ doc
  // content actually changing — keyed per project+repo so switching between
  // two projects that share a repo still reconciles each one independently.
  const lastMergedDocsRef = useRef<Map<string, string>>(new Map());
  useEffect(() => {
    if (!syncResult || !repoKey) return;
    const mergeKey = `${store.activeId}:${repoKey}`;
    const docsSignature = JSON.stringify(syncResult.context.docs);
    if (lastMergedDocsRef.current.get(mergeKey) === docsSignature) return;
    lastMergedDocsRef.current.set(mergeKey, docsSignature);

    const patch = mergeNxIntoWorkspace(syncResult.context, activeDataRef.current);
    if (Object.keys(patch).length === 0) return;
    patchData((d) => ({ ...d, ...patch }));
  }, [syncResult, patchData, repoKey, store.activeId]);

  const runSync = useCallback(async () => {
    if (!ghStatus.connected) {
      setSyncStatus("disconnected");
      return;
    }
    if (!repo || !repoKey) {
      setSyncStatus("no-repo");
      return;
    }
    if (syncInFlightKey.current === repoKey) return;
    syncInFlightKey.current = repoKey;
    setSyncStatus("syncing");
    setSyncError(null);
    try {
      const r = await syncRepo(repo, branch);
      // The active project/repo may have changed while this request was in
      // flight; discard the response if it's no longer the one we asked for.
      if (syncInFlightKey.current !== repoKey) return;
      setResultByRepo((prev) => ({ ...prev, [repoKey]: r }));
      setSyncStatus("ok");
    } catch (e) {
      if (syncInFlightKey.current !== repoKey) return;
      setSyncError(e instanceof Error ? e.message : "Sync failed.");
      setSyncStatus("error");
    } finally {
      if (syncInFlightKey.current === repoKey) syncInFlightKey.current = null;
    }
  }, [ghStatus.connected, repo, branch, repoKey]);

  // Sync on repo/connection change, then poll every 60s.
  useEffect(() => {
    if (!ghStatus.connected) {
      setTimeout(() => setSyncStatus("disconnected"), 0);
      return;
    }
    if (!repo) {
      setTimeout(() => setSyncStatus("no-repo"), 0);
      return;
    }
    setTimeout(runSync, 0);
    const id = setInterval(runSync, 60_000);
    return () => clearInterval(id);
  }, [ghStatus.connected, repo, branch, runSync]);

  const connectSync = useCallback(
    async (token: string) => {
      const s = await connectGitHub(token);
      setGhStatus(s);
      setSyncStatus(s.connected ? (repo ? "syncing" : "no-repo") : "disconnected");
    },
    [repo]
  );

  const disconnectSync = useCallback(async () => {
    await disconnectGitHub();
    setGhStatus({ connected: false });
    setSyncStatus("disconnected");
    setResultByRepo({});
    syncInFlightKey.current = null;
  }, []);

  const sync: SyncApi = {
    github: ghStatus,
    status: syncStatus,
    result: syncResult,
    lastSyncedAt: syncResult?.syncedAt ?? null,
    error: syncError,
    connect: connectSync,
    disconnect: disconnectSync,
    sync: runSync,
  };

  return (
    <Ctx.Provider
      value={{
        isHydrated,
        projects: store.projects,
        activeProject,
        activeId: store.activeId,
        createProject,
        switchProject,
        renameProject,
        deleteProject,
        collections: store.collections,
        createCollection,
        renameCollection,
        deleteCollection,
        assignToCollection,
        data: activeProject.data,
        setProductName,
        updateIdea,
        updateBrand,
        updateDesignNotes,
        updateSchemaDraft,
        updateBriefInsights,
        briefInsightsStale,
        addIteration,
        markIterationShipped,
        applyWorkspacePatch,
        updateSchema,
        updateMcpServers,
        updateTech,
        toggleChecklist,
        isStepDone,
        resetPhase,
        customStages: activeProject.data.customStages,
        addCustomStage,
        removeCustomStage,
        addCustomStep,
        removeCustomStep,
        github: activeProject.github,
        setRepo,
        sync,
        setDueDate,
        resetActive,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
