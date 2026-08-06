"use client";

import { useState } from "react";
import {
  NxLogo,
  SearchIcon,
  LockIcon,
  CheckCircleIcon,
  CircleIcon,
  CreditCardIcon,
  BellIcon,
  KeyRoundIcon,
} from "@/components/icons";
import { PHASES, type PhaseId } from "@/lib/phases";
import { MAIN_NAV_ITEMS, STUDIO_MODE_NAV_ITEMS } from "@/lib/navigation";
import type { PhaseProgress } from "@/lib/types";
import { PhaseCardBody, PhaseCardFrame } from "@/components/canvas/PhaseCard";
import { cn } from "@/lib/utils";

/**
 * A frame of the actual nxstudio product (the Project Canvas) as the hero
 * visual — the pattern top dev-tool launches use: show the real app, in a
 * window, with a soft shadow that melts into the page.
 *
 * The phase cards are the real board components fed the real PHASES data, so
 * that view can't drift into flattering the product with UI we never shipped.
 * The other sidebar destinations are staged (nxstudio doesn't route from a
 * marketing page) but built from the same nav data and design tokens, so
 * clicking around the sidebar reads as a real, navigable product rather than
 * a static screenshot.
 */
const PREVIEW_PROGRESS: Record<PhaseId, PhaseProgress> = {
  idea: { done: 4, total: 4, percent: 100 },
  "tech-stack": { done: 2, total: 5, percent: 40 },
  build: { done: 1, total: 1, percent: 100 },
};

const TEAM = [
  { initials: "PD", name: "nx-studio", role: "Owner" },
  { initials: "AK", name: "Anya Kapoor", role: "Design" },
  { initials: "RS", name: "Rahul Seth", role: "Engineering" },
  { initials: "MJ", name: "Mira Jain", role: "Growth" },
];

const PROJECTS = [
  { name: "nxstudio", phase: "Build", percent: 100, updated: "2h ago" },
  { name: "Marketing site v2", phase: "Tech Stack", percent: 40, updated: "1d ago" },
  { name: "Mobile companion", phase: "Brief", percent: 100, updated: "4d ago" },
];

const MILESTONES = [
  { date: "Aug 12", label: "Tech stack locked", tag: "Tech Stack" },
  { date: "Aug 19", label: "Build prompt handoff", tag: "Build" },
  { date: "Aug 27", label: "Beta invite wave", tag: "Launch" },
];

const TASKS = [
  { label: "Finalize brand palette", done: true },
  { label: "Wire auth provider", done: true },
  { label: "Draft build prompt", done: false },
  { label: "QA the mobile breakpoint", done: false },
  { label: "Invite first 10 testers", done: false },
];

function MiniHeader({ title, subtitle }: { title: string; subtitle: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h3 className="text-base font-semibold tracking-tight">{title}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <span className="hidden items-center gap-1.5 text-[11px] text-muted-foreground sm:flex">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Synced
      </span>
    </div>
  );
}

function CanvasView() {
  return (
    <>
      <MiniHeader
        title="Project Canvas"
        subtitle={
          <>
            Tracking phases for <span className="text-accent-foreground">nxstudio</span>
          </>
        }
      />
      <div className="mt-4 flex items-center gap-3 rounded-lg border border-border bg-background/50 px-3.5 py-2.5">
        <SearchIcon className="h-4 w-4 text-accent-foreground" />
        <span className="flex-1 text-xs text-muted-foreground">Command nx for actions and search…</span>
        <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">⌘K</span>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {PHASES.map((phase) => (
          <PhaseCardFrame key={phase.id}>
            <PhaseCardBody phase={phase} progress={PREVIEW_PROGRESS[phase.id]} />
          </PhaseCardFrame>
        ))}
      </div>
    </>
  );
}

function StudioView() {
  return (
    <>
      <MiniHeader
        title="Studio"
        subtitle="Generative p5, 3D R3F, Motion & Annotate — one canvas per mode."
      />
      <div className="mt-4 grid grid-cols-2 gap-3">
        {STUDIO_MODE_NAV_ITEMS.map((mode, i) => {
          const Icon = mode.icon;
          return (
            <div
              key={mode.id}
              className={cn(
                "rounded-xl glass p-4",
                i === 0 && "ring-1 ring-primary/40"
              )}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <p className="mt-3 text-sm font-medium">{mode.label.replace("Studio: ", "")}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{mode.description}</p>
            </div>
          );
        })}
      </div>
    </>
  );
}

function ProjectsView() {
  return (
    <>
      <MiniHeader title="Projects" subtitle="Every workspace you're building with nxstudio." />
      <div className="mt-4 space-y-2">
        {PROJECTS.map((p) => (
          <div
            key={p.name}
            className="flex items-center justify-between rounded-lg border border-border bg-background/50 px-3.5 py-2.5"
          >
            <div>
              <p className="text-sm font-medium">{p.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{p.phase} · updated {p.updated}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1 w-16 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary" style={{ width: `${p.percent}%` }} />
              </div>
              <span className="text-[11px] text-muted-foreground">{p.percent}%</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function TeamView() {
  return (
    <>
      <MiniHeader title="Team" subtitle="Collaborators with access to this workspace." />
      <div className="mt-4 grid grid-cols-2 gap-3">
        {TEAM.map((m) => (
          <div key={m.name} className="flex items-center gap-2.5 rounded-lg border border-border bg-background/50 px-3 py-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold text-accent-foreground">
              {m.initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">{m.name}</p>
              <p className="text-[11px] text-muted-foreground">{m.role}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function CalendarView() {
  return (
    <>
      <MiniHeader title="Calendar" subtitle="Milestones derived from your phase timeline." />
      <div className="mt-4 space-y-2">
        {MILESTONES.map((m) => (
          <div key={m.label} className="flex items-center gap-3 rounded-lg border border-border bg-background/50 px-3.5 py-2.5">
            <span className="flex h-9 w-12 shrink-0 flex-col items-center justify-center rounded-md bg-secondary text-[11px] font-semibold text-accent-foreground">
              {m.date}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{m.label}</p>
            </div>
            <span className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">{m.tag}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function TasksView() {
  return (
    <>
      <MiniHeader title="Tasks" subtitle="This sprint's checklist, synced from the Build phase." />
      <div className="mt-4 space-y-1.5">
        {TASKS.map((t) => (
          <div key={t.label} className="flex items-center gap-2.5 rounded-lg border border-border bg-background/50 px-3.5 py-2">
            {t.done ? (
              <CheckCircleIcon className="h-4 w-4 shrink-0 text-primary" />
            ) : (
              <CircleIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <span className={cn("text-xs", t.done ? "text-muted-foreground line-through" : "text-foreground")}>
              {t.label}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

function SettingsView() {
  return (
    <>
      <MiniHeader title="Settings" subtitle="Workspace & API configuration." />
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between rounded-lg border border-border bg-background/50 px-3.5 py-2.5">
          <div className="flex items-center gap-2.5">
            <CreditCardIcon className="h-4 w-4 text-accent-foreground" />
            <span className="text-xs font-medium">Plan</span>
          </div>
          <span className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">Pro</span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border bg-background/50 px-3.5 py-2.5">
          <div className="flex items-center gap-2.5">
            <KeyRoundIcon className="h-4 w-4 text-accent-foreground" />
            <span className="text-xs font-medium">API key</span>
          </div>
          <span className="font-mono text-[11px] text-muted-foreground">nx_live_••••••••4f2a</span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border bg-background/50 px-3.5 py-2.5">
          <div className="flex items-center gap-2.5">
            <BellIcon className="h-4 w-4 text-accent-foreground" />
            <span className="text-xs font-medium">Notifications</span>
          </div>
          <span className="h-4 w-7 rounded-full bg-primary/80" aria-hidden />
        </div>
      </div>
    </>
  );
}

const VIEWS: Record<string, () => React.JSX.Element> = {
  "nav-canvas": CanvasView,
  "nav-studio": StudioView,
  "nav-projects": ProjectsView,
  "nav-team": TeamView,
  "nav-calendar": CalendarView,
  "nav-tasks": TasksView,
  "nav-settings": SettingsView,
};

export function CanvasPreview() {
  const [activeId, setActiveId] = useState<string>(MAIN_NAV_ITEMS[0].id);
  const ActiveView = VIEWS[activeId] ?? CanvasView;

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
            nxstudio.dev{MAIN_NAV_ITEMS.find((i) => i.id === activeId)?.href ?? "/canvas"}
          </div>
          <span className="hidden rounded-md border border-border bg-secondary/50 px-2 py-1 font-mono text-[11px] text-muted-foreground sm:inline">
            ⌘K
          </span>
        </div>

        {/* App shell: labeled sidebar (the real MAIN_NAV_ITEMS, clickable — it
            swaps the staged view on the right, so the frame feels like a real
            product to poke around in rather than a screenshot) + canvas */}
        <div className="flex">
          <div className="hidden w-44 shrink-0 flex-col border-r border-white/5 py-3 sm:flex">
            <div className="mb-2 flex items-center gap-2.5 px-3.5 pb-1">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-border">
                <NxLogo className="h-3.5 w-3.5 text-accent-foreground" />
              </span>
              <span className="text-sm font-semibold tracking-tight">nxstudio</span>
            </div>
            <ul className="space-y-0.5 px-2">
              {MAIN_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = item.id === activeId;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setActiveId(item.id)}
                      aria-current={active ? "page" : undefined}
                      className={
                        active
                          ? "flex w-full items-center gap-2.5 rounded-lg bg-accent px-2.5 py-1.5 text-left text-xs font-medium text-accent-foreground transition-colors"
                          : "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="min-w-0 flex-1 p-5 min-h-[360px] sm:min-h-[390px] sm:p-6">
            <ActiveView />
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
