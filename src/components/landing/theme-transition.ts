"use client";

/**
 * Radial View Transition FX.
 *
 * Expands a circular reveal starting from the exact (x, y) coordinates of the
 * theme toggle button or click event. Uses the Web View Transitions API with
 * fallbacks for unsupported browsers.
 */

export type Origin = { x: number; y: number };

let transitionLocked = false;
const LOCK_MS = 600;

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

function runRadialThemeTransitionInner(origin: Origin, applyTheme: () => void) {
  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => { ready: Promise<void> };
  };

  if (typeof doc.startViewTransition !== "function") {
    applyTheme();
    return;
  }

  // Calculate distance to the furthest corner of the viewport
  const maxRadius = Math.hypot(
    Math.max(origin.x, window.innerWidth - origin.x),
    Math.max(origin.y, window.innerHeight - origin.y)
  );

  const transition = doc.startViewTransition(() => {
    applyTheme();
  });

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

// Backwards compatibility aliases
export function runLightOnTransition(origin: Origin, applyTheme: () => void) {
  runRadialThemeTransition(origin, applyTheme);
}

export function runDarkSnapTransition(applyTheme: () => void) {
  const origin = { x: window.innerWidth / 2, y: 40 };
  runRadialThemeTransition(origin, applyTheme);
}
