import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseUrl, supabasePublishableKey } from "./config";

/**
 * Server-side Supabase client for Server Components, Route Handlers, and
 * Server Actions. Reads/writes the auth session through Next's cookie store.
 *
 * For any authorization decision, call `supabase.auth.getUser()` (which
 * re-validates the JWT against Supabase's Auth server) — never trust
 * `getSession()` on the server, since that only decodes the cookie.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // `setAll` was called from a Server Component, where cookies are
          // read-only. Safe to ignore — the middleware refreshes the session.
        }
      },
    },
  });
}
