"use client";

import { useState } from "react";
import { CopyButton } from "@/components/phases/CopyButton";
import { Button } from "@/components/ui/button";
import { SparklesIcon, LockIcon, ShieldCheckIcon, ZapIcon } from "@/components/icons";
import { useSubscription } from "@/lib/use-subscription";
import { PremiumDialog } from "@/components/billing/PremiumDialog";

export interface PersonaPrompt {
  id: string;
  category: "Architect" | "Security" | "QA & Tests" | "Performance" | "Growth & Analytics";
  title: string;
  description: string;
  prompt: string;
}

export const GALLERY_PROMPTS: PersonaPrompt[] = [
  {
    id: "lead-architect",
    category: "Architect",
    title: "Lead System Architect Persona",
    description: "Design modular, scalable file boundaries & strict state management before coding.",
    prompt: `Act as the Principal Software Architect. Review the product brief and tech stack decisions.
Structure the module boundaries, domain entities, and data access layers.
Output a clean folder hierarchy, interface contracts, and dependency graph guidelines in markdown.`,
  },
  {
    id: "sec-audit",
    category: "Security",
    title: "Application Security Reviewer",
    description: "Audit authentication, RLS policies, input sanitization, and secrets management.",
    prompt: `Act as a Senior Application Security Auditor. Audit authentication flows, Supabase RLS security policies, JWT validation, environment variable leaks, and OWASP Top 10 vulnerabilities.
Generate a prioritized vulnerability report with exact automated code fixes.`,
  },
  {
    id: "qa-coverage",
    category: "QA & Tests",
    title: "QA Engineer & Test Suite Builder",
    description: "Enumerate edge cases, broken states, and write unit & integration tests.",
    prompt: `Act as the Lead QA Automation Engineer. Generate unit tests using Vitest/Jest for all core business logic and state transitions.
Cover boundary conditions, missing payload handling, and network failure states. Ensure 95%+ line coverage.`,
  },
  {
    id: "perf-optimizer",
    category: "Performance",
    title: "Core Web Vitals & Query Optimizer",
    description: "Profile bundle sizes, slow re-renders, image optimization, and N+1 database queries.",
    prompt: `Act as a Web Performance Engineer. Audit Largest Contentful Paint (LCP), Interaction to Next Paint (INP), and bundle sizes.
Optimize slow queries, add memoization where critical, and lazy-load dynamic modules.`,
  },
  {
    id: "analytics-growth",
    category: "Growth & Analytics",
    title: "Telemetry & Product Analytics Engine",
    description: "Integrate structured event tracking, conversion funnel metrics, and user telemetry.",
    prompt: `Act as a Growth Engineer. Define analytics event schemas for key user conversion flows.
Implement structured logging, page view tracking, and error telemetry adapters.`,
  },
];

export function PromptGallery() {
  const { canUsePromptGallery } = useSubscription();
  const [payOpen, setPayOpen] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const filtered = filter === "all" ? GALLERY_PROMPTS : GALLERY_PROMPTS.filter((p) => p.category === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold tracking-tight">Prompt Gallery & Agent Personas</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Curated production prompt templates & specialized agent personas for Atelier & Black Label builders.
          </p>
        </div>
        {!canUsePromptGallery && (
          <Button onClick={() => setPayOpen(true)} size="sm" className="gap-2 font-mono text-xs uppercase">
            <LockIcon className="h-3.5 w-3.5" />
            Unlock Gallery (Atelier 10 USDT)
          </Button>
        )}
      </div>

      <PremiumDialog
        open={payOpen}
        title="Unlock Prompt Gallery & Agent Personas"
        description="Access curated production use cases, specialized AI agent personas, and architecture templates."
        onClose={() => setPayOpen(false)}
        onActivated={() => setPayOpen(false)}
      />

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {["all", "Architect", "Security", "QA & Tests", "Performance", "Growth & Analytics"].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
              filter === cat
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            {cat === "all" ? "All Use Cases" : cat}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="flex flex-col justify-between rounded-xl border border-border bg-card/60 p-5 shadow-sm transition-all hover:border-border/80"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground uppercase">
                  {item.category}
                </span>
                {!canUsePromptGallery && <LockIcon className="h-3.5 w-3.5 text-muted-foreground" />}
              </div>
              <h3 className="mt-3 font-semibold text-sm">{item.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{item.description}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
              {canUsePromptGallery ? (
                <CopyButton value={item.prompt} className="w-full justify-center" />
              ) : (
                <Button
                  onClick={() => setPayOpen(true)}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs gap-1.5"
                >
                  <LockIcon className="h-3 w-3" /> Copy Prompt (10 USDT Plan)
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
