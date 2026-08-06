import React from "react";
import {
  ScaffoldIcon,
  PaletteIcon,
  FolderIcon,
  UsersIcon,
  CalendarIcon,
  ListChecksIcon,
  SettingsIcon,
  SparklesIcon,
  BoxIcon,
  PlayIcon,
  PencilIcon,
  GitBranchIcon,
} from "@/components/icons";
import { PHASES } from "@/lib/phases";
import type { Project } from "@/lib/projects";

export interface NavItem {
  id: string;
  href: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  group: "Pages" | "Studio Modes" | "Phases" | "Projects";
  match?: (pathname: string) => boolean;
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  {
    id: "nav-canvas",
    href: "/canvas",
    label: "Canvas",
    description: "Main workspace canvas and lifecycle stages",
    icon: ScaffoldIcon,
    group: "Pages",
    match: (p) => p === "/canvas",
  },
  {
    id: "nav-context",
    href: "/canvas/context",
    label: ".nx Context",
    description: "Full .nx/ context directory, diffs, and temporal git history",
    icon: GitBranchIcon,
    group: "Pages",
    match: (p) => p.startsWith("/canvas/context"),
  },
  {
    id: "nav-studio",
    href: "/studio",
    label: "Studio",
    description: "Generative p5, 3D R3F, Motion & Annotate studio",
    icon: PaletteIcon,
    group: "Pages",
    match: (p) => p.startsWith("/studio"),
  },
  {
    id: "nav-projects",
    href: "/projects",
    label: "Projects",
    description: "Manage and switch active projects",
    icon: FolderIcon,
    group: "Pages",
    match: (p) => p === "/projects",
  },
  {
    id: "nav-team",
    href: "/team",
    label: "Team",
    description: "Collaborators and team permissions",
    icon: UsersIcon,
    group: "Pages",
    match: (p) => p === "/team",
  },
  {
    id: "nav-calendar",
    href: "/calendar",
    label: "Calendar",
    description: "Project timelines and schedule milestones",
    icon: CalendarIcon,
    group: "Pages",
    match: (p) => p === "/calendar",
  },
  {
    id: "nav-tasks",
    href: "/tasks",
    label: "Tasks",
    description: "Sprint tasks and implementation checklist",
    icon: ListChecksIcon,
    group: "Pages",
    match: (p) => p === "/tasks",
  },
  {
    id: "nav-settings",
    href: "/settings",
    label: "Settings",
    description: "Workspace & API configuration",
    icon: SettingsIcon,
    group: "Pages",
    match: (p) => p === "/settings",
  },
];

export const STUDIO_MODE_NAV_ITEMS: NavItem[] = [
  {
    id: "studio-mode-design",
    href: "/studio?mode=design",
    label: "Studio: Design",
    description: "Generative p5 canvas & brand controls",
    icon: SparklesIcon,
    group: "Studio Modes",
  },
  {
    id: "studio-mode-3d",
    href: "/studio?mode=3d",
    label: "Studio: 3D Scene",
    description: "Three.js 3D primitives & studio lighting",
    icon: BoxIcon,
    group: "Studio Modes",
  },
  {
    id: "studio-mode-motion",
    href: "/studio?mode=motion",
    label: "Studio: Motion",
    description: "Theatre.js animation timeline & keyframe presets",
    icon: PlayIcon,
    group: "Studio Modes",
  },
  {
    id: "studio-mode-sketch",
    href: "/studio?mode=sketch",
    label: "Studio: Annotate / Sketch",
    description: "Excalidraw draw & paint overlay",
    icon: PencilIcon,
    group: "Studio Modes",
  },
];

export function getPhaseNavItems(): NavItem[] {
  return PHASES.map((ph) => ({
    id: `phase-${ph.id}`,
    href: `/canvas/${ph.id}`,
    label: `Phase: ${ph.label}`,
    description: ph.description,
    icon: ScaffoldIcon,
    group: "Phases",
  }));
}

export function getProjectNavItems(projects: Project[]): NavItem[] {
  return projects.map((pr) => ({
    id: `project-${pr.id}`,
    href: `/canvas`,
    label: pr.data.productName || "Untitled Project",
    description: "Switch active project",
    icon: FolderIcon,
    group: "Projects",
  }));
}
