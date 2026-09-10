import { NextResponse } from "next/server";
import { track } from "@vercel/analytics/server";
import { createClient } from "@/lib/supabase/server";

/**
 * PKCE callback: Supabase redirects here (after OAuth, magic link, or email
 * confirmation) with a `code` that we exchange for a session cookie. This is
 * the only place the code lands, and it's server-side, so the tokens are set as
 * httpOnly cookies and never touch client JS.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Only ever redirect to a same-origin relative path (open-redirect guard).
  // We also reject "/\" as browsers normalize it into protocol-relative URLs.
  const nextParam = searchParams.get("redirectTo") ?? "/canvas";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") && !nextParam.startsWith("/\\") ? nextParam : "/canvas";

  if (code) {
    const supabase = await createClient();
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
    await track("auth_error", { method: "github", reason: "code_exchange_failed", message: error.message });
  } else {
    await track("auth_error", { method: "github", reason: "no_code" });
  }

  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`);
}
