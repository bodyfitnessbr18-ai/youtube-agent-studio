import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, useCurrentFrame } from "remotion";
import type { MixVisualEngineProps } from "./types";
import { buildTimeline } from "./timeline";
import { SceneRenderer } from "./SceneRenderer";

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
          <SceneRenderer scene={entry} accent={accent} />
          {showCaptions && entry.narration && (
            <div style={{ position: "absolute", bottom: "5%", left: "7%", right: "7%", padding: "18px 24px", borderRadius: 16, background: "#080b10c9", color: "#fff", fontSize: "clamp(18px,2.2vw,32px)", lineHeight: 1.25, textAlign: "center", fontWeight: 600 }}>
              {entry.narration}
            </div>
          )}
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
