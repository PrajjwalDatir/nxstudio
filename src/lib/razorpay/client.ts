import "server-only";
import crypto from "node:crypto";
import { razorpay } from "./config";

const API = "https://api.razorpay.com/v1";

function authHeader(): string {
  const basic = Buffer.from(`${razorpay.keyId()}:${razorpay.keySecret()}`).toString("base64");
  return `Basic ${basic}`;
}

export interface RazorpaySubscription {
  id: string;
  plan_id: string;
  status: string;
  customer_id?: string;
  current_start: number | null;
  current_end: number | null;
  short_url?: string;
}

/** Create a subscription against the configured Plan. `notes` links it to our user. */
export async function createSubscription(params: {
  notes: Record<string, string>;
  totalCount?: number;
}): Promise<RazorpaySubscription> {
  const res = await fetch(`${API}/subscriptions`, {
    method: "POST",
    headers: { Authorization: authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({
      plan_id: razorpay.planId(),
      // total_count is required by Razorpay: number of billing cycles. 120 =
      // 10 years of monthly billing — effectively "until cancelled".
      total_count: params.totalCount ?? 120,
      customer_notify: 1,
      notes: params.notes,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Razorpay createSubscription failed (${res.status}): ${body}`);
  }
  return (await res.json()) as RazorpaySubscription;
}

export async function fetchSubscription(id: string): Promise<RazorpaySubscription> {
  const res = await fetch(`${API}/subscriptions/${id}`, {
    headers: { Authorization: authHeader() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Razorpay fetchSubscription failed (${res.status}).`);
  return (await res.json()) as RazorpaySubscription;
}

/** Constant-time comparison of two hex signatures. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/**
 * Verify the Checkout handler payload for a subscription. Razorpay signs
 * `payment_id|subscription_id` with the key secret.
 */
export function verifyCheckoutSignature(input: {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}): boolean {
  const expected = crypto
    .createHmac("sha256", razorpay.keySecret())
    .update(`${input.razorpay_payment_id}|${input.razorpay_subscription_id}`)
    .digest("hex");
  return safeEqual(expected, input.razorpay_signature);
}

/** Verify a webhook delivery: HMAC-SHA256 of the raw body with the webhook secret. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const expected = crypto
    .createHmac("sha256", razorpay.webhookSecret())
    .update(rawBody)
    .digest("hex");
  return safeEqual(expected, signature);
}
