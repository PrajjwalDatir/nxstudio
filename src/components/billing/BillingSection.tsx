"use client";

import { useSubscription } from "@/lib/use-subscription";
import { useProductLimit } from "@/lib/use-product-limit";
import { CryptoCheckout } from "./CryptoCheckout";
import { RazorpayCheckout } from "./RazorpayCheckout";
import { PricingGrid } from "./PricingGrid";
import { CheckCircleIcon, ZapIcon, LockIcon, LoaderIcon } from "@/components/icons";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { siteConfig } from "@/lib/site";

const SUPPORT_EMAIL = siteConfig.contactEmail;

function fmt(date: string | null): string {
  return date ? new Date(date).toLocaleDateString() : "";
}

export function BillingSection() {
  const { subscription, state, tier, tierName, projectLimit, refresh } = useSubscription();
  const { count } = useProductLimit();
  const [showPlans, setShowPlans] = useState(false);
  
  const [promoCode, setPromoCode] = useState("");
  const [promoStatus, setPromoStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [promoMessage, setPromoMessage] = useState("");

  const periodEnd = subscription?.current_period_end ?? subscription?.current_end ?? null;

  const applyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoStatus("loading");
    setPromoMessage("");
    try {
      const res = await fetch("/api/billing/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to apply promo code");
      setPromoStatus("success");
      setPromoMessage("Promo code applied! You now have Pro access.");
      refresh();
    } catch (e) {
      setPromoStatus("error");
      setPromoMessage(e instanceof Error ? e.message : "Error applying code.");
    }
  };

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ZapIcon className="h-5 w-5 text-accent-foreground" />
          <h2 className="font-semibold text-lg">Subscription Tier</h2>
        </div>
        <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-accent-foreground">
          {tierName}
        </span>
      </div>

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
            You are currently on the <strong className="text-foreground">Free</strong> plan (2 projects ALL ACCESS). Upgrade to Pro for unlimited workspaces and no gates.
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
            <div className="mt-6 rounded-xl border border-border bg-background p-4 space-y-4">
              <RazorpayCheckout onActivated={() => { refresh(); setShowPlans(false); }} />
              <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                <div className="h-px flex-1 bg-border" />
                or
                <div className="h-px flex-1 bg-border" />
              </div>
              <CryptoCheckout onActivated={() => { refresh(); setShowPlans(false); }} />
            </div>
          </div>
        ) : state !== "active" && (
          <div className="mt-4 rounded-xl border border-border bg-background p-4 space-y-4">
            <RazorpayCheckout onActivated={refresh} />
            <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              or
              <div className="h-px flex-1 bg-border" />
            </div>
            <CryptoCheckout onActivated={refresh} />
          </div>
        )}

        <div className="mt-6 border-t border-border pt-6">
          <h3 className="text-sm font-medium mb-3">Have a promo code?</h3>
          <div className="flex gap-2">
            <Input
              placeholder="Enter promo code"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className="max-w-xs"
              disabled={promoStatus === "loading"}
            />
            <Button 
              variant="secondary" 
              onClick={applyPromo}
              disabled={promoStatus === "loading" || !promoCode.trim()}
            >
              {promoStatus === "loading" ? <LoaderIcon className="h-4 w-4 animate-spin" /> : "Apply"}
            </Button>
          </div>
          {promoMessage && (
            <p className={`mt-2 text-sm ${promoStatus === "success" ? "text-emerald-400" : "text-amber-500"}`}>
              {promoMessage}
            </p>
          )}
        </div>
      </div>

      <p className="mt-5 text-xs text-muted-foreground">
        Billing support or custom enterprise workflows?{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="underline text-foreground">
          {SUPPORT_EMAIL}
        </a>
      </p>
    </section>
  );
}
