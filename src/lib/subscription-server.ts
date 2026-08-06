import { createClient } from "@/lib/supabase/server";
import { Subscription } from "./use-subscription";

export async function fetchSubscriptionServer(userId: string): Promise<Subscription | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("provider, status, current_end, current_period_end, plan_id")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as Subscription | null) ?? null;
}
