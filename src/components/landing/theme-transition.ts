"use client";

/**
 * Radial theme-toggle reveal.
 *
 * Three things had to be worked out the hard way here, each confirmed by
 * instrumenting real clicks with an on-screen marker rather than guessing:
 *
 * 1. Driving the circle via clip-path on the View Transitions API's
 *    ::view-transition-new(root) pseudo-element doesn't work reliably in
 *    this engine — that pseudo is positioned/sized by the browser
 *    per-transition to match the captured root element's geometry, not
 *    necessarily the viewport, and no author override (including
 *    !important on position/size) changed where its own clip-path actually
 *    rendered. A plain, ordinary <div> — full author control, no special UA
 *    layout path — sidesteps that entirely.
 *
 * 2. A solid *outgoing*-colored div that starts fully covering the screen
 *    and *shrinks* its clip-path circle down to 0 does NOT read as "reveal
 *    grows from the click point." clip-path: circle(R) defines the VISIBLE
 *    region, so shrinking R uncovers the far edges/corners first — the last
 *    surviving sliver of the old color sits right at the click point. The
 *    correct construction is a solid *incoming*-colored div that starts as
 *    a 0-radius circle at the click point and grows to cover the viewport,
 *    with the real page swapping underneath only once fully covered.
 *
 * 3. Even with (1) and (2) fixed — a plain div, correct color, correct
 *    growing direction, and an on-screen marker confirming (x, y) landed
 *    exactly on the button — the animated circle still visibly grew from
 *    the center of the screen instead. The one thing in common between that
 *    failure and the pseudo-element failure in (1) is the browser's own
 *    interpolation of the circle() shape function between two keyframes;
 *    both times a mathematically correct, marker-verified coordinate went
 *    in and something other than that coordinate came out on screen. So
 *    this drives clip-path manually with requestAnimationFrame instead of
 *    handing two circle() keyframes to the Web Animations API and trusting
 *    its interpolation — every frame's exact string is computed here, in
 *    plain arithmetic, and written directly to style.clipPath.
 */

export type Origin = { x: number; y: number };

let transitionLocked = false;
const LOCK_MS = 800;
const DURATION_MS = 750;

function withTransitionLock(run: () => void) {
  if (transitionLocked) return;
  transitionLocked = true;
  run();
  window.setTimeout(() => {
    transitionLocked = false;
  }, LOCK_MS);
}

export function runRadialThemeTransition(origin: Origin, applyTheme: () => void) {
  withTransitionLock(() => runRadialThemeTransitionInner(origin, applyTheme));
}

// Slow, slow, medium, fast, FAST — a steep ease-in. Quintic rather than a
// cubic-bezier because we're evaluating this ourselves every frame; a plain
// power curve is trivial arithmetic and reads the same "barely moves, then
// rockets" way the requested easing curve did.
function easeInQuint(t: number): number {
  return t * t * t * t * t;
}

function runRadialThemeTransitionInner(origin: Origin, applyTheme: () => void) {
  // Ensure origin coordinates are valid numbers and fallback to top-right nav position if invalid
  const x = typeof origin.x === "number" && !isNaN(origin.x) ? origin.x : window.innerWidth - 80;
  const y = typeof origin.y === "number" && !isNaN(origin.y) ? origin.y : 30;

  // Calculate distance to the furthest corner of the viewport from the button
  const maxRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  if (typeof requestAnimationFrame !== "function") {
    applyTheme();
    return;
  }

  // Peek at the *incoming* theme's background color without visibly
  // applying it: flip the class, read the computed value, flip back.
  // Nothing yields to the event loop between the two toggles, so no paint
  // happens in between — this is just a synchronous style recalc, invisible
  // to the viewer.
  const root = document.documentElement;
  root.classList.toggle("light");
  const incomingBackground =
    getComputedStyle(root).getPropertyValue("--background").trim() || "#08080A";
  root.classList.toggle("light");

  window.dispatchEvent(new CustomEvent("nx:theme-transition-start"));

  const overlay = document.createElement("div");
  overlay.style.cssText = `position:fixed;inset:0;z-index:2147483647;pointer-events:none;background:${incomingBackground};clip-path:circle(0px at ${x}px ${y}px);`;
  document.body.appendChild(overlay);

  const startTime = performance.now();

  const finish = () => {
    // The overlay now fully covers the viewport in the incoming color —
    // swap the real page underneath (invisible, hidden by the overlay),
    // then drop the overlay. Same background color on both sides, so
    // there's nothing to flash between the two.
    applyTheme();
    overlay.remove();
    window.dispatchEvent(new CustomEvent("nx:theme-transition-end"));
  };

  const tick = (now: number) => {
    const t = Math.min(1, (now - startTime) / DURATION_MS);
    const radius = maxRadius * easeInQuint(t);
    overlay.style.clipPath = `circle(${radius}px at ${x}px ${y}px)`;
    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      finish();
    }
  };
  requestAnimationFrame(tick);
}
