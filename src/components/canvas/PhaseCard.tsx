"use client";

import Link from "next/link";
import { PhaseDef, getPhaseProgress } from "@/lib/phases";
import { useWorkspace } from "@/lib/workspace-store";
import { PhaseCardBody, PhaseCardFrame } from "@/components/canvas/PhaseCardBody";
import { MoreIcon, ExternalLinkIcon, ResetIcon, TrashIcon } from "@/components/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function PhaseCard({ phase, isCustom = false }: { phase: PhaseDef; isCustom?: boolean }) {
  const { data, resetPhase, removeCustomStage } = useWorkspace();
  const progress = getPhaseProgress(phase, data);

  return (
    <PhaseCardFrame>
      {/* Stretched link: covers the card for navigation without nesting the
          dropdown button inside an <a>. */}
      <Link
        href={`/canvas/${phase.id}`}
        aria-label={`Open ${phase.label}`}
        className="absolute inset-0 z-0 rounded-xl"
      />

      {/* Visual content is click-through; only the menu is interactive. */}
      <div className="pointer-events-none relative z-10">
        <PhaseCardBody
          phase={phase}
          progress={progress}
          action={
            <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Stage options"
              className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground opacity-0 outline-none transition-opacity hover:bg-secondary hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100 data-[state=open]:bg-secondary"
            >
              <MoreIcon className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem asChild>
                <Link href={`/canvas/${phase.id}`}>
                  <ExternalLinkIcon className="h-4 w-4" />
                  Open
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => resetPhase(phase.id)}>
                <ResetIcon className="h-4 w-4" />
                Reset progress
              </DropdownMenuItem>
              {isCustom && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => removeCustomStage(phase.id)}
                  >
                    <TrashIcon className="h-4 w-4" />
                    Remove stage
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
            </DropdownMenu>
          }
        />
      </div>
    </PhaseCardFrame>
  );
}
