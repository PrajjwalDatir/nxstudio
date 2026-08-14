"use client";

/**
 * Annotation layer — the Sketch mode of the shared canvas.
 *
 * A transparent Excalidraw surface stacked on top of the generative + 3D
 * layers, so founders can draw arrows, shapes, and notes over their design to
 * tell the AI what they want. It's always mounted (annotations stay visible in
 * every mode); it's only interactive in Sketch mode — otherwise it's view-only
 * and click-through so the 3D orbit/pan still work underneath.
 *
 * Excalidraw miscomputes pointer coords under a CSS *scale*, so annotate at 100%
 * zoom; translate/pan is fine. Fonts are self-hosted (see /excalidraw-assets).
 */
import React, { useCallback } from "react";
import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { useToolcraftValue } from "@/toolcraft/runtime/react";
import { useIsMobile } from "@/toolcraft/ui/hooks/use-mobile";
import { STUDIO_MODE } from "@/lib/studio/schema";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    EXCALIDRAW_ASSET_PATH?: string | string[];
  }
}
if (typeof window !== "undefined") {
  window.EXCALIDRAW_ASSET_PATH = "/excalidraw-assets";
}

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((m) => m.Excalidraw),
  {
    ssr: false,
    loading: () => null,
  },
);

const MainMenu = dynamic(
  () => import("@excalidraw/excalidraw").then((m) => m.MainMenu),
  {
    ssr: false,
  },
);

const EXCALIDRAW_INITIAL_DATA = { appState: { viewBackgroundColor: "transparent" } };
const EXCALIDRAW_UI_OPTIONS = {
  canvasActions: {
    export: false as const,
    loadScene: false,
    saveAsImage: false,
    saveToActiveFile: false,
    toggleTheme: false,
    changeViewBackgroundColor: false,
    clearCanvas: true,
  },
};

/**
 * Inner surface isolated behind React.memo — Excalidraw only re-renders when
 * `sketching` or `onApi` actually change, NOT on every toolcraft state tick.
 */
const ExcalidrawSurface = React.memo(function ExcalidrawSurface({
  sketching,
  onApi,
}: {
  sketching: boolean;
  onApi?: (api: ExcalidrawImperativeAPI) => void;
}) {
  const isMobile = useIsMobile();
  const handleApi = useCallback(
    (api: ExcalidrawImperativeAPI) => {
      onApi?.(api);
    },
    [onApi],
  );

  return (
    <div
      className={cn(
        "absolute inset-0 right-0 z-20 transition-opacity duration-200 md:right-[21rem]",
        sketching
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-90",
      )}
      style={{ "--shapes-offset": isMobile ? "0rem" : "10.5rem" } as React.CSSProperties}
    >
      {/* Hide Excalidraw's native menus — they overlap our ModeToolbar */}
      <style jsx global>{`
        .excalidraw .Island.App-menu__left,
        .excalidraw .App-menu_bottom,
        .excalidraw .layer-ui__wrapper__top-right,
        .excalidraw .main-menu-trigger,
        .excalidraw .App-menu__left,
        .excalidraw button.sidebar-trigger {
          display: none !important;
        }
        /* Excalidraw docks its shape toolbar at top-center, where it hides
           behind our ModeToolbar. Float it down to sit just above the bottom
           zoom panel (which lives at bottom-2.5 of the app) instead. The
           Excalidraw surface is inset by the 21rem controls panel on the right
           on desktop only (see the sibling className above), so its own centre
           sits 10.5rem left of the viewport centre there — offset the toolbar
           back so it lines up with the (viewport-centred) zoom bar. On mobile
           the surface isn't inset, so no compensation is needed; --shapes-offset
           carries that distinction from the same isMobile check driving the
           className, instead of a second hardcoded breakpoint in raw CSS. */
        .excalidraw .shapes-section {
          position: absolute;
          left: 50%;
          right: auto;
          bottom: 4.25rem;
          transform: translateX(calc(-50% + var(--shapes-offset, 10.5rem)));
          justify-content: center;
          z-index: 4;
        }
      `}</style>
      <Excalidraw
        theme="dark"
        viewModeEnabled={!sketching}
        initialData={EXCALIDRAW_INITIAL_DATA}
        excalidrawAPI={handleApi}
        UIOptions={EXCALIDRAW_UI_OPTIONS}
      >
        <MainMenu>{/* Empty to hide default hamburger menu */}</MainMenu>
      </Excalidraw>
    </div>
  );
});

export function AnnotationLayer({
  onApi,
}: {
  onApi?: (api: ExcalidrawImperativeAPI) => void;
}) {
  const sketching = useToolcraftValue(STUDIO_MODE) === "sketch";

  return <ExcalidrawSurface sketching={sketching} onApi={onApi} />;
}

/** Collect the text of every text element the founder wrote, for the AI. */
export function readAnnotationNotes(
  api: ExcalidrawImperativeAPI | null,
): string {
  if (!api) return "";
  return api
    .getSceneElements()
    .filter(
      (el): el is typeof el & { type: "text"; text: string } =>
        el.type === "text" && !el.isDeleted,
    )
    .map((el) => el.text.trim())
    .filter(Boolean)
    .join("\n");
}
