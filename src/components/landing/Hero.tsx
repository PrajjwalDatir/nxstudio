"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useIsMobile } from "./use-is-mobile";
import { CanvasPreview } from "./CanvasPreview";
import { ArrowRightIcon, GithubIcon } from "@/components/icons";
import { IndieHackersMark, NpmMark, ProductHuntMark } from "./brand-icons";
import { FIRST_LINE, pickLine, type DialogueTrigger } from "./machine-dialogue";
import { AuthButton } from "./AuthOverlay";
import { useInView } from "./use-in-view";
import { IdeFlipper } from "./IdeFlipper";

// WebGL — client only, so the page still prerenders statically.
const MachineScene = dynamic(() => import("./MachineScene"), { ssr: false });

/** Section id → the line the machine says when you reach it. */
const SECTION_TRIGGERS: [string, DialogueTrigger][] = [
  ["how", "scroll-how"],
  ["features", "scroll-features"],
  ["pricing", "scroll-pricing"],
  ["faq", "scroll-faq"],
];

/**
 * Asymmetric frame: copy anchored left, the machine large on the right. The
 * unit isn't decoration in the corner — it's the other half of the composition,
 * and it talks back to whatever you're doing on the page.
 */
export function Hero() {
  const isMobile = useIsMobile();
  const { ref: stageRef, inView: stageInView } = useInView<HTMLDivElement>();
  // Deterministic first line: pickLine() is random, and calling it during
  // render would make the server and client disagree.
  const [line, setLine] = useState<string>(FIRST_LINE);
  const lastLine = useRef(line);
  const idleTimer = useRef<number | undefined>(undefined);

  const say = useCallback(
    (trigger: DialogueTrigger) => {
      const next = pickLine(trigger, lastLine.current);
      lastLine.current = next;
      setLine(next);
    },
    []
  );

  // Drift back to an idle remark once a triggered line has had its moment.
  useEffect(() => {
    window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => {
      const next = pickLine("idle", lastLine.current);
      lastLine.current = next;
      setLine(next);
    }, 9000);
    return () => window.clearTimeout(idleTimer.current);
  }, [line]);

  // React to which section the visitor has scrolled into.
  useEffect(() => {
    const seen = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const id = e.target.id;
          if (seen.has(id)) return;
          seen.add(id);
          const match = SECTION_TRIGGERS.find(([sectionId]) => sectionId === id);
          if (match) say(match[1]);
        });
      },
      { rootMargin: "-40% 0px -40% 0px" }
    );
    SECTION_TRIGGERS.forEach(([id]) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [say]);

  // A single MachineScene instance — its container changes with the breakpoint,
  // so we never mount two WebGL canvases. `stageRef` drives the in-view pause.
  // On mobile the unit is a clean focal object in its own frame, so we drop the
  // dialogue bubble (empty line → the model renders no speech): a fixed-size
  // bubble would otherwise dominate the smaller frame and hide the unit.
  // Mobile also unmounts the canvas once it scrolls away, so only one WebGL
  // scene holds a context at a time (mobile GPUs evict contexts when the hero,
  // how-it-works and closing scenes are all mounted together).
  const mountMachine = !isMobile || stageInView;
  const machine = (
    <div ref={stageRef} className="pointer-events-auto h-full w-full cursor-pointer">
      {mountMachine && (
        <MachineScene
          line={isMobile ? "" : line}
          onPoke={() => say("poke")}
          paused={!stageInView}
        />
      )}
    </div>
  );

  return (
    <section className="relative overflow-hidden">
      <div className="hero-glow" aria-hidden />
      {/* Filmic grain — a faint tactile texture over the whole stage */}
      <div className="grain-overlay pointer-events-none absolute inset-0 z-30" aria-hidden />

      <div className="relative z-10 mx-auto max-w-6xl px-5 pb-12 pt-8 sm:px-6 sm:pt-10 md:pb-16">
        <div className="grid items-center gap-6 md:grid-cols-2 md:gap-8 lg:gap-12">
          {/* Copy — left rail */}
          <div className="relative z-10 text-center md:text-left max-w-2xl lg:max-w-3xl">
            {/* Top Proof Badges — Indie Hackers + Product Hunt */}
            <div
              style={{ animationDelay: "0.12s" }}
              className="reveal-rise mb-4 flex flex-wrap items-center justify-center gap-2.5 md:justify-start"
            >
              <a
                href="https://www.indiehackers.com/prajj"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-full border border-border/40 bg-card/40 px-3.5 py-1 text-xs font-medium text-foreground transition-all hover:-translate-y-0.5 hover:bg-card/70"
              >
                <IndieHackersMark className="h-3.5 w-3.5 rounded shrink-0" />
                <span>Featured on Indie Hackers</span>
              </a>
              <a
                href="https://www.producthunt.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-full border border-border/40 bg-card/40 px-3.5 py-1 text-xs font-medium text-foreground transition-all hover:-translate-y-0.5 hover:bg-card/70"
              >
                <ProductHuntMark className="h-3.5 w-3.5 fill-current text-[#DA552F] shrink-0" />
                <span>Product Hunt</span>
              </a>
            </div>

            <h1
              style={{ animationDelay: "0.28s" }}
              className="reveal-rise text-3xl font-extrabold leading-[1.2] tracking-tight sm:text-4xl md:text-5xl lg:text-[3.6rem]"
            >
              Product context
              <br />
              for <IdeFlipper />
            </h1>

            <p
              style={{ animationDelay: "0.48s" }}
              className="reveal-rise mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg sm:leading-relaxed md:mx-0 [text-wrap:balance]"
            >
              Stop re-explaining your vision. Engineer the exact context bundle your AI agent needs to build it right.
            </p>

            <div
              style={{ animationDelay: "0.65s" }}
              className="reveal-rise mx-auto mt-6 flex max-w-[17rem] flex-col items-center gap-3 sm:max-w-none sm:flex-row md:mx-0 md:justify-start"
            >
              <AuthButton
                source="hero"
                onMouseEnter={() => say("cta-hover")}
                className="group inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:opacity-90 sm:w-auto"
              >
                Start building — free
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </AuthButton>
              <a
                href="#how"
                className="inline-flex h-11 w-full items-center justify-center rounded-full border border-border/50 bg-secondary/50 px-6 text-sm font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:bg-secondary/80 sm:w-auto"
              >
                See how it works
              </a>
            </div>

            <p
              style={{ animationDelay: "0.8s" }}
              className="reveal-rise mt-3.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-muted-foreground/80 md:justify-start"
            >
              <GithubIcon className="h-3.5 w-3.5" />
              Free · GitHub sign-in · Works with any agent
            </p>

          </div>

          {/* Right column is a spacer on desktop */}
          <div className="hidden md:block md:h-[520px]" aria-hidden />
        </div>

      </div>

      <div className="relative z-0 -mt-8 h-[440px] w-full md:pointer-events-none md:absolute md:inset-0 md:z-0 md:mt-0 md:h-[620px] lg:h-[680px]">
        {machine}
      </div>

      {/* The evidence */}
      <div
        style={{ animationDelay: "0.95s" }}
        className="reveal-rise relative z-10 mx-auto mt-4 max-w-5xl px-5 sm:mt-0 sm:px-6"
      >
        <CanvasPreview />
      </div>
    </section>
  );
}
