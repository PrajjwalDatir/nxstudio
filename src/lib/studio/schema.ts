/**
 * Unified Studio schema.
 *
 * ONE toolcraft tool drives ONE shared canvas. The canvas composites every
 * layer at once — a generative p5 background, a 3D object, and its motion — so
 * you always see the full picture. The floating mode toolbar (Design / 3D /
 * Motion) sets `studio.mode`, and each inspector section is gated by
 * `visibleWhen` on that mode, so switching modes only changes which controls
 * you edit — never the canvas. The renderer (StudioCanvas) reads every value
 * regardless of mode.
 */
import { defineToolcraft } from "@/toolcraft/runtime";

export const STUDIO_MODE = "studio.mode";
export type StudioMode = "design" | "3d" | "motion" | "sketch";

export const BRAND_TARGETS = {
  primary: "brand.primary",
  vibe: "brand.vibe",
  radius: "brand.radius",
  font: "brand.font",
} as const;

export const GEN_TARGETS = {
  sketch: "gen.sketch",
  color: "gen.color",
  background: "gen.background",
  count: "gen.count",
  particleSize: "gen.particleSize",
  connectionDist: "gen.connectionDist",
  speed: "gen.speed",
  seed: "gen.seed",
} as const;

export const THREE_TARGETS = {
  shape: "three.shape",
  color: "three.color",
  metalness: "three.metalness",
  roughness: "three.roughness",
  spin: "three.spin",
  mood: "three.mood",
} as const;

export const MOTION_TARGETS = {
  preset: "motion.preset",
  speed: "motion.speed",
} as const;

export const ATTACH_ACTION = "attach-context";
export const GEN_RANDOMIZE = "gen-randomize";

const whenMode = (mode: StudioMode) => ({ target: STUDIO_MODE, equals: mode });

/**
 * Persistence is a Pro feature: Pro users get localStorage persistence of their
 * control values (work survives reloads); free users get `storage: "none"`
 * (session only). UnifiedStudio picks the schema from the subscription.
 */
function makeStudioSchema(persist: boolean) {
  return defineToolcraft({
  canvas: { enabled: true, upload: false, draggable: false },
  panels: {
    controls: {
      title: "Studio",
      sections: [
        /* ── Design mode ─────────────────────────────────────────────── */
        {
          title: "Brand",
          visibleWhen: whenMode("design"),
          controls: {
            primary: { type: "color", target: BRAND_TARGETS.primary, label: "Primary color", defaultValue: "#8B5CF6" },
            vibe: {
              type: "segmented", target: BRAND_TARGETS.vibe, label: "Vibe", defaultValue: "minimal",
              options: [
                { label: "Minimal", value: "minimal" },
                { label: "Playful", value: "playful" },
                { label: "Bold", value: "bold" },
                { label: "Elegant", value: "elegant" },
              ],
            },
            radius: { type: "slider", target: BRAND_TARGETS.radius, label: "Corner radius", min: 0, max: 24, step: 1, unit: "px", defaultValue: 10 },
            font: {
              type: "select", target: BRAND_TARGETS.font, label: "Typography", defaultValue: "Inter",
              options: [
                { label: "Inter", value: "Inter" },
                { label: "Geist", value: "Geist" },
                { label: "System UI", value: "System UI" },
                { label: "Serif", value: "Serif" },
                { label: "Monospace", value: "Monospace" },
              ],
            },
          },
        },
        {
          title: "Generative",
          visibleWhen: whenMode("design"),
          controls: {
            sketch: {
              type: "select", target: GEN_TARGETS.sketch, label: "Sketch Engine", defaultValue: "flow",
              options: [
                { label: "Flow field", value: "flow" },
                { label: "Particles", value: "particles" },
                { label: "Perlin Noise", value: "noise" },
                { label: "Matrix Rain", value: "matrix" },
                { label: "Wave Grid", value: "waves" },
                { label: "Neon Rings", value: "neon" },
              ],
            },
            inkColor: { type: "color", target: GEN_TARGETS.color, label: "Particle / Ink Color" },
            background: { type: "color", target: GEN_TARGETS.background, label: "Canvas Background", defaultValue: "#08080A" },
            count: { type: "slider", target: GEN_TARGETS.count, label: "Density", min: 50, max: 1200, step: 10, defaultValue: 400 },
            size: { type: "slider", target: GEN_TARGETS.particleSize, label: "Particle Size", min: 1, max: 16, step: 0.5, unit: "px", defaultValue: 4.5 },
            dist: { type: "slider", target: GEN_TARGETS.connectionDist, label: "Constellation Reach", min: 40, max: 300, step: 5, unit: "px", defaultValue: 130 },
            speed: { type: "slider", target: GEN_TARGETS.speed, label: "Speed", min: 0, max: 3, step: 0.05, defaultValue: 1 },
          },
        },
        {
          title: "Deliver",
          visibleWhen: { target: STUDIO_MODE, oneOf: ["design", "sketch"] },
          actionGroup: "primary",
          controls: {
            randomize: {
              type: "actions", target: "gen.deliver", label: false,
              actions: [{ value: GEN_RANDOMIZE, label: "Randomize", icon: "shuffle", variant: "secondary" }],
            },
            attach: {
              type: "actions", target: "brand.deliver", label: false,
              actions: [{ value: ATTACH_ACTION, label: "Attach to build context", icon: "wand-sparkles", variant: "default" }],
            },
          },
        },
        /* ── 3D mode ─────────────────────────────────────────────────── */
        {
          title: "Object",
          visibleWhen: whenMode("3d"),
          controls: {
            shape: {
              type: "select", target: THREE_TARGETS.shape, label: "Shape Primitive", defaultValue: "knot",
              options: [
                { label: "Torus Knot", value: "knot" },
                { label: "Sphere", value: "sphere" },
                { label: "Torus", value: "torus" },
                { label: "Box", value: "box" },
                { label: "Icosahedron", value: "icosahedron" },
                { label: "Crystal", value: "crystal" },
                { label: "Wireframe Knot", value: "wireframe" },
              ],
            },
            color: { type: "color", target: THREE_TARGETS.color, label: "Material Color" },
            metalness: { type: "slider", target: THREE_TARGETS.metalness, label: "Metalness", min: 0, max: 1, step: 0.05, defaultValue: 0.6 },
            roughness: { type: "slider", target: THREE_TARGETS.roughness, label: "Roughness", min: 0, max: 1, step: 0.05, defaultValue: 0.25 },
          },
        },
        {
          title: "Lighting",
          visibleWhen: whenMode("3d"),
          controls: {
            mood: {
              type: "segmented", target: THREE_TARGETS.mood, label: "Lighting Rig", defaultValue: "studio",
              options: [
                { label: "Studio", value: "studio" },
                { label: "Sunset", value: "sunset" },
                { label: "Night", value: "night" },
              ],
            },
            spin: { type: "slider", target: THREE_TARGETS.spin, label: "Auto-spin", min: 0, max: 3, step: 0.05, defaultValue: 0.6 },
          },
        },
        /* ── Motion mode ─────────────────────────────────────────────── */
        {
          title: "Animation",
          visibleWhen: whenMode("motion"),
          controls: {
            preset: {
              type: "select", target: MOTION_TARGETS.preset, label: "Motion Preset", defaultValue: "none",
              options: [
                { label: "None (Spin)", value: "none" },
                { label: "Orbit", value: "orbit" },
                { label: "Float", value: "float" },
                { label: "Pulse", value: "pulse" },
                { label: "Tumble", value: "tumble" },
                { label: "Elastic Bounce", value: "elastic" },
                { label: "Spiral Helix", value: "spiral" },
              ],
            },
            speed: { type: "slider", target: MOTION_TARGETS.speed, label: "Speed", min: 0.1, max: 3, step: 0.05, defaultValue: 1 },
          },
        },
      ],
    },
  },
  toolbar: { history: true, radar: true, zoom: true },
  persistence: persist
    ? { storage: "localStorage", key: "toolcraft:nxstudio-studio:state:v1", version: 1, include: ["values", "panels"] }
    : { storage: "none" },
  });
}

export const studioSchema = makeStudioSchema(true);
export const studioSchemaFree = makeStudioSchema(false);
