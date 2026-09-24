"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  LockIcon,
  UnlockIcon,
  CopyIcon,
  CheckIcon,
  ShuffleIcon,
  SparklesIcon,
} from "@/components/icons";
import {
  PALETTE_SLOTS,
  CURATED_PRESETS,
  PaletteHarmonyMode,
  generateHarmonicPalette,
  getReadableTextColor,
  getContrastRatio,
  normalizeHex,
} from "@/lib/palette-generator";
import { cn } from "@/lib/utils";

interface PaletteGeneratorProps {
  palette?: string[];
  onChangePalette: (newPalette: string[]) => void;
  className?: string;
}

const DEFAULT_PALETTE = ["#8B5CF6", "#EC4899", "#38BDF8", "#09090B", "#F8FAFC"];

export function PaletteGenerator({
  palette,
  onChangePalette,
  className,
}: PaletteGeneratorProps) {
  // Ensure valid 5-color array
  const currentPalette = React.useMemo(() => {
    if (Array.isArray(palette) && palette.length === 5) {
      return palette.map((c) => normalizeHex(c));
    }
    return DEFAULT_PALETTE;
  }, [palette]);

  const [locked, setLocked] = useState<boolean[]>([false, false, false, false, false]);
  const [harmonyMode, setHarmonyMode] = useState<PaletteHarmonyMode>("smart");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Toggle lock on a swatch
  const toggleLock = (index: number) => {
    setLocked((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  // Generate new palette respecting locked slots
  const handleGenerate = useCallback(() => {
    const lockedValues = currentPalette.map((col, idx) => (locked[idx] ? col : null));
    const nextPalette = generateHarmonicPalette(lockedValues, harmonyMode);
    onChangePalette(nextPalette);
  }, [currentPalette, locked, harmonyMode, onChangePalette]);

  // Keyboard shortcut: Spacebar to generate when not typing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
          return;
        }
        e.preventDefault();
        handleGenerate();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleGenerate]);

  // Update a single swatch color
  const updateColor = (index: number, newHex: string) => {
    const next = [...currentPalette];
    next[index] = newHex;
    onChangePalette(next);
  };

  // Copy hex to clipboard
  const copyHex = (hex: string, index: number) => {
    navigator.clipboard.writeText(hex);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  // Apply curated preset
  const applyPreset = (presetColors: [string, string, string, string, string]) => {
    const next = [0, 1, 2, 3, 4].map((i) => (locked[i] ? currentPalette[i] : presetColors[i]));
    onChangePalette(next);
  };

  return (
    <div className={cn("space-y-4 rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-5 shadow-xs", className)}>
      {/* Top Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-4 w-4 text-lilac shrink-0" />
            <h3 className="text-sm font-semibold text-foreground">Color Palette Generator</h3>
            <span className="hidden sm:inline-block rounded-md border border-border bg-secondary/50 px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
              Press Space to shuffle
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Lock your favorite colors, switch harmony algorithms, or pick curated palettes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Harmony Mode Dropdown */}
          <select
            value={harmonyMode}
            onChange={(e) => setHarmonyMode(e.target.value as PaletteHarmonyMode)}
            className="h-8 rounded-lg border border-border bg-secondary/30 px-2 text-xs font-medium text-foreground outline-none focus:border-lilac cursor-pointer"
            title="Color Harmony Algorithm"
          >
            <option value="smart">Smart SaaS Harmony</option>
            <option value="analogous">Analogous</option>
            <option value="complementary">Complementary</option>
            <option value="triadic">Triadic</option>
            <option value="monochromatic">Monochromatic</option>
            <option value="cyberpunk">Cyberpunk / Neon</option>
            <option value="editorial">Warm Editorial</option>
            <option value="nordic">Nordic Slate</option>
          </select>

          {/* Preset Selector */}
          <select
            defaultValue=""
            onChange={(e) => {
              const found = CURATED_PRESETS.find((p) => p.id === e.target.value);
              if (found) applyPreset(found.colors);
              e.target.value = "";
            }}
            className="h-8 rounded-lg border border-border bg-secondary/30 px-2 text-xs font-medium text-muted-foreground hover:text-foreground outline-none focus:border-lilac cursor-pointer"
            title="Load iconic brand presets"
          >
            <option value="" disabled>
              Load Preset…
            </option>
            {CURATED_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.category})
              </option>
            ))}
          </select>

          {/* Shuffle Button */}
          <button
            type="button"
            onClick={handleGenerate}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-lilac px-3 text-xs font-semibold text-white shadow-sm hover:bg-lilac/90 active:scale-95 transition-all"
            title="Generate new palette (Spacebar)"
          >
            <ShuffleIcon className="h-3.5 w-3.5" />
            <span>Generate</span>
          </button>
        </div>
      </div>

      {/* 5-Column Interactive Swatches Bar (Coolors.co layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 sm:gap-1.5 rounded-xl overflow-hidden p-1 bg-secondary/20 border border-border/60">
        {currentPalette.map((colorHex, idx) => {
          const meta = PALETTE_SLOTS[idx];
          const isLocked = locked[idx];
          const textColor = getReadableTextColor(colorHex);
          const isCopied = copiedIndex === idx;

          // Contrast with canvas background (slot 3) or text (slot 4)
          const bgHex = currentPalette[3] || "#09090B";
          const contrastWithBg = getContrastRatio(colorHex, bgHex);

          return (
            <div
              key={idx}
              style={{ backgroundColor: colorHex }}
              className="group relative flex flex-col justify-between rounded-lg p-3 sm:p-4 min-h-[140px] sm:min-h-[220px] transition-all shadow-xs"
            >
              {/* Top: Role Badge & Lock Button */}
              <div className="flex items-center justify-between gap-1">
                <span
                  style={{
                    color: textColor,
                    backgroundColor: textColor === "#FFFFFF" ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.45)",
                  }}
                  className="rounded px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase backdrop-blur-md"
                >
                  {meta.role}
                </span>

                <button
                  type="button"
                  onClick={() => toggleLock(idx)}
                  title={isLocked ? "Unlock color" : "Lock color (keep during shuffle)"}
                  style={{ color: textColor }}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg backdrop-blur-md transition-all",
                    isLocked
                      ? "bg-black/30 text-white ring-1 ring-white/40"
                      : "opacity-60 hover:opacity-100 hover:bg-black/20"
                  )}
                >
                  {isLocked ? <LockIcon className="h-3.5 w-3.5" /> : <UnlockIcon className="h-3.5 w-3.5" />}
                </button>
              </div>

              {/* Center: Large HEX & Click-to-Copy */}
              <div className="my-auto py-2 text-center">
                <button
                  type="button"
                  onClick={() => copyHex(colorHex, idx)}
                  style={{ color: textColor }}
                  title="Click to copy HEX code"
                  className="group/hex inline-flex flex-col items-center gap-1 transition-transform hover:scale-105 active:scale-95"
                >
                  <span className="font-mono text-sm sm:text-base font-bold tracking-wider uppercase drop-shadow-xs">
                    {colorHex}
                  </span>
                  <span
                    style={{
                      color: textColor,
                      backgroundColor: textColor === "#FFFFFF" ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.4)",
                    }}
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-mono opacity-0 group-hover/hex:opacity-100 transition-opacity backdrop-blur-md"
                  >
                    {isCopied ? <CheckIcon className="h-2.5 w-2.5 text-emerald-400" /> : <CopyIcon className="h-2.5 w-2.5" />}
                    {isCopied ? "Copied" : "Copy"}
                  </span>
                </button>

                {/* Contrast indicator for slots 0, 1, 2, 4 against background */}
                {idx !== 3 && (
                  <div className="mt-1">
                    <span
                      style={{ color: textColor, opacity: 0.75 }}
                      className="text-[9px] font-mono"
                      title={`Contrast ratio against background: ${contrastWithBg}:1`}
                    >
                      {contrastWithBg}:1 {contrastWithBg >= 4.5 ? "✓ AA" : ""}
                    </span>
                  </div>
                )}
              </div>

              {/* Bottom: Native Color Picker & Hex Input */}
              <div className="flex items-center gap-1.5 pt-1">
                <label
                  style={{
                    borderColor: textColor === "#FFFFFF" ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)",
                  }}
                  className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-md border cursor-pointer overflow-hidden shadow-xs hover:scale-110 transition-transform"
                  title="Pick exact color"
                >
                  <input
                    type="color"
                    value={normalizeHex(colorHex)}
                    onChange={(e) => updateColor(idx, e.target.value.toUpperCase())}
                    className="absolute -inset-2 h-10 w-10 cursor-pointer opacity-0"
                  />
                  <span
                    style={{ backgroundColor: colorHex }}
                    className="h-full w-full rounded-sm"
                  />
                </label>

                <input
                  type="text"
                  value={colorHex}
                  onChange={(e) => updateColor(idx, e.target.value)}
                  style={{
                    color: textColor,
                    backgroundColor: textColor === "#FFFFFF" ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.4)",
                    borderColor: textColor === "#FFFFFF" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)",
                  }}
                  className="h-6 w-full rounded-md border px-1.5 text-center font-mono text-[10px] uppercase font-semibold outline-none focus:ring-1 focus:ring-white/50 backdrop-blur-md"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
