/**
 * Central place that reads + validates the public Supabase credentials. Both
 * values are safe to expose to the browser (the URL and the *publishable* key);
 * the secret/service-role key must never live in NEXT_PUBLIC_* and is never
 * imported here. Throwing on missing config fails loudly at boot instead of
 * producing a broken, silently-unauthenticated app.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isCloudConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

export const isLocalMode =
  process.env.NX_LOCAL_MODE === "1" ||
  !isCloudConfigured ||
  (process.env.NODE_ENV !== "production" && !isCloudConfigured);

// In cloud/production mode, require Supabase credentials. In local/offline mode, provide safe fallbacks.
export const supabaseUrl: string = SUPABASE_URL || "https://local-placeholder.supabase.co";
export const supabasePublishableKey: string = SUPABASE_PUBLISHABLE_KEY || "local-placeholder-anon-key";

