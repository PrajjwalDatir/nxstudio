import type { Metadata } from "next";
import { LandingNav } from "@/components/landing/LandingNav";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { TeamSection } from "@/components/landing/TeamSection";
import { SectionKicker } from "@/components/landing/SectionKicker";
import { AuthProvider, AuthButton } from "@/components/landing/AuthOverlay";
import { ArrowRightIcon, TargetIcon, RocketIcon, ShieldCheckIcon } from "@/components/icons";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why nxstudio exists, how the two-person team behind it works, and the philosophy that shapes every build prompt it generates.",
  alternates: { canonical: "/about" },
};

const VALUES = [
  {
    icon: TargetIcon,
    title: "Opinionated by design",
    body: "A tool that hands you six database options at 1am isn't helping. nxstudio commits to a stack from your brief so you spend your time building, not deciding.",
  },
  {
    icon: RocketIcon,
    title: "Built for AI-native workflows",
    body: "Every output is written for the agent that reads it next — Claude Code, Cursor, v0, Windsurf. Plain, portable Markdown, not a proprietary format.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Founder-mode, not enterprise-mode",
    body: "No seat licenses, no admin consoles, no sales calls. It's a tool two founders built for the tool they wished they had.",
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
            <div className="hero-glow" aria-hidden />
            <div className="relative z-10 mx-auto max-w-4xl px-5 py-24 text-center sm:px-6 md:py-32">
              <SectionKicker index="00" align="center">
                About nxstudio
              </SectionKicker>
              <h1 className="mx-auto mt-5 max-w-2xl text-3xl font-bold tracking-tight sm:text-5xl">
                {siteConfig.tagline}
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
                {siteConfig.description}
              </p>
            </div>
          </section>

          {/* Story */}
          <section className="border-b border-border bg-card/20">
            <div className="mx-auto max-w-3xl px-5 py-20 sm:px-6 md:py-28">
              <SectionKicker index="01">Why we built it</SectionKicker>
              <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
                The blank page is the hardest part.
              </h2>
              <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Every builder knows the moment: the idea is clear in your head, but the
                  first prompt to your AI coding agent never quite captures it. You end up
                  in a forty-message warm-up, re-explaining the same context, watching the
                  agent guess at a stack you never chose.
                </p>
                <p>
                  nxstudio exists to close that gap. Bring a brief — half a spec, a couple
                  of screenshots in your head, strong opinions about what it shouldn&apos;t
                  be — and it derives an opinionated tech stack and compiles everything
                  into one production-ready build prompt. Your agent opens it already
                  briefed.
                </p>
                <p>
                  We&apos;re not trying to write your code for you. We&apos;re removing the
                  planning bottleneck so you and your agent can get to building sooner.
                </p>
              </div>
            </div>
          </section>

          {/* Values */}
          <section className="border-b border-border">
            <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 md:py-28">
              <div className="max-w-2xl">
                <SectionKicker index="02">How we work</SectionKicker>
                <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
                  Three ideas we don&apos;t compromise on.
                </h2>
              </div>
              <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
                {VALUES.map((v) => (
                  <div
                    key={v.title}
                    className="rounded-xl border border-border bg-card/40 p-6"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/30">
                      <v.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 font-semibold tracking-tight">{v.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {v.body}
                    </p>
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
                One brief in. One prompt out.
              </h2>
              <p className="mx-auto mt-4 max-w-sm text-muted-foreground">
                That&apos;s the whole product. Come see what it does with yours.
              </p>
              <AuthButton
                source="about_closing"
                className="group mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-7 text-sm font-medium text-primary-foreground shadow-[0_0_0_1px_rgba(139,92,246,0.4),0_16px_40px_-16px_rgba(139,92,246,0.8)] transition-transform hover:-translate-y-0.5"
              >
                Start building — free
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
