"use client";

/**
 * Radial theme-toggle reveal.
 *
 * Growing-hole mask on ::view-transition-old(root), not clip-path on
 * ::view-transition-new(root).
 *
 * Two earlier attempts at driving this off the View Transitions API both
 * targeted ::view-transition-new(root)'s clip-path and both broke in this
 * engine — once as a position/interpolation drift, once as a hard page
 * freeze when the toggle fired on a scrolled page. Rather than a third
 * attempt at the same target, this drives a different pseudo-element with a
 * different CSS property: the browser already renders the real, live,
 * already-swapped-to-new-theme DOM underneath the entire view-transition
 * overlay by default, so ::view-transition-new(root) isn't needed at all —
 * it's hidden outright. Instead a growing *hole* is cut into
 * ::view-transition-old(root) via `mask-image` (a hard-edged radial
 * gradient, alpha-based: transparent = hidden/hole, opaque = old snapshot
 * still showing), so the real live page shows through progressively from
 * the click point. Same proven-safe technique as before either way: no
 * multi-keyframe WAAPI interpolation, every frame's value computed here and
 * written directly — this time into a CSSOM rule, since pseudo-elements
 * have no `.style` of their own to write to.
 *
 * Rapid re-toggling doesn't queue or get dropped: each call cancels
 * whatever's currently mid-flight (skips the native transition, kills its
 * rAF loop, tears down its injected <style>) and starts the new one
 * immediately, rather than blocking input until the previous one finishes.
 * A generation counter guards against a stale, cancelled run's async
 * continuations (transition.ready/.finished, the next rAF tick) touching
 * the DOM after a newer run has superseded it.
 *
 * Falls back to a solid-color overlay wipe (no live dual-theme reveal, just
 * a color sweep) on browsers without View Transitions support, or if the
 * native attempt throws.
 */

export type Origin = { x: number; y: number };

const DURATION_MS = 1100;

let currentGeneration = 0;
let cancelCurrent: (() => void) | null = null;

export function runRadialThemeTransition(origin: Origin, applyTheme: () => void) {
  cancelCurrent?.();
  cancelCurrent = null;
  runRadialThemeTransitionInner(origin, applyTheme);
}

function resolveOrigin(origin: Origin): Origin {
  const x = typeof origin.x === "number" && !isNaN(origin.x) ? origin.x : window.innerWidth - 80;
  const y = typeof origin.y === "number" && !isNaN(origin.y) ? origin.y : 30;
  return { x, y };
}

function maxRadiusFrom(origin: Origin): number {
  return Math.hypot(
    Math.max(origin.x, window.innerWidth - origin.x),
    Math.max(origin.y, window.innerHeight - origin.y)
  );
}

// A pure ease-in (t^5) puts ~97% of the visible growth in the animation's
// final quarter — invisible for most of the duration, then the whole screen
// flips at once, which reads as a snap rather than a reveal now that real
// content is what's sweeping past instead of a flat color. Ease-in-out
// spreads the motion across the full duration instead.
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

type ViewTransition = {
  ready: Promise<void>;
  finished: Promise<void>;
  skipTransition?: () => void;
};

type DocumentWithViewTransitions = Document & {
  startViewTransition?: (callback: () => void) => ViewTransition;
};

function runRadialThemeTransitionInner(originInput: Origin, applyTheme: () => void) {
  const doc = document as DocumentWithViewTransitions;
  const origin = resolveOrigin(originInput);
  const generation = ++currentGeneration;

  if (typeof doc.startViewTransition !== "function" || typeof requestAnimationFrame !== "function") {
    runSolidOverlayFallback(origin, applyTheme, generation);
    return;
  }

  try {
    runGrowingHoleTransition(doc, origin, applyTheme, generation);
  } catch {
    runSolidOverlayFallback(origin, applyTheme, generation);
  }
}

// Width of the blend band straddling the reveal radius — a hard two-stop
// gradient cuts a razor-sharp ring that reads as a visible seam between old
// and new; feathering it this wide turns that seam into a soft gradient
// zone so the boundary itself disappears into the reveal.
const FEATHER_PX = 64;

function maskAt(origin: Origin, radius: number): string {
  const inner = Math.max(0, radius - FEATHER_PX);
  const outer = radius + FEATHER_PX;
  return `radial-gradient(circle at ${origin.x}px ${origin.y}px, transparent ${inner}px, black ${outer}px)`;
}

function runGrowingHoleTransition(
  doc: DocumentWithViewTransitions,
  origin: Origin,
  applyTheme: () => void,
  generation: number
) {
  const maxRadius = maxRadiusFrom(origin);

  // Kill the default cross-fade/resize-morph on all four view-transition
  // pseudos (it would compete with our own mask), hide ::new(root) — the
  // real live DOM already shows the new theme underneath, so the browser's
  // own "new" snapshot layer is redundant — and start ::old(root) with a
  // zero-radius hole (fully opaque, nothing revealed yet) so there's no
  // flash of the new theme before the animation begins.
  const style = document.createElement("style");
  style.textContent = `
    ::view-transition-group(root),
    ::view-transition-image-pair(root),
    ::view-transition-old(root),
    ::view-transition-new(root) {
      animation: none !important;
      mix-blend-mode: normal !important;
    }
    ::view-transition-new(root) {
      display: none !important;
    }
    ::view-transition-old(root) {
      mask-image: ${maskAt(origin, 0)};
      -webkit-mask-image: ${maskAt(origin, 0)};
    }
  `;
  document.head.appendChild(style);

  const maskRule = Array.from(style.sheet?.cssRules ?? []).find(
    (rule): rule is CSSStyleRule =>
      rule instanceof CSSStyleRule && rule.selectorText === "::view-transition-old(root)"
  );

  if (!maskRule) {
    // Couldn't get a handle on the rule to drive per-frame — bail out to
    // the proven fallback rather than run a transition nobody can animate.
    style.remove();
    runSolidOverlayFallback(origin, applyTheme, generation);
    return;
  }

  const isCurrent = () => generation === currentGeneration;

  // A superseded run tears down quietly — no "end" event, no removing the
  // color-fade class — because a newer run is about to (or already did)
  // set that state up fresh for itself; firing them here would just be a
  // one-frame flicker sandwiched between two "start" events.
  cancelCurrent = () => {
    style.remove();
    try {
      transition.skipTransition?.();
    } catch {
      // Already finished/skipped — nothing to do.
    }
  };

  // Lets each component's own background/text/border color transition
  // (globals.css) fade toward the new theme instead of snapping the instant
  // classList flips, so a region can still be mid-fade when the mask
  // uncovers it rather than already fully baked to its end color.
  document.documentElement.classList.add("theme-transitioning");

  const transition = doc.startViewTransition!(() => {
    applyTheme();
  });

  const cleanup = () => {
    if (!isCurrent()) return;
    style.remove();
    document.documentElement.classList.remove("theme-transitioning");
    cancelCurrent = null;
  };

  transition.ready
    .then(() => {
      if (!isCurrent()) return;
      const startTime = performance.now();
      const tick = (now: number) => {
        if (!isCurrent()) return;
        const t = Math.min(1, (now - startTime) / DURATION_MS);
        const radius = maxRadius * easeInOutCubic(t);
        const mask = maskAt(origin, radius);
        maskRule.style.maskImage = mask;
        maskRule.style.webkitMaskImage = mask;
        if (t < 1) {
          requestAnimationFrame(tick);
        }
      };
      requestAnimationFrame(tick);
    })
    .catch(() => {
      cleanup();
    });

  transition.finished.then(cleanup).catch(cleanup);
}

function runSolidOverlayFallback(
  origin: Origin,
  applyTheme: () => void,
  generation: number
) {
  const maxRadius = maxRadiusFrom(origin);
  const root = document.documentElement;
  const isCurrent = () => generation === currentGeneration;

  // Peek at the *incoming* theme's background color without visibly
  // applying it: flip the class, read the computed value, flip back.
  // Nothing yields to the event loop between the two toggles, so no paint
  // happens in between — this is just a synchronous style recalc, invisible
  // to the viewer.
  root.classList.toggle("light");
  const incomingBackground =
    getComputedStyle(root).getPropertyValue("--background").trim() || "#08080A";
  root.classList.toggle("light");

  const overlay = document.createElement("div");
  overlay.style.cssText = `position:fixed;inset:0;z-index:2147483647;pointer-events:none;background:${incomingBackground};clip-path:circle(0px at ${origin.x}px ${origin.y}px);`;

  let applied = false;
  // Cancelling mid-flight means this click's theme swap — deferred to the
  // end of its own animation, unlike the native path where it happens
  // up front — may never have run yet. Apply it now so state stays correct
  // for whatever toggle comes next, then get out of the way silently.
  cancelCurrent = () => {
    if (!applied) applyTheme();
    overlay.remove();
  };

  root.classList.add("theme-transitioning");
  document.body.appendChild(overlay);

  const startTime = performance.now();

  const finish = () => {
    if (!isCurrent()) return;
    applied = true;
    applyTheme();
    overlay.remove();
    root.classList.remove("theme-transitioning");
    cancelCurrent = null;
  };

  const tick = (now: number) => {
    if (!isCurrent()) return;
    const t = Math.min(1, (now - startTime) / DURATION_MS);
    const radius = maxRadius * easeInOutCubic(t);
    overlay.style.clipPath = `circle(${radius}px at ${origin.x}px ${origin.y}px)`;
    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      finish();
    }
  };
  requestAnimationFrame(tick);
}
