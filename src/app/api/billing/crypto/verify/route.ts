import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPayment } from "@/lib/solana/client";
import { solana } from "@/lib/solana/config";
import { deriveAccessState } from "@/lib/billing";
import { markReferralConverted } from "@/lib/referrals-server";

// @solana/web3.js needs the Node runtime. Do not switch to edge.
export const runtime = "nodejs";

const SUPPORT_EMAIL = "support@nxstudio.dev";

/**
 * Verify a crypto payment and extend the subscription. Uses the reference stored
 * on the user's row (the "I've already paid" path may echo it back, but we only
 * ever verify a reference WE issued to this caller). All trust comes from
 * on-chain verification; the unique signature PK makes replay impossible.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { reference?: string };
  const pasted = body.reference?.trim();

  try {
    const admin = createAdminClient();
    const { data: row } = await admin
      .from("subscriptions")
      .select("pending_reference, pending_amount, plan_id, current_period_end")
      .eq("user_id", user.id)
      .maybeSingle();

    const stored = row?.pending_reference ?? null;
    if (!stored) {
      return NextResponse.json(
        { error: "No pending payment. Start a subscription first." },
        { status: 400 }
      );
    }
    // If they pasted a reference, it must be the one we issued to them.
    if (pasted && pasted !== stored) {
      return NextResponse.json(
        { error: `That reference isn't linked to your account. Email ${SUPPORT_EMAIL} if you paid.` },
        { status: 400 }
      );
    }

    const expectedAmt = row?.pending_amount ? String(row.pending_amount) : undefined;
    const result = await verifyPayment(stored, expectedAmt);
    if (!result.ok) {
      // not_found → poll again shortly; invalid → needs support.
      return NextResponse.json({
        verified: false,
        reason: result.reason,
        message: result.message,
        support: result.reason === "invalid" ? SUPPORT_EMAIL : undefined,
      });
    }

    // Record the payment. The unique signature PK is the replay guard: a signature
    // can grant exactly one cycle, ever.
    const { error: insertErr } = await admin.from("crypto_payments").insert({
      signature: result.signature,
      user_id: user.id,
      reference: stored,
      mint: result.mint,
      amount: result.amount,
    });

    if (insertErr) {
      // 23505 = unique violation → this signature was already redeemed. Don't extend
      // again; just report the current state.
      if (insertErr.code === "23505") {
        const state = deriveAccessState(
          { provider: "crypto", current_period_end: row?.current_period_end ?? null },
          solana.graceHours()
        );
        return NextResponse.json({
          verified: true,
          alreadyRedeemed: true,
          state,
          currentPeriodEnd: row?.current_period_end ?? null,
        });
      }
      console.error(`DB error saving crypto payment: ${insertErr.message}`);
      return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }

    // Extend from whichever is later: now, or the current period end (stacking renewals).
    const now = Date.now();
    const currentEndMs = row?.current_period_end ? new Date(row.current_period_end).getTime() : 0;
    const base = Math.max(now, currentEndMs);
    const newEnd = new Date(base + solana.cycleDays() * 86_400_000).toISOString();
    const finalPlanId = row?.plan_id || (result.amount === "50" ? "master_50" : "pro_10");

    const { error: updateErr } = await admin
      .from("subscriptions")
      .update({
        provider: "crypto",
        status: "active",
        plan_id: finalPlanId,
        plan_tier: finalPlanId,
        plan_amount: Number(result.amount),
        current_period_end: newEnd,
        pending_reference: null,
        pending_amount: null,
        pending_mint: null,
      })
      .eq("user_id", user.id);
    if (updateErr) {
      console.error(`DB error updating subscription: ${updateErr.message}`);
      return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }

    // Convert any pending referral now that this user is premium. Best-effort:
    // a referral hiccup must never fail a verified payment.
    try {
      await markReferralConverted(user.id);
    } catch {
      // swallow — payment already succeeded; conversion can be reconciled later.
    }

    const state = deriveAccessState(
      { provider: "crypto", current_period_end: newEnd },
      solana.graceHours()
    );
    return NextResponse.json({ verified: true, state, currentPeriodEnd: newEnd });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Verification failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
