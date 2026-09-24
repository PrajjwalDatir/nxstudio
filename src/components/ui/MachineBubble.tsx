import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface MachineBubbleProps extends React.HTMLAttributes<HTMLDivElement> {
  tail?: "left" | "right" | "top" | "bottom" | false;
}

export const MachineBubble = forwardRef<HTMLDivElement, MachineBubbleProps>(
  ({ children, tail = false, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-2xl border border-white/25 dark:border-white/15 bg-background/60 dark:bg-card/50 text-foreground px-3.5 py-2 shadow-[0_8px_30px_rgb(0_0_0/0.14),inset_0_1px_1px_0_rgba(255,255,255,0.3)] backdrop-blur-2xl backdrop-saturate-150 transition-all duration-200 select-none",
          className
        )}
        {...props}
      >
        {/* Specular rim highlight */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
        />

        {children}

        {tail === "bottom" && (
          <span
            aria-hidden
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-lilac/80 shadow-[0_0_8px_rgba(196,181,253,0.7)]"
          />
        )}
        {tail === "top" && (
          <span
            aria-hidden
            className="absolute -top-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-lilac/80 shadow-[0_0_8px_rgba(196,181,253,0.7)]"
          />
        )}
        {tail === "right" && (
          <span
            aria-hidden
            className="absolute -right-1 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-lilac/80 shadow-[0_0_8px_rgba(196,181,253,0.7)]"
          />
        )}
        {tail === "left" && (
          <span
            aria-hidden
            className="absolute -left-1 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-lilac/80 shadow-[0_0_8px_rgba(196,181,253,0.7)]"
          />
        )}
      </div>
    );
  }
);
MachineBubble.displayName = "MachineBubble";
