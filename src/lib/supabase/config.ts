/**
 * Central place that reads + validates the public Supabase credentials. Both
 * values are safe to expose to the browser (the URL and the *publishable* key);
 * the secret/service-role key must never live in NEXT_PUBLIC_* and is never
 * imported here. Throwing on missing config fails loudly at boot instead of
 * producing a broken, silently-unauthenticated app.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env."
  );
}

// Re-export as non-optional strings for call sites (the check above guarantees them).
export const supabaseUrl: string = SUPABASE_URL;
export const supabasePublishableKey: string = SUPABASE_PUBLISHABLE_KEY;
