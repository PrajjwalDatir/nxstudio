"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { useWorkspace } from "@/lib/workspace-store";
import {
  CAPABILITY_OPTIONS,
  SURFACE_OPTIONS,
  compileStack,
  stackSlots,
} from "@/lib/platform-engine";
import { Capability, Surface } from "@/lib/types";
import { PhaseHeader } from "./PhaseHeader";
import {
  CheckIcon,
  ChevronRightIcon,
  LayersIcon,
  GlobeIcon,
  MonitorIcon,
  LockIcon,
  DatabaseIcon,
  ZapIcon,
  UsersIcon,
  CreditCardIcon,
  FolderIcon,
  BellIcon,
  SparklesIcon,
  PaletteIcon,
} from "@/components/icons";
import { AppleMark, AndroidMark } from "@/components/landing/brand-icons";
import { cn } from "@/lib/utils";

type IconType = ComponentType<{ className?: string }>;

const SURFACE_ICON: Record<Surface, IconType> = {
  web: GlobeIcon,
  ios: AppleMark,
  android: AndroidMark,
  desktop: MonitorIcon,
};

const CAPABILITY_ICON: Record<Capability, IconType> = {
  auth: LockIcon,
  database: DatabaseIcon,
  realtime: ZapIcon,
  multiplayer: UsersIcon,
  payments: CreditCardIcon,
  storage: FolderIcon,
  push: BellIcon,
  ai: SparklesIcon,
  graphics: PaletteIcon,
};

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function TechStackPhase() {
  const { data, updateTech, toggleChecklist, isStepDone } = useWorkspace();
  const { surfaces, capabilities } = data.tech;
  const stack = compileStack(data.tech);
  const configured = isStepDone("tech-stack", "configured");

  const setSurfaces = (s: Surface) => updateTech("surfaces", toggle(surfaces, s));
  const setCapabilities = (c: Capability) => updateTech("capabilities", toggle(capabilities, c));

  const confirm = () => {
    if (surfaces.length > 0 && !configured) toggleChecklist("tech-stack", "configured");
  };

  return (
    <>
      <PhaseHeader title="Tech Stack" status="in-progress" phaseId="tech-stack" />

      <p className="max-w-2xl text-sm text-muted-foreground">
        Pick what you&apos;re shipping and what it needs to do. nx derives the framework, backend,
        and libraries — you never choose them by hand.
      </p>

      {/* Surfaces */}
      <section className="mt-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Where does it ship?</h2>
          <span className="text-xs text-muted-foreground">Pick one or more</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {SURFACE_OPTIONS.map((opt) => {
            const on = surfaces.includes(opt.id);
            const Icon = SURFACE_ICON[opt.id];
            return (
              <button
                key={opt.id}
                onClick={() => setSurfaces(opt.id)}
                aria-pressed={on}
                className={cn(
                  "relative flex flex-col gap-1 rounded-xl border-2 p-4 text-left transition-all",
                  on ? "border-primary bg-accent/40" : "border-border hover:border-primary/50"
                )}
              >
                <span
                  className={cn(
                    "absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-md border transition-colors",
                    on ? "border-primary bg-primary text-primary-foreground" : "border-border text-transparent"
                  )}
                >
                  <CheckIcon className="h-3 w-3" />
                </span>
                <Icon className={cn("h-6 w-6", on ? "text-primary" : "text-muted-foreground")} />
                <span className="mt-1 font-medium">{opt.label}</span>
                <span className="text-xs text-muted-foreground">{opt.description}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Capabilities */}
      <section className="mt-8">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">What does it need to do?</h2>
          <span className="text-xs text-muted-foreground">Optional</span>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITY_OPTIONS.map((opt) => {
            const on = capabilities.includes(opt.id);
            const Icon = CAPABILITY_ICON[opt.id];
            return (
              <button
                key={opt.id}
                onClick={() => setCapabilities(opt.id)}
                aria-pressed={on}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-3 text-left transition-all",
                  on ? "border-primary bg-accent/30" : "border-border hover:border-primary/40"
                )}
              >
                <Icon className={cn("mt-0.5 h-4.5 w-4.5 shrink-0", on ? "text-primary" : "text-muted-foreground")} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{opt.label}</span>
                  <span className="block text-xs text-muted-foreground">{opt.description}</span>
                </span>
                <span
                  className={cn(
                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                    on ? "border-primary bg-primary text-primary-foreground" : "border-border text-transparent"
                  )}
                >
                  <CheckIcon className="h-2.5 w-2.5" />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Derived stack — live */}
      <section className="mt-8">
        <div className="flex items-center gap-2">
          <LayersIcon className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold">Your derived stack</h2>
        </div>

        {!stack ? (
          <div className="mt-3 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Pick at least one surface above and your stack appears here.
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-border bg-card p-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {stackSlots(stack).map((s) => (
                <div key={s.label} className="rounded-lg border border-border bg-background p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {s.label}
                  </div>
                  <div className="mt-1 text-sm font-medium">{s.value}</div>
                </div>
              ))}
            </div>

            {stack.libraries.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Libraries
                </span>
                {stack.libraries.map((lib) => (
                  <span
                    key={lib}
                    className="rounded-md border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground"
                  >
                    {lib}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-4 rounded-lg border border-primary/30 bg-accent/30 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                Why this stack
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{stack.rationale}</p>
            </div>
          </div>
        )}
      </section>

      {/* Continue */}
      {stack && (
        <div className="mt-6 flex justify-end">
          <Link
            href="/canvas/build"
            onClick={confirm}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Continue to Build
            <ChevronRightIcon className="h-4 w-4" />
          </Link>
        </div>
      )}
    </>
  );
}
