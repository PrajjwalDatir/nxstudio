"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { GithubIcon, LoaderIcon } from "@/components/icons";

/**
 * Kicks off the GitHub OAuth (PKCE) flow. Supabase redirects the browser to
 * GitHub; on return, GitHub → Supabase → our /auth/callback exchanges the code
 * for an httpOnly session cookie. `redirectTo` is where the user lands after.
 */
export function GitHubSignIn({ redirectTo }: { redirectTo: string }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const signIn = async () => {
    setLoading(true);
    setErr(null);
    const supabase = createClient();
    const callback = `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(
      redirectTo
    )}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: callback },
    });
    if (error) {
      setErr(error.message);
      setLoading(false);
    }
    // On success the browser navigates away to GitHub — no further work here.
  };

  return (
    <div className="space-y-3">
      <button
        onClick={signIn}
        disabled={loading}
        className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg bg-foreground text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {loading ? (
          <LoaderIcon className="h-4 w-4 animate-spin" />
        ) : (
          <GithubIcon className="h-4 w-4" />
        )}
        Continue with GitHub
      </button>
      {err && <p className="text-center text-sm text-red-400">{err}</p>}
    </div>
  );
}
