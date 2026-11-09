"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isLocalMode } from "@/lib/supabase/config";
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
  isAnonymous: boolean;
}

/** Fetch the current user's subscription from the client. */
async function loadSubscriptionClient(): Promise<Loaded> {
  if (isLocalMode) {
    return {
      subscription: {
        provider: "local",
        status: "active",
        plan_id: "pro_10",
        current_end: null,
        current_period_end: null,
      },
      email: "developer@localhost",
      isAnonymous: false,
    };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { subscription: null, email: "", isAnonymous: false };

  const { data } = await supabase
    .from("subscriptions")
    .select("provider, status, current_end, current_period_end, plan_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return { 
    subscription: (data as Subscription | null) ?? null, 
    email: user.email ?? "",
    isAnonymous: user.is_anonymous ?? false
  };
}

interface SubscriptionContextType {
  subscription: Subscription | null;
  email: string;
  isAnonymous: boolean;
  setSubscription: React.Dispatch<React.SetStateAction<Subscription | null>>;
  setEmail: React.Dispatch<React.SetStateAction<string>>;
  setIsAnonymous: React.Dispatch<React.SetStateAction<boolean>>;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export function SubscriptionProvider({
  children,
  initialSubscription,
  initialEmail,
  initialIsAnonymous,
}: {
  children: React.ReactNode;
  initialSubscription: Subscription | null;
  initialEmail: string;
  initialIsAnonymous: boolean;
}) {
  const [subscription, setSubscription] = useState<Subscription | null>(initialSubscription);
  const [email, setEmail] = useState<string>(initialEmail);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(initialIsAnonymous);

  useEffect(() => {
    let alive = true;
    
    // Auto-verify background check if pending
    if (subscription && (subscription as unknown as { pending_reference?: string }).pending_reference) {
      (async () => {
        try {
          const res = await fetch("/api/billing/crypto/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          });
          const body = await res.json();
          if (body.verified && alive) {
            const updated = await loadSubscriptionClient();
            if (alive) {
              setSubscription(updated.subscription);
            }
          }
        } catch {
          // quiet background auto-verify
        }
      })();
    }
    
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  return (
    <SubscriptionContext.Provider value={{ subscription, setSubscription, email, setEmail, isAnonymous, setIsAnonymous }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

/**
 * Reads the signed-in user's subscription from context and derives tier capabilities.
 */
export function useSubscription() {
  const ctx = useContext(SubscriptionContext);

  const refresh = useCallback(async () => {
    if (!ctx) return;
    const r = await loadSubscriptionClient();
    ctx.setSubscription(r.subscription);
    ctx.setEmail(r.email);
    ctx.setIsAnonymous(r.isAnonymous);
  }, [ctx]);

  if (!ctx) {
    const tierInfo = getTierInfo("free");
    return {
      subscription: null,
      email: "",
      state: "none" as AccessState,
      isActive: false,
      ...tierInfo,
      isAnonymous: false,
      refresh,
    };
  }

  const { subscription, email, isAnonymous } = ctx;

  const state: AccessState = deriveAccessState(subscription);
  const isActive = premiumOf(state);
  
  // Force free tier if anonymous to apply guest restrictions
  const baseTier: PlanTier = derivePlanTier(subscription, state);
  const tier: PlanTier = isAnonymous ? "free" : baseTier;
  
  const tierInfo = getTierInfo(tier);

  return {
    subscription,
    email,
    state,
    isActive,
    ...tierInfo,
    isAnonymous,
    refresh,
  };
}
