"use client";

/**
 * The single shared Studio canvas.
 *
 * Every mode composites onto this one surface: a generative p5 background, with
 * the 3D object + its motion in a transparent r3f layer on top — so you always
 * see the full picture regardless of which mode's controls are open. The
 * floating mode toolbar (left) and canvas actions (top-right) are portaled to
 * the toolcraft app root so they float at viewport level instead of panning and
 * zooming with the canvas world.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { GenerativeRenderer } from "./tools/GenerativeRenderer";
import { ThreeLayer } from "./tools/ThreeLayer";
import { AnnotationLayer } from "./tools/AnnotationLayer";
import { ModeToolbar } from "./ModeToolbar";
import { StudioActions } from "./StudioActions";
import { BrandSync } from "./BrandSync";

export function StudioCanvas({ onAnnotationApi }: { onAnnotationApi?: (api: ExcalidrawImperativeAPI) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [appRoot, setAppRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (el) setAppRoot(el.closest<HTMLElement>('[data-slot="toolcraft-runtime-app"]'));
  }, []);

  const portalContent = useMemo(
    () => (
      <>
        <AnnotationLayer onApi={onAnnotationApi} />
        <div className="pointer-events-none absolute right-[21rem] top-4 z-[9999] flex items-center gap-3">
          <ModeToolbar />
          <StudioActions containerRef={containerRef} />
        </div>
      </>
    ),
    [onAnnotationApi],
  );

  return (
    <div ref={containerRef} className="relative h-full w-full">
      {/* Keeps the brand controls and the workspace BrandDNA in lockstep. */}
      <BrandSync />
      {/* Layer 1: generative background */}
      <div className="absolute inset-0">
        <GenerativeRenderer />
      </div>
      {/* Layer 2: 3D object + motion (transparent, composites over the background) */}
      <div className="absolute inset-0">
        <ThreeLayer />
      </div>
      {/* Layer 3: annotations & tools portaled to viewport root so UI isn't shrunken by canvas scale */}
      {appRoot && createPortal(portalContent, appRoot)}
    </div>
  );
}
