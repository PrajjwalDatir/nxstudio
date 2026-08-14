import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type AiBudgetResult = "ok" | "rate_limited" | "daily_cap";

const MIN_INTERVAL_SECONDS = Number(process.env.AI_MIN_INTERVAL_SECONDS ?? 4);
const DAILY_CAP = Number(process.env.AI_DAILY_CAP ?? 900);

/**
 * Consumes one slot from the shared, app-wide Gemini free-tier budget. The
 * quota is per Google Cloud project (not per user), so this guards the whole
 * app's ~15-30 RPM / ~1000 RPD ceiling against any single burst of clicks —
 * see try_consume_ai_call() in 0009_ai_context.sql, which enforces both the
 * min-interval and the daily cap atomically in one row-locked call.
 *
 * Retries briefly on rate_limited (a transient burst) but fails fast on
 * daily_cap (retrying won't help until the day rolls over).
 */
export async function consumeAiBudget(): Promise<AiBudgetResult> {
  const admin = createAdminClient();
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await admin.rpc("try_consume_ai_call", {
      p_min_interval_seconds: MIN_INTERVAL_SECONDS,
      p_daily_cap: DAILY_CAP,
    });
    if (error) throw error;
    const result = data as AiBudgetResult;
    if (result !== "rate_limited") return result;
    await new Promise((r) => setTimeout(r, MIN_INTERVAL_SECONDS * 1000 + 250));
  }
  return "rate_limited";
}
