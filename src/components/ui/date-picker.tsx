"use client";

/**
 * Themed date picker built on React Aria Components (Adobe) — headless,
 * fully accessible date segments + calendar popover, styled to the studio theme.
 * Wraps the DateValue API with a simple yyyy-mm-dd string in/out.
 */

import {
  DatePicker as AriaDatePicker,
  Button,
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  DateInput,
  DateSegment,
  Dialog,
  Group,
  Heading,
  Popover,
} from "react-aria-components";
import { CalendarDate, parseDate } from "@internationalized/date";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, XIcon } from "@/components/icons";

export function DatePicker({
  value,
  onChange,
  "aria-label": ariaLabel = "Date",
}: {
  /** yyyy-mm-dd, or "" / null when unset. */
  value: string | null;
  onChange: (value: string) => void;
  "aria-label"?: string;
}) {
  const dateValue = value ? safeParse(value) : null;

  return (
    <AriaDatePicker
      aria-label={ariaLabel}
      value={dateValue}
      onChange={(v) => onChange(v ? v.toString() : "")}
      className="group flex flex-col gap-1"
    >
      <Group className="flex h-9 w-[168px] items-center rounded-lg border border-border bg-secondary/40 pl-2.5 pr-1 text-sm transition-colors focus-within:border-ring data-[open]:border-ring">
        <CalendarIcon className="mr-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <DateInput className="flex flex-1 items-center">
          {(segment) => (
            <DateSegment
              segment={segment}
              className="rounded px-0.5 tabular-nums caret-transparent outline-none data-[placeholder]:text-muted-foreground data-[focused]:bg-primary data-[focused]:text-primary-foreground data-[type=literal]:text-muted-foreground"
            />
          )}
        </DateInput>
        {value ? (
          <Button
            slot={null}
            aria-label="Clear date"
            onPress={() => onChange("")}
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground outline-none hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring"
          >
            <XIcon className="h-3.5 w-3.5" />
          </Button>
        ) : null}
        <Button className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground outline-none hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring">
          <ChevronRightIcon className="h-3.5 w-3.5 rotate-90" />
        </Button>
      </Group>

      <Popover
        placement="bottom end"
        className="rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-xl outline-none data-[entering]:animate-in data-[entering]:fade-in-0 data-[entering]:zoom-in-95 data-[exiting]:animate-out data-[exiting]:fade-out-0 data-[exiting]:zoom-out-95"
      >
        <Dialog className="outline-none">
          <Calendar className="w-[248px]">
            <header className="mb-3 flex items-center justify-between px-1">
              <Button
                slot="previous"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground outline-none hover:bg-secondary hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <Heading className="text-sm font-semibold" />
              <Button
                slot="next"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground outline-none hover:bg-secondary hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
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
                    className="mx-auto flex h-8 w-8 cursor-default items-center justify-center rounded-lg text-sm outline-none transition-colors data-[outside-month]:text-muted-foreground/40 data-[hovered]:bg-secondary data-[selected]:bg-primary data-[selected]:font-semibold data-[selected]:text-primary-foreground data-[today]:font-semibold data-[today]:text-primary data-[selected]:data-[today]:text-primary-foreground data-[focus-visible]:ring-1 data-[focus-visible]:ring-ring data-[disabled]:opacity-40"
                  />
                )}
              </CalendarGridBody>
            </CalendarGrid>
          </Calendar>
        </Dialog>
      </Popover>
    </AriaDatePicker>
  );
}

function safeParse(v: string): CalendarDate | null {
  try {
    return parseDate(v.slice(0, 10));
  } catch {
    return null;
  }
}
