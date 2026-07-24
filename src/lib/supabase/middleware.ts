import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseUrl, supabasePublishableKey } from "./config";

/**
 * Paths reachable without an authenticated session. `/api/webhooks` is public
 * because inbound webhooks (e.g. Razorpay) have no user session — they are
 * authenticated by verifying an HMAC signature inside the handler instead.
 */
const PUBLIC_PREFIXES = ["/login", "/auth", "/api/webhooks"];

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

  // Already authenticated but sitting on /login → send to the app.
  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
