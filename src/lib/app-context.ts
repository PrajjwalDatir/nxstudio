import { getPhase } from "./phases";
import type { CustomStage } from "./types";

/** Which part of the app the user is in — the one answer both the Topbar
 * breadcrumb and the in-app assistant key off, so they never disagree. */
export interface AppSection {
  /** Stable key for analytics — the matched route, or "/canvas/<phaseId>". */
  key: string;
  /** Human label — "Tech Stack", "Settings", etc. */
  label: string;
  phaseId?: string;
  /** Set only for a matched canvas phase — its own one-line description. */
  description?: string;
}

const SECTION_LABELS: Record<string, string> = {
  "/studio": "Studio",
  "/projects": "Projects",
  "/team": "Team",
  "/calendar": "Calendar",
  "/tasks": "Tasks",
  "/settings": "Settings",
  "/canvas": "Canvas",
};

export function resolveAppSection(pathname: string, customStages: CustomStage[] = []): AppSection {
  const phaseMatch = pathname.match(/^\/canvas\/([^/]+)/);
  if (phaseMatch) {
    const phaseId = phaseMatch[1];
    const phase = getPhase(phaseId);
    const custom = customStages.find((s) => s.id === phaseId);
    return {
      key: `/canvas/${phaseId}`,
      label: phase?.label ?? custom?.label ?? "Canvas",
      phaseId,
      description: phase?.description ?? custom?.description,
    };
  }
  const key = Object.keys(SECTION_LABELS).find((k) => pathname.startsWith(k));
  return { key: key ?? pathname, label: (key && SECTION_LABELS[key]) || "nxstudio" };
}
