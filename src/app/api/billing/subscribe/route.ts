import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSubscription } from "@/lib/razorpay/client";
import { razorpay } from "@/lib/razorpay/config";

/**
 * Create a Razorpay subscription for the signed-in user and persist a pending
 * row. Returns the subscription id + public key id that the browser needs to
 * open Razorpay Checkout. Auth is enforced via getUser(); the row is written
 * with the service role (RLS denies client writes).
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const subscription = await createSubscription({
      notes: { user_id: user.id, email: user.email ?? "" },
    });

    const admin = createAdminClient();
    const { error } = await admin.from("subscriptions").upsert(
      {
        user_id: user.id,
        razorpay_subscription_id: subscription.id,
        razorpay_customer_id: subscription.customer_id ?? null,
        plan_id: subscription.plan_id,
        status: subscription.status ?? "created",
      },
      { onConflict: "user_id" }
    );
    if (error) {
      console.error(`DB error in subscribe: ${error.message}`);
      return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }
    revalidateTag(`subscription:${user.id}`, { expire: 0 });

    return NextResponse.json({
      subscriptionId: subscription.id,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? razorpay.keyId(),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create subscription.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
