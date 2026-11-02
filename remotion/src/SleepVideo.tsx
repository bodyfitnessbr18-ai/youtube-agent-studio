import React from "react";
import { AbsoluteFill, Audio, Img, Loop, Sequence, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export type SleepScene = {
  title: string;
  durationSeconds: number;
  imageSrc?: string;
  imagePrompt?: string;
  animationPrompt?: string;
};
export type SleepVideoProps = {
  title: string;
  durationSeconds: number;
  musicSrc?: string;
  audioLoop?: boolean;
  scenes: SleepScene[];
};

const fallbackBackgrounds = [
  "linear-gradient(180deg,#07143c 0%,#123d78 58%,#071a36 100%)",
  "linear-gradient(180deg,#07183c 0%,#174b83 55%,#06172f 100%)",
  "linear-gradient(180deg,#07132e 0%,#163c70 62%,#06152a 100%)",
  "linear-gradient(180deg,#0b1d43 0%,#214c75 58%,#07172d 100%)",
  "linear-gradient(180deg,#08152f 0%,#1c3c68 60%,#07142a 100%)",
  "linear-gradient(180deg,#0c1b3b 0%,#345477 58%,#0a1a30 100%)",
];

const SleepSceneView: React.FC<{ scene: SleepScene; index: number }> = ({ scene, index }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const drift = interpolate(frame, [0, durationInFrames], [1, 1.025]);
  const opacity = interpolate(frame, [0, 45, durationInFrames - 45, durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ background: fallbackBackgrounds[index % fallbackBackgrounds.length], opacity, overflow: "hidden" }}>
      {scene.imageSrc ? (
        <Img src={scene.imageSrc} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${drift})` }} />
      ) : (
        <>
          <div style={{ position: "absolute", width: 230, height: 230, borderRadius: "50%", background: "#f2edcf", right: "20%", top: "12%", boxShadow: "0 0 100px 30px #d9e5ff55" }} />
          <div style={{ position: "absolute", inset: "58% 0 0", background: "repeating-linear-gradient(176deg,#8db7e8 0 2px,#174477 3px 13px)", opacity: .5 }} />
        </>
      )}
      <AbsoluteFill style={{ background: "linear-gradient(180deg,#02081722 0%,transparent 38%,#02081766 100%)" }} />
    </AbsoluteFill>
  );
};

export const SleepVideo: React.FC<SleepVideoProps> = ({ durationSeconds, musicSrc, audioLoop = true, scenes }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const safeScenes = scenes.length ? scenes : [{ title: "Moonlight ocean", durationSeconds }];
  const total = safeScenes.reduce((sum, scene) => sum + Math.max(1, scene.durationSeconds), 0);
  let cursor = 0;
  const timeline = safeScenes.map((scene, index) => {
    const from = cursor;
    const frames = index === safeScenes.length - 1
      ? durationInFrames - cursor
      : Math.round(durationInFrames * Math.max(1, scene.durationSeconds) / total);
    cursor += frames;
    return { scene, from, frames: Math.max(1, frames) };
  });
  return (
    <AbsoluteFill style={{ background: "#061329" }}>
      {musicSrc && (audioLoop
        ? <Loop durationInFrames={durationInFrames}><Audio src={musicSrc} volume={0.82} /></Loop>
        : <Audio src={musicSrc} volume={0.82} />)}
      {timeline.map(({ scene, from, frames }, index) => (
        <Sequence key={index} from={from} durationInFrames={frames}>
          <SleepSceneView scene={scene} index={index} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};