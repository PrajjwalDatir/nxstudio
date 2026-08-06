import type { Metadata } from "next";
import { LandingNav } from "@/components/landing/LandingNav";
import { Hero } from "@/components/landing/Hero";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { ClaudeMark, CursorMark, V0Mark, WindsurfMark } from "@/components/landing/brand-icons";
import { FeatureShowcase } from "@/components/landing/FeatureShowcase";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { TeamSection } from "@/components/landing/TeamSection";
import { SectionKicker } from "@/components/landing/SectionKicker";
import { ClosingScene } from "@/components/landing/ClosingScene";
import { AuthProvider, AuthButton } from "@/components/landing/AuthOverlay";
import { ReferralCapture } from "@/components/referral/ReferralCapture";
import { ArrowRightIcon } from "@/components/icons";

const AGENTS = [
  { name: "Claude Code", Icon: ClaudeMark, hoverColor: "group-hover:text-[#D97757]", hoverBg: "hover:border-[#D97757]/30 hover:bg-[#D97757]/10" },
  { name: "Cursor", Icon: CursorMark, hoverColor: "group-hover:text-white", hoverBg: "hover:border-white/20 hover:bg-white/10" },
  { name: "v0 by Vercel", Icon: V0Mark, hoverColor: "group-hover:text-white", hoverBg: "hover:border-white/20 hover:bg-white/10" },
  { name: "Windsurf", Icon: WindsurfMark, hoverColor: "group-hover:text-[#00D2FF]", hoverBg: "hover:border-[#00D2FF]/30 hover:bg-[#00D2FF]/10" },
];

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

        {/* ── Works-with strip ────────────────────────────────────────── */}
        <section className="relative z-10 py-10 px-5 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="glass flex flex-col items-center gap-4 rounded-2xl px-6 py-5 md:flex-row md:justify-between md:gap-8">
              <p className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
                Speaks your agent&apos;s language
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                {AGENTS.map(({ name, Icon, hoverColor, hoverBg }) => (
                  <span
                    key={name}
                    className={`group flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.03] px-3.5 py-2 text-sm text-foreground/80 transition-all hover:-translate-y-0.5 ${hoverBg} hover:text-foreground`}
                  >
                    <Icon className={`h-4 w-4 text-foreground/60 transition-colors ${hoverColor}`} />
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
                className="group mt-9 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-7 text-sm font-medium text-primary-foreground shadow-[0_0_0_1px_rgba(196,181,253,0.4),0_16px_40px_-16px_rgba(196,181,253,0.8)] transition-transform hover:-translate-y-0.5"
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
