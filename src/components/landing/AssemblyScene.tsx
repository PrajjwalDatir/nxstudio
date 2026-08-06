"use client";

/**
 * The "how it works" stage — the same machine, sequenced through three beats as
 * you scroll, driven by a Theatre.js timeline:
 *
 *   0 · cold start   parts separated, lights cold and grey. It knows nothing.
 *   1 · powering up   parts draw together, colour/light floods in. Assembled.
 *   2 · online        eyes blaze and the unit breaks into a little dance.
 *
 * Theatre.js owns the choreography. A `PositionalSequence` keyframes four dials —
 * `build` (exploded→seated), `colour` (grey→saturated), `eye` (dim→blazing) and
 * `dance` (still→moving) — at positions 0, 1, 2. Scroll maps the active step to a
 * sequence position; we ease the playhead toward it each frame and read the
 * interpolated dials back out to drive the model, the colour rig and the sprites.
 *
 * The keyframes are shipped as a saved project state (below) rather than authored
 * live in Theatre's Studio — the same state the Studio would export, which is the
 * intended production path.
 */

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { getProject, types } from "@theatre/core";
import {
  ACCENT,
  Machine,
  usePrefersReducedMotion,
  type MachineDynamics,
  type MachinePose,
} from "./MachineModel";

const POSES: MachinePose[] = ["dormant", "briefed", "ready"];

/* ------------------------------------------------------------------ */
/* Theatre.js project + saved sequence state                          */
/* ------------------------------------------------------------------ */

/** One bezier keyframe. Handles sit on the segment mid so the curve eases
 *  smoothly and never overshoots (values like eye-glow must stay monotonic). */
const kf = (id: string, position: number, value: number, connectedRight = true) => ({
  id,
  position,
  value,
  handles: [0.5, 0.5, 0.5, 0.5] as [number, number, number, number],
  connectedRight,
  type: "bezier" as const,
});

const track = (name: string, values: [number, number, number]) => ({
  type: "BasicKeyframedTrack" as const,
  __debugName: name,
  keyframes: [
    kf(`${name}-0`, 0, values[0]),
    kf(`${name}-1`, 1, values[1]),
    kf(`${name}-2`, 2, values[2], false),
  ],
});

// The exported Theatre state. Positions: 0 cold · 1 powered · 2 online.
const theatreState = {
  sheetsById: {
    Assembly: {
      staticOverrides: { byObject: {} },
      sequence: {
        type: "PositionalSequence",
        length: 2,
        subUnitsPerUnit: 30,
        tracksByObject: {
          Unit: {
            trackIdByPropPath: {
              '["build"]': "t-build",
              '["colour"]': "t-colour",
              '["eye"]': "t-eye",
              '["dance"]': "t-dance",
            },
            trackData: {
              "t-build": track("build", [0, 1, 1]),
              "t-colour": track("colour", [0, 0.85, 1]),
              "t-eye": track("eye", [0.12, 0.95, 1.9]),
              "t-dance": track("dance", [0, 0, 1]),
            },
          },
        },
      },
    },
  },
  definitionVersion: "0.4.0",
  revisionHistory: ["nx-how-it-works-r1"],
};

const project = getProject("nx-how-it-works", { state: theatreState });
const sheet = project.sheet("Assembly");
const unit = sheet.object("Unit", {
  build: types.number(0, { range: [0, 1] }),
  colour: types.number(0, { range: [0, 1] }),
  eye: types.number(0.12, { range: [0, 3] }),
  dance: types.number(0, { range: [0, 1] }),
});

/* ------------------------------------------------------------------ */
/* Scene                                                              */
/* ------------------------------------------------------------------ */

/** Eases the sequence playhead toward the active step so beats crossfade. */
function Sequencer({ step }: { step: number }) {
  const pos = useRef(0);
  useFrame((_, delta) => {
    const targetPos = Math.min(Math.max(step, 0), 2);
    pos.current += (targetPos - pos.current) * (1 - Math.exp(-delta * 3.2));
    sheet.sequence.position = pos.current;
  });
  return null;
}

/**
 * Colour rig: a cold grey key that fades back while violet, teal and magenta
 * lamps ramp up with the `colour` dial. Intensities are lerped per-frame so the
 * reveal crossfades smoothly between scroll steps instead of snapping.
 */
function ColorRig({ colourRef }: { colourRef: React.MutableRefObject<number> }) {
  const key = useRef<THREE.DirectionalLight>(null);
  const vio = useRef<THREE.PointLight>(null);
  const teal = useRef<THREE.PointLight>(null);
  const mag = useRef<THREE.PointLight>(null);

  useFrame((_, delta) => {
    const t = colourRef.current;
    const a = 1 - Math.exp(-delta * 3);
    const ease = (l: THREE.Light | null, target: number) => {
      if (l) l.intensity += (target - l.intensity) * a;
    };
    ease(key.current, 2.2 * (1 - 0.4 * t)); // cold key steps back
    ease(vio.current, 8 + 34 * t); // violet leads the reveal
    ease(teal.current, 30 * t); // teal fill
    ease(mag.current, 24 * t); // magenta rim
  });

  return (
    <>
      <directionalLight ref={key} position={[-4, 5, 4]} intensity={2.2} color="#D6D9E4" />
      <directionalLight position={[5, 1.5, 2]} intensity={0.5} color="#8E94A8" />
      <pointLight ref={vio} position={[2.5, 2, 3]} intensity={8} distance={22} color={ACCENT} />
      <pointLight ref={teal} position={[-4, 1, 3]} intensity={0} distance={22} color="#22D3EE" />
      <pointLight ref={mag} position={[3, 3, -3]} intensity={0} distance={22} color="#F472B6" />
    </>
  );
}

/** A soft four-point spark, drawn once and shared by every dancing sprite. */
let _spark: THREE.CanvasTexture | null = null;
function sparkTexture(): THREE.CanvasTexture | null {
  if (_spark) return _spark;
  if (typeof document === "undefined") return null;
  const s = 64;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,255,255,0.9)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  // Round core.
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2);
  ctx.fill();
  // Four-point star flare.
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(s / 2, 4);
  ctx.lineTo(s / 2, s - 4);
  ctx.moveTo(4, s / 2);
  ctx.lineTo(s - 4, s / 2);
  ctx.stroke();
  _spark = new THREE.CanvasTexture(c);
  return _spark;
}

const SPRITES = [
  { base: [-1.15, 1.7, 0.6], colour: "#C4B5FD", size: 0.34, phase: 0.0 },
  { base: [1.2, 1.9, 0.2], colour: "#22D3EE", size: 0.28, phase: 1.1 },
  { base: [-1.3, 0.5, 1.0], colour: "#F472B6", size: 0.3, phase: 2.3 },
  { base: [1.35, 0.7, 0.9], colour: "#A78BFA", size: 0.26, phase: 3.4 },
  { base: [0.0, 2.35, -0.2], colour: "#FDE68A", size: 0.24, phase: 4.2 },
  { base: [1.0, 1.2, 1.3], colour: "#7DD3FC", size: 0.3, phase: 5.0 },
] as const;

/**
 * Sprites that dance in when the unit comes online — little sparks that bob and
 * pulse on the same beat as the machine, fading up with the `dance` dial so they
 * only appear for the closing celebration.
 */
function DancingSprites({
  dynamicsRef,
}: {
  dynamicsRef: React.MutableRefObject<MachineDynamics>;
}) {
  const tex = sparkTexture();
  const refs = useRef<(THREE.Sprite | null)[]>([]);
  const mats = useRef<(THREE.SpriteMaterial | null)[]>([]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const beat = t * 7.2;
    const dance = dynamicsRef.current.dance;
    const shown = THREE.MathUtils.clamp(dance, 0, 1);
    SPRITES.forEach((s, i) => {
      const sp = refs.current[i];
      const m = mats.current[i];
      if (!sp || !m) return;
      const ph = s.phase;
      sp.position.set(
        s.base[0] + Math.sin(beat * 0.33 + ph) * 0.16,
        s.base[1] + Math.sin(beat * 0.5 + ph) * 0.22 + Math.abs(Math.sin(beat)) * 0.14 * shown,
        s.base[2]
      );
      const pulse = 0.8 + 0.25 * Math.sin(beat + ph);
      const sc = s.size * pulse * (0.4 + 0.6 * shown);
      sp.scale.set(sc, sc, sc);
      m.opacity = shown * (0.55 + 0.35 * Math.max(0, Math.sin(beat + ph)));
      m.rotation = beat * 0.2 + ph;
    });
  });

  if (!tex) return null;
  return (
    <group>
      {SPRITES.map((s, i) => (
        <sprite
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          position={[s.base[0], s.base[1], s.base[2]]}
        >
          <spriteMaterial
            ref={(el) => {
              mats.current[i] = el;
            }}
            map={tex}
            color={s.colour}
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </sprite>
      ))}
    </group>
  );
}

export default function AssemblyScene({
  step,
  paused = false,
}: {
  step: number;
  paused?: boolean;
}) {
  const reduce = usePrefersReducedMotion();
  const clamped = Math.min(Math.max(step, 0), POSES.length - 1);
  const pose = POSES[clamped];

  // Live dials read out of the Theatre sequence and fed to the model per-frame.
  const dynamicsRef = useRef<MachineDynamics>({ build: 0, eye: 0.12, dance: 0 });
  const colourRef = useRef(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Reduced motion skips the choreography: show the destination, no dance.
    if (reduce) {
      dynamicsRef.current = { build: 1, eye: 1.6, dance: 0 };
      colourRef.current = 1;
      return;
    }
    let live = true;
    const unsub = unit.onValuesChange((v) => {
      dynamicsRef.current.build = v.build;
      dynamicsRef.current.eye = v.eye;
      dynamicsRef.current.dance = v.dance;
      colourRef.current = v.colour;
    });
    project.ready.then(() => {
      if (live) setReady(true);
    });
    return () => {
      live = false;
      unsub();
    };
  }, [reduce]);

  return (
    <Canvas
      dpr={[1, 1.8]}
      frameloop={paused ? "never" : "always"}
      camera={{ position: [0.4, 0.35, 6.1], fov: 40 }}
      gl={{ alpha: true, antialias: true }}
      style={{ background: "transparent" }}
    >
      <fog attach="fog" args={["#0B0B10", 8, 20]} />

      <ambientLight intensity={0.3} />
      <ColorRig colourRef={colourRef} />
      {!reduce && ready && <Sequencer step={clamped} />}

      <Suspense fallback={null}>
        <group position={[0, -0.35, 0]}>
          {reduce ? (
            <Machine reduce pose={pose} dynamicsRef={dynamicsRef} facing={0.44} />
          ) : (
            <Float speed={1} rotationIntensity={0.1} floatIntensity={0.25}>
              <Machine reduce={false} pose={pose} dynamicsRef={dynamicsRef} facing={0.44} />
            </Float>
          )}
          {!reduce && <DancingSprites dynamicsRef={dynamicsRef} />}
        </group>
        {/* Ambient dust — cool violet placed far back in background depth */}
        <Sparkles count={24} scale={[6, 5, 2]} position={[0, 0, -3.5]} raycast={() => null} size={1.6} speed={0.16} color="#C4B5FD" opacity={0.22} />
      </Suspense>
    </Canvas>
  );
}
