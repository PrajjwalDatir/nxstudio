"use client";

import { useSubscription } from "@/lib/use-subscription";
import { CryptoCheckout } from "./CryptoCheckout";
import { CheckCircleIcon, ZapIcon, LockIcon } from "@/components/icons";

const SUPPORT_EMAIL = "support@nxstudio.dev";

function fmt(date: string | null): string {
  return date ? new Date(date).toLocaleDateString() : "";
}

/**
 * Billing panel. Crypto (Solana USDC/USDT) is the surfaced payment method; the
 * Razorpay code is kept but not wired here. Access state is derived by
 * useSubscription (active → grace → locked) from the crypto cycle end.
 */
export function BillingSection() {
  const { subscription, state, loading, refresh } = useSubscription();
  const periodEnd = subscription?.current_period_end ?? subscription?.current_end ?? null;

  return (
    <section className="mt-6 rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <ZapIcon className="h-5 w-5 text-primary" />
        <h2 className="font-semibold">Subscription</h2>
      </div>

      {loading ? (
        <p className="mt-3 text-sm text-muted-foreground">Loading subscription…</p>
      ) : state === "active" ? (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
          <CheckCircleIcon className="h-4 w-4" />
          <span>Active{periodEnd ? ` · renews ${fmt(periodEnd)}` : ""}</span>
        </div>
      ) : state === "grace" ? (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
            <LockIcon className="h-4 w-4" />
            <span>Payment overdue — renew within 48 hours to avoid losing access.</span>
          </div>
          <CryptoCheckout onActivated={refresh} />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            {state === "locked"
              ? "Your subscription has lapsed. Renew with crypto to unlock premium again."
              : "Subscribe with crypto (Solana USDC/USDT) to unlock premium — your build prompts."}
          </p>
          <CryptoCheckout onActivated={refresh} />
        </div>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        Payment issues?{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="underline">
          {SUPPORT_EMAIL}
        </a>
      </p>
    </section>
  );
}
