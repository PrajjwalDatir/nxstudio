"use client";

import { useEffect } from "react";
import { CryptoCheckout } from "./CryptoCheckout";
import { WandIcon, XIcon } from "@/components/icons";

const SUPPORT_EMAIL = "in.prajj@gmail.com";

/**
 * Upsell modal shown when a free user tries to copy a gated prompt. Wraps the
 * shared CryptoCheckout. Lightweight overlay — the design system has no dialog
 * primitive, and a full Radix dialog isn't warranted here.
 */
export function PremiumDialog({
  open,
  onClose,
  onActivated,
}: {
  open: boolean;
  onClose: () => void;
  onActivated?: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <WandIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Unlock your build prompts</h2>
              <p className="text-sm text-muted-foreground">Premium compiles and copies every prompt.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5">
          <CryptoCheckout onActivated={onActivated} />
        </div>

        <p className="mt-5 text-xs text-muted-foreground">
          Questions or a payment that didn&apos;t go through?{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="underline">
            {SUPPORT_EMAIL}
          </a>
        </p>
      </div>
    </div>
  );
}
