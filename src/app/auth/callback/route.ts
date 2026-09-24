import { NextResponse } from "next/server";
import { track } from "@vercel/analytics/server";
import { createClient } from "@/lib/supabase/server";

import { getSafeRedirectUrl } from "@/lib/security/redirect";

/**
 * PKCE callback: Supabase redirects here (after OAuth, magic link, or email
 * confirmation) with a `code` that we exchange for a session cookie. This is
 * the only place the code lands, and it's server-side, so the tokens are set as
 * httpOnly cookies and never touch client JS.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");
  const errorDesc = searchParams.get("error_description");
  // Only ever redirect to a validated, safe same-origin relative path (open-redirect guard).
  const next = getSafeRedirectUrl(searchParams.get("redirectTo"), "/canvas");

  const supabase = await createClient();

  // If the user already has an active authenticated session, direct them straight through
  const { data: { user } } = await supabase.auth.getUser();
  if (user && !user.is_anonymous) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  // Handle explicit errors from provider/Supabase
  if (errorParam) {
    if (errorParam === "identity_already_exists" || errorDesc?.toLowerCase().includes("already")) {
      await track("auth_error", { method: "github", reason: "identity_already_exists" });
      return NextResponse.redirect(`${origin}/login?error=account-already-exists`);
    }
    if (errorParam === "access_denied") {
      await track("auth_error", { method: "github", reason: "access_denied" });
      return NextResponse.redirect(`${origin}/login?error=access-denied`);
    }
    await track("auth_error", { method: "github", reason: errorParam, message: errorDesc || "" });
    return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      await track("auth_success", { method: "github" });
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }

    // Code exchange failing here is the classic in-app-browser symptom: the
    // PKCE verifier cookie set before the GitHub redirect didn't survive the
    // round trip, so the code can't be redeemed.
    const isPkceVerifierLoss =
      error.message?.toLowerCase().includes("code verifier") ||
      error.message?.toLowerCase().includes("flow state");

    await track("auth_error", {
      method: "github",
      reason: isPkceVerifierLoss ? "in_app_browser" : "code_exchange_failed",
      message: error.message,
    });

    if (isPkceVerifierLoss) {
      return NextResponse.redirect(`${origin}/login?error=in-app-browser`);
    }
  } else {
    await track("auth_error", { method: "github", reason: "no_code" });
  }

  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`);
}
