"use client";

/**
 * The machine — the single 3D subject the whole site is built around.
 *
 * It is the coding agent: patient, mass-produced, waiting for instructions.
 * Shared by the hero and the "how it works" narrative so there is exactly one
 * model on the site, posed differently, rather than a set of unrelated shapes.
 *
 * Art direction borrows the post-industrial language of the reference — modular
 * bodies welded from cheap primitives, soft haze, heavy rim light, near-
 * monochrome with a single accent. That last part is why it sits on brand
 * rather than fighting it: the reference palette is monochrome plus one colour,
 * and ours is near-black plus violet. Same system, our hue.
 *
 * Built entirely from primitives — no external model, nothing to license,
 * nothing to load.
 */

import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import gsap from "gsap";
import * as THREE from "three";
import { MachineBubble } from "@/components/ui/MachineBubble";

/**
 * Per-frame animation values the "how it works" stage feeds the unit. These are
 * driven by a Theatre.js sequence (see AssemblyScene) and read here inside the
 * frame loop, so the assembly, colour reveal, eye glow and the closing dance all
 * stay smooth independent of React renders. The hero never passes this — it just
 * leaves the unit fully built at rest.
 */
export interface MachineDynamics {
  /** 0 = parts scattered, 1 = seated. */
  build: number;
  /** Emissive intensity target for the eyes. */
  eye: number;
  /** 0 = still, 1 = full dance. */
  dance: number;
}

/**
 * Tracks a collision with a small machine.
 * leg: 0 is left, 1 is right. time is state.clock.elapsedTime of hit.
 */
export interface MachineHitState {
  leg: 0 | 1;
  time: number;
}

export const ACCENT = "#8B5CF6";

/**
 * Procedural weathered-metal map, built once on the client and shared by every
 * shell material on the site (one texture, mass-produced units — same idea as
 * the model).
 *
 * The reference look is grubby cast plate: mostly matte grey with worn-smooth
 * patches, ground-in grime and vertical drip streaks. We bake that into a
 * greyscale canvas and use it two ways — as `map` it multiplies the base colour
 * so grime darkens the metal, and as `roughnessMap` the same marks read as worn
 * (smoother) vs. dirty (rougher). No image asset to load or license; the noise
 * has no hard features, so it survives the primitives' rough UVs without obvious
 * stretching.
 */
let _grunge: THREE.CanvasTexture | null = null;
function grungeTexture(): THREE.CanvasTexture | null {
  if (_grunge) return _grunge;
  if (typeof document === "undefined") return null;

  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Base: clean high-specular titanium grey
  ctx.fillStyle = "#e5e5ed";
  ctx.fillRect(0, 0, size, size);

  // Directional brushed-metal micro-streaks (horizontal hairline grain)
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < 400; i++) {
    const y = Math.random() * size;
    const h = 1 + Math.random() * 1.5;
    const w = 40 + Math.random() * 200;
    const x = Math.random() * size;
    ctx.fillRect(x, y, w, h);
  }

  // Fine tactile metal noise
  ctx.globalAlpha = 1;
  const grain = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < grain.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 32;
    grain.data[i] += n;
    grain.data[i + 1] += n;
    grain.data[i + 2] += n;
  }
  ctx.putImageData(grain, 0, 0);

  // Soft satin specular highlights
  for (let k = 0; k < 30; k++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 12 + Math.random() * 40;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(255,255,255,0.22)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.anisotropy = 16;
  _grunge = tex;
  return tex;
}

/**
 * Poses. The unit is the story, so its bearing carries the narrative beat:
 *   dormant  — powered down, head hung, nothing to act on
 *   briefed  — coming up, straightening, taking the instruction in
 *   ready    — upright and alert, waiting to be sent
 *   curious  — head tilted to one side, one arm raised, taking something in
 *   excited  — head back, both arms up, eyes at their brightest
 *   proud    — settled upright, calm bright eyes, arms relaxed at rest
 */
export type MachinePose = "dormant" | "briefed" | "ready" | "curious" | "excited" | "proud";

export const POSE: Record<
  MachinePose,
  { headX: number; headZ: number; lean: number; eye: number; armL: number; armR: number }
> = {
  dormant: { headX: 0.5, headZ: 0.16, lean: 0.16, eye: 0.12, armL: 0.05, armR: 0.1 },
  briefed: { headX: 0.12, headZ: 0.1, lean: 0.05, eye: 0.95, armL: 0.24, armR: 0.36 },
  ready: { headX: -0.1, headZ: 0.05, lean: -0.04, eye: 1.6, armL: 0.34, armR: 0.5 },
  curious: { headX: 0.14, headZ: -0.32, lean: 0.02, eye: 0.6, armL: 0.08, armR: 0.3 },
  excited: { headX: -0.22, headZ: 0.06, lean: -0.1, eye: 1.4, armL: 0.48, armR: 0.46 },
  proud: { headX: -0.02, headZ: 0.0, lean: -0.02, eye: 1.0, armL: 0.18, armR: 0.18 },
};

export function useIsLightMode() {
  // Lazy-read the class the layout's inline head script already set, so the
  // very first client render (hydration) is correct instead of always
  // starting dark and flashing to the right theme a beat later.
  const [isLight, setIsLight] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("light")
  );
  useEffect(() => {
    const update = () => setIsLight(document.documentElement.classList.contains("light"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return isLight;
}

export function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduce(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduce;
}

/** Outer plate shell — dielectric ceramic/plastic with clearcoat gloss. */
function Shell({ color }: { color?: string }) {
  const g = grungeTexture();
  const isLight = useIsLightMode();
  const baseColor =
    color === "dark"
      ? isLight
        ? "#8E8BA6"
        : "#242430"
      : color || (isLight ? "#D8D6E6" : "#545068");
  return (
    <meshPhysicalMaterial
      color={baseColor}
      map={g}
      roughnessMap={g}
      metalness={isLight ? 0.05 : 0.75}
      roughness={isLight ? 0.38 : 0.4}
      clearcoat={isLight ? 0.6 : 0.15}
      clearcoatRoughness={isLight ? 0.15 : 0.4}
      envMapIntensity={isLight ? 1.2 : 0.8}
    />
  );
}

/** Joints and bolted collars: chrome-like accent with higher metalness for contrast against the dielectric shell. */
function Joint() {
  const g = grungeTexture();
  const isLight = useIsLightMode();
  return (
    <meshPhysicalMaterial
      color={isLight ? "#9894B0" : "#1A1A22"}
      map={g}
      roughnessMap={g}
      metalness={isLight ? 0.7 : 0.9}
      roughness={isLight ? 0.18 : 0.18}
      clearcoat={isLight ? 0.4 : 0.1}
      clearcoatRoughness={0.2}
      envMapIntensity={isLight ? 1.5 : 0.8}
    />
  );
}

/** Sockets and vents — deep recessed wells with high roughness for natural AO-like darkening. */
function Recess() {
  const isLight = useIsLightMode();
  return <meshPhysicalMaterial color={isLight ? "#7A7694" : "#0E0E14"} roughness={0.7} metalness={0.05} envMapIntensity={0.3} />;
}

let _nxBadgeTexDark: THREE.CanvasTexture | null = null;
let _nxBadgeTexLight: THREE.CanvasTexture | null = null;

function nxBadgeTexture(isLight: boolean): THREE.CanvasTexture | null {
  if (isLight && _nxBadgeTexLight) return _nxBadgeTexLight;
  if (!isLight && _nxBadgeTexDark) return _nxBadgeTexDark;
  if (typeof document === "undefined") return null;

  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Badge plate background
  ctx.fillStyle = isLight ? "#F0F0F6" : "#0D0B18";
  ctx.fillRect(0, 0, size, size);

  // Outer glowing violet accent border
  ctx.strokeStyle = isLight ? "rgba(124, 58, 237, 0.5)" : "rgba(139, 92, 246, 0.4)";
  ctx.lineWidth = 14;
  ctx.strokeRect(20, 20, size - 40, size - 40);

  // Render official Hexagon Monolith with Path2D
  ctx.save();
  ctx.translate(size / 2 - 160, size / 2 - 160);
  ctx.scale(10, 10);

  // Hexagon Gradient Fill
  const grad = ctx.createLinearGradient(4, 1, 28, 31);
  if (isLight) {
    grad.addColorStop(0, "#8B5CF6");
    grad.addColorStop(0.5, "#7C3AED");
    grad.addColorStop(1, "#6D28D9");
  } else {
    grad.addColorStop(0, "#DDD6FE");
    grad.addColorStop(0.5, "#A78BFA");
    grad.addColorStop(1, "#7C3AED");
  }

  const hexPath = new Path2D("M16 1 28 8.5 V23.5 L16 31 4 23.5 V8.5 Z");
  ctx.fillStyle = grad;
  ctx.fill(hexPath);

  // N Monogram Cutout
  const nPath = new Path2D("M11.4 22 V11.6 h2.55 v1.5 q.7-.9 1.5-1.3 .8-.42 1.8-.42 1.65 0 2.55 1 .9 1 .9 2.85 V22 h-2.7 v-6.15 q0-.95-.4-1.4-.4-.46-1.15-.46-.85 0-1.35.56-.5.55-.5 1.6V22 Z");
  ctx.fillStyle = isLight ? "#FFFFFF" : "#0B0710";
  ctx.fill(nPath);

  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 16;
  if (isLight) _nxBadgeTexLight = tex;
  else _nxBadgeTexDark = tex;
  return tex;
}

/**
 * NX Emblem mounted on the main machine's front chest.
 * Displays the authentic official nxstudio hexagonal brand monolith emblem.
 */
function NxChestTattoo() {
  const isLight = useIsLightMode();
  const badgeTex = nxBadgeTexture(isLight);
  return (
    <group position={[0, 0.44, 0.58]} rotation={[0.08, 0, 0]}>
      {/* Outer bezel frame */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.44, 0.32, 0.02]} />
        <meshStandardMaterial color={isLight ? "#A8A4C0" : "#262238"} metalness={isLight ? 0.8 : 0.88} roughness={0.15} />
      </mesh>

      {/* Official nxstudio Brand Logo Faceplate */}
      <mesh position={[0, 0, 0.012]}>
        <planeGeometry args={[0.4, 0.28]} />
        <meshStandardMaterial
          map={badgeTex}
          emissiveMap={badgeTex}
          emissive="#FFFFFF"
          emissiveIntensity={1.4}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* 4 Corner Precision Bolts */}
      {[
        [-0.17, 0.11],
        [0.17, 0.11],
        [-0.17, -0.11],
        [0.17, -0.11],
      ].map(([rx, ry], idx) => (
        <mesh key={idx} position={[rx, ry, 0.018]}>
          <cylinderGeometry args={[0.012, 0.012, 0.016, 6]} />
          <meshStandardMaterial color="#DDD6FE" emissive="#A78BFA" emissiveIntensity={1.2} />
        </mesh>
      ))}
    </group>
  );
}

/** Simple 3-finger robotic hand with articulated fingers */
function Hand({ side, curl = 0.5 }: { side: number; curl?: number }) {
  const flex = curl * 0.6;
  return (
    <group>
      {/* Palm block */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.13, 0.07, 0.12]} />
        <Joint />
      </mesh>

      {/* Thumb */}
      <group position={[side * -0.06, -0.02, 0.04]} rotation={[0.4, side * -0.6, flex]}>
        <mesh position={[0, -0.05, 0]}>
          <cylinderGeometry args={[0.018, 0.015, 0.1, 8]} />
          <Shell color="dark" />
        </mesh>
      </group>

      {/* Index Finger */}
      <group position={[side * 0.03, -0.04, 0.04]} rotation={[flex, 0, 0]}>
        <mesh position={[0, -0.06, 0]}>
          <cylinderGeometry args={[0.016, 0.014, 0.12, 8]} />
          <Shell color="dark" />
        </mesh>
      </group>

      {/* Main Finger */}
      <group position={[side * 0.03, -0.04, -0.03]} rotation={[flex * 0.8, 0, 0]}>
        <mesh position={[0, -0.06, 0]}>
          <cylinderGeometry args={[0.016, 0.014, 0.12, 8]} />
          <Shell color="dark" />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Organic speech dialogue overlay anchored right at the machine's jaw/mouth.
 * Floating directly in 3D space with a speech tail pointing right to his mouth.
 */
function MouthDialogue({ line }: { line: string }) {
  const textRef = useRef<HTMLSpanElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el || !line || !line.trim()) return;
    tl.current?.kill();

    tl.current = gsap.timeline();
    tl.current
      .to(el, { opacity: 0, duration: 0.18, ease: "power1.out" })
      .add(() => {
        el.textContent = line;
      })
      .to(el, { opacity: 1, duration: 0.3, ease: "power1.in" });

    return () => {
      tl.current?.kill();
    };
  }, [line]);

  if (!line || !line.trim() || line.trim().length === 0) return null;

  return (
    <Html
      position={[0, 1.25, 0.2]}
      center
      distanceFactor={7.0}
      zIndexRange={[100, 0]}
      style={{ pointerEvents: "none", userSelect: "none" }}
    >
      <div className="flex w-max max-w-[280px] sm:max-w-[384px] justify-center">
        <MachineBubble tail="bottom">
          <p className="text-sm font-medium text-popover-foreground whitespace-pre-line text-center">
            <span ref={textRef}>{line}</span>
          </p>
        </MachineBubble>
      </div>
    </Html>
  );
}

/** One machine. Modular by design, so the same parts read as mass-produced. */
export function Machine({
  reduce,
  onPoke,
  pose = "ready",
  build = 1,
  dynamicsRef,
  line,
  hitRef,
  facing = -0.44,
}: {
  reduce: boolean;
  onPoke?: () => void;
  pose?: MachinePose;
  /** 0 = parts scattered/exploded, 1 = fully assembled. Hero leaves it at 1. */
  build?: number;
  /**
   * Optional live values driven per-frame (by Theatre.js on the "how it works"
   * stage). When present they override `build` and the pose's eye brightness and
   * add the closing dance. Absent on the hero, so it stays a still, built unit.
   */
  dynamicsRef?: MutableRefObject<MachineDynamics>;
  /** Optional machine speech line anchored to his mouth in 3D */
  line?: string;
  /** Collision tracker passed from the scene to trigger flinch reactions */
  hitRef?: MutableRefObject<MachineHitState | null>;
  /**
   * Base yaw (radians) the idle sway oscillates around — which way the unit
   * reads as "facing". Hero faces left (negative); other scenes can pass
   * their own so this one change doesn't spin every instance of the model.
   */
  facing?: number;
}) {
  const isLight = useIsLightMode();
  const group = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const eyes = useRef<THREE.MeshStandardMaterial[]>([]);
  const arms = useRef<(THREE.Group | null)[]>([]);
  const legs = useRef<(THREE.Group | null)[]>([]);
  const buildCur = useRef(build);
  const danceCur = useRef(0);
  const recoil = useRef(0);

  /** Kick the unit back briefly when poked, then settle. */
  const poke = () => {
    recoil.current = 1;
    onPoke?.();
  };

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    recoil.current = Math.max(0, recoil.current - delta * 2.4);
    const jolt = recoil.current * recoil.current;

    // Ease toward the current pose rather than snapping between beats.
    const target = POSE[pose];
    const a = 1 - Math.exp(-delta * 2.8);

    // Live values (Theatre.js) when the stage supplies them, else the static
    // props. Ease `dance` in so the unit doesn't snap into the beat.
    const dyn = dynamicsRef?.current;
    danceCur.current += ((dyn ? dyn.dance : 0) - danceCur.current) * a;
    const dance = danceCur.current;
    // A steady four-on-the-floor tempo the whole unit locks onto when online.
    const beat = t * 7.2;
    const bob = Math.abs(Math.sin(beat)) * dance; // 0..1 bounce envelope
    const sway = Math.sin(beat * 0.5) * dance;

    if (group.current) {
      // Idle sway — heavy and slow, like something powered down but not off.
      // The dance adds an upward bounce and a hip sway on top of the idle.
      group.current.position.y = Math.sin(t * 0.6) * 0.06 - 0.1 + jolt * 0.12 + bob * 0.16;
      group.current.rotation.y = facing + Math.sin(t * 0.25) * 0.12 + sway * 0.18;
      group.current.rotation.z = -0.035 + sway * 0.1;
    }
    if (torso.current) {
      torso.current.rotation.x = THREE.MathUtils.lerp(
        torso.current.rotation.x,
        target.lean,
        a
      );
    }
    if (head.current) {
      head.current.rotation.x = THREE.MathUtils.lerp(head.current.rotation.x, target.headX, a);
      head.current.rotation.z = THREE.MathUtils.lerp(head.current.rotation.z, target.headZ, a);
    }
    // Eyes brighten as the unit comes up — the clearest read on its state.
    // The stage drives them directly (dyn.eye); on the beat they pulse.
    const eyeTarget = dyn ? dyn.eye : target.eye;
    eyes.current.forEach((m) => {
      if (m) m.emissiveIntensity = THREE.MathUtils.lerp(m.emissiveIntensity, eyeTarget, a);
    });

    // Assembly: parts ease from scattered → seated as `build` rises. Every
    // offset is `apart * k`, so at build=1 (apart=0) they resolve to zero and
    // the hero unit is untouched. Offsets are deliberately tight so even fully
    // scattered the unit reads as one centred cluster — never flinging a part
    // into the section header or off the edge of the frame. Legs keep their
    // prop x/z — only y is offset.
    const buildTarget = dyn ? dyn.build : build;
    buildCur.current += (buildTarget - buildCur.current) * a;
    const apart = 1 - buildCur.current;
    const wob = Math.sin(t * 1.4) * 0.045 * apart;
    // Head lifts and the limbs drift out into a loose exploded-diagram cluster
    // — clearly "in pieces", but sized to stay inside the centred frame rather
    // than flinging a part off-screen or up into the section header.
    if (head.current) head.current.position.y = 1.42 + apart * (0.42 + wob);
    arms.current.forEach((g, i) => {
      if (!g) return;
      g.position.x = apart * (i === 0 ? -0.5 : 0.5);
      g.position.y = apart * (0.24 + wob);
      // Dance: the arms lift and wave in opposition, in time with the bounce.
      g.rotation.z = Math.sin(beat + (i === 0 ? 0 : Math.PI)) * 0.5 * dance;
    });
    
    // Leg positioning + Hurt Instinct Flinch
    legs.current.forEach((g, i) => {
      if (!g) return;
      // Default scatter position
      const targetY = apart * (-0.36 - wob);
      let targetRotX = 0;
      
      // If hit recently, flinch upward
      if (hitRef?.current?.leg === i) {
        const timeSinceHit = t - hitRef.current.time;
        if (timeSinceHit < 1.2) {
          // Quick lift, slow drop (envelope from 0 to 1 back to 0)
          const lift = Math.max(0, Math.sin(timeSinceHit * Math.PI / 1.2));
          // Move the whole hip up and rotate backward
          g.position.y = targetY + lift * 0.45;
          targetRotX = -lift * 0.6;
        } else {
          g.position.y = targetY;
        }
      } else {
        g.position.y = targetY;
      }
      
      // Lerp rotation for smooth flinch entry/exit
      g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, targetRotX, 0.15);
    });
  });

  return (
    // Whole unit turned a few degrees off-axis and tipped at the shoulders, so
    // the silhouette is asymmetric before anything else is even read.
    <group ref={group} onPointerDown={poke} rotation={[0, facing, 0]}>
      {/* Everything above the hips leans as one, pivoting at the waist. */}
      <group ref={torso}>
      {/* Head — centered and aligned with CAD-grade precision symmetry. */}
      <group ref={head} position={[0, 1.42, 0]} rotation={[0, 0, 0]}>
        {/* Main helmet sphere */}
        <mesh castShadow>
          <sphereGeometry args={[0.62, 24, 20]} />
          <Shell />
        </mesh>

        {/* Forehead power visor crest */}
        <mesh position={[0, 0.45, 0.35]} rotation={[-0.2, 0, 0]}>
          <boxGeometry args={[0.34, 0.05, 0.14]} />
          <Joint />
        </mesh>

        {/* Dialogue speech line anchored directly near his mouth in 3D */}
        {line && line.trim().length > 0 && <MouthDialogue line={line} />}

        {/* Antenna — centered on top of head with glowing radiant lilac orb */}
        <mesh position={[0, 0.62, 0]} rotation={[0.08, 0, 0]}>
          <cylinderGeometry args={[0.022, 0.03, 0.44, 10]} />
          <Shell color="dark" />
        </mesh>
        <mesh position={[0, 0.86, 0]}>
          <sphereGeometry args={[0.065, 12, 10]} />
          <meshStandardMaterial
            color="#A78BFA"
            emissive="#C084FC"
            emissiveIntensity={3.4}
            toneMapped={false}
          />
        </mesh>

        {/* Ears — an open outer-helix curve plus a lobe, read as ears rather
            than a flat sensor disc. The amber sensor glint (vs. the eyes'
            violet) codes them as the "listening" organ at a glance. */}
        {[-0.54, 0.54].map((x) => {
          const side = Math.sign(x);
          return (
            <group key={x} position={[x, 0.04, 0.08]} rotation={[0.1, side * -0.35, 0]}>
              {/* Outer helix: an open C so it reads as a curled rim, not a ring */}
              <mesh rotation={[0, Math.PI / 2, side * 2.0]}>
                <torusGeometry args={[0.11, 0.026, 10, 20, Math.PI * 1.4]} />
                <Joint />
              </mesh>
              {/* Lobe — soft, flattened, hangs below the helix */}
              <mesh position={[side * 0.01, -0.1, 0.01]} scale={[0.62, 1, 0.8]}>
                <sphereGeometry args={[0.06, 14, 12]} />
                <Joint />
              </mesh>
              {/* Canal recess — the shadowed inner well the helix curls around */}
              <mesh position={[side * 0.028, -0.005, 0.01]} rotation={[0, Math.PI / 2, 0]}>
                <circleGeometry args={[0.052, 16]} />
                <Recess />
              </mesh>
              {/* Sensor glint — amber, distinct from the eyes' violet */}
              <mesh position={[side * 0.045, -0.005, 0.012]}>
                <sphereGeometry args={[0.02, 10, 8]} />
                <meshStandardMaterial color="#FDBA74" emissive="#F59E0B" emissiveIntensity={2.6} toneMapped={false} />
              </mesh>
            </group>
          );
        })}

        {/* Jaw seam tuck */}
        <mesh position={[0, -0.22, 0.5]} rotation={[0.34, 0, 0]}>
          <boxGeometry args={[0.42, 0.05, 0.06]} />
          <Joint />
        </mesh>

        {/* Smoked-glass helmet visor band — adapts cleanly to light and dark themes */}
        <mesh position={[0, 0.06, 0.38]} rotation={[0.08, 0, 0]}>
          <boxGeometry args={[0.72, 0.22, 0.3]} />
          <meshStandardMaterial color={isLight ? "#9490B0" : "#06050C"} roughness={0.1} metalness={isLight ? 0.78 : 0.95} />
        </mesh>

        {/* Eyes: almond-proportioned lens assemblies (wide, flattened — not
            circular camera lenses) with a two-tone iris and a brow arc, so
            they read as eyes rather than optical sensors. */}
        {[-0.2, 0.2].map((x) => (
          <group key={x} position={[x, 0.06, 0.46]} rotation={[0.04, x * 0.28, 0]}>
            {/* Outer chamfered bezel — stretched wide and flattened tall, the
                classic almond proportion */}
            <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1.28, 0.8, 1]}>
              <cylinderGeometry args={[0.125, 0.12, 0.06, 24]} />
              <Joint />
            </mesh>
            {/* Inner dark optical well */}
            <mesh position={[0, 0, 0.012]} rotation={[Math.PI / 2, 0, 0]} scale={[1.28, 0.8, 1]}>
              <cylinderGeometry args={[0.1, 0.095, 0.05, 24]} />
              <Recess />
            </mesh>
            {/* Iris — warm amber ring around the core, the way a real iris
                reads as a distinct band rather than one flat color */}
            <mesh position={[0, 0, 0.026]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.062, 0.016, 14, 28]} />
              <meshStandardMaterial color="#FCD34D" emissive="#F59E0B" emissiveIntensity={1.8} toneMapped={false} />
            </mesh>
            {/* Core radiant lilac emissive pupil */}
            <mesh position={[0, 0, 0.03]} scale={[1.12, 0.86, 1]}>
              <sphereGeometry args={[0.068, 24, 20]} />
              <meshStandardMaterial
                ref={(m) => {
                  if (m) eyes.current[x < 0 ? 0 : 1] = m;
                }}
                color="#7C3AED"
                emissive="#DDD6FE"
                emissiveIntensity={3.6}
                toneMapped={false}
              />
            </mesh>
            {/* Concentric aperture glow ring */}
            <mesh position={[0, 0, 0.046]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.04, 0.01, 16, 32]} />
              <meshStandardMaterial
                color="#FFFFFF"
                emissive="#FAF5FF"
                emissiveIntensity={4.2}
                toneMapped={false}
              />
            </mesh>
            {/* Glossy glass catchlight reflection dot */}
            <mesh position={[0.03, 0.024, 0.068]}>
              <sphereGeometry args={[0.017, 12, 10]} />
              <meshStandardMaterial
                color="#FFFFFF"
                emissive="#FFFFFF"
                emissiveIntensity={2.5}
                toneMapped={false}
              />
            </mesh>
            {/* Brow arc — a slim raised crease above the eye, angled up at
                the outer corner for an alert, expressive read */}
            <mesh position={[x > 0 ? 0.01 : -0.01, 0.095, 0.03]} rotation={[0, 0, x > 0 ? -0.18 : 0.18]}>
              <torusGeometry args={[0.11, 0.012, 8, 20, Math.PI * 0.62]} />
              <Joint />
            </mesh>
          </group>
        ))}

        {/* Rivet crown band */}
        <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.43, 0.045, 10, 28]} />
          <Shell color="dark" />
        </mesh>
      </group>

      {/* Neck armor sleeve */}
      <mesh position={[0, 0.98, 0]}>
        <cylinderGeometry args={[0.15, 0.16, 0.3, 12]} />
        <Shell color="dark" />
      </mesh>
      {/* Neck power conduit ring */}
      <mesh position={[0, 0.9, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.17, 0.03, 10, 20]} />
        <meshStandardMaterial color="#8B5CF6" emissive="#C084FC" emissiveIntensity={2.8} toneMapped={false} />
      </mesh>

      {/* Segmented Barrel Torso */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.52, 0.64, 1.05, 16]} />
        <Shell />
      </mesh>
      {/* Waist armor collar & ribbing seams */}
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.55, 0.55, 0.16, 16]} />
        <Shell color="dark" />
      </mesh>
      <mesh position={[0, 0.74, 0]}>
        <cylinderGeometry args={[0.52, 0.52, 0.07, 16]} />
        <Shell color="dark" />
      </mesh>

      {/* NX Chest Emblem */}
      <NxChestTattoo />

      {/* Status Indicator LEDs — perfectly mirrored */}
      {[-0.23, 0.23].map((x) => (
        <mesh key={x} position={[x, 0.65, 0.49]}>
          <sphereGeometry args={[0.028, 10, 10]} />
          <meshStandardMaterial
            color="#8B5CF6"
            emissive="#A78BFA"
            emissiveIntensity={1.6}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Power conduit hydraulics connecting chest to shoulders — perfectly mirrored */}
      {[-0.33, 0.33].map((x, i) => (
        <mesh
          key={i}
          position={[x, 0.76, 0.26]}
          rotation={[0.3, 0, i === 0 ? -0.4 : 0.4]}
        >
          <cylinderGeometry args={[0.025, 0.025, 0.36, 10]} />
          <Joint />
        </mesh>
      ))}

      {/* Chest cooling vent slats */}
      {[0.24, 0.16].map((y) => (
        <mesh key={y} position={[0, y, 0.55]} rotation={[0.08, 0, 0]}>
          <boxGeometry args={[0.28, 0.028, 0.045]} />
          <Shell color="dark" />
        </mesh>
      ))}

      {/* Hip collar */}
      <mesh position={[0, -0.12, 0]}>
        <cylinderGeometry args={[0.48, 0.42, 0.2, 14]} />
        <Shell color="dark" />
      </mesh>

      {/* Articulated Arm Assemblies — 100% Symmetrical Shoulder Pivot Heights */}
      {([
        { s: -1, shoulderY: 0.75, curl: 0.5 },
        { s: 1, shoulderY: 0.75, curl: 0.5 },
      ] as const).map(({ s, shoulderY, curl }, i) => (
        <group
          key={s}
          ref={(el) => {
            arms.current[i] = el;
          }}
        >
          <group position={[s * 0.62, shoulderY, 0]}>
            {/* Pauldron shoulder cap */}
            <mesh position={[0, 0.06, 0]} rotation={[0, 0, s * 0.2]}>
              <sphereGeometry args={[0.28, 16, 12, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
              <Shell />
            </mesh>
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[0.23, 16, 14]} />
              <Joint />
            </mesh>
            {/* Upper arm column */}
            <mesh position={[s * 0.05, -0.35, 0]} rotation={[0.08, 0, s * 0.05]}>
              <cylinderGeometry args={[0.11, 0.12, 0.6, 12]} />
              <Shell />
            </mesh>
            {/* Chrome elbow pivot joint */}
            <mesh position={[s * 0.05, -0.68, 0]}>
              <sphereGeometry args={[0.14, 14, 12]} />
              <Joint />
            </mesh>
            {/* Forearm with piston rod */}
            <mesh position={[s * 0.05, -1.0, 0.04]} rotation={[0.12, 0, 0]}>
              <cylinderGeometry args={[0.1, 0.11, 0.5, 12]} />
              <Shell />
            </mesh>
            {/* Wrist joint ring */}
            <mesh position={[s * 0.05, -1.24, 0.05]}>
              <cylinderGeometry args={[0.09, 0.09, 0.06, 12]} />
              <Joint />
            </mesh>
            {/* Articulated hand */}
            <group position={[s * 0.05, -1.32, 0.06]} rotation={[0.1, 0, 0]}>
              <Hand side={s} curl={curl} />
            </group>
          </group>
        </group>
      ))}

      </group>

      {/* Articulated Leg Assemblies */}
      {([
        { x: -0.27, z: -0.04, tilt: 0.0, splay: -0.05, len: 0.74 },
        { x: 0.28, z: 0.12, tilt: 0.16, splay: 0.14, len: 0.68 },
      ] as const).map(({ x, z, tilt, splay, len }, i) => (
        <group
          key={x}
          ref={(el) => {
            legs.current[i] = el;
          }}
          position={[x, 0, z]}
          rotation={[0, splay, 0]}
        >
          {/* Hip ball joint */}
          <mesh position={[0, -0.3, 0]}>
            <sphereGeometry args={[0.17, 14, 12]} />
            <Joint />
          </mesh>
          {/* Thigh strut */}
          <mesh position={[0, -0.62, 0]} rotation={[tilt, 0, 0]}>
            <cylinderGeometry args={[0.135, 0.155, len, 12]} />
            <Shell />
          </mesh>
          {/* Bevelled knee cap armor guard */}
          <mesh position={[0, -0.66, tilt * 0.22]}>
            <cylinderGeometry args={[0.155, 0.155, 0.09, 12]} />
            <Joint />
          </mesh>
          {/* Ankle joint */}
          <mesh position={[0, -1.0, tilt * 0.34]}>
            <sphereGeometry args={[0.14, 14, 12]} />
            <Joint />
          </mesh>
          {/* Industrial treaded foot pad */}
          <mesh position={[0, -1.13, tilt * 0.34 + 0.06]}>
            <cylinderGeometry args={[0.15, 0.23, 0.18, 12]} />
            <Shell />
          </mesh>
        </group>
      ))}
    </group>
  );
}
