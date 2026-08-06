"use client";

/**
 * "How it works" as a scroll-driven narrative rather than three equal cards.
 *
 * The 3D pins on the left and performs the transformation — scattered → lattice
 * → fused — while the steps scroll past on the right and drive its state. The
 * shape is the argument; the copy just names what you're watching.
 */

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import { PHASES } from "@/lib/phases";
import { PhaseCardBody, PhaseCardFrame } from "@/components/canvas/PhaseCard";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CopyIcon } from "@/components/icons";
import { SectionKicker } from "./SectionKicker";
import { useInView } from "./use-in-view";
import { useIsMobile } from "./use-is-mobile";

const AssemblyScene = dynamic(() => import("./AssemblyScene"), { ssr: false });

const STEPS = [
  {
    kicker: "The Brain-Dump",
    title: "It knows nothing yet.",
    body: "Write your brief exactly how you'd explain it to a friend. Tell us who it's for and how it works. No rigid templates, just pure vision.",
    // The real Brief field from the Idea phase, mid-typing.
    artifact: (
      <div className="glass rounded-xl p-4">
        <Label className="text-xs text-muted-foreground">What problem does it solve?</Label>
        <Textarea
          readOnly
          tabIndex={-1}
          aria-hidden
          className="mt-2 min-h-20 resize-none bg-background/40 text-sm"
          value={
            "read-later app for founders. hate that everything syncs to notion. wants highlights + something that works offline"
          }
        />
      </div>
    ),
  },
  {
    kicker: "The Hard Calls",
    title: "It picks a direction.",
    body: "nxstudio reads your vibe and derives an opinionated, production-ready stack. No more agonizing over six different database options at 1 AM.",
    // The Tech Stack phase card, exactly as it renders on the board.
    artifact: (
      <div className="max-w-[280px]">
        <PhaseCardFrame>
          <PhaseCardBody
            phase={PHASES.find((p) => p.id === "tech-stack")!}
            progress={{ done: 5, total: 5, percent: 100 }}
          />
        </PhaseCardFrame>
      </div>
    ),
  },
  {
    kicker: "The Handoff",
    title: "It knows exactly what you meant.",
    body: "Your context, schemas, and build constraints compile into a single context bundle. You aren't just generating a prompt — you're wiring your agent's brain.",
    // The compiled prompt panel from the Build phase, with its real Copy control.
    artifact: (
      <div className="glass overflow-hidden rounded-xl">
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-2.5">
          <span className="font-mono text-[11px] text-muted-foreground">build-prompt.md</span>
          <Button size="sm" variant="secondary" className="h-7 gap-1.5 px-2.5 text-xs" tabIndex={-1}>
            <CopyIcon className="h-3 w-3" />
            Copy
          </Button>
        </div>
        <pre className="px-4 py-3 font-mono text-[11px] leading-relaxed text-foreground/80">
          <span className="text-primary"># Build: nxstudio</span>
          {"\n"}Stack: Next.js · TypeScript · Supabase
          {"\n"}Visual canvas · derived stack · one build prompt
        </pre>
      </div>
    ),
  },
];

export function HowItWorks() {
  const reduce = useReducedMotion();
  const isMobile = useIsMobile();
  const { ref: stageRef, inView: stageInView } = useInView<HTMLDivElement>();
  // On mobile, mount the WebGL canvas only while it's near the viewport, so no
  // more than one scene holds a context at a time (mobile GPUs evict contexts
  // when all three landing scenes are mounted together). Desktop keeps it live
  // and just pauses the render loop when out of view.
  const mountScene = !isMobile || stageInView;
  const [active, setActive] = useState(0);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);

  /**
   * Whichever step's centre is nearest the middle of the viewport owns the 3D.
   * Deliberately not an IntersectionObserver band: a band leaves the state
   * stuck whenever no step happens to be inside it (fast scrolling, short
   * viewports). Nearest-to-centre always resolves to exactly one step.
   */
  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;
      const mid = window.innerHeight / 2;
      let best = 0;
      let bestDist = Infinity;

      stepRefs.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const dist = Math.abs(r.top + r.height / 2 - mid);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });

      setActive(best);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section id="how" className="scroll-mt-20 border-t border-border">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="pt-20 md:pt-28">
          <SectionKicker index="01">How it works</SectionKicker>
          <h2 className="mt-4 max-w-2xl text-2xl font-bold tracking-tight sm:text-4xl">
            Watch it come online.
          </h2>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Your agent doesn&apos;t start clever. It starts blank. Three steps is
            all it takes to get it standing up and pointed the exact right way.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 pb-20 md:grid-cols-2 md:gap-14 md:pb-28">
          {/* Stage — pinned and vertically centred in the viewport, so the unit
              holds frame the whole way down while only the story column scrolls.
              A tall sticky box (not a short top-anchored one) is what keeps the
              machine at eye level instead of riding up under the section title. */}
          <div
            className="sticky top-16 z-10 -mx-5 flex h-[50vh] min-w-0 items-center justify-center bg-background/70 backdrop-blur-sm sm:-mx-6 md:top-24 md:mx-0 md:h-[500px] md:bg-transparent md:backdrop-blur-none"
          >
            <div ref={stageRef} aria-hidden className="canvas-bleed h-full w-full">
              {mountScene && <AssemblyScene step={active} paused={!stageInView} />}
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1.5 md:bottom-8">
              {STEPS.map((s, i) => (
                <span
                  key={s.title}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    i === active ? "w-7 bg-primary" : "w-3 bg-border"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Story — a timeline, not a stack of cards. One spine threads the
              steps; each step is plain type plus its single real artifact, so
              nothing is a box inside a box. */}
          <ol className="relative min-w-0">
            {/* the spine the nodes sit on */}
            <span
              aria-hidden
              className="absolute bottom-0 left-[11px] top-0 w-px bg-gradient-to-b from-transparent via-border to-transparent"
            />
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                data-step={i}
                ref={(el) => {
                  stepRefs.current[i] = el;
                }}
                className="relative flex flex-col justify-center py-8 pl-10 md:py-12"
              >
                {/* numbered node on the spine — the only 'chrome' the step has */}
                <span
                  aria-hidden
                  className={`absolute left-0 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border font-mono text-[11px] transition-colors duration-500 ${
                    i === active
                      ? "border-primary/60 bg-primary/15 text-primary"
                      : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </span>

                <motion.div
                  animate={reduce ? { opacity: 1 } : { opacity: i === active ? 1 : 0.35 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider">
                    <span
                      className={`transition-colors duration-500 ${
                        i === active ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      Stage {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-muted-foreground/40">/</span>
                    <span className="text-muted-foreground">{step.kicker}</span>
                  </div>

                  <h3 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                    {step.title}
                  </h3>
                  <p className="mt-3 max-w-md leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                  {/* the step's one surface */}
                  <div className="mt-6 max-w-md">{step.artifact}</div>
                </motion.div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
