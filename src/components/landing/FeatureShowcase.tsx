"use client";

import { useCallback, useMemo, useState, type ComponentType, type ReactNode } from "react";
import {
  CopyIcon,
  CheckIcon,
  BoxIcon,
  GlobeIcon,
  MonitorIcon,
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
      className={`group relative flex flex-col overflow-hidden rounded-xl glass p-5 transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-border ${className}`}
    >
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
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
    </div>
  );
}

/* ── Master build prompt — ZIP + Copy Prompt ─────────────────────────── */
function PromptCard({ className, stack }: { className?: string; stack: CompiledStack }) {
  const promptText = useMemo(() => buildPrompt(stack), [stack]);
  const [copied, setCopied] = useState(false);

  const copy = useCallback(() => {
    navigator.clipboard?.writeText(promptText).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }, [promptText]);

  const downloadZip = useCallback(async () => {
    const { exportNxZip } = await import("@/lib/nx-exporter");
    await exportNxZip({
      productName: "nxstudio-demo",
      idea: { problem: "One brief to full build order", targetUsers: "Founders", currentSolutions: "Manual prompts", differentiation: "Studio .nx/ engine" },
      brand: { vibe: "Modern Industrial", primaryColor: "#8B5CF6", radius: "12px", font: "Instrument Sans" },
      tech: { surfaces: ["web"], capabilities: ["auth", "database"] },
      checklist: {},
      customStages: [],
      iterations: [],
    });
  }, []);

  return (
    <CardShell
      title="Drop the bundle. Run the prompt."
      line="Download your .nx/ context bundle or copy the master prompt, and your agent reads disk and builds in one run."
      className={className}
    >
      <div className="overflow-hidden rounded-xl border border-border bg-background/50">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <span className="font-mono text-[11px] text-muted-foreground">build-prompt.md</span>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadZip}
              className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-accent-foreground transition-transform hover:-translate-y-0.5 hover:bg-primary/20"
            >
              <BoxIcon className="h-3 w-3" />
              Download .nx/ ZIP
            </button>
            <button
              onClick={copy}
              aria-live="polite"
              className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                copied
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-border bg-secondary/40 text-foreground hover:border-primary/40"
              }`}
            >
              {copied ? <CheckIcon className="h-3 w-3" /> : <CopyIcon className="h-3 w-3" />}
              {copied ? "Copied Prompt" : "Copy Prompt"}
            </button>
          </div>
        </div>
        <pre className="overflow-x-auto px-4 py-3.5 font-mono text-[11px] leading-relaxed text-foreground/80">
          {promptText.split("\n").map((ln, i) => (
            <span key={i} className={ln.startsWith("#") ? "text-accent-foreground" : "text-emerald-400 font-semibold"}>
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
      line="Choose where it ships, the engine derives the rest."
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


