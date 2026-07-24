import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/lib/razorpay/client";

/**
 * Razorpay webhook — the source of truth for subscription state. Configure the
 * endpoint (…/api/webhooks/razorpay) in Dashboard → Settings → Webhooks with
 * the subscription.* events, and set RAZORPAY_WEBHOOK_SECRET to match.
 *
 * We verify the HMAC over the RAW request body before trusting anything, then
 * write with the service-role client (this request has no user session).
 */
export async function POST(request: Request) {
  const signature = request.headers.get("x-razorpay-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  // Must hash the exact bytes Razorpay sent — read the body as text, not JSON.
  const rawBody = await request.text();
  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let event: {
    event?: string;
    payload?: { subscription?: { entity?: RazorpaySubEntity } };
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const entity = event.payload?.subscription?.entity;
  if (!entity?.id) {
    // Not a subscription event we track — acknowledge so Razorpay stops retrying.
    return NextResponse.json({ ok: true, ignored: true });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("subscriptions")
    .update({
      status: entity.status ?? "created",
      plan_id: entity.plan_id ?? null,
      razorpay_customer_id: entity.customer_id ?? null,
      current_start: entity.current_start ? new Date(entity.current_start * 1000).toISOString() : null,
      current_end: entity.current_end ? new Date(entity.current_end * 1000).toISOString() : null,
    })
    .eq("razorpay_subscription_id", entity.id);

  if (error) {
    // 500 → Razorpay retries with backoff.
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

interface RazorpaySubEntity {
  id: string;
  status?: string;
  plan_id?: string;
  customer_id?: string;
  current_start?: number | null;
  current_end?: number | null;
}
