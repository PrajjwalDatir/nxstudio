"use client";

import { useState, useEffect } from "react";
import { track } from "@vercel/analytics";
import { createClient } from "@/lib/supabase/client";
import { GithubIcon, LoaderIcon, CheckCircleIcon } from "@/components/icons";

/**
 * Kicks off the GitHub OAuth (PKCE) flow. Supabase redirects the browser to
 * GitHub; on return, GitHub → Supabase → our /auth/callback exchanges the code
 * for an httpOnly session cookie. `redirectTo` is where the user lands after.
 * 
 * Also provides an Anonymous sign in (Guest Mode).
 */
function detectInAppBrowser(): string | null {
  if (typeof window === "undefined" || typeof navigator === "undefined") return null;
  const ua = navigator.userAgent || "";
  if (/Instagram/i.test(ua)) return "Instagram";
  if (/Twitter|TwitterAndroid|X\//i.test(ua)) return "X / Twitter";
  if (/LinkedIn/i.test(ua)) return "LinkedIn";
  if (/FBAN|FBAV/i.test(ua)) return "Facebook";
  if (/ByteDance|TikTok/i.test(ua)) return "TikTok";
  if (/Snapchat/i.test(ua)) return "Snapchat";
  return null;
}

export function GitHubSignIn({ redirectTo }: { redirectTo: string }) {
  const [loading, setLoading] = useState<"github" | "guest" | false>(false);
  const [err, setErr] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ email?: string; isAnonymous: boolean } | null>(null);
  const [inAppBrowser] = useState<string | null>(detectInAppBrowser);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user && !user.is_anonymous) {
          setCurrentUser({ email: user.email, isAnonymous: false });
        } else if (user?.is_anonymous) {
          setCurrentUser({ email: user.email, isAnonymous: true });
        }
      });
    }
  }, []);

  const signInGithub = async () => {
    setLoading("github");
    setErr(null);
    const supabase = createClient();
    const callback = `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(
      redirectTo
    )}`;

    // If anonymous, preserve the user's project in localStorage so it can be combined into their GitHub account
    const { data: { user } } = await supabase.auth.getUser();

    if (user?.is_anonymous) {
      try {
        const { data: anonProjects } = await supabase.from("projects").select("*");
        if (anonProjects && anonProjects.length > 0) {
          localStorage.setItem("nx_pending_merge_projects", JSON.stringify(anonProjects));
        } else {
          const local = localStorage.getItem("nx-studio:projects") || localStorage.getItem("projects");
          if (local) {
            localStorage.setItem("nx_pending_merge_projects", local);
          }
        }
      } catch {
        // Proceed even if project snapshot encountered a transient issue
      }
    }

    track("auth_start", { method: "github", fromGuest: Boolean(user?.is_anonymous) });

    // Always use signInWithOAuth to ensure both new users and existing GitHub accounts
    // authenticate cleanly without identity_already_exists conflicts.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: callback },
    });

    if (error) {
      track("auth_error", { method: "github", fromGuest: Boolean(user?.is_anonymous), message: error.message });
      setErr(error.message);
      setLoading(false);
    }
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
      window.location.href = redirectTo || "/canvas";
    }
  };

  if (currentUser && !currentUser.isAnonymous) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center">
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-emerald-400">
            <CheckCircleIcon className="h-4 w-4" />
            This account is already logged in
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Signed in as <strong className="text-foreground">{currentUser.email || "GitHub User"}</strong>
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <a
              href={redirectTo || "/canvas"}
              className="flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
            >
              Continue to Canvas
            </a>
            <button
              type="button"
              onClick={async () => {
                const supabase = createClient();
                await supabase.auth.signOut();
                setCurrentUser(null);
                setErr(null);
              }}
              className="mt-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in with a different account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {inAppBrowser && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 text-left text-xs text-amber-300">
          <p className="font-semibold flex items-center gap-1.5">
            <span>⚠️</span> Browsing inside {inAppBrowser}
          </p>
          <p className="mt-1 text-amber-300/80 leading-relaxed">
            In-app browsers can drop cookies during OAuth. For best results, tap <strong>•••</strong> and select <strong>Open in Safari</strong> or <strong>Open in Chrome</strong>.
          </p>
          <button
            type="button"
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2000);
              }
            }}
            className="mt-2 inline-flex items-center gap-1 rounded bg-amber-500/20 px-2 py-1 text-[11px] font-medium text-amber-200 hover:bg-amber-500/30 transition-colors"
          >
            {copiedLink ? "✓ Link Copied! Paste in Safari/Chrome" : "Copy Page Link"}
          </button>
        </div>
      )}

      <button
        onClick={signInGithub}
        disabled={loading !== false}
        className="flex h-12 w-full items-center justify-center gap-2.5 rounded-[10px] border border-border bg-card text-[15px] font-medium text-foreground transition-all hover:bg-muted disabled:opacity-60 cursor-pointer"
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
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-card px-3 text-muted-foreground">or</span>
        </div>
      </div>

      <button
        onClick={signInGuest}
        disabled={loading !== false}
        className="flex h-12 w-full items-center justify-center gap-2.5 rounded-[10px] bg-primary text-[15px] font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-60 cursor-pointer"
      >
        {loading === "guest" && <LoaderIcon className="h-4 w-4 animate-spin text-primary-foreground" />}
        Continue as Guest
      </button>

      {err && <p className="text-center text-sm text-red-400 mt-4">{err}</p>}
    </div>
  );
}
