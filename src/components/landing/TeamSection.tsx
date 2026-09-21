import { SectionKicker } from "./SectionKicker";

/**
 * The two people behind nxstudio. Deliberately small — a founder/distribution
 * pair, not a fake org chart. Drop a real photo into `photo` (a public path or
 * imported asset) to replace the initials avatar.
 */
interface Member {
  name: string;
  role: string;
  location: string;
  blurb: string;
  /** Public path (e.g. "/team/avatar.jpg") or null to show the initials avatar. */
  photo: string | null;
}

const MEMBERS: Member[] = [
  {
    name: "nxstudio",
    role: "Founder & Engineering",
    location: "India",
    blurb:
      "Architects nxstudio's core compiler, .nx/ bundle engine, and WebGL canvas. Engineers the technical pipeline that translates founder specs into agent-ready context.",
    photo: null, // Uses the branded generated avatar. Drop /public/team/avatar.jpg to override.
  },
];

/** Deterministic hue in the brand-violet family, seeded by the name. */
function seedHue(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997;
  return 250 + (h % 46); // 250–296: indigo → violet → magenta, all on-brand
}

/**
 * Branded generated avatar — a persona silhouette on a per-person violet
 * gradient. Not a stock photo: it's generated from the name so each member is
 * distinct while the set reads as one system. Swap in a real photo via `photo`.
 */
function BrandAvatar({ name, className }: { name: string; className?: string }) {
  const hue = seedHue(name);
  const uid = `av-${name.replace(/\W/g, "")}`;
  return (
    <svg viewBox="0 0 56 56" className={className} role="img" aria-label={name}>
      <defs>
        <radialGradient id={`${uid}-bg`} cx="32%" cy="24%" r="95%">
          <stop offset="0%" stopColor={`hsl(${hue} 92% 72%)`} />
          <stop offset="55%" stopColor={`hsl(${hue} 76% 55%)`} />
          <stop offset="100%" stopColor={`hsl(${hue + 12} 62% 30%)`} />
        </radialGradient>
      </defs>
      <rect width="56" height="56" rx="28" fill={`url(#${uid}-bg)`} />
      <path d="M9 53 C9 41 19 36 28 36 C37 36 47 41 47 53 Z" fill="#ffffff" opacity="0.94" />
      <circle cx="28" cy="23" r="10" fill="#ffffff" opacity="0.97" />
      <circle cx="28" cy="28" r="26.2" fill="none" stroke="#ffffff" strokeOpacity="0.22" />
    </svg>
  );
}

export function TeamSection({ index = "06" }: { index?: string }) {
  return (
    <section id="team" className="scroll-mt-20 border-t border-border">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <SectionKicker index={index} align="center">
            Founder
          </SectionKicker>
          <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Built by nxstudio.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
            Engineering the compiler, canvas, and context pipeline for developers and AI agents.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-md">
          {MEMBERS.map((m) => (
            <div
              key={m.name}
              className="flex flex-col rounded-2xl border border-border bg-card/20 p-7"
            >
              <div className="flex items-center gap-4">
                {m.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.photo}
                    alt={m.name}
                    className="h-14 w-14 rounded-full object-cover"
                  />
                ) : (
                  <BrandAvatar name={m.name} className="h-14 w-14 shrink-0 rounded-full" />
                )}
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-semibold tracking-tight">{m.name}</h3>
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent-foreground">
                    {m.role}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{m.location}</p>
                </div>
              </div>
              <p className="mt-5 text-sm leading-relaxed text-foreground/80">{m.blurb}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
