export type MixSceneKind = "editorial" | "product" | "isometric" | "storybook" | "traffic" | "video";

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
  /** Relative path inside remotion/public, e.g. edit-ia-assets/clip.mp4 */
  videoSrc?: string;
  /** Source video offset in frames, at the composition FPS. */
  videoStartFrame?: number;
  videoFit?: "cover" | "contain";
  /** Original clip audio level from 0 to 1. */
  videoVolume?: number;
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
