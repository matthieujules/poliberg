"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, PerspectiveCamera, Html } from "@react-three/drei";
import { PolymarketEvent } from "@/lib/types";
import { EventBubble } from "./EventBubble";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { useMemo, useRef } from "react";

interface Scene3DProps {
  events: PolymarketEvent[];
  onSelectEvent: (event: PolymarketEvent) => void;
}

// Component for connection lines
function ConnectionLines({ positions }: { positions: [number, number, number][] }) {
  const linesRef = useRef<THREE.Group>(null);

  // Create connections between nearby events
  const connections = useMemo(() => {
    const lines: { start: [number, number, number]; end: [number, number, number] }[] = [];

    // Connect events that are close to each other
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const dist = Math.sqrt(
          Math.pow(positions[i][0] - positions[j][0], 2) +
          Math.pow(positions[i][1] - positions[j][1], 2) +
          Math.pow(positions[i][2] - positions[j][2], 2)
        );

        // Only connect if distance is less than threshold
        if (dist < 8) {
          lines.push({
            start: positions[i],
            end: positions[j],
          });
        }
      }
    }

    return lines;
  }, [positions]);

  return (
    <group ref={linesRef}>
      {connections.map((conn, i) => {
        const points = [
          new THREE.Vector3(...conn.start),
          new THREE.Vector3(...conn.end),
        ];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        return (
          <line key={i} geometry={geometry}>
            <lineBasicMaterial
              color="#4f46e5"
              transparent
              opacity={0.15}
              linewidth={1}
            />
          </line>
        );
      })}
    </group>
  );
}

export function Scene3D({ events, onSelectEvent }: Scene3DProps) {
  // Calculate 3D position for each event with better distribution
  const calculatePosition = (event: PolymarketEvent, index: number): [number, number, number] => {
    // Spiral/galaxy arrangement
    const now = new Date();
    const detectedAt = new Date(event.detectedAt);
    const hoursAgo = (now.getTime() - detectedAt.getTime()) / (1000 * 60 * 60);

    // Angle based on index for spiral
    const angle = (index / events.length) * Math.PI * 4 + hoursAgo * 0.1;

    // Radius based on time (recent = center, old = outer)
    const radius = hoursAgo * 0.8 + 2;

    // X, Z form the spiral
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    // Y based on probability (creates vertical layers)
    const y = (event.probability - 0.5) * 12;

    return [x, y, z];
  };

  const positions = useMemo(
    () => events.map((event, i) => calculatePosition(event, i)),
    [events]
  );

  return (
    <Canvas
      style={{ width: "100%", height: "100%" }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      }}
    >
      {/* Camera setup with better angle */}
      <PerspectiveCamera makeDefault position={[20, 15, 20]} fov={50} />

      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <pointLight position={[20, 20, 20]} intensity={1.5} color="#ffffff" />
      <pointLight position={[-20, -20, -20]} intensity={0.8} color="#4f46e5" />
      <pointLight position={[0, 30, 0]} intensity={1} color="#8b5cf6" />

      {/* Rim light */}
      <spotLight
        position={[0, 40, 0]}
        angle={0.6}
        penumbra={1}
        intensity={1.5}
        castShadow
        color="#6366f1"
      />

      {/* Background stars */}
      <Stars
        radius={150}
        depth={80}
        count={8000}
        factor={5}
        saturation={0}
        fade
        speed={0.3}
      />

      {/* Fog for depth */}
      <fog attach="fog" args={["#0a0a1a", 20, 80]} />

      {/* Connection lines between events */}
      <ConnectionLines positions={positions} />

      {/* Render all event bubbles */}
      {events.map((event, index) => (
        <EventBubble
          key={event.id}
          event={event}
          position={positions[index]}
          onSelect={onSelectEvent}
        />
      ))}

      {/* Orbit controls for interaction */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={10}
        maxDistance={80}
        autoRotate={true}
        autoRotateSpeed={0.3}
        dampingFactor={0.05}
        rotateSpeed={0.5}
      />

      {/* Post-processing effects */}
      <EffectComposer>
        <Bloom
          intensity={1.5}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          height={300}
        />
      </EffectComposer>

      {/* Color management */}
      <color attach="background" args={["#0a0a1a"]} />
    </Canvas>
  );
}
