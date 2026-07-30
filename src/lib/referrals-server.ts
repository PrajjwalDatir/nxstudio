import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Server-only referral/affiliate engine. All writes use the service-role client
 * (referral tables deny client writes via RLS). A referral code is the stable
 * "resolve a code to a person" mapping; a `referrals` row attributes one
 * referred user to a referrer and flips to 'converted' when they go premium.
 *
 * Payout amounts (20–30% of the monthly fee, up to 6 months, prorated) are NOT
 * computed here — they're derived from converted rows + subscription history at
 * payout time, once payout mechanics are finalized.
 */

// Crockford-ish alphabet: no 0/O/1/I to keep shared codes unambiguous.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 7;

export function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

function generateCode(): string {
  let s = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    s += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return s;
}

/** Return the user's stable referral code, generating one on first call. */
export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("referral_codes")
    .select("code")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing?.code) return existing.code as string;

  // Retry a few times: a 23505 can be a concurrent insert for the same user
  // (return theirs) or a code collision (try another code).
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    const { error } = await admin.from("referral_codes").insert({ code, user_id: userId });
    if (!error) return code;
    if (error.code === "23505") {
      const { data } = await admin
        .from("referral_codes")
        .select("code")
        .eq("user_id", userId)
        .maybeSingle();
      if (data?.code) return data.code as string;
      continue; // code clash — pick a new one
    }
    throw new Error(`Failed to create referral code: ${error.message}`);
  }
  throw new Error("Could not generate a unique referral code.");
}

/** Resolve a referral code to its owner's user id, or null if unknown. */
export async function resolveReferralCode(code: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("referral_codes")
    .select("user_id")
    .eq("code", normalizeCode(code))
    .maybeSingle();
  return (data?.user_id as string | undefined) ?? null;
}

export type RecordReferralResult =
  | { ok: true }
  | { ok: false; reason: "unknown_code" | "self_referral" | "already_referred" | string };

/**
 * Attribute `referredUserId` to `code` as a pending referral. No-op (with a
 * reason) if the code is unknown, it's a self-referral, or the user was already
 * referred — a user can be attributed to at most one referrer, ever.
 */
export async function recordReferral(
  referredUserId: string,
  code: string
): Promise<RecordReferralResult> {
  const referrerId = await resolveReferralCode(code);
  if (!referrerId) return { ok: false, reason: "unknown_code" };
  if (referrerId === referredUserId) return { ok: false, reason: "self_referral" };

  const admin = createAdminClient();
  const { error } = await admin.from("referrals").insert({
    referrer_user_id: referrerId,
    referred_user_id: referredUserId,
    code: normalizeCode(code),
    status: "pending",
  });
  if (error) {
    if (error.code === "23505") return { ok: false, reason: "already_referred" };
    return { ok: false, reason: error.message };
  }
  return { ok: true };
}

/**
 * Mark a referred user's attribution as converted when they become premium.
 * Idempotent: only flips pending → converted, so re-running on renewals is a
 * no-op. Safe to call on every successful payment.
 */
export async function markReferralConverted(referredUserId: string): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("referrals")
    .update({ status: "converted", converted_at: new Date().toISOString() })
    .eq("referred_user_id", referredUserId)
    .eq("status", "pending");
}

export interface ReferralStats {
  code: string;
  pending: number;
  converted: number;
}

/** The signed-in user's affiliate summary (code + referral counts). */
export async function getReferralStats(userId: string): Promise<ReferralStats> {
  const code = await getOrCreateReferralCode(userId);
  const admin = createAdminClient();
  const { data } = await admin
    .from("referrals")
    .select("status")
    .eq("referrer_user_id", userId);
  const rows = (data as { status: string }[] | null) ?? [];
  return {
    code,
    pending: rows.filter((r) => r.status === "pending").length,
    converted: rows.filter((r) => r.status === "converted").length,
  };
}
