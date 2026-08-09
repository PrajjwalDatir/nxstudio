"use client";

import { CheckIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";

export interface PricingPlan {
  id: "free" | "pro_10";
  name: string;
  badge?: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
  vip?: boolean;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    price: "0 USDT",
    cadence: "forever",
    description: "Build 1 full product workspace with complete access.",
    features: [
      "1 Active Project Workspace",
      "ALL ACCESS for 1 project",
      "Full Brief & Tech Stack Engine",
      "Full Master Build Prompt",
      "Full Depth Prompts compilation",
      "Autonomous Machine Workflows (.jules/, GitHub Actions)",
      "Sign in with GitHub",
    ],
    cta: "Current Plan",
  },
  {
    id: "pro_10",
    name: "Pro",
    badge: "MOST POPULAR",
    price: "10 USDT",
    cadence: "per 28 days",
    description: "Unlimited Project Workspaces, no gates — everything unlocked for serial builders.",
    features: [
      "Unlimited Active Project Workspaces",
      "ALL ACCESS — no gates",
      "Project Collections (Group & organize)",
      "Prompt Gallery of Use Cases & Agent Personas",
      "Agent Targets (.cursor/rules, .claude/CLAUDE.md, etc.)",
      "Pay by card, UPI, or netbanking — or crypto (USDC/USDT on Solana)",
    ],
    highlighted: true,
    cta: "Upgrade to Pro",
  },
];

export function PricingGrid({
  currentTier = "free",
  onSelectTier,
}: {
  currentTier?: "free" | "pro_10";
  onSelectTier?: (tier: "pro_10") => void;
}) {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {PRICING_PLANS.map((plan) => {
          const isCurrent = currentTier === plan.id;
          return (
            <div
              key={plan.id}
              className={`relative flex flex-col justify-between rounded-xl border p-6 transition-colors duration-200 ${
                plan.highlighted
                  ? "border-primary/60 bg-primary/[0.04]"
                  : plan.vip
                    ? "border-border bg-card ring-1 ring-inset ring-foreground/10"
                    : "border-border bg-card/40"
              }`}
            >
              {/* Floating badge for featured tiers */}
              {plan.badge && (
                <span
                  className={`absolute -top-2.5 left-6 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] ${
                    plan.highlighted
                      ? "bg-primary text-primary-foreground"
                      : "border border-primary/30 bg-accent text-accent-foreground"
                  }`}
                >
                  {plan.badge}
                </span>
              )}

              <div>
                {/* Plan name */}
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {plan.name}
                </span>

                {/* Price */}
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-3xl font-semibold tracking-tight text-foreground">{plan.price}</span>
                  <span className="font-mono text-xs text-muted-foreground">{plan.cadence}</span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{plan.description}</p>

                <div className="my-5 h-px w-full bg-border" />

                {/* Features */}
                <ul className="space-y-2.5">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5 text-xs">
                      <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-foreground" />
                      <span className="text-foreground/80">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6">
                {isCurrent ? (
                  <Button disabled variant="outline" className="w-full font-mono text-xs uppercase tracking-wider">
                    Current Plan
                  </Button>
                ) : plan.id === "free" ? (
                  <Button disabled variant="ghost" className="w-full text-xs text-muted-foreground">
                    Included
                  </Button>
                ) : (
                  <Button
                    onClick={() => onSelectTier?.(plan.id as "pro_10")}
                    className={`w-full font-mono text-xs uppercase tracking-wider ${
                      plan.vip
                        ? "bg-foreground text-background hover:bg-foreground/90"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }`}
                  >
                    {plan.cta}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
