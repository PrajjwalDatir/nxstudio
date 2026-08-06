"use client";



/**
 * The nxstudio mark: a hexagonal "monolith" carrying an N monogram. Same path
 * data as app/icon.svg, apple-icon.tsx and opengraph-image.tsx, so the mark
 * reads identically in the tab favicon, the OS icon, social cards and the UI —
 * one shape, not a placeholder Lucide hexagon standing in for a brand.
 */
const HEX_PATH = "M16 1 28 8.5 V23.5 L16 31 4 23.5 V8.5 Z";
const N_PATH =
  "M11.4 22 V11.6 h2.55 v1.5 q.7-.9 1.5-1.3 .8-.42 1.8-.42 1.65 0 2.55 1 .9 1 .9 2.85 V22 h-2.7 v-6.15 q0-.95-.4-1.4-.4-.46-1.15-.46-.85 0-1.35.56-.5.55-.5 1.6V22 Z";

/**
 * Fixed, not useId().
 *
 * useId() is only stable when the server and client render the same tree, and
 * this page mounts WebGL scenes via `dynamic(..., { ssr: false })` — those
 * render nothing on the server, which shifts React's id counter on the client
 * and made every logo gradient hydrate with a mismatched id.
 *
 * The gradient is byte-identical in every instance, so one shared id is
 * correct: `url(#…)` resolves to the first definition and they all paint the
 * same fill.
 */
const GRADIENT_ID = "nx-logo-gradient";

export function NxLogo({ className }: { className?: string }) {
  const gradId = GRADIENT_ID;
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="4" y1="1" x2="28" y2="31" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A78BFA" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      <path d={HEX_PATH} fill={`url(#${gradId})`} />
      <path d={N_PATH} fill="#0B0710" />
    </svg>
  );
}
