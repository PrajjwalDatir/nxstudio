"use client";

/**
 * The 3D + Motion layer of the shared Studio canvas.
 *
 * A transparent react-three-fiber scene (alpha canvas, no background) so the
 * generative p5 layer shows through behind the object — that's how all modes
 * composite onto one canvas. The object comes from the 3D controls; the Motion
 * controls animate it with gsap (preset "none" falls back to the 3D auto-spin).
 * `preserveDrawingBuffer` lets Copy/Export read the pixels.
 */
import React, { useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import gsap from "gsap";
import type { Mesh } from "three";

import {
  LIGHTING_RIGS,
  ShapePrimitive as ShapeId,
  LightingRig as MoodId,
  MotionCurve as MotionPreset,
} from "@/lib/studio-engine";

export type { ShapeId, MoodId, MotionPreset };

const CANVAS_CAMERA = { position: [0, 0.6, 4.6] as const, fov: 45 };
const CANVAS_DPR: [number, number] = [1, 2];
const CANVAS_GL = { alpha: true, antialias: true, preserveDrawingBuffer: true };

function Geometry({ shape }: { shape: ShapeId }) {
  switch (shape) {
    case "sphere":
      return <sphereGeometry args={[1.15, 64, 64]} />;
    case "torus":
      return <torusGeometry args={[1, 0.4, 32, 160]} />;
    case "box":
      return <boxGeometry args={[1.6, 1.6, 1.6]} />;
    case "icosahedron":
      return <icosahedronGeometry args={[1.3, 1]} />;
    case "crystal":
      return <octahedronGeometry args={[1.4, 0]} />;
    case "wireframe":
      return <torusKnotGeometry args={[0.8, 0.28, 64, 16]} />;
    default:
      return <torusKnotGeometry args={[0.8, 0.28, 220, 32]} />;
  }
}

export interface SceneProps {
  enabled?: boolean;
  shape: ShapeId;
  color: string;
  metalness: number;
  roughness: number;
  spin: number;
  mood: MoodId;
  preset: MotionPreset;
  motionSpeed: number;
}

function Object3D({ shape, color, metalness, roughness, spin, preset, motionSpeed }: Omit<SceneProps, "mood" | "enabled">) {
  const ref = useRef<Mesh>(null);
  const materialRef = useRef<import("three").MeshStandardMaterial>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const mat = materialRef.current;
    if (mat && mat.color) {
      mat.color.set(color);
      mat.metalness = metalness;
      mat.roughness = roughness;
      mat.needsUpdate = true;
    }
  }, [color, metalness, roughness]);

  useEffect(() => {
    tlRef.current?.timeScale(motionSpeed);
  }, [motionSpeed]);

  useFrame((_, dt) => {
    if (preset === "none" && ref.current) ref.current.rotation.y += dt * spin;
  });

  return (
    <mesh ref={ref} castShadow>
      <Geometry shape={shape} />
      <meshStandardMaterial
        ref={materialRef}
        color={color}
        metalness={metalness}
        roughness={roughness}
      />
    </mesh>
  );
}

export const ThreeSceneLayer = React.memo(function ThreeSceneLayer(props: SceneProps) {
  const m = LIGHTING_RIGS[props.mood] ?? LIGHTING_RIGS.studio;
  return (
    <Canvas
      shadows
      camera={CANVAS_CAMERA}
      dpr={CANVAS_DPR}
      gl={CANVAS_GL}
    >
      <ambientLight intensity={m.ambient} />
      <directionalLight position={[3, 5, 2]} intensity={m.key} color={m.keyColor} castShadow />
      <pointLight position={[-3, -1, -3]} intensity={m.fill} color={m.fillColor} />
      <Object3D
        shape={props.shape}
        color={props.color}
        metalness={props.metalness}
        roughness={props.roughness}
        spin={props.spin}
        preset={props.preset}
        motionSpeed={props.motionSpeed}
      />
      <ContactShadows position={[0, -1.5, 0]} opacity={0.35} blur={2.6} scale={9} far={4} />
      <OrbitControls enabled={props.enabled ?? true} enablePan={false} enableDamping minDistance={2.5} maxDistance={9} />
    </Canvas>
  );
});
