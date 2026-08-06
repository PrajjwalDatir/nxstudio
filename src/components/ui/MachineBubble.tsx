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
          "relative rounded-2xl border border-border bg-popover/95 text-popover-foreground p-3.5 shadow-xl backdrop-blur-xl transition-colors duration-200",
          className
        )}
        {...props}
      >
        {children}
        {tail === "right" && (
          <span
            aria-hidden
            className="absolute -right-[6px] top-4 h-3 w-3 rotate-45 border-r border-t border-border bg-popover"
          />
        )}
        {tail === "left" && (
          <span
            aria-hidden
            className="absolute -left-[6px] top-4 h-3 w-3 rotate-45 border-b border-l border-border bg-popover"
          />
        )}
        {tail === "bottom" && (
          <span
            aria-hidden
            className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 h-3 w-3 rotate-45 border-b border-r border-border bg-popover"
          />
        )}
        {tail === "top" && (
          <span
            aria-hidden
            className="absolute -top-[6px] left-1/2 -translate-x-1/2 h-3 w-3 rotate-45 border-l border-t border-border bg-popover"
          />
        )}
      </div>
    );
  }
);
MachineBubble.displayName = "MachineBubble";
