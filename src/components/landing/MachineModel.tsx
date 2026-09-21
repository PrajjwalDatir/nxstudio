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
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";

export { usePrefersReducedMotion };

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
  dormant: { headX: 0.5, headZ: 0.16, lean: 0.16, eye: 0.12, armL: 0.18, armR: 0.18 },
  briefed: { headX: 0.12, headZ: 0.1, lean: 0.05, eye: 0.95, armL: 0.22, armR: 0.28 },
  ready: { headX: -0.1, headZ: 0.05, lean: -0.04, eye: 1.6, armL: 0.22, armR: 0.28 },
  curious: { headX: 0.14, headZ: -0.32, lean: 0.02, eye: 0.6, armL: 0.18, armR: 0.32 },
  excited: { headX: -0.22, headZ: 0.06, lean: -0.1, eye: 1.4, armL: 0.45, armR: 0.45 },
  proud: { headX: -0.02, headZ: 0.0, lean: -0.02, eye: 1.0, armL: 0.20, armR: 0.20 },
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
    grad.addColorStop(1, "#7C3AED");
  } else {
    grad.addColorStop(0, "#DDD6FE");
    grad.addColorStop(1, "#C4B5FD");
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

let _robotEyeTex: THREE.CanvasTexture | null = null;

function robotEyeTexture(): THREE.CanvasTexture | null {
  if (_robotEyeTex) return _robotEyeTex;
  if (typeof document === "undefined") return null;

  const w = 512;
  const h = 256;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Deep obsidian OLED screen background
  ctx.fillStyle = "#04040A";
  ctx.fillRect(0, 0, w, h);

  // Subtle ambient brand lilac inner glow on screen edges
  const vig = ctx.createRadialGradient(w / 2, h / 2, 60, w / 2, h / 2, w / 2);
  vig.addColorStop(0, "rgba(196, 181, 253, 0.08)");
  vig.addColorStop(0.6, "rgba(167, 139, 250, 0.03)");
  vig.addColorStop(1, "rgba(2, 2, 8, 0.98)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  // Function to draw one expressive happy arch eye in brand lilac
  const drawEye = (cx: number, cy: number, eyeWidth: number, eyeHeight: number) => {
    const drawCrescent = (inset = 0, fillStyle: string, blur = 0, shadowColor: string | null = null) => {
      ctx.save();
      if (blur > 0 && shadowColor) {
        ctx.shadowColor = shadowColor;
        ctx.shadowBlur = blur;
      }
      ctx.fillStyle = fillStyle;

      const w2 = eyeWidth * 0.45 - inset * 0.4;
      const topY = cy - eyeHeight * 0.46 + inset * 0.8;
      const innerY = cy - eyeHeight * 0.12 + inset * 1.2;
      const tipY = cy + eyeHeight * 0.22 - inset * 0.2;

      ctx.beginPath();
      // Left rounded tip
      ctx.moveTo(cx - w2, tipY);
      // Top outer curve
      ctx.bezierCurveTo(
        cx - w2 * 0.45,
        topY,
        cx + w2 * 0.45,
        topY,
        cx + w2,
        tipY
      );
      // Right tip round-over
      ctx.quadraticCurveTo(cx + w2 + 4 - inset * 0.2, tipY + 8, cx + w2 - 6, tipY + 6);
      // Bottom inner curve
      ctx.bezierCurveTo(
        cx + w2 * 0.4,
        innerY,
        cx - w2 * 0.4,
        innerY,
        cx - w2 + 6,
        tipY + 6
      );
      // Left tip round-over
      ctx.quadraticCurveTo(cx - w2 - 4 + inset * 0.2, tipY + 8, cx - w2, tipY);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    // Layer 1: Wide luminous brand lilac glow
    drawCrescent(-8, "rgba(196, 181, 253, 0.45)", 34, "#C4B5FD");

    // Layer 2: Radiant brand lilac body
    drawCrescent(0, "#C4B5FD", 22, "#A78BFA");

    // Layer 3: Vibrant light violet/lilac core
    drawCrescent(4, "#DDD6FE", 14, "#C4B5FD");

    // Layer 4: Bright pastel lilac core
    drawCrescent(8, "#EDE9FE", 8, "#DDD6FE");

    // Layer 5: Pure crest white/lilac shimmer
    drawCrescent(12, "#FFFFFF", 4, "#EDE9FE");
  };

  // Draw left and right eyes
  const eyeY = h * 0.52;
  const eyeW = w * 0.28;
  const eyeH = h * 0.54;
  drawEye(w * 0.31, eyeY, eyeW, eyeH);
  drawEye(w * 0.69, eyeY, eyeW, eyeH);

  // Digital OLED horizontal scanlines overlay
  ctx.save();
  ctx.fillStyle = "rgba(4, 4, 10, 0.45)";
  for (let y = 0; y < h; y += 4) {
    ctx.fillRect(0, y, w, 1.6);
  }
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 16;
  _robotEyeTex = tex;
  return tex;
}

/**
 * NX Emblem mounted on the main machine's front chest.
 * Displays the authentic official nxstudio hexagonal brand monolith emblem.
 */
function NxChestTattoo() {
  const isLight = useIsLightMode();
  const badgeTex = nxBadgeTexture(isLight);
  // Conical torso slopes at ~0.114 rad; match tilt angle so the monitor lies flush against the chest
  return (
    <group position={[0, 0.44, 0.585]} rotation={[-0.114, 0, 0]}>
      {/* Outer bezel frame - deep enough so the back embeds solidly into the curved chest sides with zero floating gaps */}
      <mesh position={[0, 0, -0.015]}>
        <boxGeometry args={[0.42, 0.30, 0.05]} />
        <meshStandardMaterial color={isLight ? "#A8A4C0" : "#221E34"} metalness={isLight ? 0.75 : 0.85} roughness={0.2} />
      </mesh>

      {/* Official nxstudio Brand Logo Faceplate */}
      <mesh position={[0, 0, 0.015]}>
        <planeGeometry args={[0.39, 0.27]} />
        <meshStandardMaterial
          map={badgeTex}
          emissiveMap={badgeTex}
          emissive="#FFFFFF"
          emissiveIntensity={1.4}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
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
  const eyeTex = robotEyeTexture();
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
    // Eyes brighten as the unit comes up — vibrant electric cyan digital display.
    // The stage drives them directly (dyn.eye); on the beat they pulse.
    const eyeTarget = dyn ? dyn.eye : target.eye;
    const eyeGlow = Math.max(1.4, eyeTarget * 2.4);
    eyes.current.forEach((m) => {
      if (m) m.emissiveIntensity = THREE.MathUtils.lerp(m.emissiveIntensity, eyeGlow, a);
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
      const s = i === 0 ? -1 : 1;
      const baseArm = i === 0 ? target.armR : target.armL;

      g.position.x = apart * (i === 0 ? -0.5 : 0.5);
      g.position.y = apart * (0.24 + wob);

      // Dance: the arms lift and wave in opposition, in time with the bounce.
      // Both arms rotate outward away from the flared conical torso (s * angle),
      // bounded safely so hands and forearms never clip into the body.
      const wave = 0.5 + 0.5 * Math.sin(beat + (i === 0 ? 0 : Math.PI));
      const danceOutward = 0.18 + 0.38 * wave;
      const armOutward = THREE.MathUtils.lerp(baseArm, danceOutward, dance);
      g.rotation.z = s * armOutward;

      // Natural forward/back swing synced with hip sway tempo
      const danceForward = Math.sin(beat * 0.5 + (i === 0 ? 0 : Math.PI)) * 0.14 + 0.1;
      g.rotation.x = THREE.MathUtils.lerp(0, danceForward, dance);
      g.rotation.y = THREE.MathUtils.lerp(0, s * 0.08, dance);
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
        {/* Main helmet sphere — 36 segments for smooth rounded finish */}
        <mesh castShadow>
          <sphereGeometry args={[0.62, 36, 24]} />
          <Shell />
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

        {/* Temple ear-sensor nodules — sleek brand lilac sensors */}
        {[-0.52, 0.52].map((x) => (
          <group key={x} position={[x, 0.08, 0.1]} rotation={[0, 0, Math.PI / 2]}>
            <mesh>
              <cylinderGeometry args={[0.08, 0.08, 0.09, 14]} />
              <Joint />
            </mesh>
            <mesh position={[0, 0.05 * Math.sign(x), 0]}>
              <sphereGeometry args={[0.048, 14, 12]} />
              <meshStandardMaterial color="#A78BFA" emissive="#C4B5FD" emissiveIntensity={2.8} toneMapped={false} />
            </mesh>
          </group>
        ))}

        {/* Sleek Dark Visor Bezel Rim — framing the OLED display smoothly into the helmet contour */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.624, 32, 20, Math.PI * 0.5 - 0.56, 1.12, 1.12, 0.68]} />
          <meshStandardMaterial color="#12101C" roughness={0.35} metalness={0.85} side={THREE.DoubleSide} />
        </mesh>

        {/* High-Gloss OLED Face Visor Screen with Glowing Lilac Crescent Eyes */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.627, 32, 20, Math.PI * 0.5 - 0.52, 1.04, 1.16, 0.60]} />
          <meshPhysicalMaterial
            ref={(m) => {
              if (m) eyes.current[0] = m;
            }}
            map={eyeTex}
            emissiveMap={eyeTex}
            emissive="#C4B5FD"
            emissiveIntensity={3.2}
            roughness={0.06}
            metalness={0.12}
            clearcoat={1.0}
            clearcoatRoughness={0.03}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>

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

      {/* Segmented Barrel Torso — 40 radial segments for smooth curvature without low-poly facet seams */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.52, 0.64, 1.05, 40]} />
        <Shell />
      </mesh>

      {/* NX Chest Emblem */}
      <NxChestTattoo />

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
          position={[s * 0.62, shoulderY, 0]}
        >
          <group
            ref={(el) => {
              arms.current[i] = el;
            }}
          >
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
