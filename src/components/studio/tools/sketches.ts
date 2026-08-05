/**
 * p5.js generative sketches for the Studio generative tool.
 *
 * Each sketch is a factory that owns its own particle/field state and exposes
 * `init` (seed state to the current canvas) and `draw` (one frame). The renderer
 * keeps a single p5 instance and swaps the active sketch object on change, so
 * switching sketches never tears down the canvas.
 */
import type P5 from "p5";
import { SpatialHashGrid, Particle2D } from "@/lib/studio-engine";

export interface GenParams {
  primary: string;
  background: string;
  count: number;
  particleSize: number;
  connectionDist: number;
  speed: number;
  seed: number;
}

export type SketchId = "flow" | "particles" | "noise" | "matrix" | "waves" | "neon";

export interface Sketch {
  init(p: P5, params: GenParams): void;
  draw(p: P5, params: GenParams): void;
}

export type SketchFactory = () => Sketch;

/** Flow field — particles advected along an animated Perlin-noise vector field. */
const flow: SketchFactory = () => {
  let pts: { x: number; y: number }[] = [];
  const ensure = (p: P5, n: number) => {
    while (pts.length < n) pts.push({ x: p.random(p.width), y: p.random(p.height) });
    if (pts.length > n) pts.length = n;
  };
  return {
    init(p, params) {
      pts = [];
      ensure(p, params.count);
      p.background(params.background);
    },
    draw(p, params) {
      ensure(p, params.count);
      const fade = p.color(params.background);
      fade.setAlpha(18);
      p.noStroke();
      p.fill(fade);
      p.rect(0, 0, p.width, p.height);

      const ink = p.color(params.primary);
      ink.setAlpha(110);
      p.stroke(ink);
      p.strokeWeight(1.2);

      const t = p.frameCount * 0.002 * params.speed;
      const scale = 0.0016;
      const step = 1.6 * params.speed;
      for (const pt of pts) {
        const angle = p.noise(pt.x * scale, pt.y * scale, t) * p.TWO_PI * 2;
        const nx = pt.x + Math.cos(angle) * step;
        const ny = pt.y + Math.sin(angle) * step;
        p.line(pt.x, pt.y, nx, ny);
        pt.x = nx;
        pt.y = ny;
        if (pt.x < 0 || pt.x > p.width || pt.y < 0 || pt.y > p.height) {
          pt.x = p.random(p.width);
          pt.y = p.random(p.height);
        }
      }
    },
  };
};

/** Particles — spatial-grid accelerated constellation with O(N) proximity querying. */
const particles: SketchFactory = () => {
  let ps: Particle2D[] = [];
  let spatialGrid = new SpatialHashGrid(130);

  const ensure = (p: P5, n: number) => {
    while (ps.length < n) {
      ps.push({ x: p.random(p.width), y: p.random(p.height), vx: p.random(-1, 1), vy: p.random(-1, 1) });
    }
    if (ps.length > n) ps.length = n;
  };

  return {
    init(p, params) {
      ps = [];
      spatialGrid = new SpatialHashGrid(params.connectionDist || 130);
      ensure(p, params.count);
      p.background(params.background);
    },
    draw(p, params) {
      ensure(p, params.count);
      p.background(params.background);

      const sp = params.speed;
      const maxDist = params.connectionDist || 130;
      const maxDistanceSq = maxDist * maxDist;
      const nodeSize = params.particleSize || 4.5;

      for (let i = 0; i < ps.length; i++) {
        const a = ps[i];
        a.x += a.vx * sp;
        a.y += a.vy * sp;
        if (a.x < 0 || a.x > p.width) a.vx *= -1;
        if (a.y < 0 || a.y > p.height) a.vy *= -1;
      }

      // Rebuild Spatial Hash Grid: O(N)
      spatialGrid.build(ps);

      p.strokeWeight(1.2);
      const lineInk = p.color(params.primary);
      const queryResult: Particle2D[] = [];
      // Query adjacent grid cells: average O(N) instead of O(N^2)
      for (let i = 0; i < ps.length; i++) {
        const a = ps[i];
        const nearby = spatialGrid.getNearby(a, queryResult);
        for (let j = 0; j < nearby.length; j++) {
          const b = nearby[j];
          if (a === b) continue;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dSq = dx * dx + dy * dy;

          if (dSq < maxDistanceSq) {
            const d = Math.sqrt(dSq);
            lineInk.setAlpha(p.map(d, 0, maxDist, 160, 0));
            p.stroke(lineInk);
            p.line(a.x, a.y, b.x, b.y);
          }
        }
      }

      const nodeInk = p.color(params.primary);
      nodeInk.setAlpha(255);
      p.noStroke();
      p.fill(nodeInk);
      for (let i = 0; i < ps.length; i++) {
        p.circle(ps[i].x, ps[i].y, nodeSize);
      }
    },
  };
};

/** Matrix — digital code rain with pooled character streams. */
const matrix: SketchFactory = () => {
  let drops: { x: number; y: number; speed: number; chars: string[] }[] = [];
  const ensure = (p: P5, n: number) => {
    const colWidth = 20;
    const cols = Math.floor(p.width / colWidth);
    while (drops.length < Math.min(n / 4, cols)) {
      drops.push({
        x: drops.length * colWidth + 5,
        y: p.random(-p.height, 0),
        speed: p.random(2, 6),
        chars: Array.from({ length: 12 }, () => String.fromCharCode(0x30a0 + Math.floor(Math.random() * 96))),
      });
    }
  };
  return {
    init(p, params) {
      drops = [];
      ensure(p, params.count);
      p.background(params.background);
    },
    draw(p, params) {
      ensure(p, params.count);
      const fade = p.color(params.background);
      fade.setAlpha(40);
      p.noStroke();
      p.fill(fade);
      p.rect(0, 0, p.width, p.height);

      p.textSize(14);
      p.textFont("monospace");
      const ink = p.color(params.primary);
      const sp = params.speed;

      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        d.y += d.speed * sp * 1.5;
        if (d.y > p.height + 200) d.y = p.random(-200, 0);

        for (let j = 0; j < d.chars.length; j++) {
          const charY = d.y - j * 16;
          if (charY > 0 && charY < p.height) {
            ink.setAlpha(p.map(j, 0, d.chars.length, 255, 30));
            p.fill(ink);
            p.text(d.chars[j], d.x, charY);
          }
        }
      }
    },
  };
};

/** Waves — undulating sine wave frequency lines. */
const waves: SketchFactory = () => {
  return {
    init(p, params) {
      p.background(params.background);
    },
    draw(p, params) {
      p.background(params.background);
      const ink = p.color(params.primary);
      ink.setAlpha(160);
      p.stroke(ink);
      p.strokeWeight(1.5);
      p.noFill();

      const lines = 16;
      const t = p.frameCount * 0.02 * params.speed;

      for (let i = 0; i < lines; i++) {
        p.beginShape();
        const yBase = p.map(i, 0, lines - 1, p.height * 0.2, p.height * 0.8);
        for (let x = 0; x <= p.width; x += 15) {
          const y = yBase + Math.sin(x * 0.008 + t + i * 0.3) * 35 * Math.sin(t * 0.5 + i * 0.2);
          p.vertex(x, y);
        }
        p.endShape();
      }
    },
  };
};

/** Neon — concentric pulsing glowing geometric rings. */
const neon: SketchFactory = () => {
  return {
    init(p, params) {
      p.background(params.background);
    },
    draw(p, params) {
      p.background(params.background);
      p.push();
      p.translate(p.width / 2, p.height / 2);
      p.noFill();

      const rings = 12;
      const ink = p.color(params.primary);
      const t = p.frameCount * 0.015 * params.speed;

      for (let i = 0; i < rings; i++) {
        const radius = (i + 1) * 28 + Math.sin(t + i * 0.4) * 15;
        ink.setAlpha(p.map(i, 0, rings, 220, 40));
        p.stroke(ink);
        p.strokeWeight(2);
        p.ellipse(0, 0, radius * 2, radius * 1.8);
      }
      p.pop();
    },
  };
};

/** Noise — a flowing Perlin field rendered as a coloured grid between two tones. */
const noise: SketchFactory = () => {
  return {
    init(p, params) {
      p.background(params.background);
    },
    draw(p, params) {
      const step = 24;
      const t = p.frameCount * 0.01 * params.speed;
      const from = p.color(params.background);
      const to = p.color(params.primary);
      p.noStroke();
      for (let y = 0; y < p.height; y += step) {
        for (let x = 0; x < p.width; x += step) {
          const n = p.noise(x * 0.003, y * 0.003, t);
          p.fill(p.lerpColor(from, to, n));
          p.rect(x, y, step, step);
        }
      }
    },
  };
};

export const SKETCHES: Record<SketchId, SketchFactory> = { flow, particles, noise, matrix, waves, neon };
