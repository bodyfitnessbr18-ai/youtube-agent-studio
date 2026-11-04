import type { MixFormat } from "./types";

export const MIX_FORMATS: Record<MixFormat, { width: number; height: number; label: string }> = {
  vertical: { width: 1080, height: 1920, label: "Vertical 9:16" },
  horizontal: { width: 1920, height: 1080, label: "Horizontal 16:9" },
  square: { width: 1080, height: 1080, label: "Square 1:1" },
};

export const MIX_STYLE_PRESETS = {
  cinematic: { background: "#10131c", accent: "#f5c76b", foreground: "#fffaf0" },
  product: { background: "#f4f0e8", accent: "#c58b55", foreground: "#24211e" },
  storybook: { background: "#f4e8d7", accent: "#b87963", foreground: "#44342d" },
  data: { background: "#101c2b", accent: "#56c5c2", foreground: "#f4f7fb" },
} as const;
