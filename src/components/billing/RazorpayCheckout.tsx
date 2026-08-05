"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { LoaderIcon, CreditCardIcon } from "@/components/icons";

const SUPPORT_EMAIL = "in.prajj@gmail.com";
const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

interface RazorpayFailureResponse {
  error?: { description?: string };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: "payment.failed", handler: (response: RazorpayFailureResponse) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

function loadCheckoutScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const existing = document.querySelector(`script[src="${CHECKOUT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.src = CHECKOUT_SRC;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function RazorpayCheckout({ onActivated }: { onActivated?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [needsSupport, setNeedsSupport] = useState(false);

  const start = useCallback(async () => {
    setLoading(true);
    setNote(null);
    setNeedsSupport(false);
    try {
      const scriptOk = await loadCheckoutScript();
      if (!scriptOk || !window.Razorpay) {
        throw new Error("Couldn't load the payment form. Check your connection and try again.");
      }

      const res = await fetch("/api/billing/subscribe", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't start checkout.");

      const rzp = new window.Razorpay({
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "nxstudio",
        description: "Pro — unlimited project workspaces",
        theme: { color: "#7c3aed" },
        handler: async (response: RazorpaySuccessResponse) => {
          try {
            const verifyRes = await fetch("/api/billing/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error ?? "Verification failed.");
            setNote("Payment confirmed — access activated.");
            onActivated?.();
          } catch (e) {
            setNote(e instanceof Error ? e.message : "Verification failed.");
            setNeedsSupport(true);
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });
      rzp.on("payment.failed", (response) => {
        setNote(response.error?.description ?? "That payment couldn't be completed.");
        setLoading(false);
      });
      rzp.open();
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Something went wrong.");
      setLoading(false);
    }
  }, [onActivated]);

  return (
    <div className="space-y-3">
      <Button
        onClick={start}
        disabled={loading}
        variant="outline"
        className="w-full gap-2 font-mono text-xs uppercase"
      >
        {loading ? (
          <LoaderIcon className="h-4 w-4 animate-spin" />
        ) : (
          <CreditCardIcon className="h-4 w-4" />
        )}
        {loading ? "Opening checkout…" : "Pay with Card / UPI / Netbanking"}
      </Button>
      {note && (
        <p className={needsSupport ? "text-sm text-amber-400" : "text-sm text-muted-foreground"}>
          {note}
          {needsSupport && (
            <>
              {" "}
              Contact{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="underline">
                {SUPPORT_EMAIL}
              </a>{" "}
              if the charge went through.
            </>
          )}
        </p>
      )}
    </div>
  );
}
