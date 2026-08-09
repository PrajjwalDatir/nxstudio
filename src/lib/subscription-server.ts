import "server-only";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { Subscription } from "./use-subscription";

/**
 * Cached per-user so a hard reload doesn't re-hit Postgres for data that only
 * changes through the billing routes below — those call `revalidateTag` on
 * write, so this never serves stale state to the user who just paid. Reads
 * through the admin client (not the cookie-bound server client) because
 * `unstable_cache` forbids calling `cookies()`/`headers()` inside the cached
 * function; RLS is replaced here by the explicit `user_id` filter.
 */
export async function fetchSubscriptionServer(userId: string): Promise<Subscription | null> {
  return unstable_cache(
    async () => {
      const admin = createAdminClient();
      const { data } = await admin
        .from("subscriptions")
        .select("provider, status, current_end, current_period_end, plan_id")
        .eq("user_id", userId)
        .maybeSingle();
      return (data as Subscription | null) ?? null;
    },
    ["subscription", userId],
    { tags: [`subscription:${userId}`], revalidate: 60 }
  )();
}
