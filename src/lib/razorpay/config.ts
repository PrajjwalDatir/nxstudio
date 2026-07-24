import "server-only";

/**
 * Lazily read + validate Razorpay server secrets. These are NOT validated at
 * import time (unlike Supabase) so the app still boots before billing is
 * configured; each route that needs a value calls the getter, which throws a
 * clear error if the corresponding env var is missing.
 */
function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}. Set it in .env to enable billing.`);
  return v;
}

export const razorpay = {
  keyId: () => required("RAZORPAY_KEY_ID"),
  keySecret: () => required("RAZORPAY_KEY_SECRET"),
  webhookSecret: () => required("RAZORPAY_WEBHOOK_SECRET"),
  planId: () => required("RAZORPAY_PLAN_ID"),
};
