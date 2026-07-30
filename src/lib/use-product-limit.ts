"use client";

import { useProjects } from "@/lib/workspace-store";
import { useSubscription } from "@/lib/use-subscription";

/**
 * Free accounts: 1 project.
 * Atelier (10 USDT): 5 projects.
 * Black Label VIP (50 USDT): Unlimited (Infinity).
 */
export function useProductLimit() {
  const { projects } = useProjects();
  const { projectLimit, tier, loading } = useSubscription();

  const count = projects.length;
  const isInfinite = !isFinite(projectLimit);
  const atLimit = !loading && !isInfinite && count >= projectLimit;

  return { count, limit: projectLimit, tier, atLimit, loading, isInfinite };
}
