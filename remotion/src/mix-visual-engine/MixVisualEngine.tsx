import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, useCurrentFrame } from "remotion";
import type { MixVisualEngineProps } from "./types";
import { buildTimeline } from "./timeline";
import { SceneWithFade } from "./SceneWithFade";

export const MixVisualEngine: React.FC<MixVisualEngineProps> = ({
  title, scenes, voiceSrc, musicSrc, showCaptions = true, musicVolume = 0.16,
  brandName = "MIX VISUAL ENGINE", accent = "#f5c76b",
}) => {
  const frame = useCurrentFrame();
  const timeline = buildTimeline(scenes);
  const fade = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ backgroundColor: "#10131c", opacity: fade }}>
      {timeline.map((entry) => (
        <Sequence key={entry.id} from={entry.from} durationInFrames={entry.durationInFrames} name={entry.id}>
          <SceneWithFade scene={entry} accent={accent} showCaptions={showCaptions} />
        </Sequence>
      ))}
      {voiceSrc && <Audio src={voiceSrc} volume={1} />}
      {musicSrc && <Audio src={musicSrc} volume={musicVolume} loop />}
      <div style={{ position: "absolute", top: 22, left: 28, right: 28, display: "flex", justifyContent: "space-between", color: "#ffffffa8", fontSize: 14, letterSpacing: ".16em", fontWeight: 800, opacity: fade, pointerEvents: "none" }}>
        <span>{brandName}</span><span>{title}</span>
      </div>
    </AbsoluteFill>
  );
};
