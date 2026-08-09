"use client";

/**
 * Studio — the visual half of nxstudio, shown as a real (if mocked) editor.
 *
 * The actual Studio is one shared canvas driven by a floating mode toolbar
 * (Design / 3D / Motion) with a Brand + Generative inspector on the right and an
 * Excalidraw annotation layer on top. This section reproduces that layout and
 * makes the essentials live: pick an accent and the whole canvas recolours,
 * switch modes and the centre object changes, drag density and the particle
 * field thickens. It's the same argument as the rest of the page — show the
 * product, don't describe it — kept to flat, on-DNA surfaces (no gradients).
 */

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { SectionKicker } from "./SectionKicker";
import { AuthButton } from "./AuthOverlay";
import {
  PencilLineIcon,
  HexagonIcon,
  WavesIcon,
  GemIcon,
  AtomIcon,
  WorkflowIcon,
  ArrowRightIcon,
  DiscIcon,
  PencilIcon,
} from "@/components/icons";

type Mode = "design" | "spatial" | "motion";

const MODES: { id: Mode; label: string; Icon: typeof HexagonIcon }[] = [
  { id: "design", label: "Design", Icon: PencilLineIcon },
  { id: "spatial", label: "3D", Icon: HexagonIcon },
  { id: "motion", label: "Motion", Icon: WavesIcon },
];

const ACCENTS = ["#8B5CF6", "#22D3EE", "#F472B6", "#34D399", "#FB923C"];
const VIBES = ["Minimal", "Playful", "Bold", "Elegant"];
const ENGINES = ["Flow field", "Particles", "Neon rings"];

const HIGHLIGHTS = [
  {
    Icon: GemIcon,
    title: "Brand DNA",
    line: "Primary colour, vibe, corner radius and type: the tokens your agent builds against.",
  },
  {
    Icon: AtomIcon,
    title: "Generative canvas",
    line: "Flow fields, particles, neon rings: living backdrops tuned in real time, over a 3D object and its motion.",
  },
  {
    Icon: WorkflowIcon,
    title: "Attach to build",
    line: "Push the whole look into your build prompts in one click, no re-describing it in words.",
  },
];

/** Deterministic constellation so the canvas backdrop is stable across renders. */
const NODES = [
  [46, 60], [120, 38], [188, 74], [262, 44], [330, 82],
  [70, 138], [150, 168], [232, 132], [308, 176], [366, 120],
  [40, 210], [110, 236], [196, 214], [278, 240], [350, 208],
] as const;
const EDGES = [
  [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [1, 6], [2, 7], [3, 8],
  [5, 6], [6, 7], [7, 8], [8, 9], [5, 10], [6, 11], [7, 12], [8, 13],
  [10, 11], [11, 12], [12, 13], [13, 14],
] as const;

/** A deterministic scatter for the generative particle layer (seeded LCG). */
const PARTICLES: [number, number, number][] = (() => {
  let s = 20260731;
  const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  return Array.from({ length: 48 }, () => [rnd() * 400, rnd() * 260, rnd()]);
})();

export function StudioShowcase() {
  const reduce = useReducedMotion();
  const [mode, setMode] = useState<Mode>("design");
  const [accent, setAccent] = useState(ACCENTS[0]);
  const [vibe, setVibe] = useState(VIBES[0]);
  const [radius, setRadius] = useState(10);
  const [engine, setEngine] = useState(ENGINES[0]);
  const [density, setDensity] = useState(65);
  const [seed, setSeed] = useState(40219);

  const backdrop = useMemo(() => {
    const count = Math.round((density / 100) * PARTICLES.length);
    return (
      <svg
        viewBox="0 0 400 260"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        {/* generative particle field */}
        {PARTICLES.slice(0, count).map(([x, y, r], i) => (
          <circle key={`p${i}`} cx={x} cy={y} r={0.6 + r * 1.4} fill={accent} fillOpacity={0.12 + r * 0.16} />
        ))}
        {/* constellation lattice */}
        {EDGES.map(([a, b], i) => (
          <line
            key={`e${i}`}
            x1={NODES[a][0]}
            y1={NODES[a][1]}
            x2={NODES[b][0]}
            y2={NODES[b][1]}
            stroke={accent}
            strokeOpacity={0.14}
            strokeWidth={1}
          />
        ))}
        {NODES.map(([x, y], i) => (
          <circle key={`n${i}`} cx={x} cy={y} r={i % 4 === 0 ? 2.4 : 1.5} fill={accent} fillOpacity={i % 4 === 0 ? 0.55 : 0.3} />
        ))}
      </svg>
    );
  }, [accent, density]);

  return (
    <section id="studio" className="scroll-mt-20 border-t border-border">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 md:py-28">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
          {/* ── Copy ─────────────────────────────────────────────────────── */}
          <div>
            <SectionKicker index="03">Studio</SectionKicker>
            <h2 className="mt-4 max-w-md text-2xl font-bold tracking-tight sm:text-4xl">
              Design its face while you spec its guts.
            </h2>
            <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">
              A prompt can carry the plan, but not the feel. The Studio is one
              canvas for colour, motion and mood: set the brand, tune the
              backdrop, sketch a note, and attach it straight to your build
              context.
            </p>

            <ul className="mt-8 space-y-5">
              {HIGHLIGHTS.map(({ Icon, title, line }) => (
                <li key={title} className="flex gap-3.5">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-accent-foreground">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{line}</p>
                  </div>
                </li>
              ))}
            </ul>

            <AuthButton
              source="studio_showcase"
              redirectTo="/studio"
              className="group mt-9 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 font-mono text-xs font-semibold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Open the Studio
              <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </AuthButton>
          </div>

          {/* ── The editor ───────────────────────────────────────────────── */}
          <div className="overflow-hidden rounded-xl border border-border bg-card/60 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.8)]">
            {/* window chrome */}
            <div className="flex items-center gap-3 border-b border-border px-4 py-2.5">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-border" />
                <span className="h-2.5 w-2.5 rounded-full bg-border" />
                <span className="h-2.5 w-2.5 rounded-full bg-border" />
              </div>
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                nxstudio · studio
              </span>
              <span className="ml-auto hidden items-center gap-1.5 font-mono text-[11px] text-muted-foreground sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                localStorage
              </span>
            </div>

            <div className="flex flex-col sm:flex-row">
              {/* floating mode toolbar */}
              <div className="flex shrink-0 gap-1.5 border-b border-border p-2.5 sm:flex-col sm:border-b-0 sm:border-r">
                {MODES.map(({ id, label, Icon }) => {
                  const on = mode === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setMode(id)}
                      aria-pressed={on}
                      title={label}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
                        on
                          ? "border-primary/40 bg-primary/15 text-accent-foreground"
                          : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  );
                })}
                {/* annotate layer — a persistent overlay tool in the real Studio,
                    pinned to the bottom of the rail so it reads as separate from
                    the mode switches above. */}
                <span
                  title="Annotate"
                  className="hidden h-9 w-9 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground/70 sm:mt-auto sm:flex"
                >
                  <PencilIcon className="h-4 w-4" />
                </span>
              </div>

              {/* the one shared canvas */}
              <div className="relative min-h-[280px] flex-1 overflow-hidden bg-background/60">
                {backdrop}
                <div className="absolute inset-0 flex items-center justify-center">
                  <CanvasObject mode={mode} accent={accent} radius={radius} vibe={vibe} reduce={!!reduce} />
                </div>
                {/* annotation — a sketched note, standing in for the Excalidraw layer */}
                <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1.5">
                  <svg width="34" height="20" viewBox="0 0 34 20" aria-hidden>
                    <path d="M2 18 C 10 4, 20 4, 30 9" fill="none" stroke={accent} strokeOpacity="0.7" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="1 3" />
                    <path d="M25 6 L31 9 L26 13" fill="none" stroke={accent} strokeOpacity="0.7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="-rotate-2 rounded-md border border-border bg-background/80 px-1.5 py-0.5 font-mono text-[11px] text-foreground/70 backdrop-blur-sm">
                    make it pop
                  </span>
                </div>
                <span className="absolute left-3 top-3 rounded-md border border-border bg-background/70 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground backdrop-blur-sm">
                  {MODES.find((m) => m.id === mode)!.label} mode
                </span>
                <span className="absolute right-3 top-3 rounded-md border border-border bg-background/70 px-2 py-0.5 font-mono text-[11px] text-muted-foreground backdrop-blur-sm">
                  seed {seed}
                </span>
              </div>

              {/* Inspector — Brand · Generative · Deliver */}
              <div className="shrink-0 space-y-4 border-t border-border p-4 sm:w-60 sm:border-l sm:border-t-0">
                {/* Brand */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Brand</span>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] text-muted-foreground">Primary color</p>
                  <div className="flex gap-2">
                    {ACCENTS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setAccent(c)}
                        aria-label={`Accent ${c}`}
                        aria-pressed={accent === c}
                        className="h-6 w-6 rounded-full transition-transform hover:scale-110"
                        style={{ background: c, boxShadow: accent === c ? `0 0 0 2px var(--card), 0 0 0 4px ${c}` : undefined }}
                      />
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-background/50 p-1">
                  {VIBES.map((v) => (
                    <button
                      key={v}
                      onClick={() => setVibe(v)}
                      aria-pressed={vibe === v}
                      className={`rounded-md py-1 text-[11px] font-medium transition-colors ${
                        vibe === v ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <Slider label="Corner radius" value={radius} min={0} max={24} unit="px" accent={accent} onChange={setRadius} />

                {/* Generative */}
                <div className="flex items-center justify-between border-t border-border pt-4">
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Generative</span>
                  <AtomIcon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ENGINES.map((e) => (
                    <button
                      key={e}
                      onClick={() => setEngine(e)}
                      aria-pressed={engine === e}
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                        engine === e
                          ? "border-primary/40 bg-primary/15 text-foreground"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
                <Slider label="Density" value={density} min={0} max={100} accent={accent} onChange={setDensity} />

                {/* Deliver */}
                <div className="flex gap-2 border-t border-border pt-4">
                  <button
                    onClick={() => setSeed(Math.floor(10000 + Math.random() * 89999))}
                    title="Randomize seed"
                    aria-label="Randomize seed"
                    className="flex h-8 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <DiscIcon className="h-3.5 w-3.5" />
                  </button>
                  <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 py-2 text-[11px] font-semibold text-accent-foreground transition-colors hover:bg-primary/20">
                    <WorkflowIcon className="h-3 w-3" />
                    Attach to build
                  </button>
                </div>
              </div>
            </div>

            {/* status bar */}
            <div className="flex items-center gap-3 border-t border-border px-4 py-2 font-mono text-[11px] text-muted-foreground">
              <span className="text-foreground/70">{MODES.find((m) => m.id === mode)!.label}</span>
              <span className="text-muted-foreground/40">/</span>
              <span>{engine}</span>
              <span className="text-muted-foreground/40">/</span>
              <span>density {density}</span>
              <span className="ml-auto hidden sm:inline">attaches to <span className="text-accent-foreground">.nx/brand</span></span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** A compact labelled range control, tinted by the active accent. */
function Slider({
  label,
  value,
  min,
  max,
  unit,
  accent,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  accent: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-foreground/80">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className="h-1 w-full cursor-pointer appearance-none rounded-full bg-secondary"
        style={{ accentColor: accent }}
      />
    </div>
  );
}

/** The single object the canvas composites — swapped by mode, tinted by accent. */
function CanvasObject({
  mode,
  accent,
  radius,
  vibe,
  reduce,
}: {
  mode: Mode;
  accent: string;
  radius: number;
  vibe: string;
  reduce: boolean;
}) {
  if (mode === "design") {
    return (
      <div
        className="w-44 overflow-hidden border bg-card/90 backdrop-blur-sm"
        style={{ borderRadius: radius, borderColor: `${accent}55` }}
      >
        <div className="h-14" style={{ background: accent }} />
        <div className="space-y-2 p-3">
          <div className="h-2 w-2/3 rounded-full bg-foreground/25" />
          <div className="h-2 w-full rounded-full bg-foreground/10" />
          <div className="flex items-center justify-between pt-1">
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{ background: `${accent}22`, color: accent }}
            >
              {vibe}
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">{radius}px</span>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "spatial") {
    return (
      <motion.svg
        width={150}
        height={150}
        viewBox="-60 -60 120 120"
        animate={reduce ? undefined : { rotate: 360 }}
        transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
      >
        <polygon
          points="0,-50 43,-25 43,25 0,50 -43,25 -43,-25"
          fill={`${accent}12`}
          stroke={accent}
          strokeWidth={1.5}
        />
        <polygon
          points="0,-28 24,-14 24,14 0,28 -24,14 -24,-14"
          fill="none"
          stroke={accent}
          strokeOpacity={0.6}
          strokeWidth={1}
        />
        <line x1={0} y1={-50} x2={0} y2={-28} stroke={accent} strokeOpacity={0.5} />
        <line x1={43} y1={-25} x2={24} y2={-14} stroke={accent} strokeOpacity={0.5} />
        <line x1={43} y1={25} x2={24} y2={14} stroke={accent} strokeOpacity={0.5} />
        <line x1={-43} y1={-25} x2={-24} y2={-14} stroke={accent} strokeOpacity={0.5} />
      </motion.svg>
    );
  }

  // motion
  return (
    <div className="relative h-40 w-40">
      <svg viewBox="0 0 160 160" className="absolute inset-0 h-full w-full">
        <circle cx={80} cy={80} r={62} fill="none" stroke={accent} strokeOpacity={0.25} strokeWidth={1} strokeDasharray="4 6" />
        <circle cx={80} cy={80} r={38} fill="none" stroke={accent} strokeOpacity={0.35} strokeWidth={1} />
        <circle cx={80} cy={80} r={6} fill={accent} fillOpacity={0.9} />
      </svg>
      <motion.div
        className="absolute inset-0"
        animate={reduce ? undefined : { rotate: 360 }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      >
        <span
          className="absolute left-1/2 top-[18px] h-3 w-3 -translate-x-1/2 rounded-full"
          style={{ background: accent, boxShadow: `0 0 12px ${accent}` }}
        />
      </motion.div>
    </div>
  );
}
