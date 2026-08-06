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
          "relative rounded-2xl border border-primary/25 bg-[#0E0C18]/85 p-3.5 shadow-[0_8px_32px_-8px_rgba(139,92,246,0.3)] backdrop-blur-xl",
          className
        )}
        {...props}
      >
        {children}
        {tail === "right" && (
          <span
            aria-hidden
            className="absolute -right-[6px] top-4 h-3 w-3 rotate-45 border-r border-t border-primary/25 bg-[#0E0C18]"
          />
        )}
        {tail === "left" && (
          <span
            aria-hidden
            className="absolute -left-[6px] top-4 h-3 w-3 rotate-45 border-b border-l border-primary/25 bg-[#0E0C18]"
          />
        )}
        {tail === "bottom" && (
          <span
            aria-hidden
            className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 h-3 w-3 rotate-45 border-b border-r border-primary/25 bg-[#0E0C18]"
          />
        )}
        {tail === "top" && (
          <span
            aria-hidden
            className="absolute -top-[6px] left-1/2 -translate-x-1/2 h-3 w-3 rotate-45 border-l border-t border-primary/25 bg-[#0E0C18]"
          />
        )}
      </div>
    );
  }
);
MachineBubble.displayName = "MachineBubble";
