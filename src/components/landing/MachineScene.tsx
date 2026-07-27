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

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import CameraControls from "camera-controls";
import * as THREE from "three";
import { ACCENT, Machine, usePrefersReducedMotion } from "./MachineModel";

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
function GuidedCamera({ reduce }: { reduce: boolean }) {
  const { camera, gl } = useThree();
  const controls = useRef<CameraControls | null>(null);
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const c = new CameraControls(camera, gl.domElement);
    // Purely cinematic: the visitor drives it by moving, not by dragging.
    c.mouseButtons.left = CameraControls.ACTION.NONE;
    c.mouseButtons.wheel = CameraControls.ACTION.NONE;
    c.touches.one = CameraControls.ACTION.NONE;
    c.touches.two = CameraControls.ACTION.NONE;
    c.smoothTime = 0.85;
    // Straight, centred shot. The unit is framed by translating *it* in world
    // space (see heroX), which keeps this a clean linear shift with no yaw.
    c.setLookAt(0, 0.5, 9.2, 0, 0.15, 0, false);
    controls.current = c;

    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onMove);
      c.dispose();
    };
  }, [camera, gl]);

  useFrame((_, delta) => {
    const c = controls.current;
    if (!c) return;
    if (!reduce) {
      // Small offsets only — enough to feel alive, never enough to lose framing.
      const x = pointer.current.x * 0.55;
      const y = 0.5 - pointer.current.y * 0.35;
      c.setLookAt(x, y, 9.2, 0, 0.15, 0, true);
    }
    c.update(delta);
  });

  return null;
}

// Shared silhouette-grade materials for the back line — cheap, no grunge map.
const BODY = "#43434C";
const DARK = "#33333A";

/** A single violet standby lamp that glows *through* the fog (`fog={false}`). */
function Eye({ position, awake }: { position: [number, number, number]; awake?: boolean }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.07, 10, 8]} />
      <meshStandardMaterial
        color="#6D28D9"
        emissive="#7C3AED"
        emissiveIntensity={awake ? 1.15 : 0.55}
        toneMapped={false}
        fog={false}
      />
    </mesh>
  );
}

type WalkProps = { awake?: boolean; phase?: number; stride?: number };

/** Type A — the egg: round head, barrel torso, twin legs. The hero's kin. */
function EggUnit({ awake, phase = 0, stride = 0 }: WalkProps) {
  const legs = useRef<(THREE.Group | null)[]>([]);
  useFrame((s) => {
    if (!stride) return;
    const a = Math.sin(s.clock.elapsedTime * stride + phase) * 0.5;
    if (legs.current[0]) legs.current[0].rotation.x = a;
    if (legs.current[1]) legs.current[1].rotation.x = -a;
  });
  return (
    <group>
      <mesh position={[0, 1.42, 0]}>
        <sphereGeometry args={[0.6, 16, 12]} />
        <meshStandardMaterial color={BODY} metalness={0.3} roughness={0.9} flatShading />
      </mesh>
      <Eye position={[-0.22, 1.46, 0.53]} awake={awake} />
      <Eye position={[0.22, 1.46, 0.53]} awake={awake} />
      <mesh position={[0.19, 2.02, -0.06]} rotation={[0.1, 0, -0.3]}>
        <cylinderGeometry args={[0.02, 0.026, 0.42, 6]} />
        <meshStandardMaterial color={DARK} roughness={0.95} flatShading />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.48, 0.6, 1.08, 12]} />
        <meshStandardMaterial color={BODY} metalness={0.3} roughness={0.9} flatShading />
      </mesh>
      {/* Legs pivot at the hip so they swing fore/aft — an actual gait. */}
      {[-0.24, 0.26].map((x, i) => (
        <group
          key={x}
          ref={(el) => {
            legs.current[i] = el;
          }}
          position={[x, -0.07, 0]}
        >
          <mesh position={[0, -0.45, 0]}>
            <cylinderGeometry args={[0.12, 0.13, 0.9, 8]} />
            <meshStandardMaterial color={BODY} metalness={0.3} roughness={0.9} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Type B — the porter: a tilted box head with an exhaust stack, on bent pipe legs. */
function BoxUnit({ awake, phase = 0, stride = 0 }: WalkProps) {
  const legs = useRef<(THREE.Group | null)[]>([]);
  useFrame((s) => {
    if (!stride) return;
    const a = Math.sin(s.clock.elapsedTime * stride + phase) * 0.45;
    if (legs.current[0]) legs.current[0].rotation.x = a;
    if (legs.current[1]) legs.current[1].rotation.x = -a;
  });
  return (
    <group>
      <group position={[0, 1.5, 0]} rotation={[0.12, 0.35, 0.06]}>
        <mesh>
          <boxGeometry args={[0.72, 0.82, 0.6]} />
          <meshStandardMaterial color={BODY} metalness={0.32} roughness={0.88} flatShading />
        </mesh>
        {/* exhaust stack — the porter's tell */}
        <mesh position={[0.16, 0.62, -0.12]}>
          <cylinderGeometry args={[0.07, 0.085, 0.38, 8]} />
          <meshStandardMaterial color={DARK} roughness={0.95} flatShading />
        </mesh>
        <Eye position={[-0.18, 0.06, 0.31]} awake={awake} />
        <Eye position={[0.18, 0.06, 0.31]} awake={awake} />
      </group>
      {/* thin spine */}
      <mesh position={[0, 0.86, 0]}>
        <cylinderGeometry args={[0.1, 0.11, 0.5, 8]} />
        <meshStandardMaterial color={DARK} roughness={0.95} flatShading />
      </mesh>
      {/* two bent pipe legs, pivoting at the hip */}
      {[-0.2, 0.22].map((x, i) => (
        <group
          key={x}
          ref={(el) => {
            legs.current[i] = el;
          }}
          position={[x, 0.5, 0]}
          rotation={[0, 0, i ? -0.16 : 0.13]}
        >
          <mesh position={[0, -0.34, 0]}>
            <cylinderGeometry args={[0.08, 0.09, 0.7, 8]} />
            <meshStandardMaterial color={BODY} metalness={0.3} roughness={0.9} flatShading />
          </mesh>
          <mesh position={[0, -0.74, 0.13]} rotation={[0.42, 0, 0]}>
            <cylinderGeometry args={[0.07, 0.08, 0.6, 8]} />
            <meshStandardMaterial color={BODY} metalness={0.3} roughness={0.9} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Type C — the strider: a small head on a node, four long splayed legs. */
function StiltUnit({ awake, phase = 0, stride = 0 }: WalkProps) {
  const legs = useRef<(THREE.Group | null)[]>([]);
  useFrame((s) => {
    if (!stride) return;
    const base = s.clock.elapsedTime * stride + phase;
    // Diagonal gait: opposite corners swing together.
    legs.current.forEach((g, i) => {
      if (g) g.rotation.x = Math.sin(base + (i % 2) * Math.PI) * 0.3;
    });
  });
  return (
    <group>
      <group position={[0, 1.2, 0]}>
        <mesh>
          <sphereGeometry args={[0.4, 14, 12]} />
          <meshStandardMaterial color={BODY} metalness={0.32} roughness={0.88} flatShading />
        </mesh>
        <Eye position={[-0.14, 0.02, 0.36]} awake={awake} />
        <Eye position={[0.14, 0.02, 0.36]} awake={awake} />
      </group>
      {/* body node */}
      <mesh position={[0, 0.88, 0]}>
        <sphereGeometry args={[0.22, 10, 8]} />
        <meshStandardMaterial color={DARK} roughness={0.95} flatShading />
      </mesh>
      {/* four long splayed legs, pivoting at the node */}
      {[-0.55, -0.2, 0.2, 0.55].map((x, i) => (
        <group
          key={x}
          ref={(el) => {
            legs.current[i] = el;
          }}
          position={[x * 0.6, 0.85, i % 2 ? 0.14 : -0.14]}
          rotation={[0, 0, x * 0.55]}
        >
          <mesh position={[0, -0.75, 0]}>
            <cylinderGeometry args={[0.04, 0.05, 1.5, 6]} />
            <meshStandardMaterial color={BODY} metalness={0.3} roughness={0.9} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
}

const UNIT_TYPES = { egg: EggUnit, box: BoxUnit, stilt: StiltUnit } as const;

/**
 * The back line — a mixed cohort of units *walking* across the frame, left to
 * right, on parallax depth planes. Ambient traffic: they read as a population
 * going about its business behind the hero, not a static row posing.
 *
 * Each keeps a fixed z (its depth lane) and marches +x, wrapping around once it
 * passes the far edge. A per-step bob and a slight roll sell the gait without
 * articulating legs; every unit faces its direction of travel, so they read in
 * walking profile rather than sliding sideways.
 */
const WALK_MIN = -17;
const WALK_MAX = 17;
const WALK_SPAN = WALK_MAX - WALK_MIN;

function WalkingUnits({ reduce }: { reduce: boolean }) {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const units = useMemo(
    () =>
      [
        { z: -3.6, s: 0.6, type: "egg", speed: 0.85, start: 0, bob: 0.08, awake: true },
        { z: -5.2, s: 0.54, type: "box", speed: 0.62, start: 7, bob: 0.07 },
        { z: -6.8, s: 0.48, type: "stilt", speed: 1.05, start: 13, bob: 0.05 },
        { z: -8.2, s: 0.42, type: "egg", speed: 0.5, start: 20, bob: 0.05 },
        { z: -9.6, s: 0.36, type: "box", speed: 0.72, start: 28, bob: 0.04 },
      ] as const,
    []
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    refs.current.forEach((g, i) => {
      if (!g) return;
      const u = units[i];
      const x = WALK_MIN + (((u.start + t * u.speed) % WALK_SPAN) + WALK_SPAN) % WALK_SPAN;
      g.position.x = x;
      if (!reduce) {
        // Bob at 2× the leg-swing so it peaks on each footfall; a whisper of roll.
        const stride = t * u.speed * 3.4 + u.start;
        g.position.y = -0.55 + Math.abs(Math.sin(stride)) * u.bob;
        g.rotation.z = Math.sin(stride) * 0.025;
      }
    });
  });

  return (
    <group>
      {units.map((u, i) => {
        const Unit = UNIT_TYPES[u.type];
        return (
          <group
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            position={[WALK_MIN, -0.55, u.z]}
            scale={u.s}
            // Faced ~3/4 toward travel (+x) so the walk reads but the eyes still catch.
            rotation={[0, Math.PI / 2 - 0.5, 0]}
          >
            <Unit
              awake={u.awake}
              phase={reduce ? 0 : u.start}
              stride={reduce ? 0 : u.speed * 3.4}
            />
          </group>
        );
      })}
    </group>
  );
}

export default function MachineScene({ onPoke }: { onPoke?: () => void }) {
  const reduce = usePrefersReducedMotion();
  const isDesktop = useIsDesktop();
  // Hero unit stands right-of-centre on desktop (copy owns the left), centred on
  // mobile. The camera looks only *partway* toward it, so the unit lands on the
  // right of the frame rather than dead-centre (offsetting the target as much as
  // the unit would just re-centre it).
  // Straight camera; the unit is shifted to the right on desktop by translating
  // it in world x (copy owns the left), and centred on mobile.
  const heroX = isDesktop ? 2.6 : 0;

  return (
    <Canvas
      dpr={[1, 1.8]}
      // Low and close: the unit looks down slightly at the viewer, which reads
      // as presence rather than turntable.
      // Well back: the canvas is full-bleed, so a near camera crops the unit to
      // a head. This frames the whole body with air around it.
      camera={{ position: [0, 0.5, 9.2], fov: 40 }}
      gl={{ alpha: true, antialias: true }}
      style={{ background: "transparent" }}
    >
      {/* Haze — depth, without erasing the back line. Pushed far enough that
          the hero unit (~9 units out) stays crisp and the distant file only
          half-dissolves, so they read as silhouettes rather than vanishing. */}
      <fog attach="fog" args={["#0B0B10", 9, 26]} />

      <ambientLight intensity={0.34} />
      {/* Cold key from high front-left. Carries most of the exposure so the
          shell stays grey metal — let violet dominate and the whole unit just
          reads as a purple toy. */}
      <directionalLight position={[-4, 5, 4]} intensity={2.4} color="#D6D9E4" />
      {/* Cool fill from the right, keeps the shadow side from going flat black */}
      <directionalLight position={[5, 1.5, 2]} intensity={0.5} color="#8E94A8" />
      {/* Violet rim from behind — separation only, not a wash */}
      <pointLight position={[2.5, 2, -4]} intensity={26} distance={20} color={ACCENT} />
      {/* Dedicated back-line rim: a wide, dim violet wash from behind/above the
          distant units so their top edges catch light and lift off the black. */}
      <pointLight position={[-2, 4, -8]} intensity={22} distance={26} color="#A78BFA" />

      <GuidedCamera reduce={reduce} />

      <Suspense fallback={null}>
        <WalkingUnits reduce={reduce} />
        <group position={[heroX, -0.15, 0]}>
          {reduce ? (
            <Machine reduce onPoke={onPoke} pose="ready" />
          ) : (
            <Float speed={1.1} rotationIntensity={0.12} floatIntensity={0.35}>
              <Machine reduce={false} onPoke={onPoke} pose="ready" />
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
