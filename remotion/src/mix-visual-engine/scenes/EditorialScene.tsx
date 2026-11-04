import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { MixScene } from "../types";

export const EditorialScene: React.FC<{ scene: MixScene; accent?: string }> = ({ scene, accent = "#f5c76b" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = interpolate(frame, [0, 12, 24], [0, 1, 1], { extrapolateRight: "clamp" });
  const lift = interpolate(frame, [0, 22], [55, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: scene.background ?? "#10131c", color: "#fff", justifyContent: "center", padding: "9%" }}>
      <div style={{ width: 92, height: 7, borderRadius: 8, background: scene.accent ?? accent, marginBottom: 34, opacity }} />
      <div style={{ fontSize: "clamp(48px, 8vw, 132px)", lineHeight: 0.98, fontWeight: 900, letterSpacing: "-0.055em", maxWidth: "94%", opacity, transform: `translateY(${lift}px)` }}>
        {scene.title}
      </div>
      {scene.subtitle && <div style={{ marginTop: 30, fontSize: "clamp(22px, 3vw, 42px)", lineHeight: 1.25, color: scene.accent ?? accent, maxWidth: "82%", opacity: interpolate(frame, [Math.round(fps * 0.25), Math.round(fps * 0.8)], [0, 1], { extrapolateRight: "clamp" }) }}>{scene.subtitle}</div>}
    </AbsoluteFill>
  );
};
