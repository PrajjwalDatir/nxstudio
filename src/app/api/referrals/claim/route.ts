import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { recordReferral } from "@/lib/referrals-server";

export const runtime = "nodejs";

/**
 * Attribute the signed-in user to a referral code (once). Called after signup
 * when a `?ref=` code was captured on the landing page. Idempotent-ish: a user
 * who was already referred gets `{ ok:false, reason:"already_referred" }`, which
 * the client treats as "done, stop retrying".
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { code } = (await request.json().catch(() => ({}))) as { code?: string };
  if (!code?.trim()) return NextResponse.json({ error: "Missing code." }, { status: 400 });

  try {
    const result = await recordReferral(user.id, code.trim());
    return NextResponse.json(result);
  } catch (e) {
    console.error("Error in POST /api/referrals/claim:", e);
    return NextResponse.json({ error: "Failed to record referral." }, { status: 500 });
  }
}
