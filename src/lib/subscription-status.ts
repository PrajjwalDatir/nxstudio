/**
 * Single source of truth for whether a subscription grants access. Pure and
 * isomorphic (no secrets, no I/O) so the server routes AND the client hook derive
 * the same state from the same row. Access is arithmetic on `current_period_end`
 * — no cron, no background job: it's simply re-evaluated every time it's read.
 *
 *   active : now <= period_end
 *   grace  : period_end < now <= period_end + graceHours   (still allowed in)
 *   locked : now > period_end + graceHours
 *   none   : never paid / no period
 *
 * `isPremium` (active OR grace) is the flag every gate checks.
 */

export type AccessState = "active" | "grace" | "locked" | "none";

// Statuses from the (unwired) Razorpay path that still count as paid.
const RAZORPAY_ACTIVE = new Set(["active", "authenticated", "completed"]);

export interface SubscriptionRow {
  provider?: string | null;
  status?: string | null;
  current_period_end?: string | null;
}

export function deriveAccessState(
  row: SubscriptionRow | null,
  graceHours = 48,
  now: Date = new Date()
): AccessState {
  if (!row) return "none";

  // Crypto rows are governed entirely by current_period_end.
  if (row.provider === "crypto") {
    if (!row.current_period_end) return "none";
    const end = new Date(row.current_period_end).getTime();
    const nowMs = now.getTime();
    if (nowMs <= end) return "active";
    if (nowMs <= end + graceHours * 3_600_000) return "grace";
    return "locked";
  }

  // Razorpay (kept working, not surfaced): trust the webhook-maintained status.
  return row.status && RAZORPAY_ACTIVE.has(row.status) ? "active" : "none";
}

export function isPremium(state: AccessState): boolean {
  return state === "active" || state === "grace";
}
