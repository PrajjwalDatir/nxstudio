"use client";

import { useState } from "react";
import { track } from "@vercel/analytics";
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
      track("auth_start", { method: "github", fromGuest: true });
      const { error } = await supabase.auth.linkIdentity({
        provider: "github",
        options: { redirectTo: callback },
      });
      if (error) {
        track("auth_error", { method: "github", fromGuest: true, message: error.message });
        setErr(error.message);
        setLoading(false);
      }
    } else {
      // Standard sign in
      track("auth_start", { method: "github", fromGuest: false });
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: { redirectTo: callback },
      });
      if (error) {
        track("auth_error", { method: "github", fromGuest: false, message: error.message });
        setErr(error.message);
        setLoading(false);
      }
    }
    // Success isn't tracked here — it's a full-page redirect to GitHub, so this
    // component unmounts before any success state exists. /auth/callback is
    // where a completed sign-in would be tracked server-side.
  };

  const signInGuest = async () => {
    setLoading("guest");
    setErr(null);
    track("auth_start", { method: "guest" });
    const supabase = createClient();

    const { error } = await supabase.auth.signInAnonymously();

    if (error) {
      track("auth_error", { method: "guest", message: error.message });
      setErr(error.message);
      setLoading(false);
    } else {
      track("auth_success", { method: "guest" });
      // Upon successful anonymous auth, @supabase/ssr writes the cookie.
      // We can redirect the user to the destination.
      window.location.href = redirectTo || "/canvas";
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={signInGithub}
        disabled={loading !== false}
        className="flex h-12 w-full items-center justify-center gap-2.5 rounded-[10px] border border-[#333333] bg-transparent text-[15px] font-medium text-white transition-all hover:bg-white/5 disabled:opacity-60"
      >
        {loading === "github" ? (
          <LoaderIcon className="h-4 w-4 animate-spin" />
        ) : (
          <GithubIcon className="h-4 w-4" />
        )}
        Continue with GitHub
      </button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-[#111111] px-3 text-[#555555]">or</span>
        </div>
      </div>

      <button
        onClick={signInGuest}
        disabled={loading !== false}
        className="flex h-12 w-full items-center justify-center gap-2.5 rounded-[10px] bg-white text-[15px] font-medium text-black transition-all hover:bg-zinc-200 disabled:opacity-60"
      >
        {loading === "guest" && <LoaderIcon className="h-4 w-4 animate-spin text-black" />}
        Continue as Guest
      </button>

      {err && <p className="text-center text-sm text-red-400 mt-4">{err}</p>}
    </div>
  );
}
