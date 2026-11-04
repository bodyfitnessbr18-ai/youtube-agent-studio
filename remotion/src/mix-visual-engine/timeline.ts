import type { MixScene, TimelineEntry } from "./types";

const FPS = 30;
const WORDS_PER_SECOND = 2.65;
const MIN_SCENE_FRAMES = 90;
const PAUSE_BUFFER_FRAMES = 18;

/**
 * Estimates each scene length from its narration so visual cuts follow
 * the spoken text instead of using the same fixed duration for every scene.
 * Explicit duration remains the fallback for scenes without narration.
 */
export const getSceneDurationInFrames = (scene: MixScene): number => {
  const narration = (scene.narration ?? "").trim();
  if (!narration) return Math.max(1, Math.floor(scene.durationInFrames));

  const words = narration.split(/\s+/).filter(Boolean).length;
  const estimatedFrames = Math.ceil((words / WORDS_PER_SECOND) * FPS) + PAUSE_BUFFER_FRAMES;
  return Math.max(MIN_SCENE_FRAMES, estimatedFrames);
};

export const buildTimeline = (scenes: MixScene[]): TimelineEntry[] => {
  let cursor = 0;
  return scenes.map((scene) => {
    const duration = getSceneDurationInFrames(scene);
    const entry: TimelineEntry = { ...scene, durationInFrames: duration, from: cursor, to: cursor + duration };
    cursor += duration;
    return entry;
  });
};

export const getTimelineDuration = (scenes: MixScene[]) =>
  scenes.reduce((total, scene) => total + getSceneDurationInFrames(scene), 0);
