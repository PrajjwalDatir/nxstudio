import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next 16 renamed the "middleware" file convention to "proxy". This runs the
// Supabase session refresh + route protection on every matched request.
export default async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on every path except Next internals and static assets. Auth routes
     * and the login page stay matched (the proxy treats them as public) so an
     * already-signed-in user gets redirected away from /login.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
