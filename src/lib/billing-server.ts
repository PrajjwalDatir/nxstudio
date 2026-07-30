import "server-only";
import { createClient } from "@/lib/supabase/server";
import { AccessInfo, SubscriptionRow, deriveAccessState, derivePlanTier, getTierInfo, isPremium } from "./billing";
import { solana } from "./solana/config";

export async function getAccessForUser(userId: string): Promise<AccessInfo> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("provider, status, plan_id, current_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  const row = (data as SubscriptionRow | null) ?? null;
  const state = deriveAccessState(row, solana.graceHours());
  const active = isPremium(state);
  const tier = derivePlanTier(row, state);
  const info = getTierInfo(tier);

  return {
    row,
    state,
    isPremium: active,
    ...info,
  };
}
