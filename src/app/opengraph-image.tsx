import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

// Route segment config
export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Premium social-share card (Open Graph + Twitter fallback). Editorial split:
 * value prop on the left, the signature "build-prompt" terminal on the right,
 * over an architectural grid + violet glow — the "Lilac Monolith" identity.
 * Regenerated at build time so copy stays in sync with siteConfig.
 */
export default function OpengraphImage() {
  const violet = "#8B5CF6";
  const promptLines = [
    { t: "# BUILD PROMPT · Acme Reader", c: "#C4B5FD" },
    { t: "Stack:  Next.js · Supabase · Tailwind", c: "#8B8B93" },
    { t: "", c: "#8B8B93" },
    { t: "Build a read-later app for founders.", c: "#E4E4E7" },
    { t: "1. Auth — GitHub OAuth (Supabase)", c: "#E4E4E7" },
    { t: "2. Data — articles, highlights, tags", c: "#E4E4E7" },
    { t: "3. Feed — edge-cached, infinite", c: "#E4E4E7" },
    { t: "4. Ship — Vercel, RLS on default", c: "#E4E4E7" },
  ];

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
              nx.prajj.in
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

            {/* Right: terminal card */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                borderRadius: 16,
                border: "1px solid #26262B",
                borderLeft: `3px solid ${violet}`,
                background: "rgba(18,18,20,0.85)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "14px 18px",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div style={{ display: "flex", width: 11, height: 11, borderRadius: 9999, background: "#ff5f57" }} />
                <div style={{ display: "flex", width: 11, height: 11, borderRadius: 9999, background: "#febc2e" }} />
                <div style={{ display: "flex", width: 11, height: 11, borderRadius: 9999, background: "#28c840" }} />
                <div style={{ display: "flex", marginLeft: 10, fontSize: 15, color: "#8B8B93" }}>
                  build-prompt.md
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", padding: 20, gap: 7 }}>
                {promptLines.map((l, i) => (
                  <div key={i} style={{ display: "flex", fontSize: 17, color: l.c, minHeight: 10 }}>
                    {l.t}
                  </div>
                ))}
              </div>
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
