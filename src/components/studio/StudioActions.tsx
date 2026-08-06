"use client";

import { type RefObject, useCallback, useState } from "react";
import { toast } from "sonner";
import { useSubscription } from "@/lib/use-subscription";
import { CopyIcon, DownloadIcon, LockIcon, CheckIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

async function canvasToImage(canvas: HTMLCanvasElement): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    try {
      const dataUrl = canvas.toDataURL("image/png");
      if (!dataUrl || dataUrl === "data:,") return resolve(null);
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    } catch {
      resolve(null);
    }
  });
}

async function composeToBlob(container: HTMLElement): Promise<Blob | null> {
  // Query all active canvas elements across stacked layers
  const root = container.closest('[data-slot="toolcraft-runtime-app"]') ?? document.body;
  const canvases = Array.from(root.querySelectorAll<HTMLCanvasElement>("canvas")).filter(
    (c) => c.width > 0 && c.height > 0
  );

  if (canvases.length === 0) return null;

  // Determine target composite dimensions
  const rect = container.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const w = Math.max(800, Math.round((rect.width || 1200) * dpr));
  const h = Math.max(600, Math.round((rect.height || 800) * dpr));

  const off = document.createElement("canvas");
  off.width = w;
  off.height = h;
  const ctx = off.getContext("2d");
  if (!ctx) return null;

  // Background fill
  ctx.fillStyle = "#08080A";
  ctx.fillRect(0, 0, w, h);

  // Convert and composite all active canvas layers (p5 + Three.js WebGL + Excalidraw)
  for (const c of canvases) {
    const img = await canvasToImage(c);
    if (img) {
      ctx.drawImage(img, 0, 0, w, h);
    } else {
      try {
        ctx.drawImage(c, 0, 0, c.width, c.height, 0, 0, w, h);
      } catch {
        /* skip invalid canvas states */
      }
    }
  }

  return new Promise((resolve) => off.toBlob(resolve, "image/png"));
}

export function StudioActions({ containerRef }: { containerRef: RefObject<HTMLElement | null> }) {
  const { isActive } = useSubscription();
  const [copied, setCopied] = useState(false);

  const copyPng = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      const el =
        containerRef.current ??
        document.querySelector<HTMLElement>('[data-slot="generative-canvas"]')?.parentElement;
      if (!el) {
        toast.error("Canvas container not ready");
        return;
      }

      try {
        const blob = await composeToBlob(el);
        if (!blob) throw new Error("Could not capture canvas frame");

        if (navigator.clipboard && typeof ClipboardItem !== "undefined") {
          try {
            await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            toast.success("Canvas copied to clipboard as PNG");
            return;
          } catch {
            /* Fallback to file download */
          }
        }

        // Direct file download fallback if clipboard write fails or is restricted
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `nxstudio-snapshot-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Snapshot saved as PNG");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to copy canvas PNG");
      }
    },
    [containerRef]
  );

  const exportPng = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      if (!isActive) {
        toast.message("Export is a Pro feature", {
          description: "Upgrade to export HD PNG snapshots. Copy as PNG is free.",
        });
        return;
      }
      const el =
        containerRef.current ??
        document.querySelector<HTMLElement>('[data-slot="generative-canvas"]')?.parentElement;
      if (!el) return;
      const blob = await composeToBlob(el);
      if (!blob) {
        toast.error("Nothing to export yet.");
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nxstudio-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Exported PNG");
    },
    [containerRef, isActive]
  );

  const stopLeak = (e: React.SyntheticEvent) => e.stopPropagation();

  const btn =
    "pointer-events-auto flex h-9 items-center gap-1.5 rounded-xl border border-transparent px-3 text-xs font-medium transition-colors cursor-pointer select-none";

  return (
    <div
      role="toolbar"
      aria-label="Canvas actions"
      className="flex items-center gap-1 rounded-2xl border border-border bg-card/85 p-1 shadow-[0_16px_36px_rgba(0,0,0,0.6)] backdrop-blur-2xl pointer-events-auto select-none"
      onPointerDown={stopLeak}
      onMouseDown={stopLeak}
      onTouchStart={stopLeak}
      onClick={stopLeak}
    >
      <button
        type="button"
        onClick={copyPng}
        className={cn(btn, "text-foreground hover:border-primary/35 hover:bg-primary/20 hover:text-foreground")}
        title="Copy the canvas to your clipboard as a PNG"
      >
        {copied ? <CheckIcon className="h-4 w-4 text-emerald-400" /> : <CopyIcon className="h-4 w-4" />}
        Copy PNG
      </button>
      <button
        type="button"
        onClick={exportPng}
        className={cn(
          btn,
          isActive
            ? "text-foreground hover:border-primary/35 hover:bg-primary/20 hover:text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
        title={isActive ? "Download the canvas as a PNG" : "Export is a Pro feature"}
      >
        {isActive ? <DownloadIcon className="h-4 w-4" /> : <LockIcon className="h-4 w-4" />}
        Export
      </button>
    </div>
  );
}
