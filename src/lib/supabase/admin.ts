import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./config";

/**
 * Elevated Supabase client — bypasses Row Level Security. Use ONLY in trusted
 * server contexts that must read/write without a user session: the Razorpay
 * webhook, the crypto billing routes, and server-side prompt compilation. The
 * `server-only` import guarantees this module can never be bundled into client
 * code and leak the key.
 *
 * Prefers the new-format secret key (`sb_secret_...` via SUPABASE_SECRET_KEY);
 * falls back to the legacy `SUPABASE_SERVICE_ROLE_KEY` JWT for older setups.
 */
export function createAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secretKey) {
    throw new Error(
      "Missing Supabase secret key. Set SUPABASE_SECRET_KEY (sb_secret_…) in .env (server-only)."
    );
  }
  return createSupabaseClient(supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
