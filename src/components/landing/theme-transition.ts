"use client";

/**
 * Theme-swap FX.
 *
 * dark → light: a plain radial reveal (View Transitions API) expanding from
 * the toggle button itself. No extra glow/gradient layered on top — that
 * read as a glowing "sun" blob in the first frames and fought with the
 * actual reveal edge instead of reading as one effect. Falls back to an
 * instant swap on browsers without startViewTransition.
 *
 * light → dark: an abrupt flash-snap (no easing) — the instant class swap is
 * hidden inside the flash peak so it reads as a cut, not a fade. Once the
 * flash clears, an `nx:theme-dark-snap` event fires so the hero lamp can
 * spark and settle its glow, giving the cut a sense of "this just happened".
 */

import gsap from "gsap";

type Origin = { x: number; y: number };

function ensureOverlay(id: string, zIndex: number): HTMLDivElement {
  let el = document.getElementById(id) as HTMLDivElement | null;
  if (!el) {
    el = document.createElement("div");
    el.id = id;
    el.style.cssText = `position:fixed;inset:0;z-index:${zIndex};pointer-events:none;`;
    document.body.appendChild(el);
  }
  return el;
}

// A click while one of these is still animating would stack a second
// transition on top of the first. Ignore toggles until the current one has
// fully settled.
let transitionLocked = false;
const LOCK_MS = 700;

function withTransitionLock(run: () => void) {
  if (transitionLocked) return;
  transitionLocked = true;
  run();
  window.setTimeout(() => {
    transitionLocked = false;
  }, LOCK_MS);
}

export function runLightOnTransition(origin: Origin, applyTheme: () => void) {
  withTransitionLock(() => runLightOnTransitionInner(origin, applyTheme));
}

function runLightOnTransitionInner(origin: Origin, applyTheme: () => void) {
  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => { ready: Promise<void> };
  };

  if (typeof doc.startViewTransition !== "function") {
    applyTheme();
    return;
  }

  const maxRadius = Math.hypot(
    Math.max(origin.x, window.innerWidth - origin.x),
    Math.max(origin.y, window.innerHeight - origin.y)
  );

  const transition = doc.startViewTransition(applyTheme);
  transition.ready
    .then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${origin.x}px ${origin.y}px)`,
            `circle(${maxRadius}px at ${origin.x}px ${origin.y}px)`,
          ],
        },
        {
          duration: 550,
          easing: "cubic-bezier(0.22, 0.75, 0.2, 1)",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    })
    .catch(() => {});
}

export function runDarkSnapTransition(applyTheme: () => void) {
  withTransitionLock(() => runDarkSnapTransitionInner(applyTheme));
}

function runDarkSnapTransitionInner(applyTheme: () => void) {
  const flash = ensureOverlay("nx-theme-flash", 9999);
  flash.style.background = "#fff";
  flash.style.opacity = "0";

  gsap
    .timeline()
    .to(flash, { opacity: 0.95, duration: 0.06, ease: "power1.in" })
    .call(applyTheme)
    .to(flash, { opacity: 0, duration: 0.3, ease: "power2.out", delay: 0.02 })
    .call(
      () => {
        window.dispatchEvent(new CustomEvent("nx:theme-dark-snap"));
      },
      undefined,
      "-=0.18"
    );
}
