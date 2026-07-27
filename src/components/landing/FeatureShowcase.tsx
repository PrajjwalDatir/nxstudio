"use client";

import { useCallback, useMemo, useState, type ComponentType, type ReactNode } from "react";
import {
  CopyIcon,
  CheckIcon,
  GitBranchIcon,
  SearchIcon,
  ArrowRightIcon,
  PlusIcon,
  CommandIcon,
  GlobeIcon,
  MonitorIcon,
  BoxIcon,
} from "@/components/icons";
import { AppleMark, AndroidMark } from "@/components/landing/brand-icons";
import { compileStack, SURFACE_OPTIONS } from "@/lib/platform-engine";
import type { Capability, CompiledStack, Surface } from "@/lib/types";

/** Official platform marks per surface (Apple/Android logos) — no emoji in the UI. */
const SURFACE_ICON: Record<Surface, ComponentType<{ className?: string }>> = {
  web: GlobeIcon,
  ios: AppleMark,
  android: AndroidMark,
  desktop: MonitorIcon,
};

/**
 * Features, shown *and* played. Each cell is a small, real slice of the product
 * you can actually poke — toggle the stack, filter the command palette, copy the
 * prompt, tick a phase forward — so "show, don't tell" is literal. Client
 * component: all state is local and trivial, nothing leaves the card.
 */

// Baseline capabilities for the nxstudio demo — dogfooding our own product, a web
// app that always needs accounts + a database, so the backend stays Supabase. The
// visitor drives the SURFACES (and an optional 3D toggle); everything else is
// engine output.
const BASE_CAPS: Capability[] = ["auth", "database"];

// Which library string counts as the "3D surface" line, per frontend. Matches
// what platform-engine::graphicsLib emits (Three.js, Flame, SceneKit, …).
const GFX_RE = /Three\.js|Flame|SceneKit|RealityKit|Filament|OpenGL/;

/** Compile the founder's picks into the exact build-prompt.md the agent gets. */
function buildPrompt(stack: CompiledStack): string {
  const lines = [
    "# Build: nxstudio",
    `Stack: ${stack.frontend} · ${stack.language} · ${stack.backend}`,
    `Target: ${stack.platform} · ${stack.hosting}`,
  ];
  if (stack.libraries.length) lines.push(`Libraries: ${stack.libraries.join(" · ")}`);
  lines.push("", "## Scaffold", "- Read `.nx/` for architecture + brand");
  if (stack.backend.startsWith("Supabase")) lines.push("- Supabase auth + `profiles` table");
  else if (stack.backend.startsWith("SpacetimeDB")) lines.push("- SpacetimeDB module + realtime sync");
  else lines.push("- Local-first persistence on device");
  lines.push("- Project canvas → derived stack → one build prompt");
  const gfx = stack.libraries.find((l) => GFX_RE.test(l));
  if (gfx) lines.push(`- Animated 3D surface (${gfx})`);
  return lines.join("\n");
}

const PALETTE = [
  { icon: ArrowRightIcon, label: "Go to Tech Stack", hint: "↵" },
  { icon: PlusIcon, label: "New phase", hint: "⇧N" },
  { icon: CopyIcon, label: "Copy build prompt", hint: "⌘C" },
  { icon: GitBranchIcon, label: "Sync to GitHub", hint: "⌘G" },
  { icon: SearchIcon, label: "Search everything", hint: "⌘K" },
];

const INITIAL_PHASES = [
  { label: "Brief", done: 4, total: 4, tone: "bg-emerald-500" },
  { label: "Tech Stack", done: 2, total: 5, tone: "bg-primary" },
  { label: "Build", done: 0, total: 3, tone: "bg-muted-foreground/40" },
];

function CardShell({
  title,
  line,
  className = "",
  children,
}: {
  title: string;
  line: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-xl glass p-5 transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-white/12 ${className}`}
    >
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{line}</p>
      <div className="mt-5 flex-1">{children}</div>
    </div>
  );
}

export function FeatureShowcase() {
  // The visitor's picks live here so the Stack selector (right) and the
  // build-prompt.md (left) read the same engine output — change a surface and
  // the prompt recompiles through the real platform-engine.
  const [surfaces, setSurfaces] = useState<Set<Surface>>(() => new Set<Surface>(["web"]));
  const [graphics, setGraphics] = useState(false);

  const toggleSurface = useCallback((id: Surface) => {
    setSurfaces((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id); // always keep at least one surface
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Non-null: we guarantee ≥1 surface above, and compileStack only returns null
  // when no surface is chosen.
  const stack = useMemo(
    () =>
      compileStack({
        surfaces: [...surfaces],
        capabilities: [...BASE_CAPS, ...(graphics ? (["graphics"] as Capability[]) : [])],
      })!,
    [surfaces, graphics]
  );

  return (
    <div className="mt-12 grid gap-4 lg:grid-cols-6">
      <PromptCard className="lg:col-span-4" stack={stack} />
      <StackCard
        className="lg:col-span-2"
        surfaces={surfaces}
        onToggleSurface={toggleSurface}
        graphics={graphics}
        onToggleGraphics={() => setGraphics((g) => !g)}
      />
      <PaletteCard className="lg:col-span-2" />
      <PhasesCard className="lg:col-span-2" />
      <SyncCard className="lg:col-span-2" />
    </div>
  );
}

/* ── One build prompt — recompiled live from the Stack picks ────────────────── */
function PromptCard({ className, stack }: { className?: string; stack: CompiledStack }) {
  const promptText = useMemo(() => buildPrompt(stack), [stack]);
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    navigator.clipboard?.writeText(promptText).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }, [promptText]);

  return (
    <CardShell
      title="One prompt, not forty messages"
      line="Everything your agent needs, compiled into a single paste."
      className={className}
    >
      <div className="overflow-hidden rounded-xl border border-white/5 bg-background/50">
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-2.5">
          <span className="font-mono text-[11px] text-muted-foreground">build-prompt.md</span>
          <button
            onClick={copy}
            aria-live="polite"
            className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors ${
              copied
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-primary/30 bg-primary/10 text-primary hover:bg-primary/15"
            }`}
          >
            {copied ? <CheckIcon className="h-3 w-3" /> : <CopyIcon className="h-3 w-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <pre className="overflow-x-auto px-4 py-3.5 font-mono text-[11.5px] leading-relaxed text-foreground/80">
          {promptText.split("\n").map((ln, i) => (
            <span key={i} className={ln.startsWith("#") ? "text-primary" : undefined}>
              {ln}
              {"\n"}
            </span>
          ))}
        </pre>
      </div>
    </CardShell>
  );
}

/* ── Surfaces you pick — the engine derives the stack, live ─────────────────── */
function StackCard({
  className,
  surfaces,
  onToggleSurface,
  graphics,
  onToggleGraphics,
}: {
  className?: string;
  surfaces: Set<Surface>;
  onToggleSurface: (id: Surface) => void;
  graphics: boolean;
  onToggleGraphics: () => void;
}) {
  const chip = (on: boolean) =>
    `inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
      on
        ? "border-primary/40 bg-primary/15 text-foreground"
        : "border-border bg-transparent text-muted-foreground hover:border-primary/30 hover:text-foreground"
    }`;

  return (
    <CardShell
      title="Pick surfaces, get a stack"
      line="Choose where it ships — the engine derives the rest."
      className={className}
    >
      <div className="flex flex-wrap gap-2">
        {SURFACE_OPTIONS.map((s) => {
          const on = surfaces.has(s.id);
          const Icon = SURFACE_ICON[s.id];
          return (
            <button
              key={s.id}
              onClick={() => onToggleSurface(s.id)}
              aria-pressed={on}
              className={chip(on)}
            >
              <Icon className="h-3.5 w-3.5" />
              {s.label}
            </button>
          );
        })}
        <button onClick={onToggleGraphics} aria-pressed={graphics} className={chip(graphics)}>
          <BoxIcon className="h-3.5 w-3.5" />
          3D / graphics
        </button>
      </div>
    </CardShell>
  );
}

/* ── Command palette — a live filter you can type into ──────────────────────── */
function PaletteCard({ className }: { className?: string }) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(PALETTE[0].label);
  const filtered = useMemo(
    () => PALETTE.filter((p) => p.label.toLowerCase().includes(q.trim().toLowerCase())),
    [q]
  );

  return (
    <CardShell
      title="⌘K everything"
      line="Drive the whole studio from the keyboard — try typing."
      className={className}
    >
      <div className="overflow-hidden rounded-xl border border-white/5 bg-background/50">
        <div className="flex items-center gap-2.5 border-b border-white/5 px-3.5 py-2.5">
          <SearchIcon className="h-3.5 w-3.5 text-primary" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Command nx…"
            aria-label="Filter commands"
            className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <CommandIcon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <ul className="min-h-[112px] p-1.5">
          {filtered.length === 0 && (
            <li className="px-2.5 py-6 text-center text-xs text-muted-foreground">No commands.</li>
          )}
          {filtered.map(({ icon: Icon, label, hint }) => {
            const on = active === label;
            return (
              <li key={label}>
                <button
                  onMouseEnter={() => setActive(label)}
                  onClick={() => setActive(label)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                    on ? "bg-accent text-accent-foreground" : "text-foreground/80 hover:bg-white/5"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="flex-1">{label}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{hint}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </CardShell>
  );
}

/* ── Phase tracking — tick a phase forward and watch it fill ────────────────── */
function PhasesCard({ className }: { className?: string }) {
  const [phases, setPhases] = useState(INITIAL_PHASES);
  const bump = useCallback((i: number) => {
    setPhases((prev) =>
      prev.map((p, idx) =>
        idx === i ? { ...p, done: p.done >= p.total ? 0 : p.done + 1 } : p
      )
    );
  }, []);

  return (
    <CardShell
      title="Phases that track themselves"
      line="Tick a step — progress moves as the work gets done."
      className={className}
    >
      <div className="space-y-3.5">
        {phases.map((p, i) => (
          <button key={p.label} onClick={() => bump(i)} className="block w-full text-left">
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground/85">{p.label}</span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {p.done}/{p.total}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
              <div
                className={`h-full rounded-full transition-[width] duration-500 ${p.tone}`}
                style={{ width: `${(p.done / p.total) * 100}%` }}
              />
            </div>
          </button>
        ))}
      </div>
    </CardShell>
  );
}

/* ── GitHub sync — a live-looking status row ────────────────────────────────── */
function SyncCard({ className }: { className?: string }) {
  return (
    <CardShell
      title="Synced to your repo"
      line="Keep the plan next to where the code lives."
      className={className}
    >
      <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-background/50 px-3.5 py-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/8 bg-secondary/40">
          <GitBranchIcon className="h-4 w-4 text-foreground/80" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-xs text-foreground/90">nx-studio/nxstudio</p>
          <p className="text-[11px] text-muted-foreground">main · updated 2m ago</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Synced
        </span>
      </div>
    </CardShell>
  );
}
