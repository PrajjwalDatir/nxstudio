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
import { Float, Sparkles, Text } from "@react-three/drei";
import CameraControls from "camera-controls";
import * as THREE from "three";
import { Machine, usePrefersReducedMotion } from "./MachineModel";

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

// Bright, reflective steel materials for back line units — no dark shadows.
const BODY = "#888C9E";
const DARK = "#5A5E70";

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

/** Type A — the egg: round head, barrel torso, twin legs, upright carrying arms. */
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

      {/* Upright carrying arms reaching up to grip board poles */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.52, 0.75, 0]} rotation={[0.3, 0, side * -0.45]}>
          <mesh position={[0, 0.38, 0]}>
            <cylinderGeometry args={[0.065, 0.075, 0.75, 8]} />
            <meshStandardMaterial color={BODY} metalness={0.35} roughness={0.85} flatShading />
          </mesh>
          <mesh position={[0, 0.75, 0]}>
            <sphereGeometry args={[0.08, 10, 8]} />
            <meshStandardMaterial color="#8B5CF6" metalness={0.6} roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* Legs pivot at the hip so they swing fore/aft */}
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

/** Type B — the porter: a tilted box head, exhaust stack, upright carrying arms. */
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
        <mesh position={[0.16, 0.62, -0.12]}>
          <cylinderGeometry args={[0.07, 0.085, 0.38, 8]} />
          <meshStandardMaterial color={DARK} roughness={0.95} flatShading />
        </mesh>
        <Eye position={[-0.18, 0.06, 0.31]} awake={awake} />
        <Eye position={[0.18, 0.06, 0.31]} awake={awake} />
      </group>
      <mesh position={[0, 0.86, 0]}>
        <cylinderGeometry args={[0.1, 0.11, 0.5, 8]} />
        <meshStandardMaterial color={DARK} roughness={0.95} flatShading />
      </mesh>

      {/* Upright robotic arms reaching up to grip board poles */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.55, 0.85, 0]} rotation={[0.3, 0, side * -0.5]}>
          <mesh position={[0, 0.42, 0]}>
            <boxGeometry args={[0.11, 0.8, 0.11]} />
            <meshStandardMaterial color={BODY} metalness={0.35} roughness={0.85} flatShading />
          </mesh>
          <mesh position={[0, 0.82, 0]}>
            <sphereGeometry args={[0.08, 10, 8]} />
            <meshStandardMaterial color="#8B5CF6" metalness={0.6} roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* Two bent pipe legs */}
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

/** Type C — the strider: small head on node, splayed legs, carrying arms. */
function StiltUnit({ awake, phase = 0, stride = 0 }: WalkProps) {
  const legs = useRef<(THREE.Group | null)[]>([]);
  useFrame((s) => {
    if (!stride) return;
    const base = s.clock.elapsedTime * stride + phase;
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
      <mesh position={[0, 0.88, 0]}>
        <sphereGeometry args={[0.22, 10, 8]} />
        <meshStandardMaterial color={DARK} roughness={0.95} flatShading />
      </mesh>

      {/* Articulated carrying arms holding board poles */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.35, 0.95, 0]} rotation={[0.25, 0, side * -0.45]}>
          <mesh position={[0, 0.42, 0]}>
            <cylinderGeometry args={[0.045, 0.055, 0.82, 6]} />
            <meshStandardMaterial color={BODY} metalness={0.35} roughness={0.85} flatShading />
          </mesh>
          <mesh position={[0, 0.83, 0]}>
            <sphereGeometry args={[0.075, 10, 8]} />
            <meshStandardMaterial color="#8B5CF6" metalness={0.6} roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* Four long splayed legs */}
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
// Faced ~3/4 toward travel (+x) so the walk reads but the eyes still catch.
const BASE_YAW = Math.PI / 2 - 0.5;

// Half-width (world units) of the zone around centre where a carried sign turns
// to face the camera and grows to readable size.
const SIGN_REVEAL_WIDTH = 5;

/**
 * A tip placard a walking unit carries. Edge-on and tiny out at the sides, it
 * turns to face the camera and scales up as the unit crosses centre — so the
 * back line reads as a parade holding up advice, one legible sign at a time.
 * Driven entirely off the unit's world x, so it stays in step with the walk.
 */
export type BoardShape = "hexagon" | "arch" | "speech" | "octagon" | "trapezoid";

/**
 * Custom 3D Quirky Board mesh frames for carried placards.
 * Gives each background machine a distinct personality, physical weight, and shape.
 */
function QuirkyBoardFrame({ shape }: { shape: BoardShape }) {
  if (shape === "hexagon") {
    // Hexagonal diamond plate with corner rivets
    return (
      <group>
        <mesh>
          <cylinderGeometry args={[1.8, 1.8, 0.08, 6]} />
          <meshStandardMaterial
            color="#141120"
            metalness={0.6}
            roughness={0.7}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh position={[0, 0, 0.045]}>
          <cylinderGeometry args={[1.72, 1.72, 0.02, 6]} />
          <meshStandardMaterial
            color="#0E0C17"
            emissive="#5B21B6"
            emissiveIntensity={0.25}
          />
        </mesh>
        {/* Neon purple border rim — flat behind text */}
        <mesh position={[0, 0, 0.035]} rotation={[0, 0, Math.PI / 6]}>
          <ringGeometry args={[1.72, 1.78, 6]} />
          <meshStandardMaterial color="#8B5CF6" emissive="#7C3AED" emissiveIntensity={1.1} />
        </mesh>
      </group>
    );
  }

  if (shape === "arch") {
    // Arched top billboard with dual spotlight fixtures on top
    return (
      <group>
        {/* Main body */}
        <mesh position={[0, -0.1, 0]}>
          <boxGeometry args={[3.4, 1.3, 0.08]} />
          <meshStandardMaterial color="#161426" metalness={0.5} roughness={0.8} />
        </mesh>
        {/* Arch dome top */}
        <mesh position={[0, 0.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[1.7, 1.7, 0.08, 20, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color="#161426" metalness={0.5} roughness={0.8} />
        </mesh>
        {/* Bezel frame — kept recessed behind text */}
        <mesh position={[0, 0.1, 0.035]}>
          <boxGeometry args={[3.25, 1.45, 0.01]} />
          <meshStandardMaterial color="#0C0A14" emissive="#3B0764" emissiveIntensity={0.3} />
        </mesh>
        {/* Overhead mini twin lights */}
        {[-0.8, 0.8].map((lx) => (
          <group key={lx} position={[lx, 1.15, 0.08]}>
            <mesh rotation={[0.4, 0, 0]}>
              <cylinderGeometry args={[0.08, 0.12, 0.22, 10]} />
              <meshStandardMaterial color="#2E2E38" metalness={0.8} />
            </mesh>
            <mesh position={[0, -0.1, 0.05]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial color="#DDD6FE" emissive="#A78BFA" emissiveIntensity={1.8} toneMapped={false} />
            </mesh>
          </group>
        ))}
      </group>
    );
  }

  if (shape === "speech") {
    // Quirky comic/cyber speech bubble with pointed tail
    return (
      <group>
        <mesh>
          <boxGeometry args={[3.8, 1.5, 0.08]} />
          <meshStandardMaterial color="#1A1528" metalness={0.4} roughness={0.75} />
        </mesh>
        <mesh position={[0, 0, 0.035]}>
          <boxGeometry args={[3.65, 1.35, 0.01]} />
          <meshStandardMaterial color="#100C1B" emissive="#4C1D95" emissiveIntensity={0.35} />
        </mesh>
        {/* Tail pointing down toward machine head */}
        <mesh position={[-1.1, -0.9, 0]} rotation={[0, 0, 0.5]}>
          <coneGeometry args={[0.3, 0.6, 3]} />
          <meshStandardMaterial color="#1A1528" metalness={0.4} roughness={0.75} />
        </mesh>
      </group>
    );
  }

  if (shape === "octagon") {
    // Retro-futuristic computer monitor screen with corner brackets
    return (
      <group>
        <mesh>
          <boxGeometry args={[3.5, 1.5, 0.1]} />
          <meshStandardMaterial color="#22202E" metalness={0.7} roughness={0.6} />
        </mesh>
        {/* Inset display CRT screen */}
        <mesh position={[0, 0, 0.035]}>
          <boxGeometry args={[3.2, 1.25, 0.01]} />
          <meshStandardMaterial color="#0A0812" emissive="#3B0764" emissiveIntensity={0.4} />
        </mesh>
        {/* Status indicator LEDs */}
        {[-1.45, -1.35].map((sx, idx) => (
          <mesh key={idx} position={[sx, 0.55, 0.05]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial
              color={idx === 0 ? "#10B981" : "#8B5CF6"}
              emissive={idx === 0 ? "#34D399" : "#C4B5FD"}
              emissiveIntensity={1.5}
            />
          </mesh>
        ))}
      </group>
    );
  }

  // Trapezoid / Asymmetric Hazard Banner
  return (
    <group>
      <mesh rotation={[0, 0, -0.04]}>
        <boxGeometry args={[4.0, 1.3, 0.08]} />
        <meshStandardMaterial color="#1C182A" metalness={0.5} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0, 0.035]} rotation={[0, 0, -0.04]}>
        <boxGeometry args={[3.85, 1.15, 0.01]} />
        <meshStandardMaterial color="#0F0D1A" emissive="#581C87" emissiveIntensity={0.3} />
      </mesh>
      {/* Top hazard stripe bar — pushed high above text area */}
      <mesh position={[0, 0.72, 0.04]} rotation={[0, 0, -0.04]}>
        <boxGeometry args={[3.85, 0.08, 0.01]} />
        <meshStandardMaterial color="#8B5CF6" emissive="#7C3AED" emissiveIntensity={0.9} />
      </mesh>
    </group>
  );
}

/**
 * A larger, quirky 3D board placard carried by moving background units.
 */
function QuirkyBoard({
  text,
  sub,
  shape,
}: {
  text: string;
  sub?: string;
  shape: BoardShape;
}) {
  const grp = useRef<THREE.Group>(null);
  const wp = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const g = grp.current;
    if (!g) return;
    g.getWorldPosition(wp);
    const r = THREE.MathUtils.clamp(1 - Math.abs(wp.x) / SIGN_REVEAL_WIDTH, 0, 1);
    const e = r * r * (3 - 2 * r); // smoothstep ease
    g.rotation.y = -BASE_YAW * e; // cancel walking yaw so it turns to face camera
    g.scale.setScalar(0.85); // fixed size — solid physical placard held on pole
  });

  return (
    <group ref={grp} position={[0, 2.5, 0]}>
      {/* Dual physical mounting poles held in hands */}
      {[-1.1, 1.1].map((px) => (
        <mesh key={px} position={[px, -0.85, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 2.0, 8]} />
          <meshStandardMaterial
            color="#FFFFFF"
            roughness={0.25}
            metalness={0.7}
            emissive="#E2E8F0"
            emissiveIntensity={0.2}
          />
        </mesh>
      ))}

      {/* Quirky 3D board shape frame */}
      <QuirkyBoardFrame shape={shape} />

      {/* Main quirky punchy text — floating at z=0.15 in front of all frame elements */}
      <Text
        position={[0, sub ? 0.1 : 0, 0.15]}
        fontSize={0.24}
        maxWidth={3.2}
        lineHeight={1.1}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        color="#F3E8FF"
      >
        {text}
      </Text>

      {/* Sub-label tag */}
      {sub && (
        <Text
          position={[0, -0.38, 0.15]}
          fontSize={0.12}
          maxWidth={3.0}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          color="#A78BFA"
        >
          {sub}
        </Text>
      )}
    </group>
  );
}

function WalkingUnits({ reduce }: { reduce: boolean }) {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const units = useMemo<
    {
      z: number;
      s: number;
      type: keyof typeof UNIT_TYPES;
      speed: number;
      start: number;
      bob: number;
      awake?: boolean;
      tip: string;
      sub: string;
      shape: BoardShape;
      dual?: boolean;
    }[]
  >(
    () => [
      {
        z: -3.0,
        s: 0.95,
        type: "egg",
        speed: 0.8,
        start: 0,
        bob: 0.14,
        awake: true,
        tip: "DECIDE ONCE. CREATE WITHOUT FEAR.",
        sub: "[ VISION READY ]",
        shape: "hexagon",
      },
      {
        z: -4.4,
        s: 0.82,
        type: "box",
        speed: 0.6,
        start: 7,
        bob: 0.12,
        tip: "CLARITY BEATS COMPLEXITY.",
        sub: "[ INTENT LOCKED ]",
        shape: "arch",
      },
      {
        z: -5.9,
        s: 0.7,
        type: "stilt",
        speed: 1.0,
        start: 13,
        bob: 0.1,
        tip: "BRING IT TO LIFE. MAKE IT REAL.",
        sub: "[ CREATION MODE ]",
        shape: "speech",
      },
      {
        z: -7.4,
        s: 0.68,
        type: "egg",
        speed: 0.5,
        start: 20,
        bob: 0.09,
        awake: true,
        tip: "ONE VISION → A WORKING APP.",
        sub: "[ DIRECT CREATION ]",
        shape: "octagon",
        dual: true, // Dual-carrier pair with one machine walking backwards!
      },
      {
        z: -9.0,
        s: 0.52,
        type: "box",
        speed: 0.72,
        start: 28,
        bob: 0.08,
        tip: "SAY START. WATCH YOUR APP TAKE FORM.",
        sub: "[ AUTONOMOUS CREATION ]",
        shape: "trapezoid",
      },
    ],
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
        // Bob at 2× the leg-swing so it peaks on each footfall; a waddling roll.
        const stride = t * u.speed * 3.4 + u.start;
        g.position.y = -0.55 + Math.abs(Math.sin(stride)) * u.bob;
        g.rotation.z = Math.sin(stride) * 0.05;
        // Idle look-around on top of the walk.
        g.rotation.y = BASE_YAW + Math.sin(t * 0.5 + u.start) * 0.16;
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
            rotation={[0, BASE_YAW, 0]}
          >
            {u.dual ? (
              /* Dual-Carrier Tandem: Lead machine walking forward, Rear machine walking BACKWARDS */
              <group>
                <group position={[1.1, 0, 0]}>
                  <Unit
                    awake={u.awake}
                    phase={reduce ? 0 : u.start}
                    stride={reduce ? 0 : u.speed * 3.4}
                  />
                </group>
                <group position={[-1.1, 0, 0]} rotation={[0, Math.PI - 0.2, 0]}>
                  <Unit
                    awake={u.awake}
                    phase={reduce ? 0 : u.start + 1.57}
                    stride={reduce ? 0 : u.speed * 3.4}
                  />
                </group>
              </group>
            ) : (
              <Unit
                awake={u.awake}
                phase={reduce ? 0 : u.start}
                stride={reduce ? 0 : u.speed * 3.4}
              />
            )}
            {!reduce && <QuirkyBoard text={u.tip} sub={u.sub} shape={u.shape} />}
          </group>
        );
      })}
    </group>
  );
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

      <GuidedCamera reduce={reduce} />

      <Suspense fallback={null}>
        <WalkingUnits reduce={reduce} />
        <group position={[heroX, -0.15, 0]}>
          {reduce ? (
            <Machine reduce onPoke={onPoke} pose="ready" line={line} />
          ) : (
            <Float speed={1.1} rotationIntensity={0.12} floatIntensity={0.35}>
              <Machine reduce={false} onPoke={onPoke} pose="ready" line={line} />
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
