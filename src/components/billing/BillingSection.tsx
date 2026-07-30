"use client";

import { useSubscription } from "@/lib/use-subscription";
import { useProductLimit } from "@/lib/use-product-limit";
import { CryptoCheckout } from "./CryptoCheckout";
import { PricingGrid } from "./PricingGrid";
import { CheckCircleIcon, ZapIcon, LockIcon, ShieldCheckIcon } from "@/components/icons";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const SUPPORT_EMAIL = "support@nxstudio.dev";

function fmt(date: string | null): string {
  return date ? new Date(date).toLocaleDateString() : "";
}

export function BillingSection() {
  const { subscription, state, tier, tierName, projectLimit, loading, refresh } = useSubscription();
  const { count } = useProductLimit();
  const [showPlans, setShowPlans] = useState(false);
  const periodEnd = subscription?.current_period_end ?? subscription?.current_end ?? null;

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ZapIcon className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-lg">Subscription Tier</h2>
        </div>
        <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-primary">
          {tierName}
        </span>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading subscription details…</p>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="rounded-xl border border-border/80 bg-background/60 p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Active Workspaces:</span>
              <span className="font-mono font-medium">
                {count} / {isFinite(projectLimit) ? projectLimit : "Unlimited"}
              </span>
            </div>
            {isFinite(projectLimit) && (
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.min((count / projectLimit) * 100, 100)}%` }}
                />
              </div>
            )}
          </div>

          {state === "active" ? (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
              <CheckCircleIcon className="h-4 w-4 shrink-0" />
              <span>
                {tierName} active{periodEnd ? ` · Renews ${fmt(periodEnd)}` : ""}
              </span>
            </div>
          ) : state === "grace" ? (
            <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
              <LockIcon className="h-4 w-4 shrink-0" />
              <span>Payment overdue — renew within 48 hours to preserve multi-project access.</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              You are currently on the <strong className="text-foreground">Free</strong> plan (1 project ALL ACCESS). Upgrade for multi-project collections, prompt gallery, or autonomous machine workflows.
            </p>
          )}

          <div className="pt-2">
            <Button
              variant="outline"
              onClick={() => setShowPlans(!showPlans)}
              className="font-mono text-xs uppercase tracking-wider"
            >
              {showPlans ? "Hide Tier Matrix" : "View Tiers & Upgrade"}
            </Button>
          </div>

          {showPlans ? (
            <div className="mt-6">
              <PricingGrid currentTier={tier} />
              <div className="mt-6 rounded-xl border border-border bg-background p-4">
                <CryptoCheckout onActivated={() => { refresh(); setShowPlans(false); }} />
              </div>
            </div>
          ) : state !== "active" && (
            <div className="mt-4 rounded-xl border border-border bg-background p-4">
              <CryptoCheckout onActivated={refresh} />
            </div>
          )}
        </div>
      )}

      <p className="mt-5 text-xs text-muted-foreground">
        Billing support or custom enterprise workflows?{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="underline text-foreground">
          {SUPPORT_EMAIL}
        </a>
      </p>
    </section>
  );
}
