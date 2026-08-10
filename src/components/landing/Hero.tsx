"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useIsMobile } from "./use-is-mobile";
import { CanvasPreview } from "./CanvasPreview";
import { ArrowRightIcon, GithubIcon } from "@/components/icons";
import { IndieHackersMark } from "./brand-icons";
import { FIRST_LINE, pickLine, type DialogueTrigger } from "./machine-dialogue";
import { AuthButton } from "./AuthOverlay";
import { useInView } from "./use-in-view";
import { IdeFlipper } from "./IdeFlipper";
import { MachineReadout } from "./MachineHud";

// WebGL — client only, so the page still prerenders statically. No GLTF asset
// to fetch (the machine is built from primitive geometry), so the delay
// visitors see is purely the three.js/@react-three chunk downloading and
// compiling; a fallback here avoids a blank pop-in once it lands.
const MachineScene = dynamic(() => import("./MachineScene"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-xl bg-white/[0.02]" aria-hidden />,
});

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
  const lastSpokenAt = useRef(0);
  const pendingSay = useRef<number | undefined>(undefined);

  // Floor on how often the bubble is allowed to change — without it, a fast
  // scroll through several sections fires triggers back to back and the
  // dialogue flickers instead of reading as a beat.
  const MIN_LINE_GAP_MS = 3200;

  const say = useCallback(
    (trigger: DialogueTrigger) => {
      const speak = () => {
        const next = pickLine(trigger, lastLine.current);
        lastLine.current = next;
        setLine(next);
        lastSpokenAt.current = Date.now();
      };
      const elapsed = Date.now() - lastSpokenAt.current;
      window.clearTimeout(pendingSay.current);
      if (elapsed >= MIN_LINE_GAP_MS) {
        speak();
      } else {
        pendingSay.current = window.setTimeout(speak, MIN_LINE_GAP_MS - elapsed);
      }
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
      lastSpokenAt.current = Date.now();
    }, 11000);
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

      {/* Both wrapper layers go pointer-events-none so the empty grid boxes
          don't shadow the interactive canvas underneath (the machine and
          lamp live in a separate absolutely-positioned layer below); the
          copy column opts back in since it has real buttons and links. */}
      <div className="relative z-10 mx-auto max-w-6xl px-5 pb-12 pt-8 sm:px-6 sm:pt-10 md:pb-16 pointer-events-none">
        <div className="grid items-center gap-6 md:grid-cols-2 md:gap-8 lg:gap-12 pointer-events-none">
          {/* Left column is a spacer on desktop — frames the 3D Machine on the left rail */}
          <div className="hidden md:block md:col-start-1 md:order-1 md:h-[520px] pointer-events-none" aria-hidden />

          {/* Copy — right rail on desktop, top on mobile */}
          <div className="relative z-10 text-center md:text-left max-w-2xl lg:max-w-3xl pointer-events-auto md:col-start-2 md:order-2">
            {/* Top Proof Badges — Indie Hackers + Product Hunt */}
            <div
              style={{ animationDelay: "0.12s" }}
              className="reveal-rise mb-4 flex flex-wrap items-center justify-center gap-2.5 md:justify-start"
            >
              <a
                href="https://www.indiehackers.com/prajj"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-full bg-[#C4B5FD] px-4 py-2 text-sm font-bold text-[#1B1030] shadow-sm transition-all hover:-translate-y-0.5 hover:brightness-105"
              >
                <span>Featured on</span>
                <IndieHackersMark className="h-4 w-4 rounded shrink-0" />
              </a>
              <a
                href="https://www.producthunt.com/products/nxstudio?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-nxstudio"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center transition-transform hover:-translate-y-0.5"
              >
                <img
                  src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1216560&theme=light"
                  alt="nxstudio - Product context for AI IDE | Product Hunt"
                  width={250}
                  height={54}
                  className="h-[34px] w-auto sm:h-9"
                />
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
                Start building for free
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
        </div>

      </div>

      {/* 3D Machine — Internal Web App Card on Mobile, Full Stage on Desktop */}
      {isMobile ? (
        <div className="relative z-10 mx-auto mt-4 max-w-sm px-4">
          <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/80 shadow-2xl backdrop-blur-md">
            {/* Web App Internal Header Bar */}
            <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-3.5 py-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="font-mono text-[11px] uppercase tracking-wider text-foreground/80">
                  Unit 01 · Agent Status
                </span>
              </div>
              <span className="rounded border border-border/60 bg-background/60 px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground/80">
                INTERACTIVE
              </span>
            </div>

            {/* Miniature Machine Viewport */}
            <div className="relative h-[250px] w-full overflow-hidden bg-background/40">
              {machine}
            </div>

            {/* Internal HUD Readout */}
            {line && (
              <div className="border-t border-border/50 bg-background/60 p-2.5 flex justify-center">
                <MachineReadout line={line} />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="relative z-0 md:pointer-events-none md:absolute md:inset-0 md:z-0 md:h-[540px] lg:h-[580px]">
          {machine}
        </div>
      )}

      {/* The evidence */}
      <div
        style={{ animationDelay: "0.95s" }}
        className="reveal-rise relative z-10 mx-auto mt-2 max-w-5xl px-5 sm:px-6 md:-mt-12 lg:-mt-16"
      >
        <CanvasPreview />
      </div>
    </section>
  );
}
