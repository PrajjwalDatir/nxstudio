"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getStoredValue, setStoredValue } from "./storage";
import { CustomStage, IdeaData, TechStackInput, WorkspaceData } from "./types";

/* ------------------------------------------------------------------ */
/* Model                                                              */
/* ------------------------------------------------------------------ */

export interface GitHubConnection {
  /** "owner/name" of the connected repo, or null if not yet chosen. */
  repo: string | null;
  branch: string;
}

export interface Project {
  id: string;
  createdAt: string;
  data: WorkspaceData;
  github: GitHubConnection;
  /** Optional per-phase due dates (ISO). */
  dueDates: Record<string, string>;
}

interface Store {
  projects: Project[];
  activeId: string;
}

function newWorkspaceData(name: string): WorkspaceData {
  return {
    productName: name,
    idea: { problem: "", targetUsers: "", currentSolutions: "", differentiation: "" },
    brand: {
      vibe: "Cyber-Physical, Clean, Architectural",
      primaryColor: "Lilac-500 (#A855F7)",
      radius: "0.5rem (rounded-lg)",
      font: "Geist Sans / Geist Mono",
    },
    tech: {
      target: "",
      strategy: "",
      needsAuth: false,
      needsDatabase: false,
      needsRealtime: false,
      richGraphics: false,
    },
    checklist: {},
    customStages: [],
  };
}

function newProject(name: string): Project {
  return {
    id: `p_${Math.random().toString(36).slice(2, 10)}`,
    createdAt: new Date().toISOString(),
    data: newWorkspaceData(name),
    github: { repo: null, branch: "main" },
    dueDates: {},
  };
}

function defaultStore(): Store {
  const p = newProject("Product 1");
  return { projects: [p], activeId: p.id };
}

/** Merge a possibly-partial stored WorkspaceData onto fresh defaults. */
function hydrateData(stored: Partial<WorkspaceData> | undefined, name: string): WorkspaceData {
  const base = newWorkspaceData(name);
  if (!stored) return base;
  return {
    ...base,
    ...stored,
    idea: { ...base.idea, ...stored.idea },
    brand: { ...base.brand, ...stored.brand },
    tech: { ...base.tech, ...stored.tech },
    checklist: stored.checklist ?? {},
    customStages: stored.customStages ?? [],
  };
}

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

  // Active project data (stable API used by every phase)
  data: WorkspaceData;
  setProductName: (name: string) => void;
  updateIdea: <K extends keyof IdeaData>(field: K, value: IdeaData[K]) => void;
  updateBrand: (field: keyof WorkspaceData["brand"], value: string) => void;
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

  // Due dates
  setDueDate: (phaseId: string, iso: string) => void;

  resetActive: () => void;
}

const Ctx = createContext<WorkspaceContextType | null>(null);

export function useWorkspace() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return c;
}

// Alias for clarity at call sites that manage projects.
export const useProjects = useWorkspace;

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<Store>(defaultStore);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const stored = getStoredValue<Store | null>("projects", null);
    if (stored && Array.isArray(stored.projects) && stored.projects.length > 0) {
      // Rehydrate each project's data onto current defaults.
      const projects = stored.projects.map((p) => ({
        ...newProject(p.data?.productName || "Product"),
        ...p,
        data: hydrateData(p.data, p.data?.productName || "Product"),
        github: { repo: p.github?.repo ?? null, branch: p.github?.branch ?? "main" },
        dueDates: p.dueDates ?? {},
      }));
      const activeId = projects.find((p) => p.id === stored.activeId)?.id ?? projects[0].id;
      setStore({ projects, activeId });
    } else {
      // Migrate a legacy single "workspace" blob if present.
      const legacy = getStoredValue<WorkspaceData | null>("workspace", null);
      if (legacy && legacy.productName !== undefined) {
        const p = newProject(legacy.productName || "Product 1");
        p.data = hydrateData(legacy, legacy.productName || "Product 1");
        setStore({ projects: [p], activeId: p.id });
      }
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) setStoredValue("projects", store);
  }, [store, isHydrated]);

  /* --- helpers to mutate the active project's data --- */
  const patchActive = useCallback(
    (fn: (p: Project) => Project) => {
      setStore((s) => ({
        ...s,
        projects: s.projects.map((p) => (p.id === s.activeId ? fn(p) : p)),
      }));
    },
    []
  );

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
    setStore((s) => ({ projects: [...s.projects, p], activeId: p.id }));
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
      if (remaining.length === 0) return defaultStore();
      const activeId = s.activeId === id ? remaining[0].id : s.activeId;
      return { projects: remaining, activeId };
    });
  }, []);

  /* --- active data updaters (stable API) --- */
  const setProductName = useCallback((name: string) => patchData((d) => ({ ...d, productName: name })), [patchData]);

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
    (phaseId: string, iso: string) =>
      patchActive((p) => ({ ...p, dueDates: { ...p.dueDates, [phaseId]: iso } })),
    [patchActive]
  );

  const resetActive = useCallback(
    () => patchActive((p) => ({ ...p, data: newWorkspaceData(p.data.productName), github: { repo: null, branch: "main" }, dueDates: {} })),
    [patchActive]
  );

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
        data: activeProject.data,
        setProductName,
        updateIdea,
        updateBrand,
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
        setDueDate,
        resetActive,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
