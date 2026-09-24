"use client";

import { useProjects } from "@/lib/workspace-store";
import { useSubscription } from "@/lib/use-subscription";

/**
 * Free: 2 Active Project Workspaces.
 * Pro (10 USDT): Unlimited.
 */
export function useProductLimit() {
  const { projects } = useProjects();
  const { projectLimit, tier } = useSubscription();

  const count = projects.length;
  const isInfinite = !isFinite(projectLimit);
  const atLimit = !isInfinite && count >= projectLimit;

  return { count, limit: projectLimit, tier, atLimit, isInfinite };
}
