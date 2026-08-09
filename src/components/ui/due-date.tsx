"use client";

/**
 * Compact, pickable due-date pill. Shows "Due Jul 30, 2026" (or "Set due date")
 * and opens a React Aria calendar in a themed popover. Value in/out is a
 * yyyy-mm-dd string ("" when unset).
 */

import { useState } from "react";
import {
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  Heading,
  Button as AriaButton,
} from "react-aria-components";
import { CalendarDate, parseDate } from "@internationalized/date";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, XIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

function safeParse(v: string): CalendarDate | null {
  try {
    return parseDate(v.slice(0, 10));
  } catch {
    return null;
  }
}

function formatDue(ymd: string): string {
  const [y, m, d] = ymd.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return "";
  // Build from local parts so there's no timezone drift on a date-only value.
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DueDatePicker({
  value,
  onChange,
  label = "Due date",
}: {
  value: string | null;
  onChange: (ymd: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const dateValue = value ? safeParse(value) : null;
  const display = value ? formatDue(value) : "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-sm transition-colors outline-none",
            display
              ? "border-border text-foreground hover:border-primary/40"
              : "border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5" />
          {display ? `Due ${display}` : "Set due date"}
          <ChevronDownIcon className="h-3.5 w-3.5 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-3">
        <Calendar
          aria-label={label}
          value={dateValue}
          onChange={(v) => {
            onChange(v ? v.toString() : "");
            setOpen(false);
          }}
          className="w-[248px]"
        >
          <header className="mb-3 flex items-center justify-between px-1">
            <AriaButton
              slot="previous"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground outline-none hover:bg-secondary hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </AriaButton>
            <Heading className="text-sm font-semibold" />
            <AriaButton
              slot="next"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground outline-none hover:bg-secondary hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </AriaButton>
          </header>
          <CalendarGrid className="w-full border-collapse">
            <CalendarGridHeader>
              {(day) => (
                <CalendarHeaderCell className="pb-1 text-[11px] font-medium text-muted-foreground">
                  {day}
                </CalendarHeaderCell>
              )}
            </CalendarGridHeader>
            <CalendarGridBody>
              {(date) => (
                <CalendarCell
                  date={date}
                  className="mx-auto flex h-8 w-8 cursor-default items-center justify-center rounded-lg text-sm outline-none transition-colors data-[outside-month]:text-muted-foreground/40 data-[hovered]:bg-secondary data-[selected]:bg-primary data-[selected]:font-semibold data-[selected]:text-primary-foreground data-[today]:font-semibold data-[today]:text-accent-foreground data-[selected]:data-[today]:text-primary-foreground data-[focus-visible]:ring-1 data-[focus-visible]:ring-ring data-[disabled]:opacity-40"
                />
              )}
            </CalendarGridBody>
          </CalendarGrid>
        </Calendar>

        {value && (
          <button
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <XIcon className="h-3.5 w-3.5" />
            Clear due date
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
