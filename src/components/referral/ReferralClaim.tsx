"use client";

import { useEffect, useRef } from "react";
import { readPendingReferral, clearPendingReferral } from "@/lib/referral-capture";

/**
 * Mounted inside the authenticated shell. If a referral code was captured on the
 * landing page, claim it once for this user, then clear it. The server decides
 * validity; any definitive answer (attributed, already-referred, self, unknown)
 * clears the pending code so we don't retry. Only a network/500 error keeps it
 * for a later attempt. Renders nothing.
 */
export function ReferralClaim() {
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    const code = readPendingReferral();
    if (!code) return;
    attempted.current = true;

    (async () => {
      try {
        const res = await fetch("/api/referrals/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        // 200 → server reached a decision (ok or a terminal reason). 400 → bad
        // input (missing code). Either way, stop retrying. Only keep the code on
        // 401 (not authed yet) or 5xx (transient).
        if (res.ok || res.status === 400) clearPendingReferral();
      } catch {
        // network error — leave the code for the next mount.
      }
    })();
  }, []);

  return null;
}
