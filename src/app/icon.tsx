import { ImageResponse } from "next/og";

// Dynamic App & Favicon Generator for Next.js App Router (192x192 / 512x512 PWA Icon)
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#08080A",
          borderRadius: "96px",
        }}
      >
        <svg width="360" height="360" viewBox="0 0 32 32" fill="none">
          <defs>
            <linearGradient id="pwa-nx-grad" x1="4" y1="1" x2="28" y2="31" gradientUnits="userSpaceOnUse">
              <stop stopColor="#DDD6FE" />
              <stop offset="1" stopColor="#C4B5FD" />
            </linearGradient>
          </defs>
          <path d="M16 1 28 8.5 V23.5 L16 31 4 23.5 V8.5 Z" fill="url(#pwa-nx-grad)" />
          <path
            d="M11.4 22 V11.6 h2.55 v1.5 q.7-.9 1.5-1.3 .8-.42 1.8-.42 1.65 0 2.55 1 .9 1 .9 2.85 V22 h-2.7 v-6.15 q0-.95-.4-1.4-.4-.46-1.15-.46-.85 0-1.35.56-.5.55-.5 1.6V22 Z"
            fill="#0B0710"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
