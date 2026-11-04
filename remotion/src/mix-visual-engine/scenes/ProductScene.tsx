import React from "react";
import { AbsoluteFill, OffthreadVideo, interpolate, staticFile, useCurrentFrame } from "remotion";
import type { MixScene } from "../types";

export const ProductScene: React.FC<{ scene: MixScene; accent?: string }> = ({ scene, accent = "#c58b55" }) => {
  const frame = useCurrentFrame();
  const rise = interpolate(frame, [0, 24], [180, 0], { extrapolateRight: "clamp" });
  const rotate = interpolate(frame, [0, 90], [-9, 5], { extrapolateRight: "clamp" });
  if (scene.videoSrc) {
    const videoPath = scene.videoSrc.replace(/^\\/+/, "");
    return (
      <AbsoluteFill style={{ backgroundColor: "#080a0e", overflow: "hidden" }}>
        <OffthreadVideo
          src={staticFile(videoPath)}
          muted
          loop
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", padding: "0 7% 13%", background: "linear-gradient(180deg, transparent 55%, rgba(0,0,0,.72) 100%)" }}>
          <div style={{ color: "#fff", textAlign: "center", fontSize: "clamp(30px,5vw,76px)", lineHeight: 1.05, fontWeight: 900, textShadow: "0 3px 18px #000" }}>{scene.title}</div>
          {scene.subtitle && <div style={{ color: "#fff", marginTop: 16, fontSize: "clamp(16px,2vw,28px)", textShadow: "0 2px 12px #000" }}>{scene.subtitle}</div>}
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ background: scene.background ?? "radial-gradient(circle at 50% 40%, #fff 0%, #e9e1d5 72%, #d5c8b8 100%)", color: "#24211e", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <div style={{ position: "absolute", width: "65%", height: "65%", borderRadius: "50%", background: scene.accent ?? accent, opacity: 0.12, filter: "blur(35px)" }} />
      <div style={{ width: "24%", height: "43%", minWidth: 150, borderRadius: "22% 22% 16% 16%", background: "linear-gradient(100deg,#35383c,#777d82 35%,#25282b 72%,#151719)", boxShadow: "0 45px 70px #0004, inset 12px 0 18px #ffffff30", transform: `translateY(${rise}px) rotate(${rotate}deg)`, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", top: "-10%", width: "34%", height: "13%", borderRadius: "8px 8px 2px 2px", background: "#242629" }} />
        <div style={{ width: "78%", padding: "18px 5px", background: "#f4eee5", color: "#282522", textAlign: "center", fontSize: "clamp(12px,2vw,24px)", fontWeight: 900, letterSpacing: ".08em" }}>MIX<br/>STUDIO</div>
      </div>
      <div style={{ position: "absolute", bottom: "12%", left: "8%", right: "8%", textAlign: "center", fontSize: "clamp(30px,5vw,76px)", fontWeight: 900, lineHeight: 1.05 }}>{scene.title}</div>
      {scene.subtitle && <div style={{ position: "absolute", bottom: "6%", fontSize: "clamp(16px,2vw,28px)", color: "#5c5148" }}>{scene.subtitle}</div>}
    </AbsoluteFill>
  );
};
