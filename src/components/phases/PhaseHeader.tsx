"use client";

import Link from "next/link";
import { ArrowLeftIcon, MoreIcon, BadgeCheckIcon, ResetIcon } from "@/components/icons";
import { useSync, useWorkspace } from "@/lib/workspace-store";
import { DueDatePicker } from "@/components/ui/due-date";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Status = "in-progress" | "ready" | "complete";

const STATUS_STYLES: Record<Status, string> = {
  "in-progress": "bg-primary/15 text-primary",
  ready: "bg-emerald-500/15 text-emerald-400",
  complete: "bg-emerald-500/15 text-emerald-400",
};

const STATUS_LABEL: Record<Status, string> = {
  "in-progress": "IN PROGRESS",
  ready: "READY",
  complete: "COMPLETE",
};

export function PhaseHeader({
  title,
  status = "in-progress",
  phaseId,
  meta,
  finished,
  showTeam = false,
}: {
  title: string;
  status?: Status;
  /** When set, renders a pickable due date bound to the project's dueDates. */
  phaseId?: string;
  meta?: string;
  finished?: boolean;
  showTeam?: boolean;
}) {
  const { result } = useSync();
  const { activeProject, setDueDate, resetPhase } = useWorkspace();
  const contributors = showTeam ? result?.contributors ?? [] : [];
  const due = phaseId ? activeProject.dueDates[phaseId] ?? "" : "";
  return (
    <div className="mb-8">
      <Link
        href="/canvas"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Canvas
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide",
                STATUS_STYLES[status]
              )}
            >
              {STATUS_LABEL[status]}
            </span>
          </div>
          {(phaseId || meta) && (
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {phaseId && (
                <DueDatePicker
                  label={`${title} due date`}
                  value={due ? due.slice(0, 10) : null}
                  onChange={(ymd) => setDueDate(phaseId, ymd || "")}
                />
              )}
              {meta && (
                <span className="flex items-center gap-2">
                  {finished && <BadgeCheckIcon className="h-4 w-4" />}
                  {meta}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {contributors.length > 0 && (
            <div className="flex -space-x-2">
              {contributors.slice(0, 4).map((c) =>
                c.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={c.login}
                    src={c.avatar}
                    alt={c.login}
                    title={`${c.login} · ${c.commits} commits`}
                    className="h-7 w-7 rounded-full border-2 border-background"
                  />
                ) : (
                  <div
                    key={c.login}
                    title={c.login}
                    className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-secondary text-[10px] font-medium uppercase"
                  >
                    {c.login.slice(0, 2)}
                  </div>
                )
              )}
              {contributors.length > 4 && (
                <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-secondary text-[10px] font-medium">
                  +{contributors.length - 4}
                </div>
              )}
            </div>
          )}
          {phaseId && (
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="More options"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground outline-none hover:text-foreground data-[state=open]:bg-secondary data-[state=open]:text-foreground"
              >
                <MoreIcon className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => resetPhase(phaseId)}>
                  <ResetIcon className="h-4 w-4" />
                  Reset progress
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
}
