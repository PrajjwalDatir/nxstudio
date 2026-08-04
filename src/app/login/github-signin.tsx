"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { GithubIcon, LoaderIcon } from "@/components/icons";

/**
 * Kicks off the GitHub OAuth (PKCE) flow. Supabase redirects the browser to
 * GitHub; on return, GitHub → Supabase → our /auth/callback exchanges the code
 * for an httpOnly session cookie. `redirectTo` is where the user lands after.
 * 
 * Also provides an Anonymous sign in (Guest Mode).
 */
export function GitHubSignIn({ redirectTo }: { redirectTo: string }) {
  const [loading, setLoading] = useState<"github" | "guest" | false>(false);
  const [err, setErr] = useState<string | null>(null);

  const signInGithub = async () => {
    setLoading("github");
    setErr(null);
    const supabase = createClient();
    const callback = `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(
      redirectTo
    )}`;
    
    // Check if user is currently anonymous
    const { data: { user } } = await supabase.auth.getUser();

    if (user?.is_anonymous) {
      // Link GitHub identity to the current anonymous user
      const { error } = await supabase.auth.linkIdentity({
        provider: "github",
        options: { redirectTo: callback },
      });
      if (error) {
        setErr(error.message);
        setLoading(false);
      }
    } else {
      // Standard sign in
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: { redirectTo: callback },
      });
      if (error) {
        setErr(error.message);
        setLoading(false);
      }
    }
  };

  const signInGuest = async () => {
    setLoading("guest");
    setErr(null);
    const supabase = createClient();
    
    const { error } = await supabase.auth.signInAnonymously();
    
    if (error) {
      setErr(error.message);
      setLoading(false);
    } else {
      // Upon successful anonymous auth, @supabase/ssr writes the cookie.
      // We can redirect the user to the destination.
      window.location.href = redirectTo || "/canvas";
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={signInGithub}
        disabled={loading !== false}
        className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg bg-foreground text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {loading === "github" ? (
          <LoaderIcon className="h-4 w-4 animate-spin" />
        ) : (
          <GithubIcon className="h-4 w-4" />
        )}
        Continue with GitHub
      </button>

      <button
        onClick={signInGuest}
        disabled={loading !== false}
        className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-border bg-background text-sm font-medium text-foreground transition-all hover:bg-secondary disabled:opacity-60"
      >
        {loading === "guest" && <LoaderIcon className="h-4 w-4 animate-spin" />}
        Continue as Guest
      </button>

      {err && <p className="text-center text-sm text-red-400">{err}</p>}
    </div>
  );
}
