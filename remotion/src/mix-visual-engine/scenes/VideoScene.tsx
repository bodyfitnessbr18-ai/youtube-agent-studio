import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";
import type { MixScene } from "../types";

export const VideoScene: React.FC<{ scene: MixScene; accent?: string }> = ({ scene, accent = "#f47a20" }) => {
  if (!scene.videoSrc) {
    return <AbsoluteFill style={{ backgroundColor: "#171b25", justifyContent: "center", alignItems: "center", color: "#fff" }}>
      <div style={{ fontSize: 32, fontWeight: 800 }}>VÍDEO NÃO ENCONTRADO</div>
    </AbsoluteFill>;
  }
  const src = /^https?:\/\//i.test(scene.videoSrc) ? scene.videoSrc : staticFile(scene.videoSrc);
  return (
    <AbsoluteFill style={{ backgroundColor: "#05070b" }}>
      <OffthreadVideo
        src={src}
        startFrom={scene.videoStartFrame ?? 0}
        volume={0}
        style={{ width: "100%", height: "100%", objectFit: scene.videoFit ?? "cover" }}
      />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,.55) 0%, transparent 32%, transparent 58%, rgba(0,0,0,.72) 100%)" }} />
      {(scene.title || scene.subtitle) && (
        <div style={{ position: "absolute", top: "12%", left: "7%", right: "7%", textAlign: "center", color: "#fff", textShadow: "0 3px 18px #000", fontFamily: "Arial, sans-serif" }}>
          {scene.title && <div style={{ fontSize: 58, lineHeight: 1.05, fontWeight: 900, letterSpacing: "-.035em" }}>{scene.title}</div>}
          {scene.subtitle && <div style={{ marginTop: 18, fontSize: 31, fontWeight: 650, color: accent }}>{scene.subtitle}</div>}
        </div>
      )}
    </AbsoluteFill>
  );
};
