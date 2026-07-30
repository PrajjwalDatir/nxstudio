"use client";

import { CheckIcon, ZapIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";

export interface PricingPlan {
  id: "free" | "pro_10" | "master_50";
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
    name: "Curated Entry",
    price: "0 USDT",
    cadence: "forever",
    description: "Build 1 full product workspace with complete access.",
    features: [
      "1 Active Project Workspace",
      "ALL ACCESS for 1 project",
      "Full Brief & Tech Stack Engine",
      "Full Master Build Prompt",
      "Full Depth Prompts compilation",
      "Sign in with GitHub",
    ],
    cta: "Current Plan",
  },
  {
    id: "pro_10",
    name: "Atelier",
    badge: "MOST POPULAR",
    price: "10 USDT",
    cadence: "per 28 days",
    description: "For serial builders & developers scaling multiple products.",
    features: [
      "Up to 5 Active Workspaces",
      "ALL ACCESS across 5 projects",
      "Project Collections (Group & organize)",
      "Prompt Gallery of Use Cases & Agent Personas",
      "Agent Targets (.cursor/rules, .claude/CLAUDE.md, etc.)",
      "Pay in USDC / USDT on Solana",
    ],
    highlighted: true,
    cta: "Upgrade to Atelier",
  },
  {
    id: "master_50",
    name: "Black Label VIP",
    badge: "VIP STUDIO",
    price: "50 USDT",
    cadence: "per 28 days",
    description: "Complete autonomous software machine & pipeline workflows.",
    features: [
      "Unlimited Projects & Collections",
      "ALL ACCESS & ALL RESOURCES",
      "Autonomous Machine Engine (.jules/ configs)",
      "GitHub Action Automation (.github/workflows/)",
      "Issue -> Auto Test Generation & AI Business Logic",
      "Test-Gated CI/CD Deployment Pipeline",
    ],
    vip: true,
    cta: "Unlock Black Label VIP",
  },
];

export function PricingGrid({
  currentTier = "free",
  onSelectTier,
}: {
  currentTier?: "free" | "pro_10" | "master_50";
  onSelectTier?: (tier: "pro_10" | "master_50") => void;
}) {
  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {PRICING_PLANS.map((plan) => {
          const isCurrent = currentTier === plan.id;
          return (
            <div
              key={plan.id}
              className={`relative flex flex-col justify-between rounded-2xl border p-6 transition-all duration-200 ${
                plan.vip
                  ? "border-amber-500/40 bg-gradient-to-b from-amber-950/20 via-card to-background shadow-[0_0_40px_-15px_rgba(245,158,11,0.25)]"
                  : plan.highlighted
                    ? "border-primary/50 bg-card/90 shadow-[0_0_40px_-15px_rgba(139,92,246,0.3)]"
                    : "border-border bg-card/40"
              }`}
            >
              <div>
                {/* Header tag */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {plan.name}
                  </span>
                  {plan.badge && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider ${
                        plan.vip
                          ? "border border-amber-500/30 bg-amber-500/10 text-amber-400"
                          : "bg-primary/20 text-primary"
                      }`}
                    >
                      {plan.badge}
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold tracking-tight text-foreground">{plan.price}</span>
                  <span className="font-mono text-xs text-muted-foreground">{plan.cadence}</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{plan.description}</p>

                {/* Features datasheet */}
                <ul className="mt-5 divide-y divide-border/50 border-y border-border/50">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 py-2 text-xs">
                      <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="text-foreground/90">{feat}</span>
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
                    onClick={() => onSelectTier?.(plan.id as "pro_10" | "master_50")}
                    className={`w-full font-mono text-xs uppercase tracking-wider ${
                      plan.vip
                        ? "bg-amber-500 text-black hover:bg-amber-400 font-semibold"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }`}
                  >
                    <ZapIcon className="mr-1.5 h-3.5 w-3.5" />
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
