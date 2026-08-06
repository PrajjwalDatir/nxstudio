"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * The unit's HUD: its dialogue readout and the audio control.
 *
 * Styled as instrumentation rather than as web copy — a bracketed callsign, a
 * live status lamp, a monospace readout that types itself in. The previous
 * versions of both of these were an unstyled <p> and a text button, which read
 * as debug output sitting on top of the art.
 *
 * Text is revealed with GSAP rather than a CSS transition so the character
 * sweep and the caret settle can share one timeline and be interrupted cleanly
 * when a new line arrives mid-reveal.
 */

export function MachineReadout({ line, tail = false }: { line: string; tail?: boolean | "right" | "bottom" }) {
  const textRef = useRef<HTMLSpanElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;

    tl.current?.kill();

    tl.current = gsap.timeline();
    tl.current
      .to(el, { opacity: 0, duration: 0.28, ease: "power1.out" })
      .add(() => {
        el.textContent = line;
      })
      .to(el, { opacity: 1, duration: 0.5, ease: "power1.in" });

    return () => {
      tl.current?.kill();
    };
  }, [line]);

  return (
    <div className="relative inline-flex max-w-sm items-start gap-2.5 rounded-xl border border-white/12 bg-background/90 py-2.5 pl-3 pr-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_10px_30px_-10px_rgba(0,0,0,0.85)] backdrop-blur-md">
      {/* Speech tail */}
      {(tail === true || tail === "right") && (
        <span
          aria-hidden
          className="absolute right-[-6px] top-6 hidden h-3 w-3 rotate-45 rounded-[1px] border-r border-t border-white/12 bg-background/90 md:block"
        />
      )}
      {tail === "bottom" && (
        <span
          aria-hidden
          className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 h-3 w-3 rotate-45 rounded-[1px] border-b border-r border-white/12 bg-background/90"
        />
      )}
      {/* Live status lamp — matching status pulse. */}
      <span className="relative mt-[5px] flex h-1.5 w-1.5 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-50" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
      </span>
      <div className="min-w-0">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent-foreground/60">
          Unit
        </span>
        <p
          aria-live="polite"
          className="min-h-[1.5em] font-mono text-[11px] leading-relaxed text-foreground/75 sm:text-xs"
        >
          <span ref={textRef} />
        </p>
      </div>
    </div>
  );
}


