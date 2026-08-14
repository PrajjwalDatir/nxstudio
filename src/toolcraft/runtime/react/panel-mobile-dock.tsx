"use client";

/**
 * Mobile layout for the four floating desktop panels (Controls, Layers,
 * Timeline, Toolbar) — see the Studio mobile redesign plan. On a touch
 * screen there's no room for four simultaneous draggable windows, so Layers/
 * Controls/Timeline collapse into a single bottom sheet, switched via a
 * persistent tab dock (Toolbar stays always-visible above the dock — its
 * actions are frequent, low-footprint taps that don't deserve a sheet-open
 * gate). Built with the same techniques as the Sidebar mobile drawer
 * (src/components/shell/Sidebar.tsx): fixed positioning + translate
 * transform + backdrop + Escape/scroll-lock, just bottom-anchored.
 */
import * as React from "react";
import { Film, Layers as LayersIcon, SlidersHorizontal, X } from "lucide-react";

import type { ToolcraftPanelId } from "../state/types";

export type MobilePanelId = Extract<ToolcraftPanelId, "controls" | "layers" | "timeline">;

function cn(...classNames: Array<string | false | null | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}

const MOBILE_PANEL_TABS: { id: MobilePanelId; label: string; Icon: typeof LayersIcon }[] = [
  { id: "layers", label: "Layers", Icon: LayersIcon },
  { id: "controls", label: "Controls", Icon: SlidersHorizontal },
  { id: "timeline", label: "Timeline", Icon: Film },
];

export function MobileTabDock({
  activePanel,
  availablePanels,
  onSelect,
}: {
  activePanel: MobilePanelId | null;
  availablePanels: MobilePanelId[];
  onSelect: (panel: MobilePanelId) => void;
}): React.JSX.Element | null {
  const tabs = MOBILE_PANEL_TABS.filter((tab) => availablePanels.includes(tab.id));
  if (tabs.length === 0) return null;

  return (
    <nav
      aria-label="Studio panels"
      className="pointer-events-auto fixed inset-x-0 bottom-0 z-[60] flex items-stretch justify-around border-t border-[color:var(--border)] bg-[color:var(--background)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
    >
      {tabs.map(({ id, label, Icon }) => {
        const active = activePanel === id;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={active}
            aria-label={label}
            onClick={() => onSelect(id)}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
              active
                ? "text-[color:var(--foreground)]"
                : "text-[color:var(--muted-foreground)]"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </button>
        );
      })}
    </nav>
  );
}

export function MobilePanelSheet({
  activePanel,
  children,
  onClose,
}: {
  activePanel: MobilePanelId | null;
  children: React.ReactNode;
  onClose: () => void;
}): React.JSX.Element {
  const open = activePanel !== null;

  React.useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <>
      {open ? (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      ) : null}
      <div
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        className={cn(
          "pointer-events-auto fixed inset-x-0 bottom-14 z-50 flex max-h-[75dvh] flex-col overflow-hidden rounded-t-2xl border-t border-[color:var(--border)] bg-[color:var(--background)] pb-[env(safe-area-inset-bottom)] text-[color:var(--foreground)] transition-transform duration-200 ease-out md:hidden",
          open ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="relative flex shrink-0 items-center justify-center py-2">
          <span className="h-1 w-10 rounded-full bg-[color:var(--border)]" aria-hidden="true" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="absolute right-2 top-1 flex h-8 w-8 items-center justify-center rounded-lg text-[color:var(--muted-foreground)] transition-colors hover:text-[color:var(--foreground)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">{children}</div>
      </div>
    </>
  );
}
