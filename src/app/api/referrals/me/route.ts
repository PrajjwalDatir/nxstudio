import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getReferralStats } from "@/lib/referrals-server";

export const runtime = "nodejs";

/** The signed-in user's referral code + counts, for the affiliate panel. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  try {
    const stats = await getReferralStats(user.id);
    return NextResponse.json(stats);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load referrals.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
