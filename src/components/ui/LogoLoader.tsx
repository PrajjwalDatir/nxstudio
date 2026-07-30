"use client";

/**
 * LogoLoader — a branded skeleton loader that pulses the NxLogo mark.
 *
 * Used as the Next.js `loading.tsx` fallback for heavyweight routes (Studio)
 * so the user sees the brand mark instead of a blank screen or boring text
 * while code-split chunks (Three.js, Excalidraw, p5) stream in.
 */

const HEX_PATH = "M16 1 28 8.5 V23.5 L16 31 4 23.5 V8.5 Z";
const N_PATH =
  "M11.4 22 V11.6 h2.55 v1.5 q.7-.9 1.5-1.3 .8-.42 1.8-.42 1.65 0 2.55 1 .9 1 .9 2.85 V22 h-2.7 v-6.15 q0-.95-.4-1.4-.4-.46-1.15-.46-.85 0-1.35.56-.5.55-.5 1.6V22 Z";

export function LogoLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-5">
      {/* Pulsing logo */}
      <svg
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden
        className="h-12 w-12 animate-logo-breathe drop-shadow-[0_0_24px_rgba(167,139,250,0.45)]"
      >
        <defs>
          <linearGradient
            id="loader-grad"
            x1="4"
            y1="1"
            x2="28"
            y2="31"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#A78BFA" />
            <stop offset="1" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
        <path d={HEX_PATH} fill="url(#loader-grad)" />
        <path d={N_PATH} fill="#0B0710" />
      </svg>

      {/* Subtle label */}
      <span className="text-xs tracking-widest uppercase text-muted-foreground/60 animate-pulse">
        {label}
      </span>
    </div>
  );
}
