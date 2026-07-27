import type { ReactNode } from "react";
import {
  CopyIcon,
  CheckIcon,
  GitBranchIcon,
  SearchIcon,
  ArrowRightIcon,
  PlusIcon,
  CommandIcon,
} from "@/components/icons";
import { Badge } from "@/components/ui/badge";

/**
 * Features, shown not told. Each cell is a small, real-looking slice of the
 * product doing the thing — a compiled prompt, a derived stack, the command
 * palette — with the copy kept to a single line. Static markup, no runtime.
 */

const STACK = ["Next.js", "Supabase", "Tailwind", "React Three Fiber", "Vercel"];

const PALETTE = [
  { icon: ArrowRightIcon, label: "Go to Tech Stack", hint: "↵" },
  { icon: PlusIcon, label: "New phase", hint: "⇧N" },
  { icon: CopyIcon, label: "Copy build prompt", hint: "⌘C" },
];

const PHASES = [
  { label: "Brief", done: 4, total: 4, tone: "bg-emerald-500" },
  { label: "Tech Stack", done: 2, total: 5, tone: "bg-primary" },
  { label: "Build", done: 0, total: 3, tone: "bg-muted-foreground/40" },
];

function CardShell({
  title,
  line,
  className = "",
  children,
}: {
  title: string;
  line: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-xl glass p-5 transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-white/12 ${className}`}
    >
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{line}</p>
      <div className="mt-5 flex-1">{children}</div>
    </div>
  );
}

export function FeatureShowcase() {
  return (
    <div className="mt-12 grid gap-4 lg:grid-cols-6">
      {/* One build prompt — the money shot */}
      <CardShell
        title="One prompt, not forty messages"
        line="Everything your agent needs, compiled into a single paste."
        className="lg:col-span-4"
      >
        <div className="overflow-hidden rounded-xl border border-white/5 bg-background/50">
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-2.5">
            <span className="font-mono text-[11px] text-muted-foreground">build-prompt.md</span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">
              <CheckIcon className="h-3 w-3" />
              Copied
            </span>
          </div>
          <pre className="overflow-x-auto px-4 py-3.5 font-mono text-[11.5px] leading-relaxed text-foreground/80">
            <span className="text-primary"># Build: Acme Reader</span>
            {"\n"}Stack: Next.js · Supabase · Tailwind
            {"\n"}Target: Web · mobile-first · dark
            {"\n\n"}
            <span className="text-primary">## Scaffold</span>
            {"\n"}- GitHub OAuth + `profiles` table
            {"\n"}- Reading view with saved highlights
            {"\n"}- ⌘K command palette
          </pre>
        </div>
      </CardShell>

      {/* Derived stack */}
      <CardShell
        title="Stack, derived"
        line="Opinionated defaults from your brief — no blank page."
        className="lg:col-span-2"
      >
        <div className="flex flex-wrap gap-2">
          {STACK.map((s, i) => (
            <Badge key={s} variant={i < 3 ? "default" : "secondary"} className="gap-1.5 py-1">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  i < 3 ? "bg-primary-foreground/80" : "bg-muted-foreground/60"
                }`}
              />
              {s}
            </Badge>
          ))}
        </div>
      </CardShell>

      {/* Command palette */}
      <CardShell
        title="⌘K everything"
        line="Drive the whole studio from the keyboard."
        className="lg:col-span-2"
      >
        <div className="overflow-hidden rounded-xl border border-white/5 bg-background/50">
          <div className="flex items-center gap-2.5 border-b border-white/5 px-3.5 py-2.5">
            <SearchIcon className="h-3.5 w-3.5 text-primary" />
            <span className="flex-1 text-xs text-muted-foreground">Command nx…</span>
            <CommandIcon className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <ul className="p-1.5">
            {PALETTE.map(({ icon: Icon, label, hint }, i) => (
              <li
                key={label}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs ${
                  i === 0 ? "bg-accent text-accent-foreground" : "text-foreground/80"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="flex-1">{label}</span>
                <span className="font-mono text-[10px] text-muted-foreground">{hint}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardShell>

      {/* Phase tracking */}
      <CardShell
        title="Phases that track themselves"
        line="Progress updates as the work gets done."
        className="lg:col-span-2"
      >
        <div className="space-y-3.5">
          {PHASES.map((p) => (
            <div key={p.label}>
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground/85">{p.label}</span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {p.done}/{p.total}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                <div className={`h-full rounded-full ${p.tone}`} style={{ width: `${(p.done / p.total) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </CardShell>

      {/* GitHub sync */}
      <CardShell
        title="Synced to your repo"
        line="Keep the plan next to where the code lives."
        className="lg:col-span-2"
      >
        <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-background/50 px-3.5 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/8 bg-secondary/40">
            <GitBranchIcon className="h-4 w-4 text-foreground/80" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-xs text-foreground/90">acme/reader</p>
            <p className="text-[11px] text-muted-foreground">main · updated 2m ago</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Synced
          </span>
        </div>
      </CardShell>
    </div>
  );
}
