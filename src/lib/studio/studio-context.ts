/**
 * Maps the toolcraft editor's brand control values onto nx-studio's BrandDNA.
 *
 * The Studio editor stores each control's value in `state.values` keyed by the
 * control `target` (see BRAND_TARGETS in schema.ts). This pure function turns
 * that loosely-typed map into a typed BrandDNA patch, which the Studio page
 * applies via `updateBrand` — from there the existing prompt-compile pipeline
 * carries it into the build prompts.
 */
import type { BrandDNA } from "@/lib/types";
import { BRAND_TARGETS, MOTION_TARGETS } from "./schema";

function asString(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "object" && value !== null && "hex" in value && typeof (value as { hex: unknown }).hex === "string") {
    return (value as { hex: string }).hex.trim() || undefined;
  }
  return undefined;
}

/**
 * Build a BrandDNA patch from toolcraft control values. Only fields the user
 * actually set are returned, so attaching never clobbers existing brand data
 * with empty values.
 */
export function brandPatchFromStudioValues(
  values: Record<string, unknown>
): Partial<BrandDNA> {
  const patch: Partial<BrandDNA> = {};

  const primary = asString(values[BRAND_TARGETS.primary]);
  if (primary) patch.primaryColor = primary;

  const vibe = asString(values[BRAND_TARGETS.vibe]);
  if (vibe) patch.vibe = vibe;

  const radius = asString(values[BRAND_TARGETS.radius]);
  if (radius) patch.radius = radius.endsWith("px") ? radius : `${radius}px`;

  const font = asString(values[BRAND_TARGETS.font]);
  if (font) patch.font = font;

  const motionPreset = asString(values[MOTION_TARGETS.preset]);
  if (motionPreset) patch.motionPreset = motionPreset;

  const motionSpeed = asString(values[MOTION_TARGETS.speed]);
  if (motionSpeed) patch.motionSpeed = motionSpeed;

  return patch;
}
