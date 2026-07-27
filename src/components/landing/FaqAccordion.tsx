"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * FAQ list. A native <details> can't animate its own open/close, so this is a
 * small controlled accordion instead — height + fade on the panel, and the
 * marker rotates into an ✕. Still one button per question with the right
 * aria wiring, so it stays keyboard- and screen-reader-navigable.
 */
export function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const reduce = useReducedMotion();
  /**
   * Fixed prefix rather than useId(): this page mounts WebGL scenes with
   * `dynamic(..., { ssr: false })`, which changes the client tree shape and
   * shifts React's id counter, so useId() hydrated with mismatched values and
   * broke the aria-controls wiring. There is one FAQ list per page, so a
   * constant prefix is unique and stable on both sides.
   */
  const baseId = "faq";

  return (
    // A flush index, not a boxed card: full-bleed rules, a mono row number per
    // question. Reads as a spec index, distinct from the page's card sections.
    <div className="mt-10 border-t border-border">
      {items.map((item, i) => {
        const isOpen = open === i;
        const panelId = `${baseId}-panel-${i}`;
        const buttonId = `${baseId}-button-${i}`;

        return (
          <div key={item.q} className="border-b border-border">
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : i)}
                className="group flex w-full cursor-pointer items-center gap-4 py-5 text-left"
              >
                <span
                  aria-hidden
                  className={`font-mono text-xs tabular-nums transition-colors ${
                    isOpen ? "text-primary" : "text-muted-foreground/60"
                  }`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 text-sm font-medium text-foreground transition-colors group-hover:text-primary sm:text-base">
                  {item.q}
                </span>
                <span
                  aria-hidden
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-muted-foreground transition-all duration-300 ${
                    isOpen ? "rotate-45 border-primary/40 text-primary" : "border-border group-hover:border-primary/30"
                  }`}
                >
                  +
                </span>
              </button>
            </h3>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
                  exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <p className="max-w-2xl pb-5 pl-9 text-sm leading-relaxed text-muted-foreground">
                    {item.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
