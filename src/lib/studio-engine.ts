import { BrandDNA, WorkspaceData } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* 1. Spatial Hash Grid (O(N) Particle Acceleration)                  */
/* ------------------------------------------------------------------ */
export interface Particle2D {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export class SpatialHashGrid {
  private grid = new Map<number, Particle2D[]>();

  constructor(private cellSize = 130) {}

  clear() {
    // Reuse arrays instead of clearing the map entirely to avoid reallocation
    for (const cell of this.grid.values()) {
      cell.length = 0;
    }
  }

  private key(x: number, y: number): number {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    return (cx << 16) | (cy & 0xFFFF);
  }

  insert(p: Particle2D) {
    const k = this.key(p.x, p.y);
    const cell = this.grid.get(k);
    if (cell) {
      cell.push(p);
    } else {
      this.grid.set(k, [p]);
    }
  }

  build(particles: Particle2D[]) {
    this.clear();
    for (let i = 0; i < particles.length; i++) this.insert(particles[i]);
  }

  getNearby(p: Particle2D, out: Particle2D[]): void {
    const cx = Math.floor(p.x / this.cellSize);
    const cy = Math.floor(p.y / this.cellSize);

    out.length = 0;

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const k = ((cx + dx) << 16) | ((cy + dy) & 0xFFFF);
        const cell = this.grid.get(k);
        if (cell) {
          for (let i = 0; i < cell.length; i++) {
            out.push(cell[i]);
          }
        }
      }
    }
  }
}

/* ------------------------------------------------------------------ */
/* 2. Scene Graph & Lighting Rigs                                     */
/* ------------------------------------------------------------------ */
export type ShapePrimitive = "knot" | "sphere" | "torus" | "box" | "icosahedron" | "crystal" | "wireframe";
export type LightingRig = "studio" | "sunset" | "night";
export type MotionCurve = "none" | "orbit" | "float" | "pulse" | "tumble" | "elastic" | "spiral";

export const LIGHTING_RIGS: Record<LightingRig, { ambient: number; key: number; keyColor: string; fill: number; fillColor: string }> = {
  studio: { ambient: 0.6, key: 2.2, keyColor: "#ffffff", fill: 0.8, fillColor: "#c9d4ff" },
  sunset: { ambient: 0.35, key: 2.6, keyColor: "#ff9d5c", fill: 1.0, fillColor: "#7c5cff" },
  night: { ambient: 0.18, key: 1.6, keyColor: "#8ab4ff", fill: 0.7, fillColor: "#5c7cff" },
};

/* ------------------------------------------------------------------ */
/* 3. Studio Operator & Document Registry                              */
/* ------------------------------------------------------------------ */
export type StudioMode = "design" | "3d" | "motion" | "sketch";

export interface PresetItem {
  id: string;
  label: string;
  description: string;
  category: StudioMode;
  value: string;
  targetKey: string;
}

class StudioRegistry {
  private presets = new Map<StudioMode, PresetItem[]>();
  registerPresets(cat: StudioMode, items: PresetItem[]) { this.presets.set(cat, items); }
  getPresets(cat: StudioMode) { return this.presets.get(cat) ?? []; }
}

export const StudioOperatorRegistry = new StudioRegistry();

StudioOperatorRegistry.registerPresets("design", [
  { id: "gen-flow", label: "Flow Field", description: "Perlin vector advection", category: "design", value: "flow", targetKey: "gen.sketch" },
  { id: "gen-particles", label: "Particles", description: "Constellation spatial grid", category: "design", value: "particles", targetKey: "gen.sketch" },
  { id: "gen-noise", label: "Perlin Noise", description: "Color gradient field", category: "design", value: "noise", targetKey: "gen.sketch" },
  { id: "gen-matrix", label: "Matrix Rain", description: "Digital code waterfall", category: "design", value: "matrix", targetKey: "gen.sketch" },
  { id: "gen-waves", label: "Wave Grid", description: "Harmonic frequency curves", category: "design", value: "waves", targetKey: "gen.sketch" },
  { id: "gen-neon", label: "Neon Rings", description: "Concentric pulsing lattice", category: "design", value: "neon", targetKey: "gen.sketch" },
]);

StudioOperatorRegistry.registerPresets("3d", [
  { id: "shape-knot", label: "Torus Knot", description: "Complex topology knot", category: "3d", value: "knot", targetKey: "three.shape" },
  { id: "shape-sphere", label: "Sphere", description: "Smooth metallic orb", category: "3d", value: "sphere", targetKey: "three.shape" },
  { id: "shape-torus", label: "Torus", description: "Circular ring torus", category: "3d", value: "torus", targetKey: "three.shape" },
  { id: "shape-box", label: "Box", description: "Cube primitive", category: "3d", value: "box", targetKey: "three.shape" },
  { id: "shape-icosahedron", label: "Icosahedron", description: "Polyhedral crystal", category: "3d", value: "icosahedron", targetKey: "three.shape" },
  { id: "shape-crystal", label: "Crystal", description: "Octahedral gemstone", category: "3d", value: "crystal", targetKey: "three.shape" },
  { id: "shape-wireframe", label: "Wireframe Knot", description: "Cyber grid lattice", category: "3d", value: "wireframe", targetKey: "three.shape" },
]);

StudioOperatorRegistry.registerPresets("motion", [
  { id: "motion-none", label: "Spin", description: "Continuous auto-rotation", category: "motion", value: "none", targetKey: "motion.preset" },
  { id: "motion-orbit", label: "Orbit", description: "Horizontal orbital sway", category: "motion", value: "orbit", targetKey: "motion.preset" },
  { id: "motion-float", label: "Float", description: "Vertical floating bob", category: "motion", value: "float", targetKey: "motion.preset" },
  { id: "motion-pulse", label: "Pulse", description: "Rhythmic scale expansion", category: "motion", value: "pulse", targetKey: "motion.preset" },
  { id: "motion-tumble", label: "Tumble", description: "Dual-axis tumbling rotation", category: "motion", value: "tumble", targetKey: "motion.preset" },
  { id: "motion-elastic", label: "Elastic Bounce", description: "Squash and stretch bounce", category: "motion", value: "elastic", targetKey: "motion.preset" },
  { id: "motion-spiral", label: "Spiral Helix", description: "Helical spiral path", category: "motion", value: "spiral", targetKey: "motion.preset" },
]);

/* ------------------------------------------------------------------ */
/* 4. Document State & Blog Compiler                                  */
/* ------------------------------------------------------------------ */
export interface StudioDocumentState {
  version: number;
  mode: StudioMode;
  brand: BrandDNA;
  gen: { sketch: string; background: string; count: number; speed: number; seed: number };
  three: { shape: string; color: string; metalness: number; roughness: number; spin: number; mood: string };
  motion: { preset: string; speed: number };
  designNotes: string;
}

export function compileDocumentToBuildContext(doc: StudioDocumentState): string {
  return [
    doc.brand.primaryColor && `Primary Color: ${doc.brand.primaryColor}`,
    doc.brand.vibe && `Vibe: ${doc.brand.vibe}`,
    doc.brand.font && `Font: ${doc.brand.font}`,
    doc.three.shape && `3D Mesh: ${doc.three.shape}`,
    doc.motion.preset !== "none" && `Motion: ${doc.motion.preset}`,
    doc.designNotes && `Notes: "${doc.designNotes}"`,
  ].filter(Boolean).join(" | ");
}

export function compileWorkspaceToBlog(workspace: WorkspaceData, studioDoc: StudioDocumentState) {
  const title = workspace.productName ? `${workspace.productName}: Architecture & Design Spec` : "Product Design System & Spec";
  const dateStr = new Date().toISOString().split("T")[0];
  return {
    id: `blog-${Date.now()}`,
    title,
    subtitle: workspace.idea.problem || "Technical architecture and brand specification",
    publishedAt: dateStr,
    author: "Nx Studio Compiler",
    markdown: `# ${workspace.productName || "Product Spec"}\n\n> Vibe: ${workspace.brand.vibe || "Minimal"} | Color: ${workspace.brand.primaryColor}\n\n${compileDocumentToBuildContext(studioDoc)}`,
    tags: ["Architecture", "Design System", workspace.brand.vibe || "Minimal"],
  };
}

export function getStudioTargetValue<T = unknown>(values: Record<string, unknown>, target: string, fallback: T): T {
  const val = values[target];
  return (val !== undefined && val !== null ? val : fallback) as T;
}

export function createStudioSetter(
  dispatch: (action: { type: "controls.setValue"; target: string; value: unknown }) => void
) {
  return (target: string, value: unknown) => {
    dispatch({ type: "controls.setValue", target, value });
  };
}
