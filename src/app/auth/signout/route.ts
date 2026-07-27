import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Sign out via POST (so it can't be triggered by a stray GET / prefetch).
 * Clears the Supabase session cookies, then 303-redirects to the home page.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
