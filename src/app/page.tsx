import Link from "next/link";
import type { Metadata } from "next";
import { LandingNav } from "@/components/landing/LandingNav";
import { Hero } from "@/components/landing/Hero";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { ClaudeMark, CursorMark, V0Mark, WindsurfMark } from "@/components/landing/brand-icons";
import { FeatureShowcase } from "@/components/landing/FeatureShowcase";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { FaqAccordion } from "@/components/landing/FaqAccordion";
import { SectionKicker } from "@/components/landing/SectionKicker";
import { ClosingScene } from "@/components/landing/ClosingScene";
import { AuthProvider, AuthButton } from "@/components/landing/AuthOverlay";
import { ArrowRightIcon, CheckIcon } from "@/components/icons";

const AGENTS = [
  { name: "Claude Code", Icon: ClaudeMark },
  { name: "Cursor", Icon: CursorMark },
  { name: "v0", Icon: V0Mark },
  { name: "Windsurf", Icon: WindsurfMark },
];

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const PLANS = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    blurb: "Plan your whole build before you write a line.",
    features: [
      "Visual project canvas",
      "Brief + derived tech stack",
      "Full build plan, ready to compile",
      "Sign in with GitHub",
    ],
    highlighted: false,
    cta: "Start free",
  },
  {
    name: "Pro",
    price: "$50",
    cadence: "per 28 days",
    blurb: "For founders shipping continuously.",
    features: [
      "Everything in Free",
      "Your compiled build prompt",
      "5 depth prompts — QA, security, perf, a11y, deploy",
      "Pay with USDC / USDT on Solana",
    ],
    highlighted: true,
    cta: "Go Pro",
  },
];

const FAQ = [
  {
    q: "What exactly is a “build prompt”?",
    a: "A single, structured prompt that tells your AI coding agent precisely what to build, on which stack, with what constraints — so it scaffolds the right thing on the first try instead of guessing.",
  },
  {
    q: "Which AI coding agents does it work with?",
    a: "Any of them. The compiled prompt is plain, portable Markdown — paste it into Claude Code, Cursor, v0, Windsurf, or whatever you use.",
  },
  {
    q: "Does nxstudio write the code for me?",
    a: "No — it writes the plan and the prompt. Your AI agent (and you) writes the code. nxstudio removes the planning bottleneck, not the building.",
  },
  {
    q: "Is my idea private?",
    a: "Your brief is yours. It's stored against your account and never sold or shared. See the Privacy Policy for the full picture.",
  },
  {
    q: "How does billing work?",
    a: "Free to start. Pro is a 28-day cycle paid in USDC or USDT on Solana, verified on-chain — no card required. Details live on the Refunds & Billing page.",
  },
  {
    q: "Do I need to know the tech stack already?",
    a: "No. That's the point — nxstudio derives an opinionated stack from your brief so you don't have to decide in a vacuum.",
  },
];

export default function LandingPage() {
  return (
    <AuthProvider>
    <div className="min-h-screen bg-background text-foreground">
      <LandingNav />

      <main>
        <Hero />

        {/* ── Works-with strip ──────────────────────────────────────────
            Lifted out of the page flow: a glass rail that floats up over the
            hero's lower edge, so it reads as an instrument panel laid on the
            scene rather than another full-width band stacked beneath it. */}
        <section className="relative z-20 mt-6 px-5 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="glass flex flex-col items-center gap-4 rounded-2xl px-6 py-5 md:flex-row md:justify-between md:gap-8">
              <p className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
                Speaks your agent&apos;s language
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {AGENTS.map(({ name, Icon }) => (
                  <span
                    key={name}
                    className="group flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 text-sm text-foreground/75 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/[0.07] hover:text-foreground"
                  >
                    <Icon className="h-4 w-4 text-foreground/60 transition-colors group-hover:text-primary" />
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── How it works ──────────────────────────────────────────────── */}
        <HowItWorks />

        {/* ── Features ──────────────────────────────────────────────────── */}
        <section id="features" className="scroll-mt-20 border-t border-border bg-card/20">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 md:py-28">
            <div className="max-w-2xl">
              <SectionKicker index="02">Features</SectionKicker>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Everything between idea and first commit.
              </h2>
            </div>
            <FeatureShowcase />
          </div>
        </section>

        {/* ── Pricing ───────────────────────────────────────────────────── */}
        <section id="pricing" className="scroll-mt-20 border-t border-border">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 md:py-28">
            <div className="mx-auto max-w-2xl text-center">
              <SectionKicker index="03" align="center">Pricing</SectionKicker>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Start free. Go Pro when you&apos;re shipping.
              </h2>
              <p className="mt-4 text-muted-foreground">
                No card required — Pro is billed in crypto, verified on-chain.
              </p>
            </div>
            <div className="mx-auto mt-12 grid max-w-3xl gap-5 md:grid-cols-2">
              {PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className={
                    plan.highlighted
                      ? "relative flex flex-col overflow-hidden rounded-2xl border border-primary/40 bg-card shadow-[0_0_0_1px_rgba(139,92,246,0.12),0_24px_60px_-40px_rgba(139,92,246,0.5)] md:-mt-4"
                      : "relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card/20"
                  }
                >
                  {/* Header band — a spec-sheet masthead, not a floating pill */}
                  <div
                    className={`flex items-center justify-between px-7 py-4 ${
                      plan.highlighted
                        ? "border-b border-primary/20 bg-primary/[0.07]"
                        : "border-b border-border"
                    }`}
                  >
                    <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      {plan.name}
                    </span>
                    {plan.highlighted && (
                      <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                        Most popular
                      </span>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-7">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                      <span className="font-mono text-xs text-muted-foreground">{plan.cadence}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{plan.blurb}</p>

                    {/* Spec rows — divided lines, so it reads as a datasheet */}
                    <ul className="mt-6 divide-y divide-border/60 border-y border-border/60">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2.5 py-2.5 text-sm">
                          <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span className="text-foreground/85">{feat}</span>
                        </li>
                      ))}
                    </ul>

                    <AuthButton
                      className={
                        plan.highlighted
                          ? "mt-7 flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5"
                          : "mt-7 flex h-11 w-full items-center justify-center rounded-xl border border-border bg-secondary/40 text-sm font-medium text-foreground transition-colors hover:border-primary/40"
                      }
                    >
                      {plan.cta}
                    </AuthButton>
                  </div>
                </div>
              ))}
            </div>
            <p className="mx-auto mt-6 max-w-md text-center text-xs text-muted-foreground">
              Cancel anytime. <br/> See{" "}
              <Link href="/refund" className="text-foreground/80 underline underline-offset-2">
                Refunds &amp; Billing
              </Link>
              .
            </p>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────────────── */}
        <section id="faq" className="scroll-mt-20 border-t border-border bg-card/20">
          <div className="mx-auto max-w-3xl px-5 py-20 sm:px-6 md:py-28">
            <div className="flex flex-col items-center text-center">
              <SectionKicker index="04" align="center">FAQ</SectionKicker>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Questions, answered.
              </h2>
            </div>
            <FaqAccordion items={FAQ} />
          </div>
        </section>

        {/* ── Final CTA + the unit, signing off ─────────────────────────── */}
        <section className="relative overflow-hidden border-t border-border">
          <div className="hero-glow" aria-hidden />
          <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-8 px-5 py-20 sm:px-6 md:grid-cols-2 md:gap-6 md:py-28">
            {/* The unit — same model as the hero, its own column to breathe */}
            <div className="order-last flex flex-col items-center md:order-first">
              <ClosingScene />
            </div>

            <div className="text-center md:text-left">
              <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
                One brief in.
                <br className="hidden sm:block" /> One prompt out.
              </h2>
              <p className="mx-auto mt-5 max-w-sm text-muted-foreground md:mx-0">
                That&apos;s the whole product. What you do with the rest of the
                afternoon is your business.
              </p>
              <AuthButton className="group mt-9 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-7 text-sm font-medium text-primary-foreground shadow-[0_0_0_1px_rgba(139,92,246,0.4),0_16px_40px_-16px_rgba(139,92,246,0.8)] transition-transform hover:-translate-y-0.5">
                Start building — free
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </AuthButton>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
    </AuthProvider>
  );
}
