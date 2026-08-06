"use client";

import { Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Canvas } from "@react-three/fiber";
import { useWorkspace } from "@/lib/workspace-store";
import { PHASES, getPhaseProgress, getPhaseStatus } from "@/lib/phases";
import { Machine, usePrefersReducedMotion } from "@/components/landing/MachineModel";
import { ArrowRightIcon, XIcon } from "@/components/icons";

const NEXT_STEP_COPY: Record<string, string> = {
  idea: "Finish your Brief — the problem, users, and what makes you different.",
  "tech-stack": "Pick your tech stack. I'll derive the stack and brand tokens from your Brief.",
  build: "Copy your build prompt and start building.",
  checklist: "Work through the build checklist.",
};

// Said unprompted the moment progress actually advances to a new phase.
const PROGRESS_NUDGE: Record<string, string> = {
  idea: "Let's start with your Brief — I'll be right here.",
  "tech-stack": "Brief's solid. Let's pick your tech stack next.",
  build: "Stack's set — let's get your build prompt.",
  checklist: "Build prompt's ready. Work the checklist as you go.",
};
const ALL_DONE_NUDGE = "Every phase is done — you're ready to ship.";

const EXPLORE_TIPS = [
  "Press ⌘K to open the command palette. It's the fastest way to jump between phases.",
  "You can copy your entire build prompt using ⌘C when you're ready to ship.",
  "Don't get stuck in planning. The moment your Brief is solid, move straight to the Build phase.",
  "Sync your progress to GitHub with ⌘G to keep your team in the loop.",
  "I watch your progress in real-time. Keep an eye on my expressions—I'll look proud when you're ready to ship.",
  "Pressing ⌘K isn't just for navigation—you can search tasks, phases, and your tech stack directly.",
];

const PAGE_CONTEXT: Record<string, { title: string; desc: string; tips: string[] }> = {
  "/studio": {
    title: "Studio Mode",
    desc: "The Studio is where your brand comes alive. You can explore Generative p5, 3D scenes, motion, and annotations.",
    tips: [
      "Brand consistency starts here: dial in your color tokens first, then generate variations.",
      "The 3D primitive scene is great for hero backgrounds. Try exporting a static frame for your landing page.",
      "Motion keyframes can be exported straight to Theatre.js for production use.",
      "Use the Annotate layer to leave structural notes for your frontend engineers directly on the design."
    ]
  },
  "/projects": {
    title: "Projects",
    desc: "Manage all your active projects here. Switch between them or create new ones.",
    tips: [
      "Keep an 'Archive' project for experiments that didn't pan out, so you don't lose the ideas.",
      "Your billing limit applies per workspace. Switching projects keeps your resources organized."
    ]
  },
  "/team": {
    title: "Team",
    desc: "Manage your collaborators and team permissions.",
    tips: [
      "Invite a domain expert strictly as a 'Reviewer' so they can comment on the Brief without altering the tech stack.",
      "Link your GitHub account here first so commits automatically map to the right team members."
    ]
  },
  "/calendar": {
    title: "Calendar",
    desc: "Track project timelines, sprints, and schedule milestones.",
    tips: [
      "Tie your sprint milestones strictly to user-facing features, not just backend infrastructure.",
      "Missed a date? The timeline adjusts dynamically. Focus on shipping, not rescheduling."
    ]
  },
  "/tasks": {
    title: "Tasks",
    desc: "Your implementation checklist. Check off tasks as you build.",
    tips: [
      "Every task should take less than a day. If it takes longer, break it down further.",
      "Keep the checklist open on a second monitor while you build. Ticking these off keeps momentum high."
    ]
  },
  "/settings": {
    title: "Settings",
    desc: "Configure your workspace, billing, and API connections.",
    tips: [
      "Connect your GitHub account first. We'll automatically sync your commits to the project timeline.",
      "You can configure webhooks here to trigger external builds when a phase is marked complete."
    ]
  },
  "/canvas": {
    title: "Canvas",
    desc: "The main workspace. Here you define the problem, users, and pick your tech stack.",
    tips: [
      "Your Brief drives the entire product. The more specific your 'target user', the better the derived tech stack.",
      "Don't overthink the Tech Stack. The defaults are optimized for speed. Just hit deploy and iterate later.",
      "The Idea phase isn't a business plan. Treat it like a thesis statement for today's build.",
      "You can use ⌘K to quickly search through all your phases without leaving the canvas."
    ]
  }
};

// Companion tips — shown once, matched to the field's aria-label when it has
// one (see IdeaPhase's textareas), otherwise a generic pick.
const FIELD_TIPS: Record<string, string[]> = {
  "What problem are you solving?": [
    "Be specific — what pain, for whom, and why now?",
    "One real problem beats three vague ones.",
  ],
  "Who are your target users?": [
    "Picture one real person and describe them.",
    "Who feels this problem the most acutely?",
  ],
  "How do they solve it today?": [
    "Even ‘a spreadsheet’ or ‘nothing’ counts.",
    "What's the annoying workaround right now?",
  ],
  "What makes you different?": [
    "What's the one insight competitors miss?",
    "Why do you win this, specifically?",
  ],
};
const GENERIC_TIPS = [
  "Take your time — I'm right here.",
  "No wrong answers yet, we'll sharpen it later.",
  "Just say what's true, polish comes after.",
];
const ENGAGE_DELAY = 2600; // ms of real typing before it reacts at all

type Pose = "dormant" | "briefed" | "ready" | "curious" | "excited" | "proud";

// Real walk-cycle frames (public/mascot/walk/<pose>-<frame>.png), generated
// from the actual mood art rather than drawn from scratch: the lower-body
// cluster (hips/legs/feet) is rotated as one rigid piece below the waist
// seam, so every pixel is the genuine rendered character, just re-posed.
type WalkFrame = "a" | "mid" | "b";

// Cycled while idly wandering, so it isn't stuck reading as sad/sleepy the
// whole time — a fresh one is picked each time it picks a new waypoint.
const IDLE_POSES: Pose[] = ["dormant", "curious", "proud"];

function RocketFlame() {
  return (
    <svg viewBox="0 0 16 22" className="h-full w-full">
      <title>Rocket exhaust</title>
      <defs>
        <linearGradient id="flame" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F3E8FF" />
          <stop offset="45%" stopColor="#C4B5FD" />
          <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M8 0 C 12 6, 14 10, 8 22 C 2 10, 4 6, 8 0 Z" fill="url(#flame)" />
    </svg>
  );
}

const SIZE = 112; // px
const EDGE_MARGIN = 20;
const WANDER_ACCEL = 0.035;
const WANDER_MAX_SPEED = 0.9;
const LOOK_ACCEL = 0.06; // deliberately slow — a question takes ~30s to fill
const LOOK_MAX_SPEED = 1.1;
const DAMPING = 0.94; // softer inertia — slow, gradual ramps, no sudden lurches
const BUBBLE_WIDTH = 272;

type Anchor = { above: boolean; right: boolean };

function anchorFor(p: { x: number; y: number }): Anchor {
  return {
    above: p.y > 240 || p.y > window.innerHeight - p.y,
    right: p.x > window.innerWidth / 2,
  };
}

// el is the live source of truth for a real card's position — null only for
// the synthetic floor, which has no element to track (it just tracks the
// viewport, which needs no re-measuring on scroll).
type Platform = { left: number; right: number; top: number; el: HTMLElement | null };

const PLATFORM_MIN_WIDTH = 160;
const PLATFORM_MIN_HEIGHT = 36;
const WALK_MAX_SPEED = 0.85; // brisk enough to clearly read as crossing a ledge
const WALK_ACCEL = 0.09;

// Measured from the actual art (public/mascot/*.png): the opaque robot only
// fills the center ~42% of its square canvas, symmetric, feet flush with
// the very bottom. Aligning the full padded box to a ledge's edge leaves
// the visible character floating short of it — this is the true half-width
// of the drawn character, used so its actual body (not the transparent
// padding around it) lines up with a ledge.
const SPRITE_CONTENT_FRAC = 0.417;
const SPRITE_HALF_WIDTH = (SIZE * SPRITE_CONTENT_FRAC) / 2;

/** Foot-anchored walk bounds for a ledge: keeps the drawn character's own
 * body within the ledge's true edges, not the padded image box. */
function walkBoundsFor(pl: Platform, w: number) {
  const minX = Math.max(EDGE_MARGIN, pl.left - SIZE / 2 + SPRITE_HALF_WIDTH);
  const maxX = Math.min(w - SIZE - EDGE_MARGIN, pl.right - SIZE / 2 - SPRITE_HALF_WIDTH);
  return { minX, maxX };
}

/**
 * Scans the live DOM for "set pieces" — cards and panels rendered with the
 * app's card idiom (rounded corners + a border) — so the mascot has ledges
 * to walk instead of only ever flying through open air. Run every few
 * wander cycles, not every frame — a DOM scan is too costly for 60fps.
 */
function collectPlatforms(excludeEl: HTMLElement | null): Platform[] {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const out: Platform[] = [];
  const candidates = document.querySelectorAll<HTMLElement>(
    '[class*="rounded-2xl"],[class*="rounded-xl"],[class*="rounded-lg"]'
  );
  for (const el of candidates) {
    if (out.length >= 24) break;
    if (excludeEl?.contains(el)) continue;
    const cls = el.className;
    if (typeof cls !== "string" || !(/\bborder\b/.test(cls) || /\bborder-/.test(cls))) continue;
    const r = el.getBoundingClientRect();
    if (r.width < PLATFORM_MIN_WIDTH || r.height < PLATFORM_MIN_HEIGHT) continue;
    if (r.top < 0 || r.top > vh || r.left < -40 || r.right > vw + 40) continue;
    out.push({ left: r.left, right: r.right, top: r.top, el });
  }
  // The viewport floor is always walkable — a stage always has a floor,
  // even on a page with no cards yet laid out.
  out.push({ left: 0, right: vw, top: vh - EDGE_MARGIN, el: null });
  return out;
}

/**
 * Free-roaming corner companion. It wanders on its own, cursor-independent,
 * and holds still the moment you click it — no drifting off while you're
 * reading. Typing into a field is the one thing that pulls its attention: it
 * eases toward that field's actual position for as long as you're typing.
 * It also speaks up on its own whenever real progress happens (a phase
 * completes, or everything's done), not just when clicked.
 */
export function MascotNudge() {
  const pathname = usePathname();
  const { data } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [bubble, setBubble] = useState<Anchor>({ above: true, right: false });
  const [pose, setPose] = useState<Pose>("dormant");
  const [isWalking, setIsWalking] = useState(false);
  const [walkFrame, setWalkFrame] = useState<WalkFrame>("mid");
  const [autoMsg, setAutoMsg] = useState<string | null>(null);
  const [autoAnchor, setAutoAnchor] = useState<Anchor>({ above: true, right: false });
  const reduce = usePrefersReducedMotion();

  const statuses = PHASES.map((p) => getPhaseStatus(getPhaseProgress(p, data)));
  const next = PHASES.find((_, i) => statuses[i] !== "complete");
  const allDone = statuses.every((s) => s === "complete");

  const wrapRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const vel = useRef({ x: 0, y: 0 });
  const mouse = useRef({ x: -9999, y: -9999 });
  const typing = useRef(false);
  const activeField = useRef<HTMLElement | null>(null);
  const engageStart = useRef(0); // 0 = not accumulating yet
  const greetedField = useRef<HTMLElement | null>(null);
  const wanderTarget = useRef({ x: 0, y: 0 });
  const lastPose = useRef<Pose>("dormant");
  const lastWalking = useRef(false);
  const lastWalkFrame = useRef<WalkFrame>("mid");
  const thrustL = useRef<HTMLDivElement>(null);
  const thrustR = useRef<HTMLDivElement>(null);
  const thrust = useRef(0);
  const idlePose = useRef<Pose>("dormant");
  const spriteRef = useRef<HTMLImageElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const platforms = useRef<Platform[]>([]);
  const platformRefreshCounter = useRef(0);
  const walkPhase = useRef(0);
  const facing = useRef<1 | -1>(1);
  const shadowOpacity = useRef(0);
  // Explicit stage-direction state machine for idle wandering: "fly" covers
  // both crossing open space and the approach onto a ledge; "walk" is a
  // committed, dead-level traverse from one side of that ledge to the
  // other. landingPlatform is set only while flying toward a chosen ledge
  // (null means the current flight target is just open air).
  const wanderPhase = useRef<"fly" | "walk">("fly");
  const landingPlatform = useRef<Platform | null>(null);
  const walkPlatform = useRef<Platform | null>(null);
  const walkTarget = useRef({ x: 0, y: 0 });
  const walkSide = useRef<"min" | "max">("max");
  const lastPlatform = useRef<Platform | null>(null);
  const openRef = useRef(false);
  const prevKey = useRef<string | null>(null);
  const autoMsgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Proactive chatter — fires on its own on a loop while idle, independent
  // of progress nudges and field tips: pauses wherever it currently is and
  // says something, then picks a fresh interval and keeps going forever.
  const chatterTimer = useRef(360); // ~6s before the first one
  const chatterHold = useRef(0);

  // Keep pathname in ref for the animation loop
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // The tick loop's effect only re-runs on [reduce, allDone] — next
  // updates on every data edit, so it's mirrored into a ref rather than
  // captured directly, or the chatter loop would read a stale phase.
  const nextRef = useRef(next);
  useEffect(() => {
    nextRef.current = next;
  }, [next]);

  // Land bottom-right on mount, before first paint, so there's no top-left flash.
  useLayoutEffect(() => {
    const x = window.innerWidth - SIZE - EDGE_MARGIN;
    const y = window.innerHeight - SIZE - EDGE_MARGIN;
    pos.current = { x, y };
    wanderTarget.current = { x, y };
    wrapRef.current?.style.setProperty("transform", `translate3d(${x}px, ${y}px, 0)`);
  }, []);

  // Speak up on its own the moment real progress happens — not on mount.
  useEffect(() => {
    const key = allDone ? "done" : (next?.id ?? null);
    if (prevKey.current !== null && key !== prevKey.current && !openRef.current) {
      const msg = allDone ? ALL_DONE_NUDGE : key ? PROGRESS_NUDGE[key] : null;
      if (msg) {
        setAutoAnchor(anchorFor(pos.current));
        setAutoMsg(msg);
        if (autoMsgTimer.current) clearTimeout(autoMsgTimer.current);
        autoMsgTimer.current = setTimeout(() => setAutoMsg(null), 6500);
      }
    }
    prevKey.current = key;
  }, [next?.id, allDone]);

  useEffect(() => {
    if (reduce) return; // stays put for reduced-motion users

    const isField = (t: EventTarget | null) =>
      t instanceof HTMLElement &&
      (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);

    const onMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };
    // Landing on a field, or a stray modifier/shortcut key, shouldn't move it
    // at all — only sustained real typing does, and only after it's had a
    // few seconds to notice.
    const onFocusIn = (e: FocusEvent) => {
      if (!isField(e.target)) return;
      activeField.current = e.target as HTMLElement;
      engageStart.current = 0;
      typing.current = false;
    };
    const onFocusOut = (e: FocusEvent) => {
      if (e.target !== activeField.current) return;
      activeField.current = null;
      engageStart.current = 0;
      typing.current = false;
    };
    const onInput = (e: Event) => {
      if (e.target !== activeField.current) return;
      if (engageStart.current === 0) engageStart.current = performance.now();
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    document.addEventListener("input", onInput);

    // Chooses the next flight destination — either an approach onto a
    // ledge (landingPlatform gets set, so arrival hands off to a walk
    // across it) or a waypoint out in open air (landingPlatform stays
    // null, so arrival just picks another flight target).
    const pickFlyTarget = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const p = pos.current;
      platformRefreshCounter.current -= 1;
      if (platformRefreshCounter.current <= 0) {
        platforms.current = collectPlatforms(wrapRef.current);
        platformRefreshCounter.current = 3;
      }
      const walkable = platforms.current.filter((pl) => pl.right - pl.left > SIZE * 1.4);
      // Prefer a different ledge than the one it just crossed, so it
      // actually tours the page instead of pacing the same wide strip
      // (usually the floor) back and forth.
      const fresh = walkable.filter((pl) => pl !== lastPlatform.current);
      const walkOptions = fresh.length > 0 ? fresh : walkable;
      if (walkOptions.length > 0 && Math.random() < 0.65) {
        const pl = walkOptions[Math.floor(Math.random() * walkOptions.length)];
        const { minX, maxX } = walkBoundsFor(pl, w);
        // Land on whichever side is closer, so the full width gets walked.
        const landAtMin = Math.abs(p.x - minX) <= Math.abs(p.x - maxX);
        wanderTarget.current = {
          x: landAtMin ? minX : maxX,
          y: Math.min(Math.max(pl.top - SIZE, EDGE_MARGIN), h - SIZE - EDGE_MARGIN),
        };
        landingPlatform.current = pl;
      } else {
        // An empty-air waypoint — reroll a few times if it happens to land
        // right on a ledge, so "flying" reliably means open space.
        let tx = p.x;
        let ty = p.y;
        for (let tries = 0; tries < 5; tries++) {
          tx = EDGE_MARGIN + Math.random() * (w - SIZE - EDGE_MARGIN * 2);
          ty = EDGE_MARGIN + Math.random() * (h - SIZE - EDGE_MARGIN * 2);
          const feetY = ty + SIZE;
          const onLedge = platforms.current.some(
            (pl) => Math.abs(feetY - pl.top) < 24 && tx + SIZE > pl.left && tx < pl.right
          );
          if (!onLedge) break;
        }
        wanderTarget.current = { x: tx, y: ty };
        landingPlatform.current = null;
      }
      idlePose.current = IDLE_POSES[Math.floor(Math.random() * IDLE_POSES.length)];
    };

    let raf = 0;
    const tick = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const p = pos.current;
      const v = vel.current;
      const m = mouse.current;

      // Holds perfectly still with the popup open — no drifting off while
      // you're reading it.
      if (openRef.current) {
        v.x *= DAMPING;
        v.y *= DAMPING;
        p.x += v.x;
        p.y += v.y;
        p.x = Math.min(Math.max(p.x, EDGE_MARGIN), w - SIZE - EDGE_MARGIN);
        p.y = Math.min(Math.max(p.y, EDGE_MARGIN), h - SIZE - EDGE_MARGIN);
        if (wrapRef.current) {
          wrapRef.current.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
        }
        thrust.current += (0 - thrust.current) * 0.2;
        if (thrustL.current) thrustL.current.style.opacity = String(thrust.current);
        if (thrustR.current) thrustR.current.style.opacity = String(thrust.current);
        wanderPhase.current = "fly";
        walkPlatform.current = null;
        landingPlatform.current = null;
        if (lastWalking.current) {
          lastWalking.current = false;
          setIsWalking(false);
        }
        shadowOpacity.current += (0 - shadowOpacity.current) * 0.2;
        if (shadowRef.current) shadowRef.current.style.opacity = String(shadowOpacity.current);
        if (spriteRef.current) spriteRef.current.style.transform = `scaleX(${facing.current})`;
        raf = requestAnimationFrame(tick);
        return;
      }

      // Only start reacting once the user has been genuinely typing in the
      // same field for a few seconds — a single keystroke never triggers it.
      if (activeField.current && engageStart.current > 0 && !typing.current) {
        if (performance.now() - engageStart.current > ENGAGE_DELAY) {
          typing.current = true;
          wanderPhase.current = "fly";
          walkPlatform.current = null;
          landingPlatform.current = null;
          if (greetedField.current !== activeField.current) {
            greetedField.current = activeField.current;
            const label = activeField.current.getAttribute("aria-label");
            const pool = (label && FIELD_TIPS[label]) || GENERIC_TIPS;
            setAutoAnchor(anchorFor(p));
            setAutoMsg(pool[Math.floor(Math.random() * pool.length)]);
            if (autoMsgTimer.current) clearTimeout(autoMsgTimer.current);
            autoMsgTimer.current = setTimeout(() => setAutoMsg(null), 6000);
          }
        }
      }

      // Proactive chatter loop — independent of progress nudges and field
      // tips, keeps firing for as long as it's idle (not typing, not
      // paused for the popup). Ticks down regardless of fly/walk phase.
      if (!typing.current) {
        if (chatterHold.current > 0) {
          chatterHold.current -= 1;
        } else {
          chatterTimer.current -= 1;
          if (chatterTimer.current <= 0) {
            const n = nextRef.current;
            const currentPath = pathnameRef.current;
            const matchedPrefix = Object.keys(PAGE_CONTEXT).find(k => currentPath?.startsWith(k));
            
            const talkNext = n && Math.random() < 0.5;
            
            let pool = EXPLORE_TIPS;
            if (matchedPrefix && !talkNext) {
              const ctxTips = PAGE_CONTEXT[matchedPrefix].tips;
              if (Math.random() < 0.6) pool = ctxTips;
            }

            const msg = talkNext
              ? (NEXT_STEP_COPY[n.id] ?? n.description)
              : pool[Math.floor(Math.random() * pool.length)];

            setAutoAnchor(anchorFor(p));
            setAutoMsg(msg);
            if (autoMsgTimer.current) clearTimeout(autoMsgTimer.current);
            autoMsgTimer.current = setTimeout(() => setAutoMsg(null), 5500);
            chatterHold.current = 140; // stands still for a beat while "talking"
            chatterTimer.current = 900 + Math.random() * 900; // next one in ~15-30s
          }
        }
      }

      let aware = false;
      let maxSpeed = WANDER_MAX_SPEED;

      if (chatterHold.current > 0) {
        // Paused mid-scene to say something — no wander/walk input at all
        // this frame, so the shared damping below just lets it settle.
      } else if (typing.current) {
        // Track the field actually being typed in, not just wherever the mouse
        // last was — that goes stale the moment you stop moving the cursor.
        const active = document.activeElement;
        const rect = active instanceof HTMLElement ? active.getBoundingClientRect() : null;
        const tx = (rect ? rect.right : m.x) + 40 - SIZE / 2;
        const ty = (rect ? rect.top : m.y) - 100 - SIZE / 2;
        const dx = tx - p.x;
        const dy = ty - p.y;
        const dist = Math.hypot(dx, dy) || 1;
        const closeFactor = Math.min(dist / 40, 1);
        v.x += (dx / dist) * LOOK_ACCEL * closeFactor;
        v.y += (dy / dist) * LOOK_ACCEL * closeFactor;
        aware = true;
        maxSpeed = LOOK_MAX_SPEED;
      } else if (wanderPhase.current === "walk" && walkPlatform.current) {
        // Re-measure the actual ledge every frame — it's real DOM content
        // inside a scrolling container, so its viewport position can move
        // under the mascot's feet at any time. This is what keeps it
        // riding along with the surface instead of staying put while the
        // page scrolls out from underneath it.
        const el = walkPlatform.current.el;
        const bail = () => {
          wanderPhase.current = "fly";
          lastPlatform.current = walkPlatform.current;
          walkPlatform.current = null;
          pickFlyTarget();
        };
        if (el) {
          if (!el.isConnected) {
            bail();
          } else {
            const r = el.getBoundingClientRect();
            if (r.width < SIZE || r.bottom <= 0 || r.top >= h) {
              // Scrolled fully out of view (or collapsed) — hop off rather
              // than keep standing on a ledge that's no longer there.
              bail();
            } else {
              walkPlatform.current = { left: r.left, right: r.right, top: r.top, el };
              const { minX, maxX } = walkBoundsFor(walkPlatform.current, w);
              walkTarget.current = {
                x: walkSide.current === "max" ? maxX : minX,
                y: Math.min(Math.max(r.top - SIZE, EDGE_MARGIN), h - SIZE - EDGE_MARGIN),
              };
            }
          }
        }
        // Committed traverse — dead level, straight across, no vertical
        // input at all, so there's nothing to wobble.
        if (wanderPhase.current === "walk") {
          maxSpeed = WALK_MAX_SPEED;
          const dx = walkTarget.current.x - p.x;
          if (Math.abs(dx) < 3) {
            wanderPhase.current = "fly";
            lastPlatform.current = walkPlatform.current;
            walkPlatform.current = null;
            pickFlyTarget();
          } else {
            v.x += Math.sign(dx) * WALK_ACCEL;
          }
        }
      } else {
        const wdx = wanderTarget.current.x - p.x;
        const wdy = wanderTarget.current.y - p.y;
        const wdist = Math.hypot(wdx, wdy) || 1;
        if (wdist < 6) {
          if (landingPlatform.current) {
            // Touched down — hand off into a full walk across this ledge,
            // starting from wherever it just landed toward the far side.
            const pl = landingPlatform.current;
            p.x = wanderTarget.current.x;
            p.y = wanderTarget.current.y; // already clamped on-screen, unlike pl.top - SIZE
            v.x = 0;
            v.y = 0;
            const { minX, maxX } = walkBoundsFor(pl, w);
            const toMax = p.x < (minX + maxX) / 2;
            walkTarget.current = { x: toMax ? maxX : minX, y: p.y };
            walkSide.current = toMax ? "max" : "min";
            walkPlatform.current = pl;
            wanderPhase.current = "walk";
            walkPhase.current = 0; // start each traverse from a neutral stance
            landingPlatform.current = null;
          } else {
            pickFlyTarget();
          }
        } else {
          const wClose = Math.min(wdist / 60, 1);
          v.x += (wdx / wdist) * WANDER_ACCEL * wClose;
          v.y += (wdy / wdist) * WANDER_ACCEL * wClose;
        }
      }

      v.x *= DAMPING;
      v.y *= DAMPING;
      const speed = Math.hypot(v.x, v.y);
      if (speed > maxSpeed) {
        v.x = (v.x / speed) * maxSpeed;
        v.y = (v.y / speed) * maxSpeed;
      }

      // Kill velocity into a wall instead of clamping position and letting
      // it press against the edge — that pent-up velocity was the source of
      // the "sudden acceleration" snap once the target moved away again.
      const nextX = p.x + v.x;
      const nextY = p.y + v.y;
      if (nextX < EDGE_MARGIN || nextX > w - SIZE - EDGE_MARGIN) v.x = 0;
      if (nextY < EDGE_MARGIN || nextY > h - SIZE - EDGE_MARGIN) v.y = 0;

      p.x = Math.min(Math.max(p.x + v.x, EDGE_MARGIN), w - SIZE - EDGE_MARGIN);
      p.y = Math.min(Math.max(p.y + v.y, EDGE_MARGIN), h - SIZE - EDGE_MARGIN);

      // Walking is an explicit committed state now (see the state machine
      // above), not inferred per-frame — that's what made it wobble
      // before, snapping in and out as the feet-contact math bounced
      // around the tolerance. Pin it dead level for the whole traverse.
      const walking = !typing.current && wanderPhase.current === "walk";
      if (walking) {
        p.y = walkTarget.current.y;
        v.y = 0;
      }

      if (Math.abs(v.x) > 0.05) facing.current = v.x > 0 ? 1 : -1;

      const bob = walking ? 0 : Math.sin(performance.now() / 480) * 5;
      if (wrapRef.current) {
        wrapRef.current.style.transform = `translate3d(${p.x}px, ${p.y + bob}px, 0)`;
      }

      if (walking !== lastWalking.current) {
        lastWalking.current = walking;
        setIsWalking(walking);
      }
      if (walking) {
        // Real sprite frames now carry the stepping motion — this just
        // picks which one, at a pace tied to how fast it's actually
        // covering ground rather than a fixed clock.
        walkPhase.current += 0.04 + Math.abs(v.x) * 0.05;
        const cyclePos = Math.sin(walkPhase.current);
        const wf: WalkFrame = cyclePos < -0.3 ? "a" : cyclePos > 0.3 ? "b" : "mid";
        if (wf !== lastWalkFrame.current) {
          lastWalkFrame.current = wf;
          setWalkFrame(wf);
        }
      }
      if (spriteRef.current) {
        if (walking) {
          spriteRef.current.style.transform = `scaleX(${facing.current})`;
        } else {
          const bank = Math.max(-10, Math.min(10, -v.x * 6));
          spriteRef.current.style.transform = `scaleX(${facing.current}) rotate(${bank}deg)`;
        }
      }
      shadowOpacity.current += ((walking ? 0.32 : 0) - shadowOpacity.current) * 0.15;
      if (shadowRef.current) {
        shadowRef.current.style.opacity = String(shadowOpacity.current);
      }

      // Rocket exhaust — only while actually flying; brightens with how
      // fast it's moving so the flight always looks propelled, not sliding.
      const targetThrust = walking ? 0 : Math.min(Math.hypot(v.x, v.y) / WANDER_MAX_SPEED, 1);
      thrust.current += (targetThrust - thrust.current) * 0.12;
      const flameOpacity = 0.15 + thrust.current * 0.8;
      const flameScale = 0.55 + thrust.current * 0.7;
      if (thrustL.current) {
        thrustL.current.style.opacity = String(flameOpacity);
        thrustL.current.style.transform = `scale(${flameScale})`;
      }
      if (thrustR.current) {
        thrustR.current.style.opacity = String(flameOpacity);
        thrustR.current.style.transform = `scale(${flameScale})`;
      }

      const nextPose: Pose = allDone ? "ready" : aware ? "briefed" : idlePose.current;
      if (nextPose !== lastPose.current) {
        lastPose.current = nextPose;
        setPose(nextPose);
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("input", onInput);
      cancelAnimationFrame(raf);
    };
  }, [reduce, allDone]);

  const toggle = () => {
    if (!open) {
      setBubble(anchorFor(pos.current));
      setAutoMsg(null); // don't show both at once
    }
    setOpen((v) => !v);
  };

  const bubbleStyle = (a: Anchor) => ({
    width: BUBBLE_WIDTH,
    ...(a.above ? { bottom: SIZE + 12 } : { top: SIZE + 12 }),
    ...(a.right ? { right: 0 } : { left: 0 }),
  });
  const tailStyle = (a: Anchor) => ({
    ...(a.above ? { bottom: -5 } : { top: -5 }),
    ...(a.right ? { right: 24 } : { left: 24 }),
  });

  const matchedContextKey = pathname ? Object.keys(PAGE_CONTEXT).find(k => pathname.startsWith(k)) : undefined;
  const context = matchedContextKey ? PAGE_CONTEXT[matchedContextKey] : null;

  return (
    <div
      ref={wrapRef}
      className="fixed top-0 left-0 z-50"
      style={reduce ? { right: EDGE_MARGIN, bottom: EDGE_MARGIN, left: "auto", top: "auto" } : { willChange: "transform" }}
    >
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        {!reduce && (
          <>
            <div
              ref={shadowRef}
              aria-hidden
              className="pointer-events-none absolute z-0 rounded-full bg-black opacity-0 blur-[2px]"
              style={{ left: "22%", right: "22%", bottom: "2%", height: 10 }}
            />
            <div
              ref={thrustL}
              aria-hidden
              className="pointer-events-none absolute z-0 opacity-0"
              style={{ left: "26%", bottom: "6%", width: 16, height: 22 }}
            >
              <RocketFlame />
            </div>
            <div
              ref={thrustR}
              aria-hidden
              className="pointer-events-none absolute z-0 opacity-0"
              style={{ right: "26%", bottom: "6%", width: 16, height: 22 }}
            >
              <RocketFlame />
            </div>
          </>
        )}
        <button
          onClick={toggle}
          aria-label="nx — what's next"
          className="relative z-10 flex h-full w-full items-center justify-center drop-shadow-xl transition-transform hover:scale-105 overflow-hidden"
        >
          <div className="h-full w-full pointer-events-none">
            <Canvas
              dpr={[1, 1.5]}
              camera={{ position: [0, 0.1, 4.8], fov: 38 }}
              gl={{ alpha: true, antialias: true }}
              style={{ background: "transparent" }}
            >
              <ambientLight intensity={1.4} />
              <directionalLight position={[-2, 4, 4]} intensity={3.2} color="#F1F5F9" />
              <pointLight position={[0.4, 1.2, 2.5]} intensity={14} color="#C4B5FD" />
              <pointLight position={[0, 1.5, -2.5]} intensity={22} color="#8B5CF6" />
              <Suspense fallback={null}>
                <group position={[0, -0.42, 0]} scale={[1.2, 1.2, 1.2]}>
                  <Machine reduce={reduce} pose={pose} />
                </group>
              </Suspense>
            </Canvas>
          </div>
        </button>

        {/* Unprompted companion nudge — appears on its own when progress moves. */}
        {!open && autoMsg && (
          <div className="absolute z-10" style={bubbleStyle(autoAnchor)}>
            <div className="rounded-2xl border border-primary/30 bg-card p-3.5 shadow-xl">
              <p className="text-sm text-foreground">{autoMsg}</p>
            </div>
            <div aria-hidden className="absolute h-3 w-3 rotate-45 bg-card" style={tailStyle(autoAnchor)} />
          </div>
        )}

        {open && (
          <div className="absolute z-10" style={bubbleStyle(bubble)}>
            <div className="rounded-2xl border border-border bg-card p-4 shadow-xl">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-semibold tracking-wide text-primary uppercase">
                  {context ? context.title : (next ? "Next step" : "You're all set")}
                </span>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 text-sm text-foreground">
                {context ? context.desc : (next
                  ? (NEXT_STEP_COPY[next.id] ?? next.description)
                  : "Every phase is complete — nothing blocking you right now.")}
              </p>
              {next && (
                <Link
                  href={`/canvas/${next.id}`}
                  onClick={() => setOpen(false)}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  Continue to {next.label}
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
            <div aria-hidden className="absolute h-3 w-3 rotate-45 bg-card" style={tailStyle(bubble)} />
          </div>
        )}
      </div>
    </div>
  );
}
