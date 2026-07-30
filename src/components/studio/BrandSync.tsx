"use client";

/**
 * BrandSync — keeps workspace `data.brand` and toolcraft control values in
 * lockstep, both directions, so a colour/vibe/font set anywhere (Brief or
 * Studio inspector) is reflected everywhere.
 *
 * Renders nothing. Must live inside <ToolcraftApp>.
 *
 * Loop safety: a `lastWriterRef` flag persists across renders. When Effect 1
 * writes to controls it sets the flag to "brand"; when Effect 2 fires it sees
 * "brand", consumes the flag, and skips — breaking the cycle. Vice-versa for
 * control→brand writes. Control deps are normalised to primitives so object
 * references (e.g. `{hex:"..."}`) don't cause spurious effect fires.
 */
import { useEffect, useRef } from "react";
import { useToolcraft } from "@/toolcraft/runtime/react";
import { useWorkspace } from "@/lib/workspace-store";
import { BRAND_TARGETS } from "@/lib/studio/schema";

/** Pull a lowercase hex out of a toolcraft colour value (string or {hex}). */
function colorHex(v: unknown): string | undefined {
  if (typeof v === "string") return v.trim().toLowerCase() || undefined;
  if (v && typeof v === "object" && "hex" in v && typeof (v as { hex: unknown }).hex === "string") {
    return (v as { hex: string }).hex.trim().toLowerCase() || undefined;
  }
  return undefined;
}

function asStr(v: unknown): string | undefined {
  if (typeof v === "string") return v.trim() || undefined;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return undefined;
}

function radiusPx(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return undefined;
  return raw.includes("rem") ? Math.round(n * 16) : Math.round(n);
}

export function BrandSync() {
  const { state, dispatch } = useToolcraft();
  const { data, updateBrand } = useWorkspace();
  const brand = data.brand;
  const values = state.values;

  // Refs for fresh cross-store reads (no stale closures).
  const valuesRef = useRef(values);
  valuesRef.current = values;
  const brandRef = useRef(brand);
  brandRef.current = brand;

  // Persist across renders: "brand" means Effect 1 just wrote → Effect 2 must
  // skip. "ctrl" means Effect 2 just wrote → Effect 1 must skip. null = idle.
  const lastWriterRef = useRef<"brand" | "ctrl" | null>(null);
  const mountedRef = useRef(false);

  // ── brand → controls ──────────────────────────────────────────────────────
  useEffect(() => {
    if (lastWriterRef.current === "ctrl") {
      lastWriterRef.current = null; // consume — don't skip again
      return;
    }

    const v = valuesRef.current;
    let wrote = false;
    const push = (target: string, next: unknown, cur: unknown) => {
      if (next === undefined) return;
      if (String(next).toLowerCase() === String(cur ?? "").toLowerCase()) return;
      dispatch({ type: "controls.setValue", target, value: next });
      wrote = true;
    };

    if (brand.primaryColor) {
      push(BRAND_TARGETS.primary, brand.primaryColor.toLowerCase(), colorHex(v[BRAND_TARGETS.primary]));
    }
    if (brand.vibe) push(BRAND_TARGETS.vibe, brand.vibe, asStr(v[BRAND_TARGETS.vibe]));
    const rpx = radiusPx(brand.radius);
    if (rpx !== undefined) push(BRAND_TARGETS.radius, rpx, v[BRAND_TARGETS.radius]);
    if (brand.font) push(BRAND_TARGETS.font, brand.font, asStr(v[BRAND_TARGETS.font]));

    if (wrote) lastWriterRef.current = "brand";
  }, [brand.primaryColor, brand.vibe, brand.radius, brand.font, dispatch]);

  // ── controls → brand ──────────────────────────────────────────────────────
  // Normalise to primitives so object refs (e.g. {hex:"…"}) don't trigger deps.
  const ctrlPrimary = colorHex(values[BRAND_TARGETS.primary]);
  const ctrlVibe = asStr(values[BRAND_TARGETS.vibe]);
  const ctrlFont = asStr(values[BRAND_TARGETS.font]);
  const rawRadius = values[BRAND_TARGETS.radius];
  const ctrlRadius = typeof rawRadius === "number" && Number.isFinite(rawRadius) ? rawRadius : undefined;

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (lastWriterRef.current === "brand") {
      lastWriterRef.current = null; // consume — don't skip again
      return;
    }

    const b = brandRef.current;
    let wrote = false;

    if (ctrlPrimary && ctrlPrimary !== b.primaryColor?.toLowerCase()) {
      updateBrand("primaryColor", ctrlPrimary);
      wrote = true;
    }
    if (ctrlVibe && ctrlVibe !== b.vibe) {
      updateBrand("vibe", ctrlVibe);
      wrote = true;
    }
    if (ctrlRadius !== undefined) {
      const rstr = `${Math.round(ctrlRadius)}px`;
      if (rstr !== b.radius) { updateBrand("radius", rstr); wrote = true; }
    }
    if (ctrlFont && ctrlFont !== b.font) {
      updateBrand("font", ctrlFont);
      wrote = true;
    }

    if (wrote) lastWriterRef.current = "ctrl";
  }, [ctrlPrimary, ctrlVibe, ctrlRadius, ctrlFont, updateBrand]);

  return null;
}
