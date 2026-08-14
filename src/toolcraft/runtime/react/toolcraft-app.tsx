"use client";

import * as React from "react";

import type { ResolvedToolcraftAppSchema } from "../schema/types";
import { useIsMobile } from "../../ui/hooks/use-mobile";
import { CanvasShell } from "./canvas-shell";
import {
  ControlsPanel,
  type ToolcraftPanelActionHandler,
} from "./controls-panel";
import type { ToolcraftControlRendererMap } from "./control-renderers";
import { ToolcraftRoot } from "./toolcraft-root";
import { LayersPanel } from "./layers-panel";
import { MobilePanelSheet, MobileTabDock, type MobilePanelId } from "./panel-mobile-dock";
import { TimelinePanel } from "./timeline-panel";
import { ToolbarPanel } from "./toolbar-panel";
import { useToolcraft } from "./use-toolcraft";

export type ToolcraftAppProps = {
  canvasContent?: React.ReactNode;
  className?: string;
  controlRenderers?: ToolcraftControlRendererMap;
  onPanelAction?: ToolcraftPanelActionHandler;
  renderDefaultCanvasMedia?: boolean;
  schema: ResolvedToolcraftAppSchema;
  style?: React.CSSProperties;
};

const toolcraftMinAppWidthPx = 1024;

function cn(...classNames: Array<string | false | null | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}

function ToolcraftAppContent({
  canvasContent,
  className,
  controlRenderers,
  onPanelAction,
  renderDefaultCanvasMedia = true,
  style,
}: Omit<ToolcraftAppProps, "schema">): React.JSX.Element {
  const { state } = useToolcraft();
  const isMobile = useIsMobile();
  const surfaces = state.schema.assembly.surfaces;
  const timelinePanelHidden = state.panels.timeline.hidden === true;
  // Mobile forces compact — the expanded per-keyframe bezier editor (688px,
  // tiny drag handles) isn't viable on a touch screen; see the Studio mobile
  // redesign plan for why this boundary is deliberate, not incidental.
  const timelinePanelVariant =
    !isMobile && state.panels.timeline.extended === true ? "extended" : "compact";
  const [activeMobilePanel, setActiveMobilePanel] = React.useState<MobilePanelId | null>(null);

  const mobileAvailablePanels: MobilePanelId[] = [
    surfaces.panels.layers?.enabled ? "layers" : null,
    surfaces.panels.controls?.enabled ? "controls" : null,
    surfaces.panels.timeline?.enabled && !timelinePanelHidden ? "timeline" : null,
  ].filter((id): id is MobilePanelId => id !== null);

  return (
    <div
      className={cn(
        "relative min-h-[640px] w-full overflow-hidden bg-[color:var(--background)]",
        className,
      )}
      data-slot="toolcraft-runtime-app"
      style={{
        ...style,
        // The 1024px floor protects the floating panels' fixed pixel widths
        // on a narrow desktop window — meaningless (and actively harmful,
        // see the mobile redesign plan) once panels move into a mobile sheet.
        minWidth: isMobile ? undefined : toolcraftMinAppWidthPx,
      }}
    >
      {surfaces.canvas.enabled ? (
        <CanvasShell renderDefaultMedia={renderDefaultCanvasMedia}>
          {canvasContent}
        </CanvasShell>
      ) : null}
      {isMobile ? (
        <>
          {surfaces.panels.toolbar.enabled ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-14 z-[65] flex justify-center px-2">
              <ToolbarPanel panelPlacement="surface" className="pointer-events-auto" />
            </div>
          ) : null}
          <MobilePanelSheet activePanel={activeMobilePanel} onClose={() => setActiveMobilePanel(null)}>
            {activeMobilePanel === "layers" && surfaces.panels.layers?.enabled ? (
              <LayersPanel className="w-full! max-w-none!" panelPlacement="surface" />
            ) : null}
            {activeMobilePanel === "controls" && surfaces.panels.controls?.enabled ? (
              <ControlsPanel
                className="w-full! max-w-none!"
                controlRenderers={controlRenderers}
                onPanelAction={onPanelAction}
                panelPlacement="surface"
              />
            ) : null}
            {activeMobilePanel === "timeline" && surfaces.panels.timeline?.enabled && !timelinePanelHidden ? (
              <TimelinePanel panelPlacement="surface" variant={timelinePanelVariant} />
            ) : null}
          </MobilePanelSheet>
          <MobileTabDock
            activePanel={activeMobilePanel}
            availablePanels={mobileAvailablePanels}
            onSelect={(panel) =>
              setActiveMobilePanel((current) => (current === panel ? null : panel))
            }
          />
        </>
      ) : (
        <>
          {surfaces.panels.layers?.enabled ? (
            <LayersPanel panelPlacement="floating" />
          ) : null}
          {surfaces.panels.controls?.enabled ? (
            <ControlsPanel
              controlRenderers={controlRenderers}
              onPanelAction={onPanelAction}
              panelPlacement="floating"
            />
          ) : null}
          {surfaces.panels.timeline?.enabled ? (
            <div
              data-toolcraft-timeline-panel-hidden={timelinePanelHidden ? "true" : undefined}
              data-toolcraft-timeline-panel-variant={timelinePanelVariant}
              hidden={timelinePanelHidden}
            >
              <TimelinePanel panelPlacement="floating" variant={timelinePanelVariant} />
            </div>
          ) : null}
          {surfaces.panels.toolbar.enabled ? (
            <ToolbarPanel panelPlacement="floating" />
          ) : null}
        </>
      )}
    </div>
  );
}

export function ToolcraftApp({
  schema,
  ...props
}: ToolcraftAppProps): React.JSX.Element {
  return (
    <ToolcraftRoot schema={schema}>
      <ToolcraftAppContent {...props} />
    </ToolcraftRoot>
  );
}
