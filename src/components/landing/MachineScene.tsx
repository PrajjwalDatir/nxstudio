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
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { ContactShadows, Environment, Float, Sparkles } from "@react-three/drei";
import CameraControls from "camera-controls";
import * as THREE from "three";
import { Machine, usePrefersReducedMotion, useIsLightMode, type MachineHitState } from "./MachineModel";
import { lampOrigin } from "./lamp-origin";

function SceneLighting({ heroX }: { heroX: number }) {
  const isLight = useIsLightMode();
  return (
    <>
      <fog attach="fog" args={[isLight ? "#FFFFFF" : "#08070D", 14, 38]} />
      {/* High-Visibility Studio Ambient Fill */}
      <ambientLight intensity={isLight ? 1.4 : 1.1} />
      {/* Soft Environmental Studio Hemisphere Light */}
      <hemisphereLight
        args={[
          isLight ? "#F1F5F9" : "#3B0764",
          isLight ? "#E2E8F0" : "#090811",
          isLight ? 1.2 : 0.95,
        ]}
      />
      {/* Front Center Key Light — illuminates full hero stage, lamps, and machine */}
      <directionalLight position={[heroX - 1.0, 4.2, 5.0]} intensity={isLight ? 4.8 : 3.6} color="#FFFFFF" />
      <pointLight position={[heroX + 0.4, 2.2, 3.2]} intensity={isLight ? 32 : 45} distance={14} color="#C084FC" />
      <directionalLight position={[-5, 2.0, 2]} intensity={isLight ? 1.6 : 2.2} color={isLight ? "#94A3B8" : "#A78BFA"} />
      <pointLight position={[heroX + 0.6, 2, -3]} intensity={isLight ? 35 : 48} distance={15} color="#8B5CF6" />
    </>
  );
}

/**
 * Photorealistic Volumetric Light Cone with dual-axis opacity falloff:
 *   1. Vertical: fades from full brightness at the source to 0% at the far end
 *   2. Radial:   fades from full brightness along the centre axis to 0% at the outer rim
 * Renders 3 nested cones at slightly different scales for soft volumetric depth,
 * mimicking real atmospheric light scattering with no hard geometric edges.
 */
function VolumetricLightCone({
  topRadius = 0.22,
  bottomRadius = 1.4,
  height = 3.8,
  position = [0, -1.9, 0] as [number, number, number],
  rotation = [0, 0, 0] as [number, number, number],
  color = "#FDE047",
  peakOpacity,
}: {
  topRadius?: number;
  bottomRadius?: number;
  height?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
  peakOpacity?: number;
}) {
  const isLight = useIsLightMode();
  const peak = peakOpacity ?? (isLight ? 0.06 : 0.18);

  // Build vertex colours with dual-axis falloff for a single cone layer
  const applyGradient = (geo: THREE.CylinderGeometry, scale: number, opacityMul: number) => {
    const pos = geo.attributes.position;
    const count = pos.count;
    const arr = new Float32Array(count * 4);
    const c = new THREE.Color(color);
    const halfH = height / 2;

    for (let i = 0; i < count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);

      // Vertical ratio: 1 at source end, 0 at far end
      const vRatio = Math.max(0, Math.min(1, (y + halfH) / height));

      // Radial ratio: how far this vertex is from the centre axis (0 = centre, 1 = rim)
      const radialDist = Math.sqrt(x * x + z * z);
      // Interpolated max-radius at this y-slice
      const sliceRadius = THREE.MathUtils.lerp(bottomRadius * scale, topRadius * scale, vRatio);
      const rRatio = sliceRadius > 0.001 ? Math.min(1, radialDist / sliceRadius) : 0;

      // Combine: smooth power curves on both axes, multiplied together
      const vAlpha = Math.pow(vRatio, 2.2);          // vertical: cubic-ish
      const rAlpha = Math.pow(1 - rRatio, 2.5);      // radial: fades toward rim
      const alpha = vAlpha * rAlpha * peak * opacityMul;

      arr[i * 4]     = c.r;
      arr[i * 4 + 1] = c.g;
      arr[i * 4 + 2] = c.b;
      arr[i * 4 + 3] = alpha;
    }

    geo.setAttribute("color", new THREE.BufferAttribute(arr, 4));
  };

  // Three nested layers at different scales for soft volumetric depth
  const layers = [
    { scale: 1.0,  opacity: 1.0  },   // outer: full-size, softest
    { scale: 0.6,  opacity: 1.4  },   // mid:   slightly brighter core
    { scale: 0.25, opacity: 1.8  },   // inner: bright centre beam
  ];

  return (
    <group position={position} rotation={rotation}>
      {layers.map((layer, idx) => (
        <mesh key={idx}>
          <cylinderGeometry
            ref={(geo: THREE.CylinderGeometry | null) => {
              if (geo) applyGradient(geo, layer.scale, layer.opacity);
            }}
            args={[
              topRadius * layer.scale,
              bottomRadius * layer.scale,
              height,
              32,
              20,
              true,
            ]}
          />
          <meshBasicMaterial
            vertexColors
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

/**
 * 3D Industrial Wall Lamp suspended from a cable above the machine.
 * Gently sways on initial page load and when the user scrolls down the page,
 * casting an authentic warm yellow studio spotlight onto the machine shell.
 */
const BULB_REST_COLOR = new THREE.Color("#FFB700");
const BULB_SPARK_COLOR = new THREE.Color("#FF3B1A");
// Total arc of the post-snap flourish: a hot ignition spike, then a settle back to the resting glow.
const SPARK_IGNITE_S = 0.1;
const SPARK_SETTLE_S = 0.6;
// Ceiling on the swing angle toward the machine for safety margin
const MAX_SWING_TOWARD_MACHINE = 1.15;

function SwingingLamp({
  heroX,
  paused = false,
  onPoke,
}: {
  heroX: number;
  paused?: boolean;
  onPoke?: () => void;
}) {
  const isLight = useIsLightMode();
  const lampRef = useRef<THREE.Group>(null);
  const lastScrollY = useRef(0);
  const swingAngle = useRef(0);
  const swingVelocity = useRef(0);
  const initialLoadTime = useRef<number | null>(null);
  const lastLampHitTime = useRef(0);
  const pausedRef = useRef(paused);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const sparkElapsed = useRef<number | null>(null);
  const bulbMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const sparkRef = useRef<THREE.Mesh>(null);
  const originFrameCount = useRef(0);

  // Scroll listener: fluid pendulum sway in response to page scrolling
  useEffect(() => {
    lastScrollY.current = window.scrollY;
    const handleScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY.current;
      if (Math.abs(delta) > 1 && !pausedRef.current) {
        const impulse = Math.min(Math.abs(delta) * 0.0008, 0.045) * Math.sign(delta);
        swingVelocity.current = THREE.MathUtils.clamp(
          swingVelocity.current + impulse,
          -0.5,
          0.5
        );
      }
      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const onDarkSnap = () => {
      sparkElapsed.current = 0;
    };
    window.addEventListener("nx:theme-dark-snap", onDarkSnap);
    return () => window.removeEventListener("nx:theme-dark-snap", onDarkSnap);
  }, []);

  useFrame((state, delta) => {
    if (initialLoadTime.current === null) {
      initialLoadTime.current = state.clock.getElapsedTime();
    }
    const elapsed = state.clock.getElapsedTime() - initialLoadTime.current;

    let loadImpulse = 0;
    if (elapsed < 5.0) {
      loadImpulse = Math.sin(elapsed * 1.6) * Math.exp(-elapsed * 0.5) * 0.35;
    }

    // Pendulum physics loop driven purely by scroll & load impulses
    swingAngle.current += swingVelocity.current;
    swingVelocity.current *= 0.982;
    swingVelocity.current -= swingAngle.current * 0.024;

    const totalZ = swingAngle.current + loadImpulse;
    const totalX = Math.sin(state.clock.getElapsedTime() * 1.2) * Math.abs(totalZ) * 0.2;

    if (lampRef.current) {
      lampRef.current.rotation.z = THREE.MathUtils.lerp(lampRef.current.rotation.z, totalZ, 0.08);
      lampRef.current.rotation.x = THREE.MathUtils.lerp(lampRef.current.rotation.x, totalX, 0.08);

      // Project the shade's screen position every few frames for theme toggle
      originFrameCount.current += 1;
      if (originFrameCount.current % 4 === 0) {
        const worldPos = lampRef.current.localToWorld(new THREE.Vector3(0, -3.6, 0));
        const ndc = worldPos.project(state.camera);
        const rect = state.gl.domElement.getBoundingClientRect();
        lampOrigin.x = rect.left + (ndc.x * 0.5 + 0.5) * rect.width;
        lampOrigin.y = rect.top + (1 - (ndc.y * 0.5 + 0.5)) * rect.height;
      }
    }

    // Post-snap flourish: a hot spark near the bulb, then its glow settles red → yellow.
    if (sparkElapsed.current !== null) {
      sparkElapsed.current += delta;
      const t = sparkElapsed.current;
      const restIntensity = isLight ? 7.0 : 20.0;

      if (bulbMaterialRef.current) {
        if (t < SPARK_IGNITE_S) {
          bulbMaterialRef.current.emissive.copy(BULB_SPARK_COLOR);
          bulbMaterialRef.current.emissiveIntensity = THREE.MathUtils.lerp(
            restIntensity,
            restIntensity * 2.6,
            t / SPARK_IGNITE_S
          );
        } else {
          const settleT = Math.min(1, (t - SPARK_IGNITE_S) / SPARK_SETTLE_S);
          bulbMaterialRef.current.emissive.lerpColors(BULB_SPARK_COLOR, BULB_REST_COLOR, settleT);
          bulbMaterialRef.current.emissiveIntensity = THREE.MathUtils.lerp(
            restIntensity * 2.6,
            restIntensity,
            settleT
          );
        }
      }

      if (sparkRef.current) {
        const popT = Math.min(1, t / 0.16);
        const scale = t < 0.16 ? THREE.MathUtils.lerp(0.001, 1, popT) : Math.max(0.001, 1 - (t - 0.16) / 0.3);
        sparkRef.current.scale.setScalar(scale);
        const mat = sparkRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(0, scale);
      }

      if (t > SPARK_IGNITE_S + SPARK_SETTLE_S) {
        sparkElapsed.current = null;
        if (bulbMaterialRef.current) {
          bulbMaterialRef.current.emissive.copy(BULB_REST_COLOR);
          bulbMaterialRef.current.emissiveIntensity = restIntensity;
        }
        if (sparkRef.current) sparkRef.current.scale.setScalar(0.001);
      }
    }
  });

  // Placed further in background at Z = -2.5 behind the machine at Z = 0
  const wallPivot: [number, number, number] = [
    heroX < 0 ? heroX + 1.2 : heroX > 0 ? 0.9 : 0,
    4.4,
    -2.5,
  ];

  return (
    <group position={wallPivot}>
      {/* Wall anchor bracket */}
      <mesh position={[0, 0, -0.2]}>
        <boxGeometry args={[0.32, 0.32, 0.12]} />
        <meshStandardMaterial color={isLight ? "#CBD5E1" : "#3B384E"} metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Swinging Pendulum Group */}
      <group ref={lampRef}>
        {/* Heavy braided steel suspension cable */}
        <mesh position={[0, -1.8, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 3.6, 10]} />
          <meshStandardMaterial color={isLight ? "#94A3B8" : "#38354A"} metalness={0.9} roughness={0.3} />
        </mesh>

        {/* Larger Industrial Bell Lamp Shade */}
        <group position={[0, -3.6, 0]} rotation={[0, 0, 0]}>
          {/* Outer shade shell */}
          <mesh>
            <cylinderGeometry args={[0.24, 0.62, 0.54, 28, 1, true]} />
            <meshStandardMaterial
              color={isLight ? "#D0D0E2" : "#1A1828"}
              metalness={isLight ? 0.85 : 0.92}
              roughness={0.15}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Inner reflective amber warmth lining */}
          <mesh position={[0, -0.02, 0]}>
            <cylinderGeometry args={[0.23, 0.60, 0.50, 28, 1, true]} />
            <meshStandardMaterial
              color="#F59E0B"
              metalness={0.95}
              roughness={0.1}
              side={THREE.BackSide}
            />
          </mesh>

          {/* Heavy brass top fixture cap */}
          <mesh position={[0, 0.31, 0]}>
            <cylinderGeometry args={[0.10, 0.15, 0.12, 16]} />
            <meshStandardMaterial color="#EAB308" metalness={0.92} roughness={0.15} />
          </mesh>

          {/* Enlarged Glowing Tungsten Yellow Light Bulb Core */}
          <mesh position={[0, -0.06, 0]}>
            <sphereGeometry args={[0.20, 24, 20]} />
            <meshStandardMaterial
              ref={bulbMaterialRef}
              color="#FFE066"
              emissive="#FFB700"
              emissiveIntensity={isLight ? 7.0 : 20.0}
              toneMapped={false}
            />
          </mesh>

          {/* One-shot ignition spark */}
          <mesh ref={sparkRef} position={[0.12, 0.02, 0.1]} scale={0.001}>
            <sphereGeometry args={[0.065, 12, 10]} />
            <meshBasicMaterial
              color="#FFF3D0"
              transparent
              opacity={0}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>

          {/* Photorealistic Volumetric Light Cone */}
          <VolumetricLightCone
            position={[0, -2.1, 0]}
            height={4.2}
            topRadius={0.28}
            bottomRadius={1.8}
            color="#FDE047"
          />

          {/* Radiant Background Studio Point Light */}
          <pointLight
            position={[0, -0.15, 0]}
            intensity={isLight ? 160 : 700}
            distance={36}
            color="#FFD000"
          />

          {/* High-Intensity Downward Background Studio Spotlight (angled forward toward machine) */}
          <spotLight
            position={[0, 0, 0]}
            target-position={[heroX, -0.15, 2.5]}
            angle={0.92}
            penumbra={0.35}
            intensity={isLight ? 240 : 850}
            distance={36}
            color="#FFD000"
          />
        </group>
      </group>
    </group>
  );
}

/**
 * 3D Industrial Ground Uplight Spotlight (built directly from user's reference photo).
 * Mounted at the bottom of the hero stage at the leftish center position,
 * angled upward and rightward pointing directly at the machine's chest, head, and pauldrons.
 * Micro-swivels reactively on initial load and page scroll.
 */
function FloorSpotlight({ heroX }: { heroX: number }) {
  const isLight = useIsLightMode();
  const lightHousingRef = useRef<THREE.Group>(null);
  const lastScrollY = useRef(0);
  const swivelAngle = useRef(0);
  const swivelVelocity = useRef(0);
  const initialLoadTime = useRef<number | null>(null);

  useEffect(() => {
    lastScrollY.current = window.scrollY;
    const handleScroll = () => {
      const currentY = window.scrollY;
      const delta = Math.abs(currentY - lastScrollY.current);
      if (delta > 1) {
        const direction = currentY > lastScrollY.current ? 1 : -1;
        swivelVelocity.current += Math.min(delta * 0.0003, 0.025) * direction;
      }
      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useFrame((state) => {
    if (initialLoadTime.current === null) {
      initialLoadTime.current = state.clock.getElapsedTime();
    }
    const elapsed = state.clock.getElapsedTime() - initialLoadTime.current;

    let loadImpulse = 0;
    if (elapsed < 4.0) {
      loadImpulse = Math.sin(elapsed * 2.5) * Math.exp(-elapsed * 0.9) * 0.14;
    }

    swivelAngle.current += swivelVelocity.current;
    swivelVelocity.current *= 0.92;
    swivelVelocity.current -= swivelAngle.current * 0.05;

    const totalTilt = swivelAngle.current + loadImpulse;

    if (lightHousingRef.current) {
      lightHousingRef.current.rotation.x = THREE.MathUtils.lerp(
        lightHousingRef.current.rotation.x,
        -0.45 + totalTilt * 0.3,
        0.1
      );
      lightHousingRef.current.rotation.y = THREE.MathUtils.lerp(
        lightHousingRef.current.rotation.y,
        (heroX < 0 ? -0.55 : 0.55) + totalTilt * 0.4,
        0.1
      );
    }
  });

  const floorPos: [number, number, number] = [
    heroX < 0 ? heroX + 0.6 : heroX > 0 ? heroX - 0.6 : -0.6,
    -2.4,
    0.6,
  ];

  return (
    <group position={floorPos}>
      <mesh position={[0, -0.04, 0]}>
        <cylinderGeometry args={[0.26, 0.28, 0.07, 24]} />
        <meshStandardMaterial
          color={isLight ? "#9090A2" : "#14131C"}
          metalness={isLight ? 0.8 : 0.92}
          roughness={0.25}
        />
      </mesh>

      <mesh position={[0, 0.01, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.06, 12]} />
        <meshStandardMaterial color={isLight ? "#7C3AED" : "#A78BFA"} metalness={0.9} roughness={0.2} />
      </mesh>

      {[-0.18, 0.18].map((x) => (
        <mesh key={x} position={[x, 0.14, 0]}>
          <boxGeometry args={[0.032, 0.26, 0.07]} />
          <meshStandardMaterial
            color={isLight ? "#78788A" : "#1A1926"}
            metalness={0.88}
            roughness={0.3}
          />
        </mesh>
      ))}

      <group ref={lightHousingRef} position={[0, 0.18, 0]} rotation={[-0.45, 0.55, -0.2]}>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.2, 0.45, 24]} />
          <meshStandardMaterial
            color={isLight ? "#A0A0B2" : "#161522"}
            metalness={isLight ? 0.8 : 0.92}
            roughness={0.2}
          />
        </mesh>

        <mesh position={[0, 0.23, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.21, 0.025, 12, 24]} />
          <meshStandardMaterial
            color={isLight ? "#606072" : "#0E0D16"}
            metalness={0.92}
            roughness={0.15}
          />
        </mesh>

        {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((angle, i) => (
          <mesh
            key={i}
            position={[
              Math.cos(angle) * 0.2,
              0.23,
              Math.sin(angle) * 0.2,
            ]}
          >
            <cylinderGeometry args={[0.015, 0.015, 0.03, 8]} />
            <meshStandardMaterial color={isLight ? "#7C3AED" : "#A78BFA"} metalness={0.95} roughness={0.1} />
          </mesh>
        ))}

        <mesh position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.03, 20]} />
          <meshStandardMaterial
            color={isLight ? "#E2E8F0" : "#1E1B4B"}
            roughness={0.1}
            metalness={0.5}
            transparent
            opacity={0.75}
          />
        </mesh>

        {/* Glowing Tungsten Yellow Light Bulb Core — High Brightness */}
        <mesh position={[0, 0.12, 0]}>
          <sphereGeometry args={[0.13, 20, 16]} />
          <meshStandardMaterial
            color="#FFE066"
            emissive="#FFB700"
            emissiveIntensity={isLight ? 15.0 : 45.0}
            toneMapped={false}
          />
        </mesh>

        {/* Photorealistic Upward Volumetric Light Cone — High Beam Visibility */}
        <VolumetricLightCone
          position={[0, 2.0, 0]}
          height={4.2}
          topRadius={1.5}
          bottomRadius={0.25}
          color="#FDE047"
          peakOpacity={isLight ? 0.25 : 0.55}
        />

        {/* Radiant Studio Point Light — Brightened */}
        <pointLight
          position={[0, 0.22, 0]}
          intensity={isLight ? 300 : 1350}
          distance={36}
          color="#FFD000"
        />

        {/* Upward High-Intensity Warm Yellow Studio Spotlight — Brightened */}
        <spotLight
          position={[0, 0.22, 0]}
          target-position={[heroX > 0 ? 3.3 : 0, 1.2, 0]}
          angle={0.9}
          penumbra={0.35}
          intensity={isLight ? 450 : 1800}
          distance={36}
          color="#FFD000"
        />
      </group>
    </group>
  );
}

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
  const isLight = useIsLightMode();
  const reduce = usePrefersReducedMotion();
  const isDesktop = useIsDesktop();
  const hitRef = useRef<MachineHitState | null>(null);
  const heroX = isDesktop ? -3.3 : 0;

  return (
    <Canvas
      dpr={[1, 1.8]}
      frameloop={paused ? "never" : "always"}
      camera={{ position: [0, 0.5, 9.2], fov: 40 }}
      gl={{ alpha: true, antialias: true }}
      style={{ background: "transparent" }}
    >
      {/* Dynamic Theme Studio Lighting & Fog */}
      <SceneLighting heroX={heroX} />

      <GuidedCamera />

      <Suspense fallback={null}>
        {/* Radiant Ambient Wall Reflection Light Pool */}
        <pointLight
          position={[heroX < 0 ? -0.9 : heroX > 0 ? 0.9 : 0, 1.8, -1.2]}
          intensity={isLight ? 140 : 420}
          distance={18}
          color={isLight ? "#7C3AED" : "#C084FC"}
        />

        {/* Top-suspended swinging industrial bell lamp */}
        <SwingingLamp heroX={heroX} paused={paused} onPoke={onPoke} />

        {/* Hero Machine */}
        <group position={[heroX, -0.15, 0]}>
          {reduce ? (
            <Machine reduce onPoke={onPoke} pose="ready" line={line} hitRef={hitRef} facing={isDesktop ? 0.44 : 0} />
          ) : (
            <Float speed={1.1} rotationIntensity={0.12} floatIntensity={0.35}>
              <Machine reduce={false} onPoke={onPoke} pose="ready" line={line} hitRef={hitRef} facing={isDesktop ? 0.44 : 0} />
            </Float>
          )}
        </group>

        {/* Ambient Studio Atmospheric Dust Motes placed far back in background depth */}
        <Sparkles
          count={120}
          scale={[14, 9, 3]}
          position={[0, 0, -4]}
          raycast={() => null}
          size={2.6}
          speed={0.22}
          color={isLight ? "#8B5CF6" : "#DDD6FE"}
          opacity={isLight ? 0.45 : 0.65}
        />

        {/* Dense Volumetric Dust Particles placed far back behind the spotlight beams */}
        <Sparkles
          count={80}
          scale={[6, 6, 2]}
          position={[heroX * 0.6, 0.2, -3]}
          raycast={() => null}
          size={3.6}
          speed={0.42}
          color={isLight ? "#A78BFA" : "#EDE9FE"}
          opacity={isLight ? 0.6 : 0.85}
        />
      </Suspense>
    </Canvas>
  );
}
