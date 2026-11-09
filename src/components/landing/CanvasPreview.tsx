"use client";

import { useState } from "react";
import {
  NxLogo,
  LockIcon,
  CheckCircleIcon,
  CircleIcon,
  CreditCardIcon,
  BellIcon,
  KeyRoundIcon,
} from "@/components/icons";
import { MAIN_NAV_ITEMS, STUDIO_MODE_NAV_ITEMS } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/**
 * A frame of the actual nxstudio product (the Project Canvas) as the hero
 * visual — showcasing the 3 core pillars of the Product OS:
 * Relational Schema, Topological DAG, and Native MCP Protocol Bus.
 */

const TEAM = [
  { initials: "NX", name: "Core Architect", role: "Maintainer" },
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
        <span className="h-1.5 w-1.5 rounded-full bg-lilac" />
        Synced
      </span>
    </div>
  );
}

type BriefStepId = "vision" | "brand" | "stack" | "schema" | "review";

interface StepConfig {
  id: BriefStepId;
  stepNum: number;
  label: string;
  category: string;
}

const BRIEF_STEPS: StepConfig[] = [
  { id: "vision", stepNum: 1, label: "Vision", category: "Vision & Problem Space" },
  { id: "brand", stepNum: 2, label: "Brand", category: "Brand DNA & Design Tokens" },
  { id: "stack", stepNum: 3, label: "Stack", category: "Engineered Tech Stack" },
  { id: "schema", stepNum: 4, label: "Schema", category: "Data Schema (ERD)" },
  { id: "review", stepNum: 5, label: "Review", category: "Deterministic AI Review" },
];

function StepVisionContent() {
  return (
    <div className="mt-4 grid grid-cols-1 gap-3.5 lg:grid-cols-3">
      {/* Left 2 cols: Core Brief & Positioning */}
      <div className="rounded-xl border border-border/80 bg-card/40 p-3.5 sm:col-span-2 flex flex-col justify-between shadow-sm">
        <div>
          <div className="flex items-center justify-between pb-2.5 border-b border-border/40">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-lilac" />
              <h4 className="text-xs font-semibold tracking-tight text-foreground sm:text-sm">
                Product Vision & Strategic Moat
              </h4>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">brief.vision.v1</span>
          </div>

          <div className="mt-3 space-y-2.5 font-mono text-[11px]">
            <div className="rounded-lg border border-border/60 bg-background/50 p-2.5 space-y-1">
              <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">One-Line Pitch</span>
              <p className="text-foreground text-xs font-medium font-sans">
                Turn an idea into a single, deterministic build prompt for AI coding agents.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="rounded-lg border border-border/60 bg-background/50 p-2.5 space-y-1">
                <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">Core Problem</span>
                <p className="text-muted-foreground text-[11px] font-sans leading-relaxed">
                  Vague natural-language prompts cause hallucinated tech stacks, broken schemas, and agent drift.
                </p>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/50 p-2.5 space-y-1">
                <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">Target ICP</span>
                <p className="text-muted-foreground text-[11px] font-sans leading-relaxed">
                  Solo developers & technical founders orchestrating Claude, Cursor, and Codex workflows.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-[11px]">
          <span className="text-muted-foreground">Compiled to .nx/brief/vision.md</span>
          <span className="font-mono text-muted-foreground">Conviction: High</span>
        </div>
      </div>

      {/* Right 1 col: Differentiators */}
      <div className="rounded-xl border border-border/80 bg-card/40 p-3.5 flex flex-col justify-between shadow-xs">
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <span className="font-mono text-[11px] font-semibold text-foreground flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-lilac" />
              Strategic Moat
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">3 pillars</span>
          </div>

          <div className="mt-2.5 space-y-1.5 text-[11px] font-mono">
            <div className="p-2 rounded bg-background/50 border border-border/40">
              <span className="text-foreground font-medium block">Context Directory</span>
              <span className="text-muted-foreground text-[10px]">Deterministic .nx/ contracts</span>
            </div>
            <div className="p-2 rounded bg-background/50 border border-border/40">
              <span className="text-foreground font-medium block">Topological DAG</span>
              <span className="text-muted-foreground text-[10px]">Tiered execution order</span>
            </div>
            <div className="p-2 rounded bg-background/50 border border-border/40">
              <span className="text-foreground font-medium block">Native MCP Bus</span>
              <span className="text-muted-foreground text-[10px]">IDE-to-runtime sync</span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-border/40 text-[10px] font-mono text-muted-foreground flex justify-between">
          <span>Drift Protection</span>
          <span className="text-lilac">Active</span>
        </div>
      </div>
    </div>
  );
}

function StepBrandContent() {
  return (
    <div className="mt-4 grid grid-cols-1 gap-3.5 lg:grid-cols-3">
      {/* Left 2 cols: Design Tokens */}
      <div className="rounded-xl border border-border/80 bg-card/40 p-3.5 sm:col-span-2 flex flex-col justify-between shadow-sm">
        <div>
          <div className="flex items-center justify-between pb-2.5 border-b border-border/40">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-lilac" />
              <h4 className="text-xs font-semibold tracking-tight text-foreground sm:text-sm">
                Universal Design Tokens & Kinematics
              </h4>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">W3C Tokens Spec</span>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="rounded-lg border border-border/60 bg-background/50 p-2.5 space-y-2">
              <div className="h-10 rounded-md bg-[#C4B5FD] flex items-end p-1.5">
                <span className="font-mono text-[9px] font-bold text-black">#C4B5FD</span>
              </div>
              <div>
                <span className="text-[11px] font-mono font-medium text-foreground block">brand.lilac</span>
                <span className="text-[10px] text-muted-foreground">Primary Accent</span>
              </div>
            </div>

            <div className="rounded-lg border border-border/60 bg-background/50 p-2.5 space-y-2">
              <div className="h-10 rounded-md bg-[#08080A] border border-border/80 flex items-end p-1.5">
                <span className="font-mono text-[9px] font-bold text-white">#08080A</span>
              </div>
              <div>
                <span className="text-[11px] font-mono font-medium text-foreground block">surface.canvas</span>
                <span className="text-[10px] text-muted-foreground">Near-black ground</span>
              </div>
            </div>

            <div className="rounded-lg border border-border/60 bg-background/50 p-2.5 space-y-2">
              <div className="h-10 rounded-md bg-[#FFFFFF] flex items-end p-1.5">
                <span className="font-mono text-[9px] font-bold text-black">#FFFFFF</span>
              </div>
              <div>
                <span className="text-[11px] font-mono font-medium text-foreground block">text.foreground</span>
                <span className="text-[10px] text-muted-foreground">High contrast text</span>
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="p-2 rounded bg-background/50 border border-border/40 flex justify-between items-center">
              <span className="text-muted-foreground">Typography</span>
              <span className="text-foreground">Instrument Sans</span>
            </div>
            <div className="p-2 rounded bg-background/50 border border-border/40 flex justify-between items-center">
              <span className="text-muted-foreground">Monospace</span>
              <span className="text-foreground">Geist Mono</span>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-[11px]">
          <span className="text-muted-foreground">Compiled to .nx/ui/tokens.json</span>
          <span className="font-mono text-muted-foreground">Format: Universal W3C</span>
        </div>
      </div>

      {/* Right 1 col: Kinematics & Token Spec */}
      <div className="rounded-xl border border-border/80 bg-card/40 p-3.5 flex flex-col justify-between shadow-xs">
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <span className="font-mono text-[11px] font-semibold text-foreground flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-lilac" />
              Kinematics & Radius
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">Motion</span>
          </div>

          <div className="mt-2.5 space-y-1.5 text-[11px] font-mono">
            <div className="p-2 rounded bg-background/50 border border-border/40">
              <span className="text-muted-foreground text-[10px] block">Curve</span>
              <span className="text-foreground font-medium text-[10px]">cubic-bezier(0.16, 1, 0.3, 1)</span>
            </div>
            <div className="p-2 rounded bg-background/50 border border-border/40">
              <span className="text-muted-foreground text-[10px] block">Corner Radius</span>
              <span className="text-foreground font-medium text-[10px]">16px (Card) · 8px (Control)</span>
            </div>
            <div className="p-2 rounded bg-background/50 border border-border/40">
              <span className="text-muted-foreground text-[10px] block">Accessibility</span>
              <span className="text-lilac font-medium text-[10px]">14.2:1 Contrast (AAA)</span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-border/40 text-[10px] font-mono text-muted-foreground flex justify-between">
          <span>Component Contracts</span>
          <span className="text-foreground font-medium">Synchronized</span>
        </div>
      </div>
    </div>
  );
}

function StepStackContent() {
  return (
    <div className="mt-4 grid grid-cols-1 gap-3.5 lg:grid-cols-3">
      {/* Left 2 cols: Stack Spec */}
      <div className="rounded-xl border border-border/80 bg-card/40 p-3.5 sm:col-span-2 flex flex-col justify-between shadow-sm">
        <div>
          <div className="flex items-center justify-between pb-2.5 border-b border-border/40">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-lilac" />
              <h4 className="text-xs font-semibold tracking-tight text-foreground sm:text-sm">
                Engineered Tech Stack Specification
              </h4>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">Zero Vendor Lock-in</span>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="rounded-lg border border-border/60 bg-background/50 p-2.5 space-y-1">
              <span className="text-[10px] uppercase text-muted-foreground block">Application Framework</span>
              <p className="text-foreground font-medium">Next.js 15 (App Router)</p>
              <p className="text-muted-foreground text-[10px]">React 19, Server Components & Actions</p>
            </div>

            <div className="rounded-lg border border-border/60 bg-background/50 p-2.5 space-y-1">
              <span className="text-[10px] uppercase text-muted-foreground block">Database & Typed ORM</span>
              <p className="text-foreground font-medium">PostgreSQL + Prisma</p>
              <p className="text-muted-foreground text-[10px]">Declarative schema & migration lock</p>
            </div>

            <div className="rounded-lg border border-border/60 bg-background/50 p-2.5 space-y-1">
              <span className="text-[10px] uppercase text-muted-foreground block">Styling & Design System</span>
              <p className="text-foreground font-medium">Tailwind CSS v4 + Radix</p>
              <p className="text-muted-foreground text-[10px]">Accessible headless primitive components</p>
            </div>

            <div className="rounded-lg border border-border/60 bg-background/50 p-2.5 space-y-1">
              <span className="text-[10px] uppercase text-muted-foreground block">Agent Integration</span>
              <p className="text-foreground font-medium">Model Context Protocol</p>
              <p className="text-muted-foreground text-[10px]">Native JSON-RPC tool invocation</p>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-[11px]">
          <span className="text-muted-foreground">Compiled to .nx/stack/matrix.json</span>
          <span className="font-mono text-muted-foreground">Runtime: Node.js 22 LTS</span>
        </div>
      </div>

      {/* Right 1 col: Target Capabilities */}
      <div className="rounded-xl border border-border/80 bg-card/40 p-3.5 flex flex-col justify-between shadow-xs">
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <span className="font-mono text-[11px] font-semibold text-foreground flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-lilac" />
              Runtime Architecture
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">Stack</span>
          </div>

          <div className="mt-2.5 space-y-1.5 text-[11px] font-mono">
            <div className="p-2 rounded bg-background/50 border border-border/40 flex justify-between">
              <span className="text-muted-foreground">API Protocol</span>
              <span className="text-foreground">HTTP + JSON-RPC</span>
            </div>
            <div className="p-2 rounded bg-background/50 border border-border/40 flex justify-between">
              <span className="text-muted-foreground">Auth Provider</span>
              <span className="text-foreground">Supabase / JWT</span>
            </div>
            <div className="p-2 rounded bg-background/50 border border-border/40 flex justify-between">
              <span className="text-muted-foreground">State Strategy</span>
              <span className="text-foreground">Zustand Store</span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-border/40 text-[10px] font-mono text-muted-foreground flex justify-between">
          <span>Static Compilation</span>
          <span className="text-lilac">Verified</span>
        </div>
      </div>
    </div>
  );
}

function StepSchemaContent() {
  return (
    <div className="mt-4 grid grid-cols-1 gap-3.5 lg:grid-cols-3">
      {/* Card 1: Visual Relational Schema (Dot Grid Blueprint) */}
      <div className="group relative flex flex-col justify-between rounded-xl border border-border/80 bg-card/40 p-3.5 shadow-sm transition-all hover:border-lilac/40 sm:col-span-2">
        <div>
          <div className="flex items-center justify-between pb-2.5 border-b border-border/40">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-lilac" />
              <h4 className="text-xs font-semibold tracking-tight text-foreground sm:text-sm">
                Relational Architecture & Schema
              </h4>
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
              <span>PostgreSQL · Prisma</span>
              <span>•</span>
              <span>0 Circular FKs</span>
            </div>
          </div>

          {/* Dot-grid Canvas Area */}
          <div className="relative mt-3 rounded-lg border border-border/60 bg-background/50 bg-[radial-gradient(#27272a_1.2px,transparent_1.2px)] bg-[size:14px_14px] p-3.5 overflow-hidden min-h-[140px]">
            {/* SVG Bézier Relationship Connector */}
            <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible z-10">
              <path
                d="M 135 55 C 165 55, 175 75, 205 75"
                fill="none"
                stroke="var(--lilac, #C4B5FD)"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
            </svg>

            <div className="relative z-20 flex flex-wrap gap-3 items-start">
              {/* Table 1: users */}
              <div className="w-36 rounded-lg border border-border/80 bg-card/95 p-2.5 shadow-xs">
                <div className="flex items-center justify-between border-b border-border/40 pb-1.5 mb-1.5">
                  <span className="font-mono text-xs font-semibold text-foreground">users</span>
                  <span className="font-mono text-[10px] text-muted-foreground">3 cols</span>
                </div>
                <div className="space-y-1.5 text-[11px] font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground">id</span>
                    <span className="text-lilac text-[10px] font-medium">uuid pk</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">email</span>
                    <span className="text-muted-foreground/80 text-[10px]">varchar</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">created_at</span>
                    <span className="text-muted-foreground/80 text-[10px]">date</span>
                  </div>
                </div>
              </div>

              {/* Table 2: workspaces */}
              <div className="w-38 rounded-lg border border-border/80 bg-card/95 p-2.5 shadow-xs">
                <div className="flex items-center justify-between border-b border-border/40 pb-1.5 mb-1.5">
                  <span className="font-mono text-xs font-semibold text-foreground">workspaces</span>
                  <span className="font-mono text-[10px] text-muted-foreground">3 cols</span>
                </div>
                <div className="space-y-1.5 text-[11px] font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground">id</span>
                    <span className="text-lilac text-[10px] font-medium">uuid pk</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">name</span>
                    <span className="text-muted-foreground/80 text-[10px]">varchar</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">owner_id</span>
                    <span className="text-lilac text-[10px] font-medium">fk → users</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-[11px]">
          <span className="text-muted-foreground">Compiled to .nx/db/schema.sql</span>
          <span className="font-mono text-muted-foreground">Validated AST</span>
        </div>
      </div>

      {/* Card 2: Topological DAG & Native MCP Fleet */}
      <div className="flex flex-col justify-between gap-3">
        {/* Subcard A: Topological DAG */}
        <div className="rounded-xl border border-border/80 bg-card/40 p-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <span className="font-mono text-[11px] font-semibold text-foreground flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-lilac" />
              Execution DAG
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">Tiers T0–T2</span>
          </div>
          <div className="mt-2 space-y-1 text-[10px] font-mono">
            <div className="flex items-center justify-between py-1 px-1.5">
              <span className="text-muted-foreground">T0: init_schema</span>
              <span className="text-muted-foreground">done</span>
            </div>
            <div className="flex items-center justify-between py-1 px-1.5 rounded bg-secondary/30">
              <span className="text-foreground font-medium">T1: auth_api</span>
              <span className="text-lilac font-medium">running</span>
            </div>
          </div>
        </div>

        {/* Subcard B: Native MCP Bus */}
        <div className="rounded-xl border border-border/80 bg-card/40 p-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <span className="font-mono text-[11px] font-semibold text-foreground flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-lilac" />
              Native MCP Protocol
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">JSON-RPC 2.0</span>
          </div>
          <div className="mt-2 space-y-1 text-[10px] font-mono">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Endpoint</span>
              <span className="text-foreground font-medium">/api/mcp</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Fleet</span>
              <span className="text-foreground">Cursor Connected</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Last Query</span>
              <span className="text-muted-foreground">nx_get_schema (2ms)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepReviewContent() {
  return (
    <div className="mt-4 grid grid-cols-1 gap-3.5 lg:grid-cols-3">
      {/* Left 2 cols: Master Build Prompt Preview */}
      <div className="rounded-xl border border-border/80 bg-card/40 p-3.5 sm:col-span-2 flex flex-col justify-between shadow-sm">
        <div>
          <div className="flex items-center justify-between pb-2.5 border-b border-border/40">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-lilac" />
              <h4 className="text-xs font-semibold tracking-tight text-foreground sm:text-sm">
                Deterministic Agent Build Prompt
              </h4>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">4,120 tokens</span>
          </div>

          <div className="mt-3 rounded-lg border border-border/60 bg-background/80 p-3 font-mono text-[11px] leading-relaxed text-muted-foreground overflow-x-auto space-y-1">
            <div className="text-foreground font-semibold"># PRODUCTION BUILD SPEC: nxstudio</div>
            <div>&gt; TARGET_STACK: Next.js 15 + Prisma + PostgreSQL + Tailwind v4</div>
            <div>&gt; CONTEXT_ROOT: .nx/ (memory.json, schema.prisma, tokens.json)</div>
            <div className="text-muted-foreground/60 py-1">---</div>
            <div>[TASK_01_SCHEMA]: Scaffold tables &lt;users, workspaces&gt; from .nx/db/schema.sql</div>
            <div>[TASK_02_BRAND]: Inject W3C tokens into tailwind.config from .nx/ui/tokens.json</div>
            <div>[TASK_03_MCP]: Register /api/mcp endpoints with JSON-RPC schemas</div>
            <div className="text-lilac font-medium pt-1">[STATUS]: Ready for zero-hallucination agent execution.</div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-[11px]">
          <span className="text-muted-foreground">Compiled to .nx/prompts/master-build-prompt.md</span>
          <span className="font-mono text-muted-foreground">AST Validation: 100%</span>
        </div>
      </div>

      {/* Right 1 col: Pre-flight Audit Scorecard */}
      <div className="rounded-xl border border-border/80 bg-card/40 p-3.5 flex flex-col justify-between shadow-xs">
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <span className="font-mono text-[11px] font-semibold text-foreground flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-lilac" />
              Pre-Flight Audit
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">Audit</span>
          </div>

          <div className="mt-2.5 space-y-1.5 text-[11px] font-mono">
            <div className="p-2 rounded bg-background/50 border border-border/40 flex justify-between">
              <span className="text-muted-foreground">Schema Invariants</span>
              <span className="text-foreground">Passed</span>
            </div>
            <div className="p-2 rounded bg-background/50 border border-border/40 flex justify-between">
              <span className="text-muted-foreground">Token Alignment</span>
              <span className="text-foreground">100%</span>
            </div>
            <div className="p-2 rounded bg-background/50 border border-border/40 flex justify-between">
              <span className="text-muted-foreground">Agent Drift Risk</span>
              <span className="text-lilac">0.0%</span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-border/40 text-[10px] font-mono text-muted-foreground flex justify-between">
          <span>Ready to Emit</span>
          <span className="text-foreground font-medium">Claude / Cursor</span>
        </div>
      </div>
    </div>
  );
}

function CanvasView() {
  const [activeStep, setActiveStep] = useState<BriefStepId>("schema");
  const currentStepConfig = BRIEF_STEPS.find((s) => s.id === activeStep) ?? BRIEF_STEPS[3];
  const stepIndex = BRIEF_STEPS.findIndex((s) => s.id === activeStep);

  return (
    <>
      <MiniHeader
        title="Project Canvas"
        subtitle={
          <>
            Architecture & execution pipeline for <span className="text-accent-foreground font-semibold">nxstudio</span>
          </>
        }
      />

      {/* ── Navigation Step Pills (Clickable) ─────────────── */}
      <div className="mt-4 flex items-center gap-1 overflow-x-auto rounded-xl border border-border/80 bg-background/50 p-1">
          {BRIEF_STEPS.map((s, idx) => {
            const isActive = s.id === activeStep;
            const isDone = idx < stepIndex;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveStep(s.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer outline-none",
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : isDone
                    ? "text-foreground hover:bg-secondary/60"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                )}
              >
                <span
                  className={cn(
                    "flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] font-mono transition-colors",
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  )}
                >
                  {s.stepNum}
                </span>
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

      {/* Render selected step view */}
      {activeStep === "vision" && <StepVisionContent />}
      {activeStep === "brand" && <StepBrandContent />}
      {activeStep === "stack" && <StepStackContent />}
      {activeStep === "schema" && <StepSchemaContent />}
      {activeStep === "review" && <StepReviewContent />}
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
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-accent-foreground">
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
              <CheckCircleIcon className="h-4 w-4 shrink-0 text-accent-foreground" />
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
        className="relative overflow-hidden rounded-xl border border-border bg-card shadow-[0_40px_120px_-24px_rgba(0,0,0,0.85)]"
        style={{ boxShadow: "0 40px 120px -24px rgba(0,0,0,0.85), inset 0 1px 0 0 var(--border)" }}
      >
        {/* Browser chrome */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
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
          <div className="hidden w-44 shrink-0 flex-col border-r border-border py-3 sm:flex">
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

          <div className="min-w-0 flex-1 p-5 min-h-[440px] sm:min-h-[470px] sm:p-6">
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
