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
     * Run on every path except Next internals, static assets, and public
     * SEO/metadata routes. Auth routes and the login page stay matched (the
     * proxy treats them as public) so an already-signed-in user gets redirected
     * away from /login.
     *
     * The SEO/preview routes MUST be excluded here: crawlers and social-share
     * scrapers are unauthenticated, so without this the proxy would 307 them to
     * /login and break robots.txt, the sitemap, the manifest, and OG images.
     * Covered by extension (txt/xml/webmanifest) plus the two extension-less
     * generated image routes.
     *
     * The legal + about/contact pages stay excluded — fully static, no session
     * needed.
     *
     * _vercel is excluded too — that's Vercel Web Analytics' script/collector
     * path (/_vercel/insights/...), not an app route. It isn't in
     * PUBLIC_PREFIXES either, so without this exclusion an unauthenticated
     * visitor's request for the analytics script gets 307'd to /login and
     * analytics silently never loads for signed-out traffic.
     *
     * The root IS matched (note: no trailing `$` exclusion), so a signed-in
     * visitor gets bounced from the pitch to /canvas. `updateSession` short-
     * circuits root requests that carry no auth cookie before doing any
     * Supabase work, so anonymous landing traffic still costs one cheap cookie
     * read and the page itself stays statically served.
     */
    "/((?!_next/static|_next/image|favicon.ico|opengraph-image|twitter-image|apple-icon|icon|privacy|terms|refund|about|contact|_vercel|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|txt|xml|webmanifest|mp3|ogg|wav|m4a|mp4|webm|woff|woff2)$).*)",
  ],
};
