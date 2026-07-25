"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AccessState, deriveAccessState, isPremium as premiumOf } from "@/lib/subscription-status";

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
 * Reads the signed-in user's subscription (RLS restricts it to their own row) and
 * derives access with the same pure logic the server uses. `isActive` (active OR
 * grace) is the single flag to gate premium features on.
 */
export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    loadSubscription().then((r) => {
      if (!alive) return;
      setSubscription(r.subscription);
      setEmail(r.email);
      setLoading(false);
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

  return { subscription, email, state, isActive, loading, refresh };
}
