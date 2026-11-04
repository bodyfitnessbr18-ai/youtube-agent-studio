import type { MixScene, TimelineEntry } from "./types";

export const buildTimeline = (scenes: MixScene[]): TimelineEntry[] => {
  let cursor = 0;
  return scenes.map((scene) => {
    const duration = Math.max(1, Math.floor(scene.durationInFrames));
    const entry: TimelineEntry = { ...scene, durationInFrames: duration, from: cursor, to: cursor + duration };
    cursor += duration;
    return entry;
  });
};

export const getTimelineDuration = (scenes: MixScene[]) =>
  scenes.reduce((total, scene) => total + Math.max(1, Math.floor(scene.durationInFrames)), 0);
