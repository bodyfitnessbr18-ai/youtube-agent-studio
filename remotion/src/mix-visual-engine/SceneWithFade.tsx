import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import type { TimelineEntry } from "./types";
import { SceneRenderer } from "./SceneRenderer";
import { WordCaption } from "./WordCaption";

type Props = {
  scene: TimelineEntry;
  accent?: string;
  showCaptions: boolean;
};

export const SceneWithFade: React.FC<Props> = ({ scene, accent, showCaptions }) => {
  const frame = useCurrentFrame();
  const fadeFrames = Math.min(15, Math.max(1, Math.floor(scene.durationInFrames / 4)));
  const opacity = interpolate(
    frame,
    [0, fadeFrames, scene.durationInFrames - fadeFrames, scene.durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ opacity }}>
      <SceneRenderer scene={scene} accent={accent} />
      {showCaptions && scene.narration && (
        <WordCaption text={scene.narration} durationInFrames={scene.durationInFrames} accent={scene.accent ?? accent} />
      )}
    </AbsoluteFill>
  );
};
