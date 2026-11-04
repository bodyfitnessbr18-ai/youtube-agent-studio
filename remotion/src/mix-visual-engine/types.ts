export type MixSceneKind = "editorial" | "product" | "isometric" | "storybook" | "traffic";

export type MixFormat = "vertical" | "horizontal" | "square";

export type MixScene = {
  id: string;
  kind: MixSceneKind;
  durationInFrames: number;
  title: string;
  subtitle?: string;
  narration?: string;
  accent?: string;
  background?: string;
  /** Relative path inside remotion/public, e.g. generated-videos/clip.mp4 */
  videoSrc?: string;
};

export type MixVisualEngineProps = {
  title: string;
  scenes: MixScene[];
  voiceSrc?: string;
  musicSrc?: string;
  showCaptions?: boolean;
  musicVolume?: number;
  brandName?: string;
  accent?: string;
};

export type TimelineEntry = MixScene & {
  from: number;
  to: number;
};
