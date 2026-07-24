"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseUrl, supabasePublishableKey } from "./config";

/**
 * Browser-side Supabase client. Auth state is persisted in cookies (written by
 * @supabase/ssr) so the server can read the same session — never in
 * localStorage. Safe to call on every render; the SDK memoizes internally.
 */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}
