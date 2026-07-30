"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  AccessState,
  PlanTier,
  deriveAccessState,
  derivePlanTier,
  getTierInfo,
  isPremium as premiumOf,
} from "@/lib/billing";

export interface Subscription {
  provider: string | null;
  status: string;
  current_end: string | null;
  current_period_end: string | null;
  plan_id: string | null;
}

interface Loaded {
  subscription: Subscription | null;
  email: string;
}

/** Fetch the current user's subscription. Pure read — never touches state. */
async function loadSubscription(): Promise<Loaded> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { subscription: null, email: "" };

  const { data } = await supabase
    .from("subscriptions")
    .select("provider, status, current_end, current_period_end, plan_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return { subscription: (data as Subscription | null) ?? null, email: user.email ?? "" };
}

/**
 * Reads the signed-in user's subscription and derives tier capabilities.
 */
export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    loadSubscription().then(async (r) => {
      if (!alive) return;
      setSubscription(r.subscription);
      setEmail(r.email);
      setLoading(false);

      // Auto-verify background check if pending
      if (r.subscription && (r.subscription as unknown as { pending_reference?: string }).pending_reference) {
        try {
          const res = await fetch("/api/billing/crypto/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          });
          const body = await res.json();
          if (body.verified && alive) {
            const updated = await loadSubscription();
            if (alive) {
              setSubscription(updated.subscription);
            }
          }
        } catch {
          // quiet background auto-verify
        }
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    const r = await loadSubscription();
    setSubscription(r.subscription);
    setEmail(r.email);
    setLoading(false);
  }, []);

  const state: AccessState = deriveAccessState(subscription);
  const isActive = premiumOf(state);
  const tier: PlanTier = derivePlanTier(subscription, state);
  const tierInfo = getTierInfo(tier);

  return {
    subscription,
    email,
    state,
    isActive,
    ...tierInfo,
    loading,
    refresh,
  };
}
