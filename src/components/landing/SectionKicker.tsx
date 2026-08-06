import type { ReactNode } from "react";

/**
 * The one element deliberately shared across sections: a mono "system index"
 * eyebrow. It's wayfinding, so it *should* read the same everywhere — the
 * variety lives in the surfaces below it, not here. An index number gives each
 * section a fixed coordinate (01…05) so the page reads like a spec sheet.
 */
export function SectionKicker({
  index,
  children,
  align = "left",
}: {
  index: string;
  children: ReactNode;
  align?: "left" | "center";
}) {
  const centered = align === "center";
  return (
    <div
      className={`flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] ${
        centered ? "justify-center" : ""
      }`}
    >
      {centered && <span className="h-px w-6 bg-border" />}
      <span className="tabular-nums text-accent-foreground font-medium">{index}</span>
      <span className="h-px w-6 bg-border" />
      <span className="text-muted-foreground/90">{children}</span>
    </div>
  );
}
