"use client";

import { useEffect } from "react";
import { storePendingReferral } from "@/lib/referral-capture";

/**
 * Drop-in on the landing page. Reads `?ref=CODE` from the URL and stashes it so
 * it survives sign-up, then the app claims it once the user is authenticated.
 * Renders nothing.
 */
export function ReferralCapture() {
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("ref");
    if (code) storePendingReferral(code);
  }, []);
  return null;
}
