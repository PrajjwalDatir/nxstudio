"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useIsMobile } from "./use-is-mobile";
import { CanvasPreview } from "./CanvasPreview";
import { ArrowRightIcon, GithubIcon } from "@/components/icons";
import { FIRST_LINE, pickLine, type DialogueTrigger } from "./machine-dialogue";
import { useMachineAudio } from "./useMachineAudio";
import { AudioControl } from "./MachineHud";
import { AuthButton } from "./AuthOverlay";
import { useInView } from "./use-in-view";

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
  const { enabled: soundOn, playing, toggle: toggleSound, blip, thunk } = useMachineAudio();
  // Deterministic first line: pickLine() is random, and calling it during
  // render would make the server and client disagree.
  const [line, setLine] = useState<string>(FIRST_LINE);
  const lastLine = useRef(line);
  const idleTimer = useRef<number | undefined>(undefined);

  const say = useCallback(
    (trigger: DialogueTrigger, sound: "blip" | "thunk" = "blip") => {
      const next = pickLine(trigger, lastLine.current);
      lastLine.current = next;
      setLine(next);
      if (sound === "thunk") thunk();
      else blip();
    },
    [blip, thunk]
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
          onPoke={() => say("poke", "thunk")}
          paused={!stageInView}
        />
      )}
    </div>
  );

  return (
    <section className="relative overflow-hidden">
      <div className="grid-bg absolute inset-0" aria-hidden />
      <div className="hero-glow" aria-hidden />
      {/* Filmic grain — a faint tactile texture over the whole stage, blended so
          it grips the dark background without lifting it to grey. */}
      <div className="grain-overlay pointer-events-none absolute inset-0 z-30" aria-hidden />

      <div className="relative z-10 mx-auto max-w-6xl px-5 pb-14 pt-14 sm:px-6 sm:pt-16 md:pb-20">
        <div className="grid items-center gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] md:gap-8">
          {/* Copy — left rail */}
          <div className="relative z-10 text-center md:text-left">
            <h1
              style={{ animationDelay: "0.05s" }}
              className="reveal-rise text-[2rem] font-bold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl"
            >
              Describe your app.{" "}
              <span className="text-gradient">Bring it to life.</span>
            </h1>

            <p
              style={{ animationDelay: "0.14s" }}
              className="reveal-rise mx-auto mt-5 max-w-sm text-[15px] leading-relaxed text-muted-foreground sm:text-lg md:mx-0"
            >
              Describe your vision once — your brand, your design, and your app&apos;s whole foundation.
            </p>

            <div
              style={{ animationDelay: "0.22s" }}
              className="reveal-rise mx-auto mt-9 flex max-w-[17rem] flex-col items-center gap-3 sm:max-w-none sm:flex-row md:mx-0 md:justify-start"
            >
              <AuthButton
                onMouseEnter={() => say("cta-hover")}
                className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground border border-primary-foreground/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_1px_2px_rgba(0,0,0,0.4),0_8px_24px_-4px_rgba(139,92,246,0.4)] transition-all hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.35),0_1px_3px_rgba(0,0,0,0.5),0_12px_28px_-4px_rgba(139,92,246,0.5)] sm:w-auto"
              >
                Start building — free
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </AuthButton>
              <a
                href="#how"
                className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-6 text-sm font-medium text-foreground backdrop-blur-md transition-colors hover:border-white/20 hover:bg-white/[0.08] sm:w-auto"
              >
                See how it works
              </a>
            </div>

            <p
              style={{ animationDelay: "0.3s" }}
              className="reveal-rise mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-muted-foreground md:justify-start"
            >
              <GithubIcon className="h-3.5 w-3.5" />
              Free · GitHub sign-in · Works with any agent
            </p>

          </div>

          {/* Right column is a spacer on desktop: it reserves the area the
              full-bleed canvas occupies so the copy never overlaps the unit.
              On mobile the stage sits behind everything and this collapses. */}
          <div className="hidden md:block md:h-[520px]" aria-hidden />
        </div>

        {/* Audio control — aligned to the content's right edge (inside the same
            max-w container as everything else), not floated loose against the
            viewport. */}
        <div className="absolute right-5 top-3 z-30 sm:right-6">
          <AudioControl enabled={soundOn} playing={playing} onToggle={toggleSound} />
        </div>
      </div>

      {/* The unit. One element, two framings driven purely by CSS so it never
          unmounts (a remount would drop the WebGL context and detach the
          in-view observer):
            • Mobile — an in-flow, bounded frame below the copy: a single
              deliberate focal object, not a full-bleed layer colliding with the
              headline and CTAs.
            • md+ — a full-bleed absolute layer behind the copy, framed by the
              screen edge, the unit standing right-of-centre (copy owns the left
              rail; the grid's right column reserves its space). */}
      <div className="relative z-10 -mt-8 h-[440px] w-full md:pointer-events-none md:absolute md:inset-0 md:z-0 md:mt-0 md:h-[620px] lg:h-[680px]">
        {machine}
      </div>

      {/* The evidence */}
      <div
        style={{ animationDelay: "0.42s" }}
        className="reveal-rise relative z-10 mx-auto mt-4 max-w-5xl px-5 sm:mt-0 sm:px-6"
      >
        <CanvasPreview />
      </div>
    </section>
  );
}
