"use client";

/**
 * Hero scene — the machine, alone.
 *
 * No crystal, no second shape: the unit is the whole subject. It stands in
 * haze with a handful of identical units silhouetted behind it, so it reads as
 * one of a mass-produced line rather than a mascot.
 *
 * The canvas is mounted full-bleed by the hero, so the frame edge is the
 * viewport, not a card. Nothing about the composition should imply a box.
 */

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import CameraControls from "camera-controls";
import * as THREE from "three";
import { Machine, usePrefersReducedMotion, type MachineHitState } from "./MachineModel";

// camera-controls only needs the handful of THREE members it actually uses.
CameraControls.install({ THREE });

/** Desktop frames the unit off to the right (copy takes the left); mobile centres it. */
function useIsDesktop() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const on = () => setDesktop(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return desktop;
}

/**
 * Guided camera. Not user-orbitable — this is a directed shot, not a model
 * viewer — but it drifts toward the pointer with real damping, which reads far
 * better than lerping the camera by hand each frame.
 */
function GuidedCamera() {
  const { camera, gl } = useThree();

  useEffect(() => {
    const c = new CameraControls(camera, gl.domElement);
    c.mouseButtons.left = CameraControls.ACTION.NONE;
    c.mouseButtons.right = CameraControls.ACTION.NONE;
    c.mouseButtons.wheel = CameraControls.ACTION.NONE;
    c.touches.one = CameraControls.ACTION.NONE;
    c.touches.two = CameraControls.ACTION.NONE;
    c.setLookAt(0, 0.5, 9.2, 0, 0.15, 0, false);

    return () => {
      c.dispose();
    };
  }, [camera, gl]);

  return null;
}




export default function MachineScene({
  onPoke,
  paused = false,
  line,
}: {
  onPoke?: () => void;
  paused?: boolean;
  line?: string;
}) {
  const reduce = usePrefersReducedMotion();
  const isDesktop = useIsDesktop();
  const hitRef = useRef<MachineHitState | null>(null);
  
  // Hero unit stands right-of-centre on desktop (copy owns the left), centred on
  // mobile. The camera looks only *partway* toward it, so the unit lands on the
  // right of the frame rather than dead-centre (offsetting the target as much as
  // the unit would just re-centre it).
  // Straight camera; the unit is shifted to the right on desktop by translating
  // it in world x (copy owns the left), and centred on mobile.
  const heroX = isDesktop ? 3.3 : 0;

  return (
    <Canvas
      dpr={[1, 1.8]}
      // Pause the render loop entirely when scrolled out of view.
      frameloop={paused ? "never" : "always"}
      // Low and close: the unit looks down slightly at the viewer, which reads
      // as presence rather than turntable.
      // Well back: the canvas is full-bleed, so a near camera crops the unit to
      // a head. This frames the whole body with air around it.
      camera={{ position: [0, 0.5, 9.2], fov: 40 }}
      gl={{ alpha: true, antialias: true }}
      style={{ background: "transparent" }}
    >
      {/* Soft atmospheric haze pushed back so all units stay crisp and visible */}
      <fog attach="fog" args={["#0B0B10", 14, 38]} />

      <ambientLight intensity={0.85} />
      {/* Front key light — crisp silver highlights on hero unit */}
      <directionalLight position={[-3.5, 5, 5]} intensity={3.6} color="#F1F5F9" />
      {/* Dedicated hero key light pointing directly at hero chest & logo */}
      <pointLight position={[heroX + 0.6, 1.8, 3.8]} intensity={18} distance={12} color="#C4B5FD" />
      {/* Dedicated back-line fill light — eliminates dark shadows on marching machines */}
      <directionalLight position={[0, 4, 3]} intensity={2.2} color="#CBD5E1" />
      {/* Cool fill from right */}
      <directionalLight position={[5, 1.5, 2]} intensity={1.0} color="#94A3B8" />
      {/* Intense violet rim from behind hero unit */}
      <pointLight position={[heroX + 0.5, 2, -3]} intensity={35} distance={15} color="#8B5CF6" />
      {/* Dedicated back-line rim wash */}
      <pointLight position={[-1, 5, -6]} intensity={45} distance={30} color="#C4B5FD" />

      <GuidedCamera />

      <Suspense fallback={null}>

        <group position={[heroX, -0.15, 0]}>
          {reduce ? (
            <Machine reduce onPoke={onPoke} pose="ready" line={line} hitRef={hitRef} />
          ) : (
            <Float speed={1.1} rotationIntensity={0.12} floatIntensity={0.35}>
              <Machine reduce={false} onPoke={onPoke} pose="ready" line={line} hitRef={hitRef} />
            </Float>
          )}
        </group>
        {/* Drifting particulate — sized to the frustum, never to the canvas edge */}
        <Sparkles
          count={34}
          scale={[9, 6, 4]}
          position={[heroX, 0, 0]}
          size={1.8}
          speed={0.16}
          color="#C4B5FD"
          opacity={0.35}
        />
      </Suspense>
    </Canvas>
  );
}
