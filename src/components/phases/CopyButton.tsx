"use client";

import { useState, useCallback } from "react";
import { CopyIcon, CheckIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export function CopyButton({
  value,
  label,
  className,
  variant = "ghost",
}: {
  value: string;
  label?: string;
  className?: string;
  variant?: "ghost" | "solid";
}) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  }, [value]);

  return (
    <button
      onClick={copy}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg text-sm font-medium transition-colors",
        variant === "solid"
          ? "bg-primary/15 px-3 py-1.5 text-primary hover:bg-primary/25"
          : "px-2 py-1.5 text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {copied ? (
        <CheckIcon className="h-4 w-4 text-emerald-400" />
      ) : (
        <CopyIcon className="h-4 w-4" />
      )}
      {label && <span>{copied ? "Copied" : label}</span>}
    </button>
  );
}
