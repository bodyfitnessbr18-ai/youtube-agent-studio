import React from "react";
import { ThreeCanvas } from "@remotion/three";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { MixScene } from "../types";

const IslandGeometry: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rotation = interpolate(frame, [0, fps * 12], [0, Math.PI * 2], { extrapolateRight: "extend" });
  return (
    <>
      <ambientLight intensity={1.15} />
      <directionalLight position={[5, 8, 6]} intensity={2.2} />
      <group rotation={[0, rotation * 0.18, 0]}>
        <mesh position={[0, -0.5, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[3.1, 3.5, 0.65, 6]} />
          <meshStandardMaterial color="#80a88c" flatShading roughness={0.95} />
        </mesh>
        {[-1.3, 0, 1.3].map((x, index) => (
          <mesh key={index} position={[x, 0.25 + (index % 2) * 0.18, (index - 1) * 0.9]} castShadow>
            <boxGeometry args={[0.85, 1.2 + (index % 2) * 0.4, 0.85]} />
            <meshStandardMaterial color={["#e9b77e", "#e8d5ad", "#c77f6b"][index]} flatShading />
          </mesh>
        ))}
        {[-1.8, 1.8].map((x, index) => (
          <mesh key={index} position={[x, 0.9, index ? 1.1 : -1.1]} castShadow>
            <coneGeometry args={[0.55, 1.35, 6]} />
            <meshStandardMaterial color="#426f58" flatShading />
          </mesh>
        ))}
        <mesh position={[0, 0.42, 1.85]} rotation={[0, 0, 0]}>
          <coneGeometry args={[0.42, 0.95, 4]} />
          <meshStandardMaterial color="#d6a75e" flatShading />
        </mesh>
      </group>
    </>
  );
};

export const IsometricScene: React.FC<{ scene: MixScene }> = ({ scene }) => {
  const { width, height } = useVideoConfig();
  return (
    <div style={{ position: "absolute", inset: 0, background: scene.background ?? "linear-gradient(180deg,#a8cbd0,#f0dfbd)" }}>
      <ThreeCanvas width={width} height={height} camera={{ position: [7, 7, 9], fov: 34 }} shadows>
        <IslandGeometry />
      </ThreeCanvas>
      <div style={{ position: "absolute", top: "7%", left: "7%", right: "7%", color: "#243b3d", fontSize: "clamp(38px,6vw,88px)", fontWeight: 900, textAlign: "center", textShadow: "0 2px 0 #fff8" }}>{scene.title}</div>
      {scene.subtitle && <div style={{ position: "absolute", top: "18%", left: "10%", right: "10%", color: "#355553", fontSize: "clamp(18px,2.6vw,34px)", textAlign: "center" }}>{scene.subtitle}</div>}
    </div>
  );
};
