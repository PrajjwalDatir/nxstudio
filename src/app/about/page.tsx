import type { Metadata } from "next";
import { LandingNav } from "@/components/landing/LandingNav";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { TeamSection } from "@/components/landing/TeamSection";
import { SectionKicker } from "@/components/landing/SectionKicker";
import { AuthProvider, AuthButton } from "@/components/landing/AuthOverlay";
import { ArrowRightIcon, TargetIcon, RocketIcon, ShieldCheckIcon, CheckIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why nxstudio exists, how the team behind it works, and the philosophy that shapes every build prompt it generates.",
  alternates: { canonical: "/about" },
};

const VALUES = [
  {
    icon: TargetIcon,
    title: "Opinionated by design.",
    body: "A tool that hands you six different database choices at 1 AM isn't helping you. nxstudio reads your brief and commits to a stack so you can spend your time actually building, not deciding.",
  },
  {
    icon: RocketIcon,
    title: "Built for AI-native workflows.",
    body: "Every output we generate is written specifically for the 'brain' that reads it next, whether that's Claude Code, Cursor, v0, or Windsurf. It's all plain, portable Markdown. No proprietary lock-in.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Founder-mode, not enterprise-mode.",
    body: "You won't find seat licenses, admin consoles, or 'Talk to Sales' buttons here. This is a tool built by founders, for founders, because it's exactly what we wished we had.",
  },
];

export default function AboutPage() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background text-foreground">
        <LandingNav />

        <main>
          {/* Hero */}
          <section className="relative overflow-hidden border-b border-border">
            <div className="grid-bg absolute inset-0" aria-hidden />
            <div className="hero-glow" aria-hidden />
            <div className="grain-overlay pointer-events-none absolute inset-0 z-30" aria-hidden />

            <div className="relative z-10 mx-auto max-w-4xl px-5 py-24 text-center sm:px-6 md:py-32">
              <SectionKicker index="00" align="center">
                About nxstudio
              </SectionKicker>
              <h1 className="mx-auto mt-5 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
                Your product-focused <span className="text-gradient">technical cofounder.</span>
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Bring us your messy product brief. We&apos;ll architect the right tech stack and generate a production-ready context bundle so your AI agents can ship it flawlessly.
              </p>
            </div>
          </section>

          {/* Story: Before & After */}
          <section className="border-b border-border bg-card/20">
            <div className="mx-auto max-w-5xl px-5 py-20 sm:px-6 md:py-28">
              <div className="text-center">
                <SectionKicker index="01" align="center">Why we built it</SectionKicker>
                <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-4xl">
                  Because the blank page is the ultimate vibe killer.
                </h2>
              </div>
              
              <div className="mt-16 grid gap-6 md:grid-cols-2">
                {/* The Old Way */}
                <div className="relative rounded-2xl border border-destructive/20 bg-destructive/5 p-8">
                  <div className="mb-6 flex items-center gap-3 text-destructive">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <h3 className="font-semibold uppercase tracking-widest text-sm">The Old Way</h3>
                  </div>
                  
                  <ul className="space-y-4 text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive/50" />
                      A 40-message chat warm-up just to establish context.
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive/50" />
                      Your agent constantly hallucinating a random tech stack.
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive/50" />
                      Weighing 6 different database options at 1 AM.
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive/50" />
                      Writing tedious boilerplate instead of shipping features.
                    </li>
                  </ul>
                </div>

                {/* The nxstudio Way */}
                <div className="relative rounded-2xl border border-primary/30 bg-primary/5 p-8 shadow-[0_0_40px_-15px_rgba(196,181,253,0.2)]">
                  <div className="mb-6 flex items-center gap-3 text-accent-foreground">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                      <CheckIcon className="h-4 w-4" />
                    </div>
                    <h3 className="font-semibold uppercase tracking-widest text-sm">The nxstudio Way</h3>
                  </div>
                  
                  <ul className="space-y-4 text-foreground/80">
                    <li className="flex items-start gap-3">
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent-foreground" />
                      Bring your brief: half a spec and a few screenshots is plenty.
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent-foreground" />
                      nxstudio instantly derives an opinionated architecture.
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent-foreground" />
                      One production-ready context bundle is compiled.
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent-foreground" />
                      Your agent opens the repo already fully briefed and ready to code.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Values */}
          <section className="border-b border-border relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
            <div className="relative mx-auto max-w-6xl px-5 py-20 sm:px-6 md:py-28">
              <div className="max-w-2xl">
                <SectionKicker index="02">How we work</SectionKicker>
                <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
                  Three ideas we absolutely refuse to compromise on.
                </h2>
              </div>
              <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
                {VALUES.map((v) => (
                  <div
                    key={v.title}
                    className="group relative overflow-hidden rounded-2xl border border-border bg-card/60 p-8 backdrop-blur-sm transition-all hover:border-primary/50"
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="relative">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-accent-foreground border border-primary/30 shadow-[0_0_15px_-3px_rgba(196,181,253,0.4)]">
                        <v.icon className="h-6 w-6" />
                      </div>
                      <h3 className="mt-6 text-lg font-bold tracking-tight">{v.title}</h3>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {v.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Team (same content as the landing page's #team section) */}
          <TeamSection index="03" />

          {/* Closing CTA */}
          <section className="relative overflow-hidden border-t border-border">
            <div className="hero-glow" aria-hidden />
            <div className="relative z-10 mx-auto max-w-2xl px-5 py-20 text-center sm:px-6 md:py-28">
              <h2 className="text-2xl font-bold tracking-tight sm:text-4xl">
                One brief in. One context bundle out.
              </h2>
              <p className="mx-auto mt-4 max-w-sm text-muted-foreground">
                That&apos;s the whole product. Come see what it does with yours.
              </p>
              <AuthButton
                source="about_closing"
                className="group mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-7 text-sm font-medium text-primary-foreground shadow-[0_0_0_1px_rgba(196,181,253,0.4),0_16px_40px_-16px_rgba(196,181,253,0.8)] transition-transform hover:-translate-y-0.5"
              >
                Start building for free
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </AuthButton>
            </div>
          </section>
        </main>

        <SiteFooter />
      </div>
    </AuthProvider>
  );
}
