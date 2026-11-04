import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import type { MixScene } from "../types";

export const StorybookScene: React.FC<{ scene: MixScene; accent?: string }> = ({ scene, accent = "#b87963" }) => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, 120], [-12, 12], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: scene.background ?? "linear-gradient(180deg,#b7d2d4 0%,#f3dfbd 68%,#d7ad83 100%)", overflow: "hidden", color: "#46352d" }}>
      <div style={{ position: "absolute", width: "42%", aspectRatio: "1", borderRadius: "50%", background: "#fff4d6", top: "9%", right: "12%", opacity: .88 }} />
      <div style={{ position: "absolute", bottom: "-12%", left: "-8%", width: "116%", height: "48%", borderRadius: "50% 50% 0 0", background: "#78917a", transform: `translateX(${drift}px)` }} />
      <div style={{ position: "absolute", bottom: "-19%", right: "-12%", width: "75%", height: "43%", borderRadius: "50% 50% 0 0", background: "#58715e" }} />
      <div style={{ position: "absolute", top: "12%", left: "8%", right: "8%", textAlign: "center", fontFamily: "Georgia,serif", fontSize: "clamp(42px,7vw,104px)", fontWeight: 700, lineHeight: 1.05, textShadow: "0 2px 0 #fff8" }}>{scene.title}</div>
      {scene.subtitle && <div style={{ position: "absolute", top: "31%", left: "12%", right: "12%", textAlign: "center", fontFamily: "Georgia,serif", fontSize: "clamp(20px,3vw,42px)", color: accent }}>{scene.subtitle}</div>}
    </AbsoluteFill>
  );
};
