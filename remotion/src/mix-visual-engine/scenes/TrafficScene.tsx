import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import type { MixScene } from "../types";

export const TrafficScene: React.FC<{ scene: MixScene; accent?: string }> = ({ scene, accent = "#56c5c2" }) => {
  const frame = useCurrentFrame();
  const carX = interpolate(frame % 180, [0, 180], [-25, 125]);
  return (
    <AbsoluteFill style={{ background: scene.background ?? "linear-gradient(#91c5d8 0%,#d8e5dc 62%,#6f947d 100%)", overflow: "hidden", color: "#15232d" }}>
      <div style={{ position: "absolute", bottom: "20%", width: "100%", height: "38%", background: "#424b52", transform: "perspective(500px) rotateX(8deg)" }} />
      {[32, 50, 68].map((y) => <div key={y} style={{ position: "absolute", top: `${y}%`, left: 0, width: "100%", borderTop: "5px dashed #f5e7a9", opacity: .9 }} />)}
      <div style={{ position: "absolute", left: `${carX}%`, bottom: "34%", width: "13%", height: "8%", minWidth: 80, borderRadius: "28% 35% 12% 12%", background: scene.accent ?? accent, boxShadow: "0 12px 12px #0004" }} />
      <div style={{ position: "absolute", top: "10%", left: "7%", right: "7%", fontSize: "clamp(38px,7vw,100px)", fontWeight: 900, lineHeight: 1 }}>{scene.title}</div>
      {scene.subtitle && <div style={{ position: "absolute", top: "27%", left: "7%", right: "7%", fontSize: "clamp(20px,3vw,38px)" }}>{scene.subtitle}</div>}
    </AbsoluteFill>
  );
};
