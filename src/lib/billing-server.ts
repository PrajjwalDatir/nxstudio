import "server-only";
import { createClient } from "@/lib/supabase/server";
import {
  AccessState,
  SubscriptionRow,
  deriveAccessState,
  isPremium as premiumOf,
} from "./subscription-status";
import { solana } from "./solana/config";

/**
 * Resolve a user's access from their subscription row, server-side. Reads through
 * the RLS-scoped user client (owners can read their own subscription), then
 * derives state from `current_period_end` — the single gate every route trusts.
 */
export interface AccessInfo {
  row: SubscriptionRow | null;
  state: AccessState;
  isPremium: boolean;
}

export async function getAccessForUser(userId: string): Promise<AccessInfo> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("provider, status, current_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  const row = (data as SubscriptionRow | null) ?? null;
  const state = deriveAccessState(row, solana.graceHours());
  return { row, state, isPremium: premiumOf(state) };
}
