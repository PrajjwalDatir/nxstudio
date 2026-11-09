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
import { isLocalMode } from "@/lib/supabase/config";
import { CustomStage, IdeaData, IterationEntry, ProductSchema, TechStackInput, WorkspaceData, BrandDNA } from "./types";
import { mergeNxIntoWorkspace } from "./nx-compiler";
import { isBriefInsightsStale } from "./staleness";
import {
  Collection,
  GitHubConnection,
  Project,
  ProjectRow,
  rowToProject,
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

/**
 * Synchronous local storage persistence to prevent form and project loss on page refresh.
 * Writes to both 'nx-studio:' namespaced keys and raw fallback keys for maximum compatibility.
 */
function saveProjectsLocally(
  projects: Project[],
  activeId?: string,
  collections?: Collection[]
) {
  if (typeof window === "undefined") return;
  try {
    const payload = { projects, updatedAt: Date.now() };
    const serialized = JSON.stringify(payload);
    localStorage.setItem("nx-studio:projects", serialized);
    localStorage.setItem("projects", serialized);

    if (activeId) {
      localStorage.setItem("nx-studio:activeProject", JSON.stringify(activeId));
      localStorage.setItem("activeProject", JSON.stringify(activeId));
    }
    if (collections && collections.length > 0) {
      const colPayload = JSON.stringify({ collections });
      localStorage.setItem("nx-studio:collections", colPayload);
      localStorage.setItem("collections", colPayload);
    }
  } catch (e) {
    console.error("Failed to save projects to localStorage:", e);
  }
}

function getLocalStoredProjects(): { projects: Project[]; updatedAt?: number } | null {
  if (typeof window === "undefined") return null;
  const keys = ["nx-studio:projects", "projects"];
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      let list: any[] = [];
      let updatedAt: number | undefined;

      if (Array.isArray(parsed)) {
        list = parsed;
      } else if (parsed && Array.isArray(parsed.projects)) {
        list = parsed.projects;
        updatedAt = parsed.updatedAt;
      }

      if (list.length > 0) {
        const projects = list.map((p: any) => {
          const name = p.data?.productName || p.name || "Product";
          return {
            ...newProject(name),
            ...p,
            data: hydrateData(p.data, name),
            github: { repo: p.github?.repo ?? null, branch: p.github?.branch ?? "main" },
            dueDates: p.dueDates ?? {},
          };
        });
        return { projects, updatedAt };
      }
    } catch (e) {
      console.error(`Error reading ${key} from localStorage:`, e);
    }
  }
  return null;
}

function getLocalStoredCollections(): Collection[] | null {
  if (typeof window === "undefined") return null;
  const keys = ["nx-studio:collections", "collections"];
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      if (parsed && Array.isArray(parsed.collections) && parsed.collections.length > 0) return parsed.collections;
    } catch {}
  }
  return null;
}

function getLocalDraftIdea(projectId: string): Partial<IdeaData> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`nx_draft_idea_${projectId}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function mergeProjectData(serverProj: Project, localProj?: Project): Project {
  let mergedData = { ...serverProj.data };

  if (localProj?.data) {
    const sData = serverProj.data;
    const lData = localProj.data;

    // Merge Idea questions: preserve typed answers if server has empty or stale fields
    const ideaFields: (keyof IdeaData)[] = ["problem", "targetUsers", "currentSolutions", "differentiation"];
    const mergedIdea = { ...sData.idea };
    for (const f of ideaFields) {
      const sVal = sData.idea?.[f] || "";
      const lVal = lData.idea?.[f] || "";
      if (lVal.trim().length > 0 && (!sVal.trim() || lVal.trim() !== sVal.trim())) {
        mergedIdea[f] = lVal;
      }
    }

    // Merge Brand: preserve custom brand if server has defaults
    const mergedBrand = { ...sData.brand, ...lData.brand };
    if (!lData.brand?.logo && sData.brand?.logo) {
      mergedBrand.logo = sData.brand.logo;
      mergedBrand.logoName = sData.brand.logoName;
    }

    // Merge Tech: surfaces and capabilities
    const mergedTech = {
      surfaces: (lData.tech?.surfaces?.length ? lData.tech.surfaces : sData.tech?.surfaces) || [],
      capabilities: (lData.tech?.capabilities?.length ? lData.tech.capabilities : sData.tech?.capabilities) || [],
    };

    // Merge Schema
    const mergedSchema = (lData.schema?.tables?.length ? lData.schema : sData.schema) || { tables: [], relations: [] };

    // Merge Checklist
    const mergedChecklist = { ...sData.checklist, ...lData.checklist };

    // Merge Custom stages & Iterations
    const mergedCustomStages = lData.customStages?.length ? lData.customStages : (sData.customStages || []);
    const mergedIterations = lData.iterations?.length ? lData.iterations : (sData.iterations || []);

    const mergedProductName =
      lData.productName && lData.productName !== "Product 1"
        ? lData.productName
        : sData.productName || "Product 1";

    mergedData = {
      ...sData,
      ...lData,
      productName: mergedProductName,
      idea: mergedIdea,
      brand: mergedBrand,
      tech: mergedTech,
      schema: mergedSchema,
      checklist: mergedChecklist,
      customStages: mergedCustomStages,
      iterations: mergedIterations,
      schemaDraft: lData.schemaDraft || sData.schemaDraft,
      briefInsights: lData.briefInsights || sData.briefInsights,
      designNotes: lData.designNotes || sData.designNotes || "",
    };
  }

  // Also check explicit draft for this server project id or local project id
  const draft =
    getLocalDraftIdea(serverProj.id) ||
    (localProj && localProj.id !== serverProj.id ? getLocalDraftIdea(localProj.id) : null);
  if (draft) {
    const ideaFields: (keyof IdeaData)[] = ["problem", "targetUsers", "currentSolutions", "differentiation"];
    const mergedIdea = { ...mergedData.idea };
    for (const f of ideaFields) {
      const dVal = draft[f] || "";
      if (dVal.trim().length > 0 && (!mergedIdea[f]?.trim() || dVal.trim().length >= mergedIdea[f].trim().length)) {
        mergedIdea[f] = dVal;
      }
    }
    mergedData.idea = mergedIdea;
  }

  return {
    ...serverProj,
    data: mergedData,
    dueDates: { ...(localProj?.dueDates || {}), ...(serverProj.dueDates || {}) },
    github: serverProj.github?.repo ? serverProj.github : (localProj?.github || serverProj.github),
    collectionId: serverProj.collectionId ?? localProj?.collectionId ?? null,
  };
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
  importProject: (name: string, dataPatch: Partial<WorkspaceData>, github?: { repo: string | null; branch?: string }) => string;
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
  updateBrand: (fieldOrPatch: keyof BrandDNA | Partial<BrandDNA>, value?: any) => void;
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
    // In offline local mode, persistence is handled locally via localStorage and .nx/
    if (isLocalMode) return;

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

  // Hydrate device-local bits (active project, localStorage backup, merging) once on mount.
  useEffect(() => {
    // 1. Read existing local storage projects and collections
    const localData = getLocalStoredProjects();
    const localProjects = localData?.projects || [];
    const localCollections = getLocalStoredCollections() || [];

    let finalProjects: Project[] = [];
    let finalCollections: Collection[] =
      initialCollectionsRef.current.length > 0
        ? initialCollectionsRef.current
        : localCollections.length > 0
        ? localCollections
        : [];

    const storedActive =
      getStoredValue<string | null>("activeProject", null) ||
      (() => {
        try {
          const raw = localStorage.getItem("activeProject");
          return raw ? JSON.parse(raw) : null;
        } catch {
          return null;
        }
      })();

    if (initialProjectsRef.current.length === 0) {
      // Server returned no projects (guest session, new user, or offline)
      if (localProjects.length > 0) {
        finalProjects = localProjects.map((p) => {
          const draft = getLocalDraftIdea(p.id);
          if (draft) {
            return {
              ...p,
              data: {
                ...p.data,
                idea: { ...p.data.idea, ...draft },
              },
            };
          }
          return p;
        });
      } else {
        // Brand new workspace: check if draft exists for default project
        const p = newProject("Product 1");
        const draft = getLocalDraftIdea(p.id) || getLocalDraftIdea("p_default");
        if (draft) {
          p.data.idea = { ...p.data.idea, ...draft };
        }
        finalProjects = [p];
      }
    } else {
      // Server has projects: merge with local projects and drafts to protect in-flight user edits
      const mergedServerProjects = initialProjectsRef.current.map((serverProj) => {
        const matchingLocal = localProjects.find(
          (lp) =>
            lp.id === serverProj.id ||
            lp.data.productName.toLowerCase() === serverProj.data.productName.toLowerCase()
        );
        return mergeProjectData(serverProj, matchingLocal);
      });

      // Keep any locally created projects that aren't yet on the server
      const serverIds = new Set(initialProjectsRef.current.map((p) => p.id));
      const extraLocalProjects = localProjects.filter((lp) => !serverIds.has(lp.id));

      finalProjects = [...mergedServerProjects, ...extraLocalProjects];
    }

    // Combine projects created during an anonymous guest session after signing in with GitHub
    if (typeof window !== "undefined") {
      const pendingMerge = localStorage.getItem("nx_pending_merge_projects");
      if (pendingMerge) {
        try {
          const parsed = JSON.parse(pendingMerge);
          const rawList: unknown[] = Array.isArray(parsed)
            ? parsed
            : (parsed as { projects?: unknown[] })?.projects || [];
          if (rawList.length > 0) {
            const existingNames = new Set(
              finalProjects.map((p) => p.data.productName.trim().toLowerCase())
            );
            const toAdd: Project[] = [];

            for (const raw of rawList) {
              const item = raw as Record<string, unknown>;
              let proj: Project;
              if ("github_repo" in item) {
                proj = rowToProject(item as unknown as ProjectRow);
              } else {
                const typed = item as unknown as Project;
                proj = {
                  ...newProject(typed.data?.productName || "Product"),
                  ...typed,
                  data: hydrateData(typed.data, typed.data?.productName || "Product"),
                  github: { repo: typed.github?.repo ?? null, branch: typed.github?.branch ?? "main" },
                  dueDates: typed.dueDates ?? {},
                };
              }

              const nameKey = proj.data.productName.trim().toLowerCase();
              if (!existingNames.has(nameKey) || finalProjects.length === 0) {
                toAdd.push({
                  ...proj,
                  id: `p_${Math.random().toString(36).slice(2, 10)}`,
                });
              }
            }

            if (toAdd.length > 0) {
              finalProjects = [...finalProjects, ...toAdd];
            }
          }
        } catch (e) {
          console.error("Failed to merge anonymous projects:", e);
        } finally {
          localStorage.removeItem("nx_pending_merge_projects");
        }
      }
    }

    // Determine active project preference
    let finalActiveId = finalProjects[0]?.id || "";
    if (storedActive && finalProjects.some((p) => p.id === storedActive)) {
      finalActiveId = storedActive;
    }

    // Seed savedRef with initial server data so reconciler flushes merged local changes to Supabase
    const saved = new Map<string, string>();
    for (const p of initialProjectsRef.current) saved.set(p.id, serializeProject(p));
    savedRef.current = saved;

    const savedCollections = new Map<string, string>();
    for (const c of initialCollectionsRef.current) savedCollections.set(c.id, serializeCollection(c));
    savedCollectionsRef.current = savedCollections;

    // Immediately persist resolved state locally
    saveProjectsLocally(finalProjects, finalActiveId, finalCollections);

    // Apply to React store
    setStore({
      projects: finalProjects,
      collections: finalCollections,
      activeId: finalActiveId,
    });

    setIsHydrated(true);
  }, []);

  // Synchronous localStorage persistence on every store change
  useEffect(() => {
    if (!isHydrated) return;
    saveProjectsLocally(store.projects, store.activeId, store.collections);
  }, [store, isHydrated]);

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
    setStore((s) => {
      const nextProjects = s.projects.map((p) => (p.id === s.activeId ? fn(p) : p));
      saveProjectsLocally(nextProjects, s.activeId, s.collections);
      return {
        ...s,
        projects: nextProjects,
      };
    });
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

  const importProject = useCallback(
    (name: string, dataPatch: Partial<WorkspaceData>, github?: { repo: string | null; branch?: string }) => {
      const p = newProject(name || "Imported Product");
      const imported: Project = {
        ...p,
        data: {
          ...p.data,
          ...dataPatch,
          productName: dataPatch.productName || name || p.data.productName,
        },
        github: {
          repo: github?.repo ?? null,
          branch: github?.branch ?? "main",
        },
      };
      setStore((s) => ({ ...s, projects: [...s.projects, imported], activeId: imported.id }));
      return imported.id;
    },
    []
  );

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
    <K extends keyof IdeaData>(field: K, value: IdeaData[K]) => {
      if (typeof window !== "undefined" && storeRef.current.activeId) {
        try {
          const draftKey = `nx_draft_idea_${storeRef.current.activeId}`;
          const currentProj = storeRef.current.projects.find((p) => p.id === storeRef.current.activeId);
          const currentIdea = currentProj?.data.idea || { problem: "", targetUsers: "", currentSolutions: "", differentiation: "" };
          const nextIdea = { ...currentIdea, [field]: value };
          localStorage.setItem(draftKey, JSON.stringify(nextIdea));
        } catch {}
      }
      patchData((d) => ({ ...d, idea: { ...d.idea, [field]: value } }));
    },
    [patchData]
  );

  const updateBrand = useCallback(
    (fieldOrPatch: keyof BrandDNA | Partial<BrandDNA>, value?: any) => {
      if (typeof fieldOrPatch === "object" && fieldOrPatch !== null) {
        patchData((d) => ({ ...d, brand: { ...d.brand, ...fieldOrPatch } }));
      } else {
        patchData((d) => ({ ...d, brand: { ...d.brand, [fieldOrPatch]: value } }));
      }
    },
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
        importProject,
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
