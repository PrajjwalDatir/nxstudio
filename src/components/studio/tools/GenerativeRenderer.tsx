"use client";

/**
 * Generative renderer — runs a p5.js sketch as toolcraft `canvasContent`,
 * driven live by the tool's control values.
 *
 * Rendered inside ToolcraftRoot, so it reads control state via
 * `useToolcraftEvaluatedValues`. A single p5 instance is created once and fills
 * the canvas slot (intrinsic canvas size); the active sketch object is swapped
 * on change and re-seeded on seed change, without tearing down the instance.
 * p5 touches `window`, so it's imported dynamically on the client.
 */
import { useEffect, useRef, useMemo } from "react";
import type P5 from "p5";
import { useToolcraftEvaluatedValues } from "@/toolcraft/runtime/react";
import { GEN_TARGETS, BRAND_TARGETS } from "@/lib/studio/schema";
import { SKETCHES, type GenParams, type SketchId, type Sketch } from "./sketches";

function num(v: unknown, d: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : d;
}
function str(v: unknown, d: string): string {
  return typeof v === "string" && v ? v : d;
}
function parseColor(v: unknown, fallback: string): string {
  if (typeof v === "string" && v) return v;
  if (typeof v === "object" && v !== null && "hex" in v && typeof (v as { hex: unknown }).hex === "string") {
    return (v as { hex: string }).hex || fallback;
  }
  return fallback;
}

export function GenerativeRenderer() {
  const values = useToolcraftEvaluatedValues();
  const sketchId = str(values[GEN_TARGETS.sketch], "flow") as SketchId;

  const rawInkColor = parseColor(values[GEN_TARGETS.color], "");
  const rawBrandPrimary = parseColor(values[BRAND_TARGETS.primary], "#8B5CF6");

  const params: GenParams = useMemo(() => ({
    // Ink color defaults to brand primary color unless explicitly customized
    primary: rawInkColor || rawBrandPrimary,
    background: parseColor(values[GEN_TARGETS.background], "#08080A"),
    count: Math.round(num(values[GEN_TARGETS.count], 400)),
    particleSize: num(values[GEN_TARGETS.particleSize], 4.5),
    connectionDist: num(values[GEN_TARGETS.connectionDist], 130),
    speed: num(values[GEN_TARGETS.speed], 1),
    seed: Math.round(num(values[GEN_TARGETS.seed], 1)),
  }), [rawInkColor, rawBrandPrimary, values]);

  const containerRef = useRef<HTMLDivElement>(null);
  const pRef = useRef<P5 | null>(null);
  const sketchRef = useRef<Sketch | null>(null);
  const paramsRef = useRef(params);
  const sketchIdRef = useRef<SketchId>(sketchId);
  
  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  // Create the p5 instance once.
  useEffect(() => {
    let disposed = false;
    let ro: ResizeObserver | null = null;
    (async () => {
      const p5mod = (await import("p5")).default;
      const el = containerRef.current;
      if (disposed || !el) return;
      sketchRef.current = (SKETCHES[sketchIdRef.current] ?? SKETCHES.flow)();
      const instance = new p5mod((p: P5) => {
        p.setup = () => {
          p.createCanvas(el.clientWidth || 800, el.clientHeight || 600);
          p.randomSeed(paramsRef.current.seed);
          p.noiseSeed(paramsRef.current.seed);
          sketchRef.current?.init(p, paramsRef.current);
        };
        p.draw = () => sketchRef.current?.draw(p, paramsRef.current);
      }, el);
      pRef.current = instance;
      ro = new ResizeObserver(() => {
        const w = el.clientWidth;
        const h = el.clientHeight;
        if (w > 0 && h > 0) instance.resizeCanvas(w, h, true);
      });
      ro.observe(el);
    })();
    return () => {
      disposed = true;
      ro?.disconnect();
      pRef.current?.remove();
      pRef.current = null;
    };
  }, []);

  // Swap the active sketch when it changes.
  useEffect(() => {
    sketchIdRef.current = sketchId;
    sketchRef.current = (SKETCHES[sketchId] ?? SKETCHES.flow)();
    const p = pRef.current;
    if (p) {
      p.randomSeed(paramsRef.current.seed);
      p.noiseSeed(paramsRef.current.seed);
      sketchRef.current.init(p, paramsRef.current);
    }
  }, [sketchId]);

  // Real-time parameter updates (color picker, background, particle count, speed, seed).
  useEffect(() => {
    const p = pRef.current;
    if (p) {
      p.randomSeed(params.seed);
      p.noiseSeed(params.seed);
      sketchRef.current?.init(p, paramsRef.current);
    }
  }, [params.primary, params.background, params.count, params.particleSize, params.connectionDist, params.speed, params.seed]);

  return <div ref={containerRef} className="h-full w-full" data-slot="generative-canvas" />;
}
