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

  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Base: near-white so the shell keeps most of its colour where it's clean.
  ctx.fillStyle = "#dcdcdc";
  ctx.fillRect(0, 0, size, size);

  // Fine metal grain.
  const grain = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < grain.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 46;
    grain.data[i] += n;
    grain.data[i + 1] += n;
    grain.data[i + 2] += n;
  }
  ctx.putImageData(grain, 0, 0);

  // Worn-smooth patches — darker, so the metal shines a little where it's rubbed.
  for (let k = 0; k < 30; k++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 5 + Math.random() * 20;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(90,90,90,0.45)");
    g.addColorStop(1, "rgba(90,90,90,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Grime pooling + vertical drip streaks.
  ctx.globalAlpha = 0.5;
  for (let k = 0; k < 16; k++) {
    const x = Math.random() * size;
    ctx.fillStyle = "rgba(70,68,74,1)";
    ctx.fillRect(x, Math.random() * size * 0.5, 1 + Math.random() * 2, 20 + Math.random() * 70);
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.anisotropy = 4;
  _grunge = tex;
  return tex;
}

/**
 * Poses. The unit is the story, so its bearing carries the narrative beat:
 *   dormant  — powered down, head hung, nothing to act on
 *   briefed  — coming up, straightening, taking the instruction in
 *   ready    — upright and alert, waiting to be sent
 */
export type MachinePose = "dormant" | "briefed" | "ready";

const POSE: Record<
  MachinePose,
  { headX: number; headZ: number; lean: number; eye: number; armL: number; armR: number }
> = {
  dormant: { headX: 0.5, headZ: 0.16, lean: 0.16, eye: 0.12, armL: 0.05, armR: 0.1 },
  briefed: { headX: 0.12, headZ: 0.1, lean: 0.05, eye: 0.95, armL: 0.24, armR: 0.36 },
  ready: { headX: -0.1, headZ: 0.05, lean: -0.04, eye: 1.6, armL: 0.34, armR: 0.5 },
};

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

// Mid-greys, not near-blacks. On a #08080A page a dark shell just silhouettes
// into the background and loses all the plate detail.
// Bright silver alloy for high contrast against dark background
const SHELL = "#A1A1B2";
const SHELL_DARK = "#52525E";

/** Outer plate metal — rough weathered cast with metallic shine. */
function Shell({ color = SHELL }: { color?: string }) {
  const g = grungeTexture();
  return (
    <meshStandardMaterial
      color={color}
      map={g}
      roughnessMap={g}
      metalness={0.65}
      roughness={0.45}
      flatShading
    />
  );
}

/** Joints and bolted collars: dark gunmetal contrast. */
function Joint() {
  const g = grungeTexture();
  return (
    <meshStandardMaterial
      color={SHELL_DARK}
      map={g}
      roughnessMap={g}
      metalness={0.5}
      roughness={0.7}
      flatShading
    />
  );
}

/** Sockets and vents — near-black, fully matte. */
function Recess() {
  return <meshStandardMaterial color="#0E0D14" metalness={0.2} roughness={0.9} flatShading />;
}

/**
 * NX Tattoo / Stencil Emblem mounted on the main machine's front chest.
 * Positioned proudly on chest with glowing neon stencil lettering.
 */
function NxChestTattoo() {
  return (
    <group position={[0, 0.44, 0.59]} rotation={[0.08, 0, 0]}>
      {/* Outer neon purple border rim */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.54, 0.36, 0.02]} />
        <meshStandardMaterial color="#8B5CF6" emissive="#7C3AED" emissiveIntensity={1.8} toneMapped={false} />
      </mesh>

      {/* Base chest badge plate backing */}
      <mesh position={[0, 0, 0.01]}>
        <boxGeometry args={[0.5, 0.32, 0.025]} />
        <meshStandardMaterial color="#12101D" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Corner mounting rivets */}
      {[
        [-0.21, 0.12],
        [0.21, 0.12],
        [-0.21, -0.12],
        [0.21, -0.12],
      ].map(([rx, ry], idx) => (
        <mesh key={idx} position={[rx, ry, 0.024]}>
          <cylinderGeometry args={[0.018, 0.018, 0.02, 8]} />
          <meshStandardMaterial color="#DDD6FE" emissive="#A78BFA" emissiveIntensity={1.2} />
        </mesh>
      ))}

      {/* Backlit electric violet core panel */}
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[0.42, 0.24]} />
        <meshStandardMaterial
          color="#6D28D9"
          emissive="#A78BFA"
          emissiveIntensity={2.5}
          toneMapped={false}
        />
      </mesh>

      {/* Glowing Neon 3D Stencil Letter "N" */}
      <group position={[-0.09, 0, 0.035]}>
        {/* Left vertical bar */}
        <mesh position={[-0.055, 0, 0]}>
          <boxGeometry args={[0.026, 0.16, 0.02]} />
          <meshStandardMaterial color="#FFFFFF" emissive="#E9D5FF" emissiveIntensity={2.2} toneMapped={false} />
        </mesh>
        {/* Diagonal stroke */}
        <mesh position={[0, 0, 0]} rotation={[0, 0, -0.68]}>
          <boxGeometry args={[0.024, 0.175, 0.02]} />
          <meshStandardMaterial color="#FFFFFF" emissive="#E9D5FF" emissiveIntensity={2.2} toneMapped={false} />
        </mesh>
        {/* Right vertical bar */}
        <mesh position={[0.055, 0, 0]}>
          <boxGeometry args={[0.026, 0.16, 0.02]} />
          <meshStandardMaterial color="#FFFFFF" emissive="#E9D5FF" emissiveIntensity={2.2} toneMapped={false} />
        </mesh>
      </group>

      {/* Glowing Neon 3D Stencil Letter "X" */}
      <group position={[0.09, 0, 0.035]}>
        {/* Diagonal 1 */}
        <mesh position={[0, 0, 0]} rotation={[0, 0, 0.65]}>
          <boxGeometry args={[0.026, 0.175, 0.02]} />
          <meshStandardMaterial color="#FFFFFF" emissive="#E9D5FF" emissiveIntensity={2.2} toneMapped={false} />
        </mesh>
        {/* Diagonal 2 */}
        <mesh position={[0, 0, 0]} rotation={[0, 0, -0.65]}>
          <boxGeometry args={[0.026, 0.175, 0.02]} />
          <meshStandardMaterial color="#FFFFFF" emissive="#E9D5FF" emissiveIntensity={2.2} toneMapped={false} />
        </mesh>
      </group>

      {/* Micro serial stamp */}
      <mesh position={[0, -0.11, 0.018]}>
        <boxGeometry args={[0.26, 0.015, 0.01]} />
        <meshStandardMaterial color="#8B5CF6" emissive="#7C3AED" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

/**
 * A three-fingered pincer, curled inward as if cradling. `side` mirrors it;
 * `curl` lets the two hands sit at slightly different closures, because a pair
 * of identical hands is the fastest way to make a rig look dead.
 */
function Hand({ side, curl = 1 }: { side: number; curl?: number }) {
  return (
    <group>
      {/* Wrist collar */}
      <mesh>
        <cylinderGeometry args={[0.085, 0.1, 0.09, 10]} />
        <Joint />
      </mesh>
      {/* Palm block */}
      <mesh position={[0, -0.11, 0.02]} rotation={[0.25, 0, 0]}>
        <boxGeometry args={[0.17, 0.16, 0.11]} />
        <Shell />
      </mesh>
      {/* Three fingers, splayed across the palm and curling in */}
      {[-0.055, 0.002, 0.059].map((x, i) => (
        <group
          key={x}
          position={[x, -0.19, 0.06]}
          rotation={[0.55 * curl + i * 0.06, 0, -x * 2.2]}
        >
          <mesh>
            <cylinderGeometry args={[0.026, 0.03, 0.11, 6]} />
            <Shell />
          </mesh>
          <mesh position={[0, -0.075, 0.03]} rotation={[0.7 * curl, 0, 0]}>
            <cylinderGeometry args={[0.021, 0.026, 0.09, 6]} />
            <Joint />
          </mesh>
        </group>
      ))}
      {/* Opposed thumb */}
      <group position={[side * 0.085, -0.13, 0.06]} rotation={[0.5, 0, side * 0.9]}>
        <mesh>
          <cylinderGeometry args={[0.028, 0.032, 0.1, 6]} />
          <Shell />
        </mesh>
        <mesh position={[0, -0.07, 0.02]} rotation={[0.6, 0, 0]}>
          <cylinderGeometry args={[0.023, 0.028, 0.08, 6]} />
          <Joint />
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
    if (!el) return;
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

  // On mobile, the machine is centered and large, so a side dialogue box gets clipped.
  // We move it up and center it, changing the tail to point down.
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  return (
    <Html
      position={isMobile ? [0, 0.7, 0.5] : [-0.75, -0.15, 0.45]}
      center
      distanceFactor={7.0}
      zIndexRange={[100, 0]}
      style={{ pointerEvents: "none", userSelect: "none" }}
    >
      <div className="flex items-center gap-2 max-w-[280px] sm:max-w-[460px] md:max-w-[560px] pointer-events-none select-none">
        <div className="relative rounded-2xl border border-white/15 bg-background/95 px-4 py-2.5 sm:px-4.5 sm:py-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_12px_32px_-8px_rgba(0,0,0,0.9)] backdrop-blur-xl text-left">
          {/* Small speech tail pointing directly right to his jaw */}
          <span
            aria-hidden
            className="hidden sm:block absolute -right-1.5 top-4 h-3 w-3 rotate-45 border-r border-t border-white/15 bg-background/95"
          />
          <span
            aria-hidden
            className="sm:hidden absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-3 w-3 rotate-45 border-b border-r border-white/15 bg-background/95"
          />
          <p className="font-mono text-[10px] leading-[1.6] text-foreground/95 sm:text-xs md:text-sm md:leading-relaxed">
            <span ref={textRef} />
          </p>
        </div>
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
}) {
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
    const drift = reduce ? 0 : 1;

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
      group.current.rotation.y = Math.sin(t * 0.25) * 0.12 + sway * 0.18;
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
      // Idle drift + startle tilt, both offset from the posed values rather
      // than overwriting them, so the head keeps its counter-rotation.
      const idleZ = Math.sin(t * 0.45) * 0.05 * drift;
      const idleX = Math.sin(t * 0.35) * 0.04 * drift;
      head.current.rotation.z = THREE.MathUtils.lerp(
        head.current.rotation.z,
        target.headZ + idleZ - jolt * 0.22,
        a
      );
      head.current.rotation.x = THREE.MathUtils.lerp(
        head.current.rotation.x,
        target.headX + idleX + jolt * 0.16,
        a
      );
    }
    // Eyes brighten as the unit comes up — the clearest read on its state.
    // The stage drives them directly (dyn.eye); on the beat they pulse.
    const eyeTarget = (dyn ? dyn.eye : target.eye) + bob * 0.55 * dance;
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
    legs.current.forEach((g) => {
      if (g) g.position.y = apart * (-0.36 - wob);
    });
  });

  return (
    // Whole unit turned a few degrees off-axis and tipped at the shoulders, so
    // the silhouette is asymmetric before anything else is even read.
    <group ref={group} onPointerDown={poke} rotation={[0, 0.22, -0.035]}>
      {/* Everything above the hips leans as one, pivoting at the waist. */}
      <group ref={torso}>
      {/* Head — counter-rotated against the torso twist, and tilted. A head
          squared to the chest is the difference between a figure and a prop. */}
      <group ref={head} position={[0.03, 1.42, 0.02]} rotation={[0.05, -0.34, 0.08]}>
        <mesh castShadow>
          <sphereGeometry args={[0.62, 20, 16]} />
          <Shell />
        </mesh>

        {/* Dialogue speech line anchored directly near his mouth in 3D */}
        {line && <MouthDialogue line={line} />}

        {/* Antenna — a bent stalk, the one asymmetric detail on the whole unit */}
        <mesh position={[0.2, 0.58, -0.08]} rotation={[0.12, 0, -0.28]}>
          <cylinderGeometry args={[0.022, 0.03, 0.5, 6]} />
          <Shell color={SHELL_DARK} />
        </mesh>
        <mesh position={[0.29, 0.82, -0.09]}>
          <sphereGeometry args={[0.055, 10, 8]} />
          <meshStandardMaterial
            color="#6D28D9"
            emissive="#7C3AED"
            emissiveIntensity={0.9}
            toneMapped={false}
          />
        </mesh>

        {/* Jaw seam, tucked just under the sphere's surface */}
        <mesh position={[0, -0.22, 0.5]} rotation={[0.34, 0, 0]}>
          <boxGeometry args={[0.4, 0.045, 0.05]} />
          <Joint />
        </mesh>
        {/* Temple bolts */}
        {[-0.45, 0.45].map((x) => (
          <mesh key={x} position={[x, 0.04, 0.2]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.055, 0.055, 0.07, 8]} />
            <Joint />
          </mesh>
        ))}

        {/* Eyes: recessed lamp housings seated on the sphere's surface.
            Sphere r=0.62, so the face at these offsets sits at z≈0.57 — the
            housing is sunk a little behind that, and the lens sits inside it.
            The depth is what stops them reading as stickers. */}
        {[-0.23, 0.23].map((x) => (
          <group key={x} position={[x, 0.06, 0.5]} rotation={[0.04, x * 0.42, 0]}>
            {/* Bezel ring proud of the plate */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.155, 0.145, 0.09, 16]} />
              <Joint />
            </mesh>
            {/* Dark socket bored into it */}
            <mesh position={[0, 0, 0.028]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.118, 0.118, 0.075, 16]} />
              <Recess />
            </mesh>
            {/* Lens, sunk below the bezel lip */}
            <mesh position={[0, 0, 0.026]}>
              <sphereGeometry args={[0.098, 16, 14]} />
              {/* Deep violet, modest intensity — pushed any hotter it clips to
                  white and stops reading as the brand hue. Intensity is driven
                  by the pose, so the gaze reports the unit's state. */}
              <meshStandardMaterial
                ref={(m) => {
                  if (m) eyes.current[x < 0 ? 0 : 1] = m;
                }}
                color="#6D28D9"
                emissive="#7C3AED"
                emissiveIntensity={1.35}
                toneMapped={false}
              />
            </mesh>
          </group>
        ))}
        {/* Rivet band around the crown */}
        <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.42, 0.045, 8, 24]} />
          <Shell color={SHELL_DARK} />
        </mesh>
      </group>

      {/* Neck */}
      <mesh position={[0, 0.98, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 0.3, 10]} />
        <Shell color={SHELL_DARK} />
      </mesh>
      {/* Neck power ring */}
      <mesh position={[0, 0.9, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.16, 0.025, 8, 16]} />
        <meshStandardMaterial color="#8B5CF6" emissive="#7C3AED" emissiveIntensity={0.6} />
      </mesh>

      {/* Barrel torso */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.62, 1.05, 14]} />
        <Shell />
      </mesh>
      {/* Waist band + a second seam, so the body reads as bolted sections */}
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.53, 0.53, 0.16, 14]} />
        <Shell color={SHELL_DARK} />
      </mesh>
      <mesh position={[0, 0.74, 0]}>
        <cylinderGeometry args={[0.505, 0.505, 0.07, 14]} />
        <Shell color={SHELL_DARK} />
      </mesh>

      {/* NX Chest Tattoo — bold, stencil-milled industrial logo with backlit violet core */}
      <NxChestTattoo />

      {/* Chest status indicator LEDs flanking the tattoo */}
      {[-0.22, 0.22].map((x) => (
        <mesh key={x} position={[x, 0.65, 0.48]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshStandardMaterial
            color="#8B5CF6"
            emissive="#A78BFA"
            emissiveIntensity={1.2}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Power conduits connecting chest to shoulder joints */}
      {[-0.32, 0.32].map((x, i) => (
        <mesh
          key={i}
          position={[x, 0.76, 0.26]}
          rotation={[0.3, 0, i === 0 ? -0.4 : 0.4]}
        >
          <cylinderGeometry args={[0.022, 0.022, 0.35, 8]} />
          <Joint />
        </mesh>
      ))}

      {/* Chest vent slats */}
      {[0.24, 0.16].map((y) => (
        <mesh key={y} position={[0, y, 0.54]} rotation={[0.08, 0, 0]}>
          <boxGeometry args={[0.26, 0.025, 0.04]} />
          <Shell color={SHELL_DARK} />
        </mesh>
      ))}

      {/* Hip collar */}
      <mesh position={[0, -0.12, 0]}>
        <cylinderGeometry args={[0.46, 0.4, 0.2, 12]} />
        <Shell color={SHELL_DARK} />
      </mesh>

      {/* Arms. Cradling the payload, and deliberately unmatched: the right sits
          higher and closed tighter, the left hangs lower and looser. Mirrored
          limbs are what make a rig look like a toy. */}
      {([
        { s: -1, shoulderY: 0.7, upper: 0.24, fore: 0.58, curl: 0.85 },
        { s: 1, shoulderY: 0.78, upper: 0.36, fore: 0.72, curl: 1.15 },
      ] as const).map(({ s, shoulderY, upper, fore, curl }, i) => (
        <group
          key={s}
          ref={(el) => {
            arms.current[i] = el;
          }}
        >
          {/* Pauldron cap over the joint */}
          <mesh position={[s * 0.6, shoulderY + 0.06, 0]} rotation={[0, 0, s * 0.2]}>
            <sphereGeometry args={[0.26, 14, 10, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
            <Shell />
          </mesh>
          <mesh position={[s * 0.6, shoulderY, 0]}>
            <sphereGeometry args={[0.22, 14, 12]} />
            <Joint />
          </mesh>
          {/* Upper arm */}
          <mesh position={[s * 0.72, shoulderY - 0.42, 0.08]} rotation={[upper, 0, s * 0.12]}>
            <cylinderGeometry args={[0.105, 0.115, 0.62, 10]} />
            <Shell />
          </mesh>
          {/* Elbow */}
          <mesh position={[s * 0.68, shoulderY - 0.72, 0.22]}>
            <sphereGeometry args={[0.13, 12, 10]} />
            <Joint />
          </mesh>
          {/* Forearm, angled in toward the held monolith */}
          <mesh position={[s * 0.6, shoulderY - 0.95, 0.44]} rotation={[fore, 0, s * 0.2]}>
            <cylinderGeometry args={[0.095, 0.105, 0.5, 10]} />
            <Shell />
          </mesh>
          {/* Hand, rolled inward under the payload */}
          <group
            position={[s * 0.5, shoulderY - 1.14, 0.66]}
            rotation={[0.5, s * 0.3, -s * 0.45]}
          >
            <Hand side={s} curl={curl} />
          </group>
        </group>
      ))}

      </group>

      {/* Legs in contrapposto: weight on the left, right leg eased forward and
          turned out. Even a few degrees of asymmetry reads as standing rather
          than being propped up. */}
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
          {/* Hip ball */}
          <mesh position={[0, -0.3, 0]}>
            <sphereGeometry args={[0.16, 12, 10]} />
            <Joint />
          </mesh>
          {/* Thigh + shin as one tapered strut, angled by `tilt` */}
          <mesh position={[0, -0.62, 0]} rotation={[tilt, 0, 0]}>
            <cylinderGeometry args={[0.13, 0.15, len, 10]} />
            <Shell />
          </mesh>
          {/* Knee collar */}
          <mesh position={[0, -0.66, tilt * 0.22]}>
            <cylinderGeometry args={[0.145, 0.145, 0.08, 10]} />
            <Joint />
          </mesh>
          {/* Ankle + splayed foot pad */}
          <mesh position={[0, -1.0, tilt * 0.34]}>
            <sphereGeometry args={[0.13, 12, 10]} />
            <Joint />
          </mesh>
          <mesh position={[0, -1.13, tilt * 0.34 + 0.06]}>
            <cylinderGeometry args={[0.14, 0.22, 0.16, 10]} />
            <Shell />
          </mesh>
        </group>
      ))}
    </group>
  );
}
