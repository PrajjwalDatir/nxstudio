import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./config";

/**
 * Service-role Supabase client — bypasses Row Level Security. Use ONLY in
 * trusted server contexts that must write on the user's behalf without a user
 * session, i.e. the Razorpay webhook. The `server-only` import guarantees this
 * module can never be bundled into client code and leak the service key.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY (server-only).");
  }
  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
