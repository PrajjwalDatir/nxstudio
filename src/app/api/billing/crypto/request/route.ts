import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPaymentRequest } from "@/lib/solana/client";
import { solana } from "@/lib/solana/config";

// @solana/web3.js needs the Node runtime. Do not switch to edge.
export const runtime = "nodejs";

/**
 * Start (or resume) a crypto payment for the Pro plan.
 */
export async function POST(_request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  try {
    const admin = createAdminClient();

    const { data: existing } = await admin
      .from("subscriptions")
      .select("pending_reference")
      .eq("user_id", user.id)
      .maybeSingle();

    // Resume an in-flight reference, or mint a fresh one.
    const payment = createPaymentRequest(existing?.pending_reference ?? undefined);

    // Persist the reference (+ amount we're charging) before returning it.
    const { error } = await admin.from("subscriptions").upsert(
      {
        user_id: user.id,
        provider: "crypto",
        plan_id: "pro_10",
        pending_reference: payment.reference,
        pending_amount: payment.amount,
        pending_mint: solana.usdcMint(),
      },
      { onConflict: "user_id" }
    );
    if (error) {
      console.error(`DB error requesting crypto payment: ${error.message}`);
      return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }

    return NextResponse.json({
      reference: payment.reference,
      url: payment.url,
      amount: payment.amount,
      tier: "pro_10",
      wallet: solana.walletAddress(),
      cycleDays: solana.cycleDays(),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to start crypto payment.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
