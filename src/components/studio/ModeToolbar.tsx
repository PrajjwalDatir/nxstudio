"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useToolcraft } from "@/toolcraft/runtime/react";
import { STUDIO_MODE, type StudioMode } from "@/lib/studio/schema";
import { WavesIcon, BoxIcon, FilmIcon, PencilLineIcon, ScaffoldIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

interface ModeConfig {
  id: StudioMode;
  label: string;
  subtitle: string;
  icon: typeof WavesIcon;
}

const MODES: ModeConfig[] = [
  {
    id: "design",
    label: "Generative",
    subtitle: "p5.js Field Engine",
    icon: WavesIcon,
  },
  {
    id: "3d",
    label: "3D Mesh",
    subtitle: "Three.js & R3F",
    icon: BoxIcon,
  },
  {
    id: "motion",
    label: "Motion",
    subtitle: "Theatre.js Curves",
    icon: FilmIcon,
  },
  {
    id: "sketch",
    label: "Annotate",
    subtitle: "Excalidraw Paint",
    icon: PencilLineIcon,
  },
];

const stopLeak = (e: React.SyntheticEvent) => e.stopPropagation();

export function ModeToolbar() {
  const { state, dispatch } = useToolcraft();
  const rawMode = state.values[STUDIO_MODE];
  const mode = (rawMode as StudioMode | undefined) ?? "design";

  useEffect(() => {
    if (rawMode === undefined) {
      dispatch({ type: "controls.setValue", target: STUDIO_MODE, value: "design" });
    }
  }, [rawMode, dispatch]);

  return (
    <nav
      aria-label="Studio Modes"
      className="pointer-events-auto flex items-center gap-1 rounded-2xl border border-border bg-card/85 p-1 shadow-[0_16px_36px_rgba(0,0,0,0.6)] backdrop-blur-2xl select-none"
      onPointerDown={stopLeak}
      onMouseDown={stopLeak}
      onTouchStart={stopLeak}
      onClick={stopLeak}
    >
      {MODES.map((m) => {
        const active = mode === m.id;
        const Icon = m.icon;

        return (
          <button
            key={m.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              dispatch({ type: "controls.setValue", target: STUDIO_MODE, value: m.id });
            }}
            aria-label={`${m.label} (${m.subtitle})`}
            aria-pressed={active}
            className={cn(
              "relative flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-medium transition-colors cursor-pointer pointer-events-auto z-10",
              active ? "text-accent-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {active && (
              <motion.div
                layoutId="mode-header-pill"
                className="absolute inset-0 rounded-xl bg-primary/20 border border-primary/35 shadow-[0_0_12px_rgba(139,92,246,0.3)] z-0"
                transition={{ type: "spring", stiffness: 450, damping: 32 }}
              />
            )}
            <Icon className="relative z-10 h-4 w-4 shrink-0" />
            <span className="relative z-10 font-medium tracking-tight">{m.label}</span>
          </button>
        );
      })}

      <div className="mx-1 h-4 w-px bg-border" aria-hidden="true" />
      
      <Link
        href="/canvas"
        className="flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground cursor-pointer z-10 pointer-events-auto"
        title="Back to Canvas"
      >
        <ScaffoldIcon className="h-4 w-4 shrink-0" />
        <span className="font-medium tracking-tight">Canvas</span>
      </Link>
    </nav>
  );
}
