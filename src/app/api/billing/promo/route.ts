import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { deriveAccessState } from "@/lib/billing";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  if (user.is_anonymous) {
    return NextResponse.json({ error: "Guest users cannot claim promo codes. Please sign in." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const code = body.code?.trim().toLowerCase();

  if (code !== "nxhuman") {
    return NextResponse.json({ error: "Invalid promo code." }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    
    // Check if max limit reached
    const { count, error: countErr } = await admin
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("provider", "promo");

    if (countErr) {
      return NextResponse.json({ error: `DB error: ${countErr.message}` }, { status: 500 });
    }

    if (count && count >= 100) {
      return NextResponse.json({ error: "This promo code has reached its maximum number of uses." }, { status: 400 });
    }
    
    // 30 days trial
    const trialDays = 30;
    const now = Date.now();
    
    // check if user already has an active subscription
    const { data: row } = await admin
      .from("subscriptions")
      .select("current_period_end, provider")
      .eq("user_id", user.id)
      .maybeSingle();

    if (row?.provider === "promo") {
      return NextResponse.json({ error: "Promo code already claimed." }, { status: 400 });
    }

    const currentEndMs = row?.current_period_end ? new Date(row.current_period_end).getTime() : 0;
    
    // We can either stack it or just start from now. Since it's a promo code, 
    // maybe we just give them 30 days from now, or extend if they already have time.
    const base = Math.max(now, currentEndMs);
    const newEnd = new Date(base + trialDays * 86_400_000).toISOString();

    const { error: upsertErr } = await admin.from("subscriptions").upsert(
      {
        user_id: user.id,
        provider: "promo",
        status: "active",
        plan_id: "pro_10",
        plan_tier: "pro_10",
        plan_amount: 0,
        current_period_end: newEnd,
      },
      { onConflict: "user_id" }
    );

    if (upsertErr) {
      return NextResponse.json({ error: `DB error: ${upsertErr.message}` }, { status: 500 });
    }
    revalidateTag(`subscription:${user.id}`, { expire: 0 });

    const state = deriveAccessState(
      { provider: "promo", current_period_end: newEnd },
      24 // grace hours
    );

    return NextResponse.json({ success: true, state, currentPeriodEnd: newEnd });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to apply promo code.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
