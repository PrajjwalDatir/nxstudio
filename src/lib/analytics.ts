"use client";

import { track } from "@vercel/analytics";

/**
 * Thin, typed wrapper around Vercel Analytics' custom events, kept separate
 * from page-view tracking: `<Analytics/>` in the root layout already logs
 * every route change automatically, so nothing here duplicates that. This
 * covers the in-page signals a URL alone doesn't carry — what the in-app
 * assistant said, and whether people act on it.
 */

export type MascotTipKind = "progress" | "page_tip" | "field_tip" | "explore_tip";
export type MascotAction = "opened" | "closed" | "continue_clicked";

/** A tip/nudge the assistant surfaced on its own, and which section it was in. */
export function trackMascotTip(kind: MascotTipKind, section: string) {
  track("mascot_tip", { kind, section });
}

/** Opening/closing the assistant, or following its "Continue to X" link. */
export function trackMascotAction(action: MascotAction, section: string) {
  track("mascot_action", { action, section });
}

/**
 * Sustained engagement with a labeled field — fires once per focus session,
 * after the same delay the assistant itself waits before reacting. Carries
 * the field's label only, never its typed value: what someone writes into a
 * Brief is theirs, not telemetry.
 */
export function trackFieldEngagement(field: string, section: string) {
  track("field_engagement", { field, section });
}
