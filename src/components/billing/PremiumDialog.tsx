"use client";

import { useEffect, useState } from "react";
import { CryptoCheckout } from "./CryptoCheckout";
import { PricingGrid } from "./PricingGrid";
import { WandIcon, XIcon, ZapIcon } from "@/components/icons";

const SUPPORT_EMAIL = "in.prajj@gmail.com";

export function PremiumDialog({
  open,
  title = "Scale Your Studio",
  description = "Free includes 1 full project. Step across the velvet rope for multi-project scaling & autonomous workflows.",
  onClose,
  onActivated,
}: {
  open: boolean;
  title?: string;
  description?: string;
  onClose: () => void;
  onActivated?: () => void;
}) {
  const [selectedTier, setSelectedTier] = useState<"pro_10" | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-zinc-800 bg-[#09090A] p-6 sm:p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-zinc-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/30">
              <ZapIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
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

        {selectedTier ? (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Checkout — Pro (10 USDT)
              </h3>
              <button
                onClick={() => setSelectedTier(null)}
                className="text-xs font-mono text-primary hover:underline"
              >
                ← Back to Plans
              </button>
            </div>
            <CryptoCheckout onActivated={onActivated} />
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <PricingGrid onSelectTier={(tier) => setSelectedTier(tier)} />
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
              <CryptoCheckout onActivated={onActivated} />
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Need support or customized enterprise agent setup?{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="underline text-foreground">
            {SUPPORT_EMAIL}
          </a>
        </p>
      </div>
    </div>
  );
}
