"use client";

/**
 * 3D + Motion layer wrapper — reads control values (inside the toolcraft root)
 * and renders the transparent r3f scene, loaded with `ssr: false` (WebGL).
 */
import dynamic from "next/dynamic";
import { useToolcraftEvaluatedValues } from "@/toolcraft/runtime/react";
import { THREE_TARGETS, MOTION_TARGETS, BRAND_TARGETS, STUDIO_MODE } from "@/lib/studio/schema";
import type { ShapeId, MoodId, MotionPreset } from "./three-scene";

const ThreeSceneLayer = dynamic(() => import("./three-scene").then((m) => m.ThreeSceneLayer), {
  ssr: false,
  loading: () => null,
});

function num(v: unknown, d: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : d;
}
function str(v: unknown, d: string): string {
  return typeof v === "string" && v ? v : d;
}
function parseColor(v: unknown, fallback: string): string {
  if (typeof v === "string" && v) return v;
  if (typeof v === "object" && v !== null && "hex" in v && typeof (v as { hex: unknown }).hex === "string") {
    return (v as { hex: string }).hex || fallback;
  }
  return fallback;
}

export function ThreeLayer() {
  const v = useToolcraftEvaluatedValues();
  const threeColor = parseColor(v[THREE_TARGETS.color], "");
  const brandPrimary = parseColor(v[BRAND_TARGETS.primary], "#8B5CF6");
  const meshColor = threeColor || brandPrimary;
  const isSketching = v[STUDIO_MODE] === "sketch";

  return (
    <ThreeSceneLayer
      enabled={!isSketching}
      shape={str(v[THREE_TARGETS.shape], "knot") as ShapeId}
      color={meshColor}
      metalness={num(v[THREE_TARGETS.metalness], 0.6)}
      roughness={num(v[THREE_TARGETS.roughness], 0.25)}
      spin={num(v[THREE_TARGETS.spin], 0.6)}
      mood={str(v[THREE_TARGETS.mood], "studio") as MoodId}
      preset={str(v[MOTION_TARGETS.preset], "none") as MotionPreset}
      motionSpeed={num(v[MOTION_TARGETS.speed], 1)}
    />
  );
}
