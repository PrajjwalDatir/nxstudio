"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWorkspace } from "@/lib/workspace-store";
import { PHASES, getPhaseProgress, getPhaseStatus } from "@/lib/phases";
import { resolveAppSection } from "@/lib/app-context";
import { trackMascotTip, trackMascotAction } from "@/lib/analytics";
import { ArrowRightIcon, ChevronRightIcon, XIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export type Pose = "dormant" | "briefed" | "ready" | "curious" | "excited" | "proud";

interface DialogueLine {
  text: string;
  pose: Pose;
  mood: string;
  topic?: string;
  action?: {
    label: string;
    href: string;
  };
}

const ALL_POSES: Pose[] = ["dormant", "briefed", "ready", "curious", "excited", "proud"];

/**
 * Builds context-aware visual novel guidance lines tailored to the active route,
 * phase progress, and project state.
 */
function buildDialogueLines(
  pathname: string,
  allDone: boolean,
  nextPhase: (typeof PHASES)[number] | undefined
): DialogueLine[] {
  if (allDone) {
    return [
      {
        text: "Every phase is finished! Your architecture and brief are airtight. You're officially ready to ship.",
        pose: "proud",
        mood: "PROUD",
        topic: "SHIP READY",
      },
      {
        text: "Copy your compiled build prompt anytime with ⌘C, or review the task checklist before deployment.",
        pose: "ready",
        mood: "READY",
        topic: "CHECKLIST",
      },
      {
        text: "Need to iterate? You can always return to any canvas step to refine tokens or extend your schema.",
        pose: "curious",
        mood: "CURIOUS",
        topic: "NEXT STEPS",
      },
    ];
  }

  // Specific Canvas Phase routes
  if (pathname.includes("/canvas/idea")) {
    return [
      {
        text: "Let's dial in your product brief. What real-world friction are your users experiencing right now?",
        pose: "curious",
        mood: "CURIOUS",
        topic: "IDEA // PROBLEM",
      },
      {
        text: "Be hyper-specific — solving one acute, undeniable problem always beats three vague ones.",
        pose: "briefed",
        mood: "ANALYZING",
        topic: "VALIDATION",
      },
      {
        text: "Picture one real person who feels this friction every single day. That's your target user.",
        pose: "curious",
        mood: "CURIOUS",
        topic: "AUDIENCE",
      },
      {
        text: "Once your Brief is solid, we'll automatically derive your recommended tech stack and design tokens.",
        pose: "ready",
        mood: "READY",
        topic: "WORKFLOW",
      },
    ];
  }

  if (pathname.includes("/canvas/tech-stack")) {
    return [
      {
        text: "Your Brief is locked! I've derived stack recommendations optimized for rapid execution and scale.",
        pose: "ready",
        mood: "READY",
        topic: "TECH STACK",
      },
      {
        text: "Don't overcomplicate your infrastructure early on. Stick to proven primitives and ship.",
        pose: "briefed",
        mood: "ANALYZING",
        topic: "ARCHITECTURE",
      },
      {
        text: "Pick your core database and framework, then we'll generate the full build prompt.",
        pose: "curious",
        mood: "CURIOUS",
        topic: "DECISION",
      },
    ];
  }

  if (pathname.includes("/canvas/build")) {
    return [
      {
        text: "Your stack is set and build prompt is compiled! Copy it straight into your AI coding tool.",
        pose: "excited",
        mood: "EXCITED",
        topic: "BUILD // PROMPT",
      },
      {
        text: "Remember to verify each generated module against your original schema specifications.",
        pose: "briefed",
        mood: "ANALYZING",
        topic: "VERIFICATION",
      },
      {
        text: "Press ⌘C to copy your complete build prompt anytime.",
        pose: "ready",
        mood: "READY",
        topic: "SHORTCUT",
      },
    ];
  }

  if (pathname.includes("/canvas/checklist")) {
    return [
      {
        text: "Work through your build checklist step-by-step. Keep each task under a single day of focused effort.",
        pose: "ready",
        mood: "READY",
        topic: "EXECUTION",
      },
      {
        text: "Keep the checklist open on a second monitor while you build to keep your momentum high.",
        pose: "proud",
        mood: "PROUD",
        topic: "MOMENTUM",
      },
      {
        text: "Ticking off small daily milestones is how ambitious apps get shipped on time.",
        pose: "excited",
        mood: "EXCITED",
        topic: "MILESTONES",
      },
    ];
  }

  // General Canvas overview
  if (pathname.startsWith("/canvas")) {
    const nextMsg = nextPhase
      ? `Next milestone: ${nextPhase.label}. Let's keep moving forward!`
      : "Your canvas phases are progressing smoothly.";
    return [
      {
        text: nextMsg,
        pose: "ready",
        mood: "READY",
        topic: "CANVAS",
        action: nextPhase
          ? { label: `Continue to ${nextPhase.label}`, href: `/canvas/${nextPhase.id}` }
          : undefined,
      },
      {
        text: "Don't get trapped in endless planning. The moment your Brief is clear, jump straight to building.",
        pose: "curious",
        mood: "CURIOUS",
        topic: "PHILOSOPHY",
      },
      {
        text: "Press ⌘K to open the command palette. It's the fastest way to jump between phases.",
        pose: "briefed",
        mood: "ANALYZING",
        topic: "SHORTCUT",
      },
    ];
  }

  // Studio Mode
  if (pathname.startsWith("/studio")) {
    return [
      {
        text: "Welcome to Studio. This is where your brand comes alive through generative canvas systems.",
        pose: "ready",
        mood: "READY",
        topic: "STUDIO",
      },
      {
        text: "Dial in your primary brand tokens first, then explore generative p5 textures and 3D scenes.",
        pose: "curious",
        mood: "CURIOUS",
        topic: "BRAND TOKENS",
      },
      {
        text: "Motion keyframes can be exported directly into Theatre.js for production-ready web animation.",
        pose: "briefed",
        mood: "ANALYZING",
        topic: "MOTION",
      },
      {
        text: "Use the Annotate mode to pin structural specs and design tokens directly onto your layout.",
        pose: "proud",
        mood: "PROUD",
        topic: "ANNOTATE",
      },
    ];
  }

  // Tasks
  if (pathname.startsWith("/tasks")) {
    return [
      {
        text: "Your implementation checklist. Break large architectural epics into focused, daily milestones.",
        pose: "ready",
        mood: "READY",
        topic: "TASKS",
      },
      {
        text: "Shipping smaller increments drastically reduces debugging complexity and keeps velocity high.",
        pose: "excited",
        mood: "EXCITED",
        topic: "VELOCITY",
      },
    ];
  }

  // Projects
  if (pathname.startsWith("/projects")) {
    return [
      {
        text: "Manage all your project workspaces. Switch between active builds or initialize a fresh concept.",
        pose: "ready",
        mood: "READY",
        topic: "PROJECTS",
      },
      {
        text: "Keep an archive workspace for experimental prototypes so you never lose early insights.",
        pose: "curious",
        mood: "CURIOUS",
        topic: "PROTOTYPES",
      },
    ];
  }

  // Team
  if (pathname.startsWith("/team")) {
    return [
      {
        text: "Invite domain experts as Reviewers so they can critique the Brief without altering code.",
        pose: "briefed",
        mood: "ANALYZING",
        topic: "TEAM",
      },
      {
        text: "Link your GitHub account here first so commit activity automatically maps to team members.",
        pose: "ready",
        mood: "READY",
        topic: "GITHUB",
      },
    ];
  }

  // Calendar
  if (pathname.startsWith("/calendar")) {
    return [
      {
        text: "Track project milestones and sprint deadlines. Tie your milestones strictly to user-facing value.",
        pose: "ready",
        mood: "READY",
        topic: "CALENDAR",
      },
      {
        text: "Missed a target date? Don't stress. Focus on shipping the core loop rather than rescheduling.",
        pose: "briefed",
        mood: "ANALYZING",
        topic: "FOCUS",
      },
    ];
  }

  // Settings
  if (pathname.startsWith("/settings")) {
    return [
      {
        text: "Configure your workspace, billing tier, and external integrations.",
        pose: "ready",
        mood: "READY",
        topic: "SETTINGS",
      },
      {
        text: "Connect your GitHub repository first so your schema and specs sync automatically.",
        pose: "curious",
        mood: "CURIOUS",
        topic: "INTEGRATION",
      },
    ];
  }

  // Global default dialogue
  return [
    {
      text: "I'm NX, your copilot. I watch your project architecture and guide you through each phase.",
      pose: "ready",
      mood: "READY",
      topic: "COPILOT",
    },
    {
      text: "Press ⌘K anytime to open the command palette and jump between tasks, phases, and specs.",
      pose: "curious",
      mood: "CURIOUS",
      topic: "SHORTCUT",
    },
    {
      text: "Keep an eye on my expressions in the corner — I'll react as you make real progress.",
      pose: "proud",
      mood: "PROUD",
      topic: "PROGRESS",
    },
  ];
}

/**
 * Visual Novel corner companion.
 * Sits stably in the bottom-right corner, completely free of erratic motion code.
 * Displays an expressive, visual novel-style dialogue interface that guides users.
 */
export function MascotNudge() {
  const pathname = usePathname() ?? "";
  const { data } = useWorkspace();
  const section = resolveAppSection(pathname, data.customStages);

  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hovered, setHovered] = useState(false);

  const statuses = PHASES.map((p) => getPhaseStatus(getPhaseProgress(p, data)));
  const nextPhase = PHASES.find((_, i) => statuses[i] !== "complete");
  const allDone = statuses.every((s) => s === "complete");

  // Build dialogue for current context
  const lines = useMemo(
    () => buildDialogueLines(pathname, allDone, nextPhase),
    [pathname, allDone, nextPhase]
  );

  // Preload mascot pose images
  useEffect(() => {
    for (const p of ALL_POSES) {
      const img = new Image();
      img.src = `/mascot/${p}.png`;
    }
  }, []);

  // Reset dialogue index on page navigation
  const prevPathRef = useRef(pathname);
  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname;
      setCurrentIndex(0);
      trackMascotTip("page_tip", section.label);
    }
  }, [pathname, section.label]);

  const safeIndex = currentIndex < lines.length ? currentIndex : 0;
  const currentLine = lines[safeIndex] ?? lines[0];

  // Derive robot pose based on active line and user interaction
  const activePose: Pose = hovered ? "curious" : currentLine.pose;

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % lines.length);
  }, [lines.length]);

  const handleClose = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsOpen(false);
    trackMascotAction("closed", section.label);
  }, [section.label]);

  const handleBotClick = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      trackMascotAction(next ? "opened" : "closed", section.label);
      return next;
    });
  }, [section.label]);

  // Next milestone action
  const nextAction = nextPhase
    ? { label: `Continue to ${nextPhase.label}`, href: `/canvas/${nextPhase.id}` }
    : undefined;

  return (
    <aside
      aria-label="Assistant guidance"
      className="fixed bottom-5 right-5 z-40 flex items-end gap-2.5 pointer-events-none select-none"
    >
      {/* Liquid Glass Dialogue Micro-Card */}
      {isOpen && (
        <div
          className="pointer-events-auto relative w-[260px] sm:w-[280px] rounded-2xl border border-white/20 dark:border-white/10 bg-background/60 dark:bg-card/45 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_12px_36px_0_rgba(0,0,0,0.16),inset_0_1px_1px_0_rgba(255,255,255,0.25)] p-3 transition-all animate-in fade-in-50 zoom-in-95 duration-150"
        >
          {/* Specular rim highlight */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent"
          />

          {/* Minimal header */}
          <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-lilac animate-pulse" />
              <span className="text-[11px] font-semibold text-foreground tracking-tight">NX</span>
              <span className="text-[10px] font-mono text-muted-foreground">· {safeIndex + 1}/{lines.length}</span>
            </div>
            <button
              onClick={handleClose}
              aria-label="Close"
              className="rounded-md p-0.5 text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
            >
              <XIcon className="h-3 w-3" />
            </button>
          </div>

          {/* Dialogue text */}
          <div
            onClick={handleNext}
            className="py-1.5 cursor-pointer select-none group"
            title="Click for next tip"
          >
            <p className="text-xs text-foreground/85 leading-relaxed font-normal group-hover:text-foreground transition-colors">
              {currentLine.text}
            </p>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-1.5 border-t border-border/40 text-[11px]">
            {currentLine.action || nextAction ? (
              <Link
                href={(currentLine.action || nextAction)!.href}
                onClick={() => {
                  trackMascotAction("continue_clicked", section.label);
                }}
                className="inline-flex items-center gap-1 font-medium text-lilac hover:underline text-[11px] truncate max-w-[180px]"
              >
                <span className="truncate">{(currentLine.action || nextAction)!.label}</span>
                <ArrowRightIcon className="h-2.5 w-2.5 shrink-0" />
              </Link>
            ) : (
              <span />
            )}

            <button
              onClick={handleNext}
              className="inline-flex items-center gap-0.5 font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors ml-auto shrink-0"
            >
              <span>Next</span>
              <ChevronRightIcon className="h-2.5 w-2.5" />
            </button>
          </div>
        </div>
      )}

      {/* Expressive Robot Avatar */}
      <div className="pointer-events-auto relative flex flex-col items-center">
        {/* Minimized Pill Badge (Clean Liquid Glass) */}
        {!isOpen && (
          <button
            onClick={handleBotClick}
            className="mb-1.5 whitespace-nowrap rounded-full border border-white/20 dark:border-white/10 bg-background/80 dark:bg-card/70 px-2.5 py-0.5 font-mono text-[10px] font-medium text-lilac shadow-md backdrop-blur-xl hover:bg-lilac/10 transition-all hover:scale-105 cursor-pointer"
          >
            <span>NX Guide</span>
            <span className="ml-1 text-[8px] text-lilac animate-pulse">●</span>
          </button>
        )}

        <button
          onClick={handleBotClick}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          aria-label={isOpen ? "Close NX Guide" : "Open NX Copilot Guide"}
          title={isOpen ? "Click to close" : "NX Copilot (click for advice)"}
          className="relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none cursor-pointer"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={activePose}
            src={`/mascot/${activePose}.png`}
            alt={`NX Mascot - ${activePose}`}
            draggable={false}
            className="h-full w-full object-contain drop-shadow-2xl transition-transform duration-150 select-none"
          />
        </button>
      </div>
    </aside>
  );
}
