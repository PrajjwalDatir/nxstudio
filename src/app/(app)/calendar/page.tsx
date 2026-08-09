"use client";

import { useState } from "react";
import Link from "next/link";
import { useWorkspace } from "@/lib/workspace-store";
import { PHASES } from "@/lib/phases";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Format a yyyy-mm-dd date-only value without timezone drift. Parsing via
// `new Date(iso)` treats the string as UTC midnight, which renders as the
// previous day in negative-offset timezones — so build from local parts.
function formatDay(ymd: string): string {
  const [y, m, d] = ymd.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return "";
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function CalendarPage() {
  const { activeProject, setDueDate } = useWorkspace();
  const dueDates = activeProject.dueDates;
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  // Map yyyy-mm-dd → phases due that day
  const byDay = new Map<string, string[]>();
  for (const p of PHASES) {
    const iso = dueDates[p.id];
    if (iso) {
      const key = iso.slice(0, 10);
      byDay.set(key, [...(byDay.get(key) ?? []), p.label]);
    }
  }

  const first = new Date(cursor.y, cursor.m, 1);
  const startDow = first.getDay();
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const todayKey = new Date().toISOString().slice(0, 10);
  const keyFor = (day: number) =>
    `${cursor.y}-${String(cursor.m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const shift = (delta: number) => {
    setCursor((c) => {
      const m = c.m + delta;
      return { y: c.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 };
    });
  };

  const upcoming = PHASES.filter((p) => dueDates[p.id]).sort((a, b) =>
    (dueDates[a.id] || "").localeCompare(dueDates[b.id] || "")
  );

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
      <p className="mt-1 text-muted-foreground">Phase milestones for {activeProject.data.productName}.</p>

      <div className="relative mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <div className="canvas-glow" aria-hidden />
        {/* Month grid */}
        <div className="relative z-10 rounded-xl glass p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">
              {MONTHS[cursor.m]} {cursor.y}
            </h2>
            <div className="flex gap-1">
              <button onClick={() => shift(-1)} aria-label="Previous month" className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-secondary">
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <button onClick={() => shift(1)} aria-label="Next month" className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-secondary">
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">
            {DOW.map((d) => (
              <div key={d} className="py-1">{d}</div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (day === null) return <div key={i} className="aspect-square" />;
              const key = keyFor(day);
              const due = byDay.get(key);
              const isToday = key === todayKey;
              return (
                <div
                  key={i}
                  className={cn(
                    "aspect-square rounded-lg border p-1 text-xs",
                    isToday ? "border-primary/50 bg-accent/30" : "border-border/60",
                    due && "bg-primary/10"
                  )}
                >
                  <div className={cn("font-medium", isToday && "text-accent-foreground")}>{day}</div>
                  {due && (
                    <div className="mt-0.5 truncate text-[9px] leading-tight text-accent-foreground" title={due.join(", ")}>
                      {due[0]}
                      {due.length > 1 && ` +${due.length - 1}`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Agenda / set due dates */}
        <div className="relative z-10 rounded-xl glass p-5">
          <h2 className="font-semibold">Milestones</h2>
          <p className="mt-1 text-xs text-muted-foreground">Set a target date per phase.</p>
          <div className="mt-4 space-y-3">
            {PHASES.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2">
                <Link href={`/canvas/${p.id}`} className="text-sm hover:text-accent-foreground">
                  {p.label}
                </Link>
                <DatePicker
                  aria-label={`${p.label} due date`}
                  value={(dueDates[p.id] ?? "").slice(0, 10)}
                  onChange={(val) => setDueDate(p.id, val || "")}
                />
              </div>
            ))}
          </div>

          {upcoming.length > 0 && (
            <div className="mt-6 border-t border-border pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Upcoming
              </h3>
              <div className="mt-2 space-y-1.5">
                {upcoming.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span>{p.label}</span>
                    <span className="text-muted-foreground">
                      {formatDay(dueDates[p.id])}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
