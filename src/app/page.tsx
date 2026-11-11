import type { Metadata } from "next";
import { LandingNav } from "@/components/landing/LandingNav";
import { Hero } from "@/components/landing/Hero";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { FeatureShowcase } from "@/components/landing/FeatureShowcase";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { TeamSection } from "@/components/landing/TeamSection";
import { SectionKicker } from "@/components/landing/SectionKicker";
import { ClosingScene } from "@/components/landing/ClosingScene";
import { AuthProvider, AuthButton } from "@/components/landing/AuthOverlay";
import { ReferralCapture } from "@/components/referral/ReferralCapture";
import { ArrowRightIcon } from "@/components/icons";
import { IdeBadgeFlipper } from "@/components/landing/IdeFlipper";
import { UserCountBadge } from "@/components/landing/UserCountBadge";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};


export default function LandingPage() {
  return (
    <AuthProvider>
    <ReferralCapture />
    <div className="min-h-screen bg-background text-foreground">
      <LandingNav />

      <main>
        <Hero />

        {/* ── Integration & Community Badges Strip ──────────────────────── */}
        <section className="relative z-10 py-6 px-5 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Card 1: Use with (Animated IDE Flipper) */}
              <div className="glass flex flex-col items-center justify-between gap-3 rounded-2xl px-5 py-3.5 sm:flex-row sm:gap-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground shrink-0">
                  Use with
                </p>
                <div className="flex items-center justify-center">
                  <IdeBadgeFlipper />
                </div>
              </div>

              {/* Card 2: Community (Real User Count) */}
              <div className="glass flex flex-col items-center justify-between gap-3 rounded-2xl px-5 py-3.5 sm:flex-row sm:gap-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground shrink-0">
                  Community
                </p>
                <div className="flex items-center justify-center">
                  <UserCountBadge />
                </div>
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
              <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Everything between an idea and a working app.
              </h2>
            </div>
            <FeatureShowcase />
          </div>
        </section>

        {/* ── Team ──────────────────────────────────────────────────────── */}
        <TeamSection />

        {/* ── Final CTA + the unit, signing off ─────────────────────────── */}
        <section className="relative overflow-hidden border-t border-border">
          <div className="hero-glow" aria-hidden />
          <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-8 px-5 py-20 sm:px-6 md:grid-cols-2 md:gap-6 md:py-28">
            {/* The unit — same model as the hero, its own column to breathe */}
            <div className="order-last flex flex-col items-center md:order-first">
              <ClosingScene />
            </div>

            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                One vision in.
                <br className="hidden sm:block" /> A complete context bundle out.
              </h2>
              <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-muted-foreground md:mx-0">
                That&apos;s the whole product. Your agent does the heavy lifting.
                What you do with the rest of the afternoon is your business.
              </p>
              <AuthButton
                source="closing"
                className="group mt-9 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-[0_0_0_1px_rgba(139,92,246,0.5),0_16px_40px_-16px_rgba(139,92,246,0.7)] transition-all hover:-translate-y-0.5 hover:bg-primary/90"
              >
                Start building for free
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
