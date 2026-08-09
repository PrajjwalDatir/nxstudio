"use client";

import { useState, useCallback } from "react";
import { CopyIcon, CheckIcon, LockIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export function CopyButton({
  value,
  label,
  className,
  variant = "ghost",
  locked = false,
  onLockedClick,
}: {
  value: string;
  label?: string;
  className?: string;
  variant?: "ghost" | "solid";
  /** When true, clicking never copies — it calls `onLockedClick` (e.g. open the paywall). */
  locked?: boolean;
  onLockedClick?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    if (locked) {
      onLockedClick?.();
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  }, [value, locked, onLockedClick]);

  return (
    <button
      onClick={copy}
      aria-label={label || (locked ? "Locked" : copied ? "Copied" : "Copy")}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg text-sm font-medium transition-colors",
        variant === "solid"
          ? "bg-primary/15 px-3 py-1.5 text-accent-foreground hover:bg-primary/25"
          : "px-2 py-1.5 text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {locked ? (
        <LockIcon className="h-4 w-4" />
      ) : copied ? (
        <CheckIcon className="h-4 w-4 text-emerald-400" />
      ) : (
        <CopyIcon className="h-4 w-4" />
      )}
      {label && <span>{locked ? label : copied ? "Copied" : label}</span>}
    </button>
  );
}
