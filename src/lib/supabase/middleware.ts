import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseUrl, supabasePublishableKey } from "./config";

/**
 * Paths reachable without an authenticated session. `/api/webhooks` is public
 * because inbound webhooks (e.g. Razorpay) have no user session — they are
 * authenticated by verifying an HMAC signature inside the handler instead.
 */
const PUBLIC_PREFIXES = ["/login", "/auth", "/api/webhooks", "/api/stats", "/api/mcp", "/settings-preview", "/workbench"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Runs on every matched request: refreshes the Supabase session (rotating the
 * access/refresh tokens as needed) and gates protected routes. This is the
 * primary auth boundary — unauthenticated users never reach app routes, and the
 * cookie refresh keeps Server Components from seeing an expired session.
 *
 * The canonical @supabase/ssr pattern is load-bearing here: do NOT insert any
 * logic between `createServerClient` and `getUser()`, and always return the
 * `supabaseResponse` object (with its refreshed cookies) unmodified.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  /**
   * Fast path for the marketing page. Almost everyone hitting "/" is signed
   * out, and `getUser()` is a network call to Supabase Auth — running it on
   * every landing hit would put a round-trip in front of the page we most care
   * about being fast. If no Supabase auth cookie is even present there is
   * definitely no session, so pass straight through.
   */
  if (request.nextUrl.pathname === "/") {
    const hasAuthCookie = request.cookies
      .getAll()
      .some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"));
    if (!hasAuthCookie) return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: getUser() validates the token with Supabase Auth. Keep it
  // immediately after createServerClient — nothing in between.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Unauthenticated → bounce to /login, preserving where they were headed.
  if (!user && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // Already authenticated but sitting on /login or the marketing page → the
  // signed-in user wants the app, not the pitch. Anonymous (guest) sessions
  // are exempt: guests must be able to reach /login at all — that's the only
  // place they can click "Continue with GitHub" to link their account. Without
  // this exemption every guest who follows a "Link account" link (Sidebar,
  // Settings) is bounced straight back to /canvas before the page renders.
  if (user && !user.is_anonymous && (pathname === "/login" || pathname === "/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/canvas";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
