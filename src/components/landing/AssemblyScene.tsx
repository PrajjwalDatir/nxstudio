"use client";

/**
 * The "how it works" stage — the same machine, *assembling itself and coming
 * into colour* as you scroll.
 *
 *   0 · cold start   parts scattered, lights cold and grey. It knows nothing.
 *   1 · powering up   parts draw together, pose straightens, colour creeps in.
 *   2 · online        fully assembled, bathed in violet/teal/magenta — alive.
 *
 * Two dials drive it: `build` (0→1) eases the model's parts from exploded to
 * seated, and a colour rig ramps saturated lights up over the grey shell so the
 * unit visibly "turns colourful" at the end. One model, three beats.
 */

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import {
  ACCENT,
  Machine,
  usePrefersReducedMotion,
  type MachinePose,
} from "./MachineModel";

const POSES: MachinePose[] = ["dormant", "briefed", "ready"];

/**
 * Colour rig: a cold grey key that fades back while violet, teal and magenta
 * lamps ramp up with `t` (0→1). Intensities are lerped per-frame so the reveal
 * crossfades smoothly between scroll steps instead of snapping.
 */
function ColorRig({ t }: { t: number }) {
  const key = useRef<THREE.DirectionalLight>(null);
  const vio = useRef<THREE.PointLight>(null);
  const teal = useRef<THREE.PointLight>(null);
  const mag = useRef<THREE.PointLight>(null);

  useFrame((_, delta) => {
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
  const t = clamped / (POSES.length - 1); // 0, 0.5, 1
  // Reduced motion still shows the destination: assembled and lit.
  const build = reduce ? 1 : t;
  const colorT = reduce ? 1 : t;

  return (
    <Canvas
      dpr={[1, 1.8]}
      frameloop={paused ? "never" : "always"}
      camera={{ position: [0.5, 0.3, 5.6], fov: 40 }}
      gl={{ alpha: true, antialias: true }}
      style={{ background: "transparent" }}
    >
      <fog attach="fog" args={["#0B0B10", 7, 18]} />

      <ambientLight intensity={0.3} />
      <ColorRig t={colorT} />

      <Suspense fallback={null}>
        <group position={[0, -0.25, 0]}>
          {reduce ? (
            <Machine reduce pose={pose} build={build} />
          ) : (
            <Float speed={1} rotationIntensity={0.1} floatIntensity={0.3}>
              <Machine reduce={false} pose={pose} build={build} />
            </Float>
          )}
        </group>
        {/* Particulate warms with the reveal — cool violet dust, denser once online */}
        <Sparkles
          count={26}
          scale={[7, 5, 3.5]}
          size={1.8}
          speed={0.16}
          color="#C4B5FD"
          opacity={0.2 + 0.3 * colorT}
        />
      </Suspense>
    </Canvas>
  );
}
