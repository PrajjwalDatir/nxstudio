"use client";

import React from "react";
import { motion } from "framer-motion";
import { CheckIcon } from "@/components/icons";
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
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 scrollbar-none">
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

export interface PhaseSectionFooterProps {
  prev?: PhaseSectionItem | null;
  next?: PhaseSectionItem | null;
  onNavigate?: (id: string) => void;
  finalAction?: React.ReactNode;
}

export function PhaseSectionFooter({
  finalAction,
}: PhaseSectionFooterProps) {
  if (!finalAction) return null;
  return (
    <div className="mt-8 flex justify-end">
      {finalAction}
    </div>
  );
}
