"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { PolymarketEvent } from "@/lib/types";
import { Text } from "@react-three/drei";
import * as THREE from "three";

interface EventBubbleProps {
  event: PolymarketEvent;
  position: [number, number, number];
  onSelect: (event: PolymarketEvent) => void;
}

export function EventBubble({ event, position, onSelect }: EventBubbleProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Calculate bubble size based on volume (normalized)
  const baseSize = Math.log10(event.volume24hr + 1) * 0.2;
  const size = Math.max(0.4, Math.min(baseSize, 2));

  // Calculate color based on price change
  const getColor = () => {
    const change = event.oneDayPriceChange || 0;
    if (change > 0.05) return "#10b981"; // Emerald for big gains
    if (change > 0) return "#34d399"; // Light green
    if (change < -0.05) return "#ef4444"; // Red for big losses
    if (change < 0) return "#f87171"; // Light red
    return "#3b82f6"; // Blue for neutral
  };

  const color = getColor();
  const hasSpike = event.volumeSpike && event.volumeSpike > 2;

  // Gentle rotation only
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.003;
      meshRef.current.rotation.x += 0.001;
    }

    // Subtle glow pulse for high spikes
    if (glowRef.current && hasSpike) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.15;
      glowRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group position={position}>
      {/* Outer glow ring */}
      {hasSpike && (
        <mesh ref={glowRef}>
          <ringGeometry args={[size * 1.2, size * 1.5, 32]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Main sphere */}
      <mesh
        ref={meshRef}
        onClick={() => onSelect(event)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[size, 32, 32]} />
        <meshPhysicalMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hasSpike ? 0.6 : 0.3}
          metalness={0.8}
          roughness={0.2}
          clearcoat={1}
          clearcoatRoughness={0.1}
          transparent
          opacity={hovered ? 1 : 0.95}
          transmission={0.1}
        />
      </mesh>

      {/* Inner core for high spikes */}
      {hasSpike && (
        <mesh scale={0.5}>
          <sphereGeometry args={[size, 16, 16]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.4}
          />
        </mesh>
      )}

      {/* Hover label */}
      {hovered && event.title && (
        <Text
          position={[0, size + 0.8, 0]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {event.title.slice(0, 40)}{event.title.length > 40 ? '...' : ''}
        </Text>
      )}
    </group>
  );
}
