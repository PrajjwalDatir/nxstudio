/**
 * Staleness — is a derived artifact still describing the source it was
 * derived from? `briefInsights` is generated from `idea` + the tech stack's
 * capabilities at accept-time (see IdeaPhase.tsx); if the founder edits
 * either afterward, the accepted analysis silently starts describing a
 * product that no longer exists unless something flags it. This is the one
 * check: pure and isomorphic so both the client (banner) and the scoped-
 * iteration route (server) can call it.
 */

import { Capability, IdeaData, Surface, WorkspaceData } from "./types";

function sameIdea(a: IdeaData, b: IdeaData): boolean {
  return (
    a.problem === b.problem &&
    a.targetUsers === b.targetUsers &&
    a.currentSolutions === b.currentSolutions &&
    a.differentiation === b.differentiation
  );
}

function sameSet<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((v) => set.has(v));
}

/** True when `data.briefInsights` no longer matches the idea/capabilities/surfaces it was generated from. */
export function isBriefInsightsStale(data: WorkspaceData): boolean {
  const insights = data.briefInsights;
  if (!insights) return false;
  return (
    !sameIdea(data.idea, insights.sourceIdea) ||
    !sameSet<Capability>(data.tech.capabilities, insights.sourceCapabilities) ||
    !sameSet<Surface>(data.tech.surfaces, insights.sourceSurfaces)
  );
}
