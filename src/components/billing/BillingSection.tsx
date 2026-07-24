"use client";

import { useState } from "react";
import { useSubscription } from "@/lib/use-subscription";
import { Button } from "@/components/ui/button";
import { CheckCircleIcon, LoaderIcon, ZapIcon } from "@/components/icons";

// Minimal shape of the Razorpay Checkout global we use.
interface RazorpayCheckoutOptions {
  key: string;
  subscription_id: string;
  name: string;
  description?: string;
  prefill?: { email?: string };
  theme?: { color?: string };
  handler: (r: RazorpayHandlerResponse) => void;
  modal?: { ondismiss?: () => void };
}
interface RazorpayHandlerResponse {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}
interface RazorpayInstance {
  open: () => void;
}
declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
  }
}

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadCheckoutScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = CHECKOUT_SRC;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function BillingSection() {
  const { subscription, email, isActive, loading, refresh } = useSubscription();
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subscribe = async () => {
    setWorking(true);
    setError(null);
    try {
      const ok = await loadCheckoutScript();
      if (!ok || !window.Razorpay) throw new Error("Couldn't load Razorpay Checkout.");

      const res = await fetch("/api/billing/subscribe", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start subscription.");

      const rzp = new window.Razorpay({
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "nxstudio",
        description: "Studio subscription",
        prefill: { email },
        theme: { color: "#6366f1" },
        modal: { ondismiss: () => setWorking(false) },
        handler: async (response) => {
          try {
            const verify = await fetch("/api/billing/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            if (!verify.ok) {
              const v = await verify.json();
              throw new Error(v.error ?? "Payment verification failed.");
            }
            await refresh();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Verification failed.");
          } finally {
            setWorking(false);
          }
        },
      });
      rzp.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setWorking(false);
    }
  };

  return (
    <section className="mt-6 rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <ZapIcon className="h-5 w-5 text-primary" />
        <h2 className="font-semibold">Subscription</h2>
      </div>

      {loading ? (
        <p className="mt-3 text-sm text-muted-foreground">Loading subscription…</p>
      ) : isActive ? (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
          <CheckCircleIcon className="h-4 w-4" />
          <span>
            Active{subscription?.current_end ? ` · renews ${new Date(subscription.current_end).toLocaleDateString()}` : ""}
          </span>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            {subscription
              ? `Subscription status: ${subscription.status}. Complete payment to unlock premium features.`
              : "Subscribe to unlock premium features."}
          </p>
          <Button onClick={subscribe} disabled={working} className="gap-2">
            {working && <LoaderIcon className="h-4 w-4 animate-spin" />}
            {working ? "Opening checkout…" : "Subscribe"}
          </Button>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </section>
  );
}
