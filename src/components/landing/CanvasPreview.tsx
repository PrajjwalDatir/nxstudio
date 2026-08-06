import { NxLogo, SearchIcon, LockIcon } from "@/components/icons";
import { PHASES, type PhaseId } from "@/lib/phases";
import { MAIN_NAV_ITEMS } from "@/lib/navigation";
import type { PhaseProgress } from "@/lib/types";
import { PhaseCardBody, PhaseCardFrame } from "@/components/canvas/PhaseCard";

/**
 * A frame of the actual nxstudio product (the Project Canvas) as the hero
 * visual — the pattern top dev-tool launches use: show the real app, in a
 * window, with a soft shadow that melts into the page.
 *
 * The phase cards are the real board components fed the real PHASES data, so
 * this can't drift into flattering the product with UI we never shipped. Only
 * the progress numbers are staged, to show all three states at once.
 */
const PREVIEW_PROGRESS: Record<PhaseId, PhaseProgress> = {
  idea: { done: 4, total: 4, percent: 100 },
  "tech-stack": { done: 2, total: 5, percent: 40 },
  build: { done: 1, total: 1, percent: 100 },
};

export function CanvasPreview() {
  return (
    <div className="relative">
      <div
        className="relative overflow-hidden rounded-xl border border-white/10 bg-card shadow-[0_40px_120px_-24px_rgba(0,0,0,0.85)]"
        style={{ boxShadow: "0 40px 120px -24px rgba(0,0,0,0.85), inset 0 1px 0 0 rgba(255,255,255,0.05)" }}
      >
        {/* Browser chrome */}
        <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]/80" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]/80" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]/80" />
          </div>
          <div className="mx-auto flex items-center gap-1.5 rounded-md border border-border bg-background/60 px-3 py-1 font-mono text-[11px] text-muted-foreground">
            <LockIcon className="h-3 w-3" />
            nxstudio.dev/canvas
          </div>
          <span className="hidden rounded-md border border-border bg-secondary/50 px-2 py-1 font-mono text-[11px] text-muted-foreground sm:inline">
            ⌘K
          </span>
        </div>

        {/* App shell: labeled sidebar (the real MAIN_NAV_ITEMS) + canvas */}
        <div className="flex">
          <div className="hidden w-44 shrink-0 flex-col border-r border-white/5 py-3 sm:flex">
            <div className="mb-2 flex items-center gap-2.5 px-3.5 pb-1">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-border">
                <NxLogo className="h-3.5 w-3.5 text-accent-foreground" />
              </span>
              <span className="text-sm font-semibold tracking-tight">nxstudio</span>
            </div>
            <ul className="space-y-0.5 px-2">
              {MAIN_NAV_ITEMS.map((item, i) => {
                const Icon = item.icon;
                const active = i === 0; // Canvas is the page being previewed
                return (
                  <li key={item.id}>
                    <span
                      className={
                        active
                          ? "flex items-center gap-2.5 rounded-lg bg-accent px-2.5 py-1.5 text-xs font-medium text-accent-foreground"
                          : "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground"
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="min-w-0 flex-1 p-5 sm:p-6">
            <div className="flex items-baseline justify-between">
              <div>
                <h3 className="text-base font-semibold tracking-tight">Project Canvas</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Tracking phases for <span className="text-accent-foreground">nxstudio</span>
                </p>
              </div>
              <span className="hidden items-center gap-1.5 text-[11px] text-muted-foreground sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Synced
              </span>
            </div>

            {/* Command bar */}
            <div className="mt-4 flex items-center gap-3 rounded-lg border border-border bg-background/50 px-3.5 py-2.5">
              <SearchIcon className="h-4 w-4 text-accent-foreground" />
              <span className="flex-1 text-xs text-muted-foreground">
                Command nx for actions and search…
              </span>
              <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                ⌘K
              </span>
            </div>

            {/* Phase cards — the real Canvas board component, real phase data */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {PHASES.map((phase) => (
                <PhaseCardFrame key={phase.id}>
                  <PhaseCardBody phase={phase} progress={PREVIEW_PROGRESS[phase.id]} />
                </PhaseCardFrame>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fade the frame into the page */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -bottom-1 h-28 bg-gradient-to-t from-background via-background/70 to-transparent"
      />
    </div>
  );
}
