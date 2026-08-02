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

export function MachineReadout({ line, tail = false }: { line: string; tail?: boolean }) {
  const textRef = useRef<HTMLSpanElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;

    tl.current?.kill();

    tl.current = gsap.timeline();
    tl.current
      .to(el, { opacity: 0, duration: 0.18, ease: "power1.out" })
      .add(() => {
        el.textContent = line;
      })
      .to(el, { opacity: 1, duration: 0.3, ease: "power1.in" });

    return () => {
      tl.current?.kill();
    };
  }, [line]);

  return (
    <div className="relative inline-flex max-w-sm items-start gap-2.5 rounded-xl border border-white/12 bg-background/90 py-2.5 pl-3 pr-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_10px_30px_-10px_rgba(0,0,0,0.85)] backdrop-blur-md">
      {/* Speech tail on the right edge, pointing across to the unit beside it. */}
      {tail && (
        <span
          aria-hidden
          className="absolute right-[-6px] top-6 hidden h-3 w-3 rotate-45 rounded-[1px] border-r border-t border-white/12 bg-background/90 md:block"
        />
      )}
      {/* Live status lamp — matching status pulse. */}
      <span className="relative mt-[5px] flex h-1.5 w-1.5 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-50" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
      </span>
      <div className="min-w-0">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary/60">
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

export function AudioControl({
  enabled,
  playing,
  onToggle,
}: {
  enabled: boolean;
  playing: boolean;
  onToggle: () => void;
}) {
  const barsRef = useRef<HTMLDivElement>(null);

  // Bars dance only while audio is genuinely playing, so the control never
  // implies sound that a blocked autoplay isn't actually producing.
  useEffect(() => {
    const el = barsRef.current;
    if (!el) return;
    const bars = Array.from(el.children);
    if (!playing) {
      gsap.killTweensOf(bars);
      gsap.to(bars, { scaleY: 0.25, duration: 0.2, transformOrigin: "bottom" });
      return;
    }
    const tweens = bars.map((b, i) =>
      gsap.to(b, {
        scaleY: () => 0.35 + Math.random() * 0.65,
        duration: 0.3 + i * 0.07,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        transformOrigin: "bottom",
        delay: i * 0.06,
      })
    );
    return () => tweens.forEach((t) => t.kill());
  }, [playing]);

  return (
    <button
      onClick={onToggle}
      aria-pressed={enabled}
      aria-label={enabled ? "Mute audio" : "Unmute audio"}
      className="group flex items-center gap-2.5 rounded-full border border-border bg-background/70 py-1.5 pl-3 pr-3.5 backdrop-blur-sm transition-colors hover:border-primary/40"
    >
      <div ref={barsRef} className="flex h-3 items-end gap-[2px]" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="h-full w-[2px] rounded-full bg-primary" />
        ))}
      </div>
      <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground transition-colors group-hover:text-foreground">
        {enabled ? (playing ? "Audio" : "Armed") : "Muted"}
      </span>
    </button>
  );
}
