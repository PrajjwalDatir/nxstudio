/**
 * Client-side referral capture. When someone lands via `?ref=CODE`, we stash the
 * code in localStorage so it survives the sign-up round-trip, then claim it once
 * the user is authenticated (see ReferralClaim). Capture is intentionally dumb —
 * all validation (unknown code, self-referral, already-referred) happens on the
 * server in /api/referrals/claim.
 */

const KEY = "nx_ref";

export function storePendingReferral(code: string): void {
  const c = code.trim().toUpperCase();
  if (!c || typeof window === "undefined") return;
  try {
    // Don't overwrite an earlier capture — first touch wins.
    if (!window.localStorage.getItem(KEY)) window.localStorage.setItem(KEY, c);
  } catch {
    // localStorage unavailable (private mode / blocked) — nothing to do.
  }
}

export function readPendingReferral(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function clearPendingReferral(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
