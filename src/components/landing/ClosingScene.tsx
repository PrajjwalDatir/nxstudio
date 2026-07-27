"use client";

import dynamic from "next/dynamic";
import { useInView } from "./use-in-view";

// WebGL — client only, so the page still prerenders statically.
const AssemblyScene = dynamic(() => import("./AssemblyScene"), { ssr: false });

/**
 * The closing shot. Same unit as everywhere else, held in its "ready" pose —
 * briefed, upright, waiting to be sent. No caption: the headline beside it is
 * already the line, and stacking a second one under the render was what made
 * this corner read as an afterthought.
 */
export function ClosingScene() {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div ref={ref} aria-hidden className="canvas-bleed h-[320px] w-full sm:h-[400px]">
      <AssemblyScene step={2} paused={!inView} />
    </div>
  );
}
