"use client";

import React from "react";
import { motion } from "framer-motion";
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export interface PhaseSectionItem {
  id: string;
  label: string;
  shortLabel?: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  isDone?: boolean;
}

interface PhaseSectionNavProps {
  sections: PhaseSectionItem[];
  activeId: string;
  onSelect: (id: string) => void;
  phaseLabel?: string;
}

export function PhaseSectionNav({
  sections,
  activeId,
  onSelect,
  phaseLabel = "Phase",
}: PhaseSectionNavProps) {
  const currentIndex = sections.findIndex((s) => s.id === activeId);
  const activeSection = sections[currentIndex] ?? sections[0];
  const completedCount = sections.filter((s) => s.isDone).length;
  const progressPercent = Math.round((completedCount / sections.length) * 100);

  return (
    <div className="mb-8 space-y-4">
      {/* ── Top Progress Status Bar ────────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
            {phaseLabel} · Step {currentIndex + 1} of {sections.length}
          </span>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-xs font-medium text-foreground">
            {activeSection?.label}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-medium text-muted-foreground">
            {completedCount}/{sections.length} complete ({progressPercent}%)
          </span>
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-secondary/80 border border-border/40">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={false}
              animate={{ width: `${progressPercent}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          </div>
        </div>
      </div>

      {/* ── Segmented Progress Bar (Track) ──────────────────────────────── */}
      <div className="grid grid-cols-5 gap-1.5">
        {sections.map((sec, idx) => {
          const isCurrent = sec.id === activeId;
          const isComplete = sec.isDone;

          return (
            <div
              key={sec.id}
              onClick={() => onSelect(sec.id)}
              className="group cursor-pointer py-1"
            >
              <div
                className={cn(
                  "h-1.5 w-full rounded-full transition-all duration-200",
                  isCurrent
                    ? "bg-primary shadow-[0_0_8px_rgba(168,85,247,0.4)]"
                    : isComplete
                    ? "bg-primary/50 group-hover:bg-primary/70"
                    : "bg-secondary group-hover:bg-secondary-foreground/20"
                )}
              />
            </div>
          );
        })}
      </div>

      {/* ── Interactive Navigation Pills ─────────────────────────────────── */}
      <div className="flex overflow-x-auto pb-1 scrollbar-none">
        <nav
          aria-label={`${phaseLabel} section navigation`}
          className="inline-flex min-w-full sm:min-w-0 items-center gap-1 rounded-2xl border border-border/80 bg-card/60 p-1.5 shadow-sm backdrop-blur-sm"
        >
          {sections.map((sec, idx) => {
            const Icon = sec.icon;
            const isCurrent = sec.id === activeId;
            const isComplete = sec.isDone;

            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => onSelect(sec.id)}
                className={cn(
                  "relative flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-all whitespace-nowrap outline-none",
                  isCurrent
                    ? "text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                )}
              >
                {isCurrent && (
                  <motion.div
                    layoutId={`phase-pill-active-${phaseLabel.toLowerCase()}`}
                    className="absolute inset-0 rounded-xl bg-primary shadow-sm"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}

                <span className="relative z-10 flex items-center gap-1.5">
                  <span
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-mono",
                      isCurrent
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : isComplete
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-secondary text-muted-foreground"
                    )}
                  >
                    {isComplete && !isCurrent ? (
                      <CheckIcon className="h-2.5 w-2.5" />
                    ) : (
                      idx + 1
                    )}
                  </span>
                  <Icon className={cn("h-3.5 w-3.5 shrink-0", isCurrent ? "text-primary-foreground" : "")} />
                  <span className="hidden sm:inline">{sec.label}</span>
                  <span className="inline sm:hidden">{sec.shortLabel ?? sec.label}</span>
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

interface PhaseSectionFooterProps {
  prev?: PhaseSectionItem | null;
  next?: PhaseSectionItem | null;
  onNavigate: (id: string) => void;
  finalAction?: React.ReactNode;
}

export function PhaseSectionFooter({
  prev,
  next,
  onNavigate,
  finalAction,
}: PhaseSectionFooterProps) {
  return (
    <div className="mt-12 flex flex-col-reverse sm:flex-row items-center justify-between gap-4 border-t border-border pt-6">
      <div>
        {prev ? (
          <button
            type="button"
            onClick={() => onNavigate(prev.id)}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-medium text-foreground hover:bg-secondary/60 hover:border-primary/40 transition-all shadow-xs"
          >
            <ChevronLeftIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Previous: <strong className="font-semibold">{prev.label}</strong></span>
          </button>
        ) : (
          <span />
        )}
      </div>

      <div className="flex items-center gap-3">
        {next ? (
          <button
            type="button"
            onClick={() => onNavigate(next.id)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-95 transition-transform hover:-translate-y-0.5"
          >
            <span>Next: <strong className="font-bold">{next.label}</strong></span>
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </button>
        ) : (
          finalAction ?? null
        )}
      </div>
    </div>
  );
}
