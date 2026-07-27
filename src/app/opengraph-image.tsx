import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

// Route segment config
export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Premium social-share card (Open Graph + Twitter fallback). Editorial split:
 * value prop on the left, the unit — the site's signature machine — on the
 * right, over an architectural grid + violet glow. Drawn as flat vector so it
 * matches the low-poly 3D unit without needing a WebGL render, and regenerated
 * at build time so copy stays in sync with siteConfig.
 */
export default function OpengraphImage() {
  const violet = "#8B5CF6";

  // The unit, as flat geometry (the OG runtime can't render the WebGL model).
  const unitSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 440">
    <defs>
      <radialGradient id="eye" cx="50%" cy="45%" r="55%">
        <stop offset="0%" stop-color="#DDD6FE"/>
        <stop offset="55%" stop-color="#7C3AED"/>
        <stop offset="100%" stop-color="#5B21B6"/>
      </radialGradient>
    </defs>
    <line x1="188" y1="58" x2="206" y2="22" stroke="#4E4E58" stroke-width="7" stroke-linecap="round"/>
    <circle cx="208" cy="18" r="9" fill="#7C3AED"/>
    <circle cx="123" cy="108" r="30" fill="#7C3AED" opacity="0.22"/>
    <circle cx="177" cy="108" r="30" fill="#7C3AED" opacity="0.22"/>
    <circle cx="150" cy="105" r="72" fill="#6E6E78"/>
    <path d="M96 78 a72 72 0 0 1 108 0" fill="none" stroke="#565660" stroke-width="8"/>
    <circle cx="123" cy="108" r="16" fill="url(#eye)"/>
    <circle cx="177" cy="108" r="16" fill="url(#eye)"/>
    <rect x="134" y="172" width="32" height="26" rx="7" fill="#4E4E58"/>
    <circle cx="96" cy="212" r="22" fill="#565660"/>
    <circle cx="204" cy="212" r="22" fill="#565660"/>
    <rect x="80" y="212" width="26" height="118" rx="13" fill="#6E6E78"/>
    <rect x="194" y="212" width="26" height="118" rx="13" fill="#6E6E78"/>
    <path d="M110 196 h80 l16 140 h-112 z" fill="#6E6E78"/>
    <rect x="100" y="262" width="100" height="16" rx="4" fill="#4E4E58"/>
    <rect x="128" y="216" width="44" height="7" rx="3" fill="#4E4E58"/>
    <rect x="128" y="230" width="44" height="7" rx="3" fill="#4E4E58"/>
    <rect x="128" y="244" width="44" height="7" rx="3" fill="#4E4E58"/>
    <rect x="126" y="332" width="24" height="82" rx="10" fill="#6E6E78"/>
    <rect x="150" y="332" width="24" height="82" rx="10" fill="#6E6E78"/>
    <rect x="118" y="408" width="36" height="16" rx="6" fill="#565660"/>
    <rect x="146" y="408" width="36" height="16" rx="6" fill="#565660"/>
  </svg>`;
  const unitSrc = `data:image/svg+xml;base64,${Buffer.from(unitSvg).toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: "#08080A",
          color: "#FAFAFA",
          fontFamily: "sans-serif",
          overflow: "hidden",
        }}
      >
        {/* Architectural grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage:
              "linear-gradient(rgba(139,92,246,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.09) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        {/* Violet glow */}
        <div
          style={{
            position: "absolute",
            top: -260,
            right: -160,
            width: 760,
            height: 760,
            display: "flex",
            borderRadius: 9999,
            background:
              "radial-gradient(circle, rgba(139,92,246,0.42), rgba(8,8,10,0) 62%)",
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            padding: 72,
          }}
        >
          {/* Top bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <svg width="52" height="52" viewBox="0 0 32 32" fill="none">
                <path d="M16 1 28 8.5 V23.5 L16 31 4 23.5 V8.5 Z" fill={violet} />
                <path
                  d="M11.4 22 V11.6 h2.55 v1.5 q.7-.9 1.5-1.3 .8-.42 1.8-.42 1.65 0 2.55 1 .9 1 .9 2.85 V22 h-2.7 v-6.15 q0-.95-.4-1.4-.4-.46-1.15-.46-.85 0-1.35.56-.5.55-.5 1.6V22 Z"
                  fill="#0B0710"
                />
              </svg>
              <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.5 }}>
                nxstudio
              </div>
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 20,
                color: "#A1A1AA",
                border: "1px solid #26262B",
                borderRadius: 9999,
                padding: "8px 18px",
              }}
            >
              nxstudio.dev
            </div>
          </div>

          {/* Middle: split */}
          <div style={{ display: "flex", alignItems: "center", gap: 48 }}>
            {/* Left copy */}
            <div style={{ display: "flex", flexDirection: "column", width: 620 }}>
              <div
                style={{
                  display: "flex",
                  alignSelf: "flex-start",
                  fontSize: 18,
                  letterSpacing: 2,
                  color: "#C4B5FD",
                  textTransform: "uppercase",
                  border: "1px solid rgba(139,92,246,0.35)",
                  background: "rgba(139,92,246,0.10)",
                  borderRadius: 9999,
                  padding: "8px 16px",
                }}
              >
                Founder-mode build tool
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  marginTop: 26,
                  fontSize: 66,
                  fontWeight: 800,
                  lineHeight: 1.04,
                  letterSpacing: -2,
                }}
              >
                <span>Turn a brief into a</span>
                <span
                  style={{
                    backgroundImage: `linear-gradient(120deg, #C4B5FD, ${violet} 55%, #7C3AED)`,
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  shippable build prompt.
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  marginTop: 24,
                  fontSize: 24,
                  lineHeight: 1.4,
                  color: "#A1A1AA",
                }}
              >
                Brief → derived tech stack → one production-ready prompt for your
                AI coding agent.
              </div>
            </div>

            {/* Right: the unit, standing ready on a soft violet pad */}
            <div
              style={{
                display: "flex",
                flex: 1,
                position: "relative",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* ground glow under the unit */}
              <div
                style={{
                  position: "absolute",
                  bottom: 8,
                  display: "flex",
                  width: 260,
                  height: 90,
                  borderRadius: 9999,
                  background:
                    "radial-gradient(closest-side, rgba(139,92,246,0.28), rgba(8,8,10,0))",
                }}
              />
              <img src={unitSrc} width={252} height={370} style={{ width: 252, height: 370 }} alt="" />
            </div>
          </div>

          {/* Bottom: agents + tagline */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {siteConfig.agents.slice(0, 3).map((a) => (
                <div
                  key={a}
                  style={{
                    display: "flex",
                    fontSize: 17,
                    color: "#A1A1AA",
                    border: "1px solid #26262B",
                    borderRadius: 8,
                    padding: "7px 14px",
                  }}
                >
                  {a}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", fontSize: 20, color: violet, fontWeight: 600 }}>
              From brief to build prompt.
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
