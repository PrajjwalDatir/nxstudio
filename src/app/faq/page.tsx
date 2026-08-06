import type { Metadata } from "next";
import { LandingNav } from "@/components/landing/LandingNav";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SectionKicker } from "@/components/landing/SectionKicker";
import { AuthProvider } from "@/components/landing/AuthOverlay";
import { FaqAccordion } from "@/components/landing/FaqAccordion";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Questions you're probably asking.",
};

const FAQ = [
  {
    q: 'Wait, what exactly is in this "context bundle"?',
    a: "Everything your AI agent needs to build cleanly on the first try: your tech stack rules, database schema blueprint, API specifications, component constraints, and a step-by-step build roadmap in clean Markdown.",
  },
  {
    q: "Which AI coding agents does it actually work with?",
    a: "Any of them. The context bundle is plain, portable Markdown: drop it into Claude Code, Cursor, v0, Windsurf, Aider, or whatever agent tool you use.",
  },
  {
    q: "Is nxstudio going to write the code for me?",
    a: "No, it handles the architecture, system design, and prompt engineering. Your AI agent (and you) writes the code. nxstudio removes the planning bottleneck so your agent builds software, not slop.",
  },
  {
    q: "Is my idea kept private?",
    a: "100%. Your brief and architecture plans are yours alone. They're stored securely under your account and never sold, shared, or trained on. Check our Privacy Policy for the full details.",
  },
  {
    q: "How does billing work?",
    a: "Free to start. Pro runs on a 28-day cycle. You can pay with standard fiat (card, UPI, netbanking via Razorpay) or keep it Web3 with USDC/USDT on Solana. All the fine print is on our Refunds & Billing page.",
  },
  {
    q: "Do I need to be a senior engineer to know which tech stack to pick?",
    a: "Nope. That's nxstudio's job: it analyzes your project goals and suggests an opinionated, battle-tested stack so you don't have to decide in a vacuum.",
  },
];

export default function FaqPage() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <LandingNav />
        
        <main className="flex-1">
          <section className="relative overflow-hidden border-b border-border">
            <div className="grid-bg absolute inset-0" aria-hidden />
            <div className="hero-glow" aria-hidden />
            <div className="grain-overlay pointer-events-none absolute inset-0 z-30" aria-hidden />

            <div className="relative z-10 mx-auto max-w-3xl px-5 py-20 sm:px-6 md:py-28">
              <div className="flex flex-col items-center text-center">
                <SectionKicker index="01" align="center">FAQ</SectionKicker>
                <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
                  Questions <span className="text-gradient">you&apos;re probably asking.</span>
                </h1>
                <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
                  Everything you need to know about context bundles, agent compatibility, and billing.
                </p>
              </div>
              <FaqAccordion items={FAQ} />
            </div>
          </section>
        </main>
        
        <SiteFooter />
      </div>
    </AuthProvider>
  );
}
