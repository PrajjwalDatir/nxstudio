import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCheckoutSignature } from "@/lib/razorpay/client";

/**
 * Called by the browser right after Razorpay Checkout succeeds. We verify the
 * signature (proving the payment is genuine and unmodified) and optimistically
 * flip the row to active. The webhook remains the source of truth and will
 * reconcile lifecycle changes (charged, halted, cancelled…).
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    razorpay_payment_id?: string;
    razorpay_subscription_id?: string;
    razorpay_signature?: string;
  };

  if (
    !body.razorpay_payment_id ||
    !body.razorpay_subscription_id ||
    !body.razorpay_signature
  ) {
    return NextResponse.json({ error: "Missing payment fields." }, { status: 400 });
  }

  const valid = verifyCheckoutSignature({
    razorpay_payment_id: body.razorpay_payment_id,
    razorpay_subscription_id: body.razorpay_subscription_id,
    razorpay_signature: body.razorpay_signature,
  });
  if (!valid) {
    return NextResponse.json({ error: "Invalid payment signature." }, { status: 400 });
  }

  // Only update if this subscription actually belongs to the caller.
  const admin = createAdminClient();
  const { error } = await admin
    .from("subscriptions")
    .update({ status: "active" })
    .eq("user_id", user.id)
    .eq("razorpay_subscription_id", body.razorpay_subscription_id);
  if (error) {
    return NextResponse.json({ error: `DB error: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
