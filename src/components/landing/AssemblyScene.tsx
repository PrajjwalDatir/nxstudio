"use client";

/**
 * The "how it works" stage — the same machine as the hero, in three states.
 *
 *   0 · dormant  head hung, eyes almost dark. It has nothing to act on.
 *   1 · briefed  coming up, straightening, lights rising as the stack lands.
 *   2 · ready    upright and alert, waiting to be sent.
 *
 * One model, one subject, three beats. The unit's bearing carries the narrative
 * rather than an abstract shape standing in for it.
 */

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import {
  ACCENT,
  Machine,
  usePrefersReducedMotion,
  type MachinePose,
} from "./MachineModel";

const POSES: MachinePose[] = ["dormant", "briefed", "ready"];

export default function AssemblyScene({ step }: { step: number }) {
  const reduce = usePrefersReducedMotion();
  const pose = POSES[Math.min(Math.max(step, 0), POSES.length - 1)];

  return (
    <Canvas
      dpr={[1, 1.8]}
      camera={{ position: [0.5, 0.3, 5.6], fov: 40 }}
      gl={{ alpha: true, antialias: true }}
      style={{ background: "transparent" }}
    >
      <fog attach="fog" args={["#08080A", 7, 18]} />

      <ambientLight intensity={0.32} />
      <directionalLight position={[-4, 5, 4]} intensity={2.2} color="#D6D9E4" />
      <directionalLight position={[5, 1.5, 2]} intensity={0.5} color="#8E94A8" />
      <pointLight position={[2.5, 2, -4]} intensity={24} distance={20} color={ACCENT} />

      <Suspense fallback={null}>
        <group position={[0, -0.25, 0]}>
          {reduce ? (
            <Machine reduce pose={pose} />
          ) : (
            <Float speed={1} rotationIntensity={0.1} floatIntensity={0.3}>
              <Machine reduce={false} pose={pose} />
            </Float>
          )}
        </group>
        <Sparkles count={26} scale={[7, 5, 3.5]} size={1.8} speed={0.16} color="#C4B5FD" opacity={0.32} />
      </Suspense>
    </Canvas>
  );
}
