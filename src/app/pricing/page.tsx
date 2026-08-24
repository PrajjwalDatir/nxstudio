import type { Metadata } from "next";
import Link from "next/link";
import { LandingNav } from "@/components/landing/LandingNav";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SectionKicker } from "@/components/landing/SectionKicker";
import { AuthProvider, AuthButton } from "@/components/landing/AuthOverlay";
import { CheckIcon } from "@/components/icons";
import { siteConfig, pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  path: "/pricing",
  title: "Pricing",
  description: "Start for free. Go Pro when you're ready to scale. No hard limits, cancel anytime.",
});

const PLANS = [
  {
    name: "Free",
    price: "0 USDT",
    cadence: "forever",
    blurb: "Get a feel for the workflow. Build 1 product workspace with full access to everything.",
    features: [
      "1 Product workspace (ALL ACCESS)",
      "Visual project canvas",
      "Brief → derived tech stack",
      "Full Master Build Prompt",
      "Full Depth Prompts compilation",
      "Autonomous Machine Workflows (.jules/, GitHub Actions)",
    ],
    highlighted: false,
    vip: false,
    cta: "Sign in with GitHub to start",
  },
  {
    name: "Pro",
    price: "10 USDT",
    cadence: "per 28 days",
    blurb: "Unlimited everything. No gates, no limits.",
    features: [
      "Unlimited Product workspaces (ALL ACCESS)",
      "Project Collections to group & organize",
      "Prompt Gallery of Use Cases & Personas",
      "Agent Targets (.cursor/rules, .claude, etc.)",
    ],
    highlighted: true,
    vip: false,
    badge: "Most Popular",
    cta: "Go Pro",
  },
];

// Product/Offer JSON-LD for the two plans. priceCurrency uses "USD" (ISO
// 4217, required for valid structured data) since the on-chain USDT/USDC
// price is USD-pegged 1:1 — schema.org has no currency code for stablecoins.
function PricingStructuredData() {
  const graph = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: siteConfig.name,
    description: siteConfig.description,
    offers: PLANS.map((plan) => ({
      "@type": "Offer",
      name: plan.name,
      description: plan.blurb,
      price: plan.price.split(" ")[0],
      priceCurrency: "USD",
      url: `${siteConfig.url}/pricing`,
      ...(plan.cadence !== "forever" && {
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: plan.price.split(" ")[0],
          priceCurrency: "USD",
          billingDuration: "P28D",
        },
      }),
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}

export default function PricingPage() {
  return (
    <AuthProvider>
      <PricingStructuredData />
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <LandingNav />
        
        <main className="flex-1">
          <section className="relative overflow-hidden border-b border-border">
            <div className="grid-bg absolute inset-0" aria-hidden />
            <div className="hero-glow" aria-hidden />
            <div className="grain-overlay pointer-events-none absolute inset-0 z-30" aria-hidden />

            <div className="relative z-10 mx-auto max-w-6xl px-5 py-20 sm:px-6 md:py-28">
              <div className="mx-auto max-w-2xl text-center">
                <SectionKicker index="01" align="center">Pricing</SectionKicker>
                <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
                  Start for free. <span className="text-gradient">Go Pro when you&apos;re ready to scale.</span>
                </h1>
                <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                  Pay however you want: card, UPI, or netbanking. Prefer crypto? We take USDC/USDT on Solana, verified entirely on-chain.
                </p>
              </div>
              
              <div className="mx-auto mt-14 grid max-w-3xl gap-4 md:grid-cols-2">
                {PLANS.map((plan) => (
                  <div
                    key={plan.name}
                    className={`relative flex flex-col justify-between rounded-xl border p-6 transition-colors duration-200 ${
                      plan.highlighted
                        ? "border-primary/60 bg-primary/[0.04]"
                        : plan.vip
                          ? "border-border bg-card ring-1 ring-inset ring-white/[0.06]"
                          : "border-border bg-card/40"
                    }`}
                  >
                    {plan.badge && (
                      <span
                        className={`absolute -top-2.5 left-6 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-[0.15em] ${
                          plan.highlighted
                            ? "bg-primary text-primary-foreground"
                            : "border border-primary/30 bg-accent text-accent-foreground"
                        }`}
                      >
                        {plan.badge}
                      </span>
                    )}

                    <div>
                      <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        {plan.name}
                      </span>

                      <div className="mt-3 flex items-baseline gap-1.5">
                        <span className="text-3xl font-semibold tracking-tight">{plan.price}</span>
                        <span className="font-mono text-xs text-muted-foreground">{plan.cadence}</span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{plan.blurb}</p>

                      <div className="my-5 h-px w-full bg-border" />

                      <ul className="space-y-2.5">
                        {plan.features.map((feat) => (
                          <li key={feat} className="flex items-start gap-2.5 text-sm">
                            <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-foreground" />
                            <span className="text-foreground/80">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <AuthButton
                      source={`pricing_${plan.name.toLowerCase()}`}
                      className={`mt-6 flex h-10 w-full items-center justify-center rounded-lg font-mono text-xs font-semibold uppercase tracking-wider transition-colors ${
                        plan.highlighted
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : plan.vip
                            ? "bg-foreground text-background hover:bg-foreground/90"
                            : "border border-primary/40 text-foreground hover:bg-primary/10"
                      }`}
                    >
                      {plan.cta}
                    </AuthButton>
                  </div>
                ))}
              </div>
              <p className="mx-auto mt-6 max-w-md text-center text-xs text-muted-foreground">
                Cancel anytime. No hard feelings. See{" "}
                <Link href="/refund" className="text-foreground/80 underline underline-offset-2">
                  Refunds &amp; Billing
                </Link>
                .
              </p>
            </div>
          </section>
        </main>
        
        <SiteFooter />
      </div>
    </AuthProvider>
  );
}
