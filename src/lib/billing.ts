export type AccessState = "active" | "grace" | "locked" | "none";
export type PlanTier = "free" | "pro_10";

export interface SubscriptionRow {
  provider?: string | null;
  status?: string | null;
  plan_id?: string | null;
  current_period_end?: string | null;
}

export interface AccessInfo {
  row: SubscriptionRow | null;
  state: AccessState;
  isPremium: boolean;
  tier: PlanTier;
  tierName: string;
  projectLimit: number; // 1 for free, Infinity for pro_10
  canUseCollections: boolean;
  canUsePromptGallery: boolean;
  canUseMachineWorkflows: boolean;
}

const RAZORPAY_ACTIVE = new Set(["active", "authenticated", "completed"]);

export function deriveAccessState(row: SubscriptionRow | null, graceHours = 48, now: Date = new Date()): AccessState {
  if (!row) return "none";
  if (row.provider === "crypto" || row.provider === "promo") {
    if (!row.current_period_end) return "none";
    const end = new Date(row.current_period_end).getTime();
    const nowMs = now.getTime();
    if (nowMs <= end) return "active";
    if (nowMs <= end + graceHours * 3_600_000) return "grace";
    return "locked";
  }
  return row.status && RAZORPAY_ACTIVE.has(row.status) ? "active" : "none";
}

export function isPremium(state: AccessState): boolean {
  return state === "active" || state === "grace";
}

export function derivePlanTier(row: SubscriptionRow | null, state: AccessState): PlanTier {
  if (!isPremium(state) || !row?.plan_id) return "free";
  if (row.plan_id === "pro_10" || row.plan_id === "10") return "pro_10";
  return "free";
}

export function getTierInfo(tier: PlanTier) {
  switch (tier) {
    case "pro_10":
      return {
        tier,
        tierName: "Pro",
        projectLimit: Infinity,
        canUseCollections: true,
        canUsePromptGallery: true,
        canUseMachineWorkflows: true,
      };
    case "free":
    default:
      return {
        tier: "free" as const,
        tierName: "Free",
        projectLimit: 2,
        canUseCollections: false,
        canUsePromptGallery: false,
        canUseMachineWorkflows: true,
      };
  }
}
