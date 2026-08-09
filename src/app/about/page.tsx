"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { LandingNav } from "@/components/landing/LandingNav";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { AuthProvider, AuthButton } from "@/components/landing/AuthOverlay";
import { SectionKicker } from "@/components/landing/SectionKicker";
import { ArrowRightIcon, SparklesIcon } from "@/components/icons";

export default function AboutPage() {
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [60, 0, 0, -60]);
  const scale = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.96, 1, 1, 0.96]);

  return (
    <AuthProvider>
      <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
        <LandingNav />

        <main ref={targetRef} className="relative overflow-hidden pt-12 pb-24 md:pt-20 md:pb-36">
          {/* Ambient Parallax Backdrops */}
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-1/4 left-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-[140px]" />
            <div className="absolute top-2/3 right-10 h-[350px] w-[350px] rounded-full bg-accent/20 blur-[120px]" />
            <div className="grid-bg absolute inset-0 opacity-40" />
            <div className="grain-overlay opacity-30" />
          </div>

          <div className="mx-auto max-w-4xl px-6">
            <motion.div
              style={{ opacity, y, scale }}
              className="relative rounded-3xl border border-border/80 bg-card/60 p-8 sm:p-14 md:p-20 backdrop-blur-2xl shadow-2xl overflow-hidden"
            >
              {/* Subtle top edge glow */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
              <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/20 blur-3xl pointer-events-none" />

              <div className="flex flex-col items-center text-center">
                <SectionKicker index="01" align="center">
                  Our Philosophy
                </SectionKicker>

                <h1 className="mt-6 font-mono text-xs uppercase tracking-widest text-accent-foreground flex items-center gap-1.5 font-bold">
                  <SparklesIcon className="h-3.5 w-3.5" /> About Nx Studio
                </h1>

                {/* World-Class Single Paragraph Copywriting */}
                <p className="mt-8 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight leading-[1.3] text-foreground">
                  We built <span className="text-gradient">Nx Studio</span> on a singular conviction: the journey from human intent to production software should never be lost in context drift, decision fatigue, or repetitive boilerplate. By compiling raw product vision into precise, self-contained architecture bundles, Nx Studio equips modern AI agents—from Cursor to Claude Code—to build complete software systems with <span className="text-accent-foreground underline decoration-primary/40 underline-offset-4">absolute context</span>, uncompromised precision, and award-winning craftsmanship from line zero.
                </p>

                <div className="mt-12 flex flex-col sm:flex-row items-center gap-4">
                  <AuthButton
                    source="about_single_cta"
                    className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-[0_0_0_1px_rgba(196,181,253,0.4),0_16px_40px_-16px_rgba(196,181,253,0.8)] transition-all hover:-translate-y-0.5 hover:shadow-xl"
                  >
                    Experience Nx Studio
                    <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </AuthButton>
                </div>
              </div>
            </motion.div>
          </div>
        </main>

        <SiteFooter />
      </div>
    </AuthProvider>
  );
}
