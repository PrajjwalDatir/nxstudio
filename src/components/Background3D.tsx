"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Float, Sparkles } from "@react-three/drei";
import { Suspense } from "react";
import * as THREE from "three";

function FloatingGeometry() {
  return (
    <Float
      speed={1}
      rotationIntensity={0.5}
      floatIntensity={0.5}
    >
      <mesh position={[0, 0, 0]}>
        <icosahedronGeometry args={[2, 1]} />
        <meshStandardMaterial
          color="#A855F7"
          wireframe
          transparent
          opacity={0.15}
          emissive="#A855F7"
          emissiveIntensity={0.1}
        />
      </mesh>
    </Float>
  );
}

function ParticleField() {
  return (
    <Sparkles
      count={100}
      scale={15}
      size={1.5}
      speed={0.3}
      color="#A855F7"
      opacity={0.3}
    />
  );
}

function Scene() {
  return (
    <>
      {/* Subtle lighting */}
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={0.3} color="#A855F7" />
      <pointLight position={[-10, -10, -10]} intensity={0.2} color="#7C3AED" />

      {/* Geometry */}
      <FloatingGeometry />
      <ParticleField />

      {/* Fog for depth */}
      <fog attach="fog" args={["#09090B", 5, 20]} />

      {/* Camera controls - disabled for background */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableRotate={false}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </>
  );
}

function Fallback() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
  );
}

export function Background3D() {
  return (
    <div className="fixed inset-0 -z-10">
      <Suspense fallback={<Fallback />}>
        <Canvas
          camera={{ position: [0, 0, 8], fov: 45 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
          style={{ background: "#09090B" }}
        >
          <Scene />
        </Canvas>
      </Suspense>
    </div>
  );
}
